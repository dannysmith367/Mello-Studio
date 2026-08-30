"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { submitFulfillment } from "@/lib/fulfillment/submit";

/** Retries a failed submission. Idempotency means this is always safe. */
export async function retryFulfillment(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId"));

  await submitFulfillment(orderId).catch(() => {});
  revalidatePath("/admin/orders");
}
