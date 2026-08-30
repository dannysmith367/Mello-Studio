"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendSafely } from "@/lib/email";
import { inquiryAcknowledgement, inquiryAlert } from "@/lib/email/templates/inquiry";

const InquiryInput = z.object({
  name: z.string().min(1, "Enter your name").max(120),
  email: z.string().email("Enter a valid email address").max(200),
  phone: z.string().max(40).optional(),
  medium: z.string().max(120).optional(),
  sizeNote: z.string().max(120).optional(),
  budgetRange: z.string().max(60).optional(),
  timeline: z.string().max(60).optional(),
  message: z.string().min(10, "Tell Mello a little more").max(4000),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional(),
});

export type InquiryState = { error?: string; sent?: boolean };

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const parsed = InquiryInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    medium: formData.get("medium") ?? undefined,
    sizeNote: formData.get("sizeNote") ?? undefined,
    budgetRange: formData.get("budgetRange") ?? undefined,
    timeline: formData.get("timeline") ?? undefined,
    message: formData.get("message"),
    website: formData.get("website") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { website, ...data } = parsed.data;
  // Silently accept bot submissions so the bot doesn't learn to adapt.
  if (website) return { sent: true };

  await db.commissionInquiry.create({
    data: {
      ...data,
      phone: data.phone || null,
      medium: data.medium || null,
      sizeNote: data.sizeNote || null,
      budgetRange: data.budgetRange || null,
      timeline: data.timeline || null,
    },
  });

  // The enquiry is already saved. Email is a notification on top of that,
  // so a send failure must never surface as a submission failure.
  const studioInbox = process.env.STUDIO_INBOX;
  if (studioInbox) {
    await sendSafely(inquiryAlert(data, studioInbox), `enquiry alert from ${data.email}`);
  }
  await sendSafely(inquiryAcknowledgement(data), `enquiry ack to ${data.email}`);

  return { sent: true };
}
