"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { requestImageUpload, type RequestImageUploadResult } from "@/lib/uploads";
import { sendSafely } from "@/lib/email";
import { orderIssueAcknowledgement, orderIssueAlert } from "@/lib/email/templates/order-issue";
import { MAX_ISSUE_PHOTOS } from "./constants";

/** Step 1 of a photo upload — same signed-URL pattern as artwork uploads, just
 * pointed at the public bucket under a support/ prefix instead of originals. */
export async function requestSupportPhotoUpload(input: {
  filename: string;
  contentType: string;
  bytes: number;
}): Promise<RequestImageUploadResult> {
  return requestImageUpload({ ...input, bucket: "public", keyPrefix: "support" });
}

const IssueInput = z.object({
  orderNumber: z.string().min(1, "Enter your order number").max(60),
  email: z.string().email("Enter a valid email address").max(200),
  kind: z.enum(["DEFECT", "DAMAGED_IN_TRANSIT", "NOT_RECEIVED", "WRONG_ITEM", "OTHER"]),
  description: z.string().min(10, "Tell us a little more").max(4000),
  photoKeys: z.array(z.string()).max(MAX_ISSUE_PHOTOS).default([]),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional(),
});

export type SubmitIssueResult = { error?: string; sent?: boolean };

/**
 * Step 2: the photos (if any) are already in storage from step 1. This
 * records the report, best-effort-links it to a real Order, and notifies
 * both sides. Called directly with a plain object rather than FormData,
 * since the browser has async upload work to do first.
 */
export async function submitIssue(raw: unknown): Promise<SubmitIssueResult> {
  const parsed = IssueInput.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { website, photoKeys, orderNumber, email, kind, description } = parsed.data;
  // Silently accept bot submissions so the bot doesn't learn to adapt.
  if (website) return { sent: true };

  const photoUrls = photoKeys.map((key) => storage.publicUrl("public", key));

  // Best-effort match: a typo'd order number or an order placed before this
  // existed must never block someone from filing a report.
  const order = await db.order.findUnique({ where: { orderNumber } });
  const matched = order && order.email.toLowerCase() === email.toLowerCase() ? order : null;

  await db.orderIssue.create({
    data: {
      orderNumber,
      email,
      kind,
      description,
      photoUrls,
      orderId: matched?.id ?? null,
    },
  });

  // The report is already saved. Email is a notification on top of that, so
  // a send failure must never surface as a submission failure.
  const report = { orderNumber, email, kind, description, photoUrls };
  const studioInbox = process.env.STUDIO_INBOX;
  if (studioInbox) {
    await sendSafely(orderIssueAlert(report, studioInbox), `order issue alert from ${email}`);
  }
  await sendSafely(orderIssueAcknowledgement(report), `order issue ack to ${email}`);

  return { sent: true };
}
