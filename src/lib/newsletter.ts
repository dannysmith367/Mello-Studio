"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendSafely } from "@/lib/email";
import { newsletterWelcome } from "@/lib/email/templates/newsletter";

const Input = z.object({
  email: z.string().email("Enter a valid email address").max(200),
  source: z.string().max(60).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export type SubscribeState = { error?: string; subscribed?: boolean };

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const parsed = Input.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? undefined,
    website: formData.get("website") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  const { email, source, website } = parsed.data;
  if (website) return { subscribed: true };

  const address = email.toLowerCase();
  const token = randomBytes(24).toString("base64url");

  const subscriber = await db.newsletterSubscriber.upsert({
    where: { email: address },
    update: { unsubscribedAt: null },
    create: {
      email: address,
      source: source ?? null,
      unsubscribeToken: token,
      confirmedAt: new Date(),
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendSafely(
    newsletterWelcome(
      address,
      `${siteUrl}/unsubscribe?token=${subscriber.unsubscribeToken}`
    ),
    `newsletter welcome to ${address}`
  );

  return { subscribed: true };
}
