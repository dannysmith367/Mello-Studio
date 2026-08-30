import "server-only";
import { db } from "@/lib/db";
import { getProvider } from "./index";
import type { FulfillmentProviderKey } from "@prisma/client";

/**
 * Submits a paid order to its fulfilment provider.
 *
 * Called only from the Stripe webhook, after payment is verified. Safe to
 * call more than once: FulfillmentOrder.idempotencyKey is unique per order
 * and provider, so a second call finds the existing row and does nothing.
 *
 * Orders can mix providers — a hand-shipped original alongside a Printify
 * tee — so line items are grouped by provider and submitted separately.
 */
export async function submitFulfillment(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      shippingAddress: true,
      items: { include: { variant: true, product: true } },
    },
  });

  if (!order) throw new Error(`No order ${orderId}.`);
  if (order.status !== "PAID" && order.status !== "FULFILLMENT_PENDING") return;
  if (!order.shippingAddress) throw new Error(`Order ${order.orderNumber} has no address.`);

  const groups = new Map<FulfillmentProviderKey, typeof order.items>();
  for (const item of order.items) {
    const key = item.product?.fulfillmentProvider ?? "MANUAL";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  await db.order.update({
    where: { id: order.id },
    data: { status: "FULFILLMENT_PENDING" },
  });

  for (const [providerKey, items] of groups) {
    const idempotencyKey = `${order.id}:${providerKey}`;

    // Unique constraint makes this the real duplicate guard.
    const existing = await db.fulfillmentOrder.findUnique({
      where: { idempotencyKey },
    });
    if (existing && existing.status !== "FAILED") continue;

    const record =
      existing ??
      (await db.fulfillmentOrder.create({
        data: {
          orderId: order.id,
          provider: providerKey,
          idempotencyKey,
          status: "PENDING",
        },
      }));

    // Originals and anything hand-shipped have no external provider.
    if (providerKey === "MANUAL") {
      await db.fulfillmentOrder.update({
        where: { id: record.id },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });
      continue;
    }

    try {
      const provider = getProvider(providerKey);
      if (!provider.isConfigured) {
        throw new Error(`${providerKey} has no credentials configured.`);
      }

      const address = order.shippingAddress;
      const result = await provider.submitOrder({
        externalReference: order.orderNumber,
        idempotencyKey,
        items: items.map((item) => ({
          sku: item.sku,
          providerVariantId: item.variant?.providerVariantId ?? null,
          quantity: item.quantity,
          printFileUrl: item.printFileUrl,
        })),
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          region: address.region,
          postalCode: address.postalCode,
          country: address.country,
          phone: address.phone,
          email: order.email,
        },
      });

      await db.fulfillmentOrder.update({
        where: { id: record.id },
        data: {
          providerOrderId: result.providerOrderId,
          status: "SUBMITTED",
          submittedAt: new Date(),
          lastError: null,
          attemptCount: { increment: 1 },
        },
      });

      await db.order.update({
        where: { id: order.id },
        data: { status: "SUBMITTED_TO_FULFILLMENT" },
      });
    } catch (error) {
      // Record and move on. The order is paid and valid; a failed submission
      // is an operational problem to retry, not a reason to lose the sale.
      await db.fulfillmentOrder.update({
        where: { id: record.id },
        data: {
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "Unknown error",
          attemptCount: { increment: 1 },
        },
      });
    }
  }
}
