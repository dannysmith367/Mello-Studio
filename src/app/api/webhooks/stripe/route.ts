import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/payments/stripe";
import { submitFulfillment } from "@/lib/fulfillment/submit";
import { sendSafely } from "@/lib/email";
import { orderConfirmation } from "@/lib/email/templates/order";

// Signature verification needs the raw body, and Stripe SDK needs Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook.
 *
 * This is the only place an order is allowed to become PAID. The browser
 * hitting the success URL proves nothing — it can be visited directly, or
 * never visited at all if the customer closes the tab.
 *
 * Idempotency has two layers:
 *   1. WebhookEvent has a unique index on (source, externalId), so a
 *      redelivered event is recognised and skipped.
 *   2. FulfillmentOrder.idempotencyKey is unique per order, so even a race
 *      cannot produce two fulfilment requests.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    // A bad signature means this did not come from Stripe. Do not process it.
    console.error("Stripe signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Claim the event. A duplicate delivery loses the race and exits here.
  try {
    await db.webhookEvent.create({
      data: {
        source: "stripe",
        externalId: event.id,
        eventType: event.type,
        payload: event as unknown as object,
      },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object);
        break;
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;
      default:
        break;
    }

    await db.webhookEvent.update({
      where: { source_externalId: { source: "stripe", externalId: event.id } },
      data: { processedAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.webhookEvent.update({
      where: { source_externalId: { source: "stripe", externalId: event.id } },
      data: { error: message },
    });
    // 500 tells Stripe to retry. The event row already exists, so the retry
    // would be skipped — clear it so a retry can actually reprocess.
    await db.webhookEvent
      .delete({
        where: { source_externalId: { source: "stripe", externalId: event.id } },
      })
      .catch(() => {});
    console.error("Stripe webhook processing failed:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) throw new Error("Checkout session carried no order id.");

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error(`No order ${orderId}.`);

  // Already handled by an earlier delivery.
  if (order.status !== "PENDING_PAYMENT") return;

  if (session.payment_status !== "paid") return;

  // Verify Stripe charged what we intended. A mismatch means something is
  // wrong; record it and stop rather than fulfilling.
  const amountPaid = session.amount_total ?? 0;
  if (amountPaid < order.subtotalCents) {
    throw new Error(
      `Amount mismatch on ${order.orderNumber}: expected at least ${order.subtotalCents}, Stripe reported ${amountPaid}.`
    );
  }

  const details = session.customer_details;
  const shipping = session.collected_information?.shipping_details ?? null;
  const address = shipping?.address;

  const customer = details?.email
    ? await db.customer.upsert({
        where: { email: details.email.toLowerCase() },
        update: { phone: details.phone ?? undefined },
        create: {
          email: details.email.toLowerCase(),
          phone: details.phone ?? null,
        },
      })
    : null;

  const shippingAddress =
    address && shipping?.name
      ? await db.address.create({
          data: {
            customerId: customer?.id ?? null,
            firstName: shipping.name.split(" ")[0] ?? shipping.name,
            lastName: shipping.name.split(" ").slice(1).join(" ") || "—",
            line1: address.line1 ?? "",
            line2: address.line2 ?? null,
            city: address.city ?? "",
            region: address.state ?? null,
            postalCode: address.postal_code ?? "",
            country: address.country ?? "US",
            phone: details?.phone ?? null,
          },
        })
      : null;

  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        email: details?.email?.toLowerCase() ?? order.email,
        customerId: customer?.id ?? null,
        shippingAddressId: shippingAddress?.id ?? null,
        shippingCents: session.total_details?.amount_shipping ?? 0,
        taxCents: session.total_details?.amount_tax ?? 0,
        discountCents: session.total_details?.amount_discount ?? 0,
        totalCents: amountPaid,
        currency: session.currency ?? "usd",
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        placedAt: new Date(),
      },
    }),
    db.payment.create({
      data: {
        orderId: order.id,
        provider: "stripe",
        providerPaymentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.id,
        status: "SUCCEEDED",
        amountCents: amountPaid,
        currency: session.currency ?? "usd",
      },
    }),
  ]);

  const recipient = details?.email?.toLowerCase() ?? order.email;
  if (recipient) {
    const sent = await sendSafely(
      orderConfirmation({
        orderNumber: order.orderNumber,
        email: recipient,
        items: order.items,
        subtotalCents: order.subtotalCents,
        shippingCents: session.total_details?.amount_shipping ?? 0,
        taxCents: session.total_details?.amount_tax ?? 0,
        totalCents: amountPaid,
      }),
      `order confirmation ${order.orderNumber}`
    );
    if (sent) {
      await db.order
        .update({ where: { id: order.id }, data: { confirmationSentAt: new Date() } })
        .catch(() => {});
    }
  }

  // Fulfilment failing must not fail the webhook — the money is taken and the
  // order is valid. A failed submission is recorded and can be retried.
  await submitFulfillment(order.id).catch((error) => {
    console.error(`Fulfilment submission failed for ${order.orderNumber}:`, error);
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;

  await db.order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED" },
  });
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  if (!paymentIntentId) return;

  const payment = await db.payment.findUnique({
    where: { providerPaymentId: paymentIntentId },
  });
  if (!payment) return;

  const fullyRefunded = charge.amount_refunded >= charge.amount;

  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        amountRefundedCents: charge.amount_refunded,
        status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    }),
    db.order.update({
      where: { id: payment.orderId },
      data: fullyRefunded ? { status: "REFUNDED" } : {},
    }),
  ]);
}
