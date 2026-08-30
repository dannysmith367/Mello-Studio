import "server-only";
import { db } from "@/lib/db";
import { sendSafely } from "@/lib/email";
import { shippingNotification } from "@/lib/email/templates/order";
import type { ShipmentUpdate } from "./types";

/**
 * Applies a provider status update to an order and notifies the customer.
 *
 * Guarded by shippingSentAt so a provider that reports "shipped" on every
 * poll cannot email the customer repeatedly.
 */
export async function applyShipmentUpdate(update: ShipmentUpdate): Promise<void> {
  const fulfillment = await db.fulfillmentOrder.findFirst({
    where: { providerOrderId: update.providerOrderId },
    include: { order: true },
  });
  if (!fulfillment) return;

  await db.fulfillmentOrder.update({
    where: { id: fulfillment.id },
    data: { status: update.status },
  });

  if (update.trackingNumber) {
    const existing = await db.shipment.findFirst({
      where: {
        fulfillmentOrderId: fulfillment.id,
        trackingNumber: update.trackingNumber,
      },
    });

    if (!existing) {
      await db.shipment.create({
        data: {
          fulfillmentOrderId: fulfillment.id,
          carrier: update.carrier ?? null,
          trackingNumber: update.trackingNumber,
          trackingUrl: update.trackingUrl ?? null,
          shippedAt: new Date(),
        },
      });
    }
  }

  const orderStatus =
    update.status === "SHIPPED"
      ? "SHIPPED"
      : update.status === "DELIVERED"
        ? "DELIVERED"
        : update.status === "IN_PRODUCTION"
          ? "IN_PRODUCTION"
          : null;

  if (orderStatus) {
    await db.order.update({
      where: { id: fulfillment.orderId },
      data: { status: orderStatus },
    });
  }

  const order = fulfillment.order;
  if (update.status === "SHIPPED" && !order.shippingSentAt && order.email) {
    const sent = await sendSafely(
      shippingNotification({
        orderNumber: order.orderNumber,
        email: order.email,
        carrier: update.carrier ?? null,
        trackingNumber: update.trackingNumber ?? null,
        trackingUrl: update.trackingUrl ?? null,
      }),
      `shipping notice ${order.orderNumber}`
    );
    if (sent) {
      await db.order.update({
        where: { id: order.id },
        data: { shippingSentAt: new Date() },
      });
    }
  }
}
