/**
 * Provider-agnostic fulfillment contract.
 *
 * Nothing outside /lib/fulfillment should import a provider SDK or know
 * which provider handled an order. Swapping Printify for Printful should
 * mean writing a new class here and changing one registry entry.
 */

export type ProviderKey = "PRINTIFY" | "PRINTFUL" | "MANUAL";

export interface FulfillmentLineItem {
  sku: string;
  providerVariantId: string | null;
  quantity: number;
  printFileUrl: string | null;
}

export interface FulfillmentAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
  email: string;
}

export interface FulfillmentSubmission {
  /** Our order number, so the provider record can be traced back to us. */
  externalReference: string;
  /** Guards against duplicate submission when a webhook is retried. */
  idempotencyKey: string;
  items: FulfillmentLineItem[];
  shippingAddress: FulfillmentAddress;
}

export interface FulfillmentResult {
  providerOrderId: string;
  status: "SUBMITTED" | "IN_PRODUCTION" | "FAILED";
}

export interface ShipmentUpdate {
  providerOrderId: string;
  status: "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "FAILED";
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

export interface FulfillmentProvider {
  readonly key: ProviderKey;
  readonly isConfigured: boolean;

  submitOrder(submission: FulfillmentSubmission): Promise<FulfillmentResult>;
  getOrderStatus(providerOrderId: string): Promise<ShipmentUpdate>;
  parseWebhook(payload: unknown): ShipmentUpdate | null;
}

export class ProviderNotConfiguredError extends Error {
  constructor(key: ProviderKey) {
    super(
      `Fulfillment provider ${key} is not configured. Add its credentials to .env before submitting orders.`
    );
    this.name = "ProviderNotConfiguredError";
  }
}
