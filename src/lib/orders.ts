import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Human-facing order number. Short, unambiguous, and not sequential —
 * a sequential number would leak how many orders the shop has taken.
 */
export async function generateOrderNumber(): Promise<string> {
  const alphabet = "ACDEFGHJKLMNPQRTUVWXY3467989";
  for (let attempt = 0; attempt < 8; attempt++) {
    const bytes = randomBytes(6);
    const suffix = Array.from(bytes)
      .map((b) => alphabet[b % alphabet.length])
      .join("");
    const candidate = `MS-${suffix}`;
    const clash = await db.order.findUnique({ where: { orderNumber: candidate } });
    if (!clash) return candidate;
  }
  throw new Error("Could not allocate an order number.");
}
