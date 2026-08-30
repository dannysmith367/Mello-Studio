import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PrintifyProvider } from "@/lib/fulfillment/printify";
import { applyShipmentUpdate } from "@/lib/fulfillment/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Printify webhook — fulfilment and shipping updates.
 *
 * Signed with HMAC SHA-256 in an `x-pfy-signature` header formatted
 * `sha256=<hex>`. Verification is skipped only when no secret is configured,
 * which is logged loudly because an unverified endpoint accepts anything.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET;

  if (secret) {
    const header = request.headers.get("x-pfy-signature") ?? "";
    const provided = header.replace(/^sha256=/, "");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    console.warn("[printify webhook] No PRINTIFY_WEBHOOK_SECRET set — not verified.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload as { id?: string; type?: string };
  const externalId = event.id ?? `printify-${Date.now()}`;

  // Same idempotency ledger as Stripe. A redelivery loses the race here.
  try {
    await db.webhookEvent.create({
      data: {
        source: "printify",
        externalId,
        eventType: event.type ?? "unknown",
        payload: payload as object,
      },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const update = new PrintifyProvider().parseWebhook(payload);
    if (update) await applyShipmentUpdate(update);

    await db.webhookEvent.update({
      where: { source_externalId: { source: "printify", externalId } },
      data: { processedAt: new Date() },
    });
  } catch (error) {
    await db.webhookEvent
      .delete({ where: { source_externalId: { source: "printify", externalId } } })
      .catch(() => {});
    console.error("Printify webhook failed:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
