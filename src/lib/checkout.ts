"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { getCartSessionId } from "@/lib/cart/session";
import { stripe, isStripeConfigured } from "@/lib/payments/stripe";
import { generateOrderNumber } from "@/lib/orders";

export type CheckoutState = { error?: string };

/**
 * Creates our order first, then hands off to Stripe Checkout.
 *
 * The order is written in PENDING_PAYMENT with a full price snapshot before
 * the customer ever reaches Stripe. That means the amount we intend to charge
 * is recorded independently of what Stripe reports back, and the webhook can
 * verify one against the other.
 *
 * Nothing here trusts the browser: quantities come from the cart rows, and
 * every price is read from the product and variant records.
 */
export async function startCheckout(
  _prev: CheckoutState,
  _formData: FormData
): Promise<CheckoutState> {
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured yet." };
  }

  const sessionId = await getCartSessionId();
  if (!sessionId) return { error: "Your bag is empty." };

  const cart = await getCart();
  const lines = cart.lines.filter((line) => !line.unavailable);

  if (lines.length === 0) {
    return { error: "Nothing in your bag is available to buy." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const orderNumber = await generateOrderNumber();

  const order = await db.order.create({
    data: {
      orderNumber,
      email: "", // filled in from Stripe once the customer provides it
      status: "PENDING_PAYMENT",
      subtotalCents: cart.subtotalCents,
      totalCents: cart.subtotalCents, // shipping and tax added by the webhook
      items: {
        create: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          // Snapshot. Never re-read from the product after this point.
          productName: line.productName,
          variantLabel: line.variantLabel,
          sku: line.sku,
          imageUrl: line.imageUrl,
          unitPriceCents: line.unitPriceCents,
          quantity: line.quantity,
          lineTotalCents: line.lineTotalCents,
        })),
      },
    },
  });

  let checkoutUrl: string;

  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "usd",
            unit_amount: line.unitPriceCents,
            product_data: {
              name: line.productName,
              description: line.variantLabel ?? undefined,
              images: line.imageUrl ? [line.imageUrl] : undefined,
            },
          },
        })),
        // Stripe collects the address; Printify needs it for fulfilment.
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB", "AU", "NZ", "IE"],
        },
        phone_number_collection: { enabled: true },
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber },
        success_url: `${siteUrl}/order-confirmation?order=${orderNumber}`,
        cancel_url: `${siteUrl}/cart`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
      // If the customer double-clicks, Stripe returns the same session
      // rather than creating a second one.
      { idempotencyKey: `checkout-${order.id}` }
    );

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");

    await db.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    checkoutUrl = session.url;
  } catch (error) {
    // Roll the pending order back so a failed handoff doesn't leave litter.
    await db.order.delete({ where: { id: order.id } }).catch(() => {});
    return {
      error: error instanceof Error ? error.message : "Could not start checkout.",
    };
  }

  redirect(checkoutUrl);
}
