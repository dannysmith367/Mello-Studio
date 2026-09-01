import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Pinning the version means a Stripe upgrade can't silently change
      // payload shapes underneath us.
      apiVersion: "2025-02-24.acacia",
      appInfo: { name: "Mello Studio", version: "1.0.0" },
    });
  }
  return client;
}
