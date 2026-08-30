import {
  FulfillmentProvider,
  FulfillmentResult,
  FulfillmentSubmission,
  ProviderNotConfiguredError,
  ShipmentUpdate,
} from "../types";
import { PrintifyClient } from "./client";

/**
 * Maps Printify's order status vocabulary onto ours.
 * Unrecognised values fall through to IN_PRODUCTION rather than throwing —
 * a new status upstream should not break order tracking.
 */
function mapStatus(status: string): ShipmentUpdate["status"] {
  const s = status.toLowerCase();
  if (["canceled", "cancelled"].includes(s)) return "CANCELLED";
  if (s.includes("delivered")) return "DELIVERED";
  if (s.includes("shipped") || s.includes("fulfilled")) return "SHIPPED";
  if (s.includes("failed") || s.includes("error")) return "FAILED";
  return "IN_PRODUCTION";
}

export class PrintifyProvider implements FulfillmentProvider {
  readonly key = "PRINTIFY" as const;

  private get token() {
    return process.env.PRINTIFY_API_KEY;
  }
  private get shopId() {
    return process.env.PRINTIFY_SHOP_ID;
  }

  get isConfigured(): boolean {
    return Boolean(this.token && this.shopId);
  }

  client(): PrintifyClient {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(this.key);
    return new PrintifyClient(this.token!, this.shopId!);
  }

  async submitOrder(submission: FulfillmentSubmission): Promise<FulfillmentResult> {
    const client = this.client();
    const { shippingAddress: to } = submission;

    const created = await client.createOrder({
      // Printify echoes this back, so an order can be traced to ours.
      external_id: submission.externalReference,
      label: submission.externalReference,
      line_items: submission.items.map((item) => ({
        product_id: item.providerVariantId ? undefined : item.sku,
        variant_id: item.providerVariantId ? Number(item.providerVariantId) : undefined,
        quantity: item.quantity,
      })),
      shipping_method: 1,
      send_shipping_notification: false, // we own customer comms
      address_to: {
        first_name: to.firstName,
        last_name: to.lastName,
        email: to.email,
        phone: to.phone ?? "",
        country: to.country,
        region: to.region ?? "",
        address1: to.line1,
        address2: to.line2 ?? "",
        city: to.city,
        zip: to.postalCode,
      },
    });

    return { providerOrderId: created.id, status: "SUBMITTED" };
  }

  async getOrderStatus(providerOrderId: string): Promise<ShipmentUpdate> {
    const order = await this.client().getOrder(providerOrderId);
    const shipment = order.shipments?.[0];

    return {
      providerOrderId: order.id,
      status: mapStatus(order.status),
      carrier: shipment?.carrier ?? null,
      trackingNumber: shipment?.number ?? null,
      trackingUrl: shipment?.url ?? null,
    };
  }

  parseWebhook(payload: unknown): ShipmentUpdate | null {
    if (!payload || typeof payload !== "object") return null;
    const event = payload as Record<string, unknown>;
    const resource = event.resource as Record<string, unknown> | undefined;
    const data = resource?.data as Record<string, unknown> | undefined;

    const providerOrderId = typeof resource?.id === "string" ? resource.id : null;
    if (!providerOrderId) return null;

    const status = typeof data?.status === "string" ? data.status : "";
    const shipments = Array.isArray(data?.shipments)
      ? (data.shipments as Record<string, unknown>[])
      : [];
    const shipment = shipments[0];

    return {
      providerOrderId,
      status: mapStatus(status),
      carrier: typeof shipment?.carrier === "string" ? shipment.carrier : null,
      trackingNumber: typeof shipment?.number === "string" ? shipment.number : null,
      trackingUrl: typeof shipment?.url === "string" ? shipment.url : null,
    };
  }
}

export { PrintifyClient } from "./client";
