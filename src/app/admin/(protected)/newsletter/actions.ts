"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { sendSafely } from "@/lib/email";
import { newsletterCampaign } from "@/lib/email/templates/newsletter";

// Resend's free tier caps at 100 emails/day; this keeps a campaign from
// blowing through that in one click. Sends are metered against the last
// rolling 24h, not the calendar day, so "come back tomorrow" always means
// "in <24h", regardless of when the first batch went out.
const DAILY_LIMIT = 100;
const BATCH_SIZE = 10;

async function sentInLast24h(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.newsletterSend.count({ where: { sentAt: { gte: since } } });
}

/**
 * Sends one campaign's next allotment of recipients.
 *
 * Recipients are resolved fresh on every call (confirmed, not unsubscribed,
 * not already sent-to for this campaign) rather than snapshotted, so an
 * unsubscribe between batches is always respected. Safe to call repeatedly —
 * it does nothing once every confirmed subscriber has been reached.
 */
async function sendCampaignBatch(campaignId: string): Promise<{ sent: number; limited: boolean }> {
  const remainingBudget = DAILY_LIMIT - (await sentInLast24h());
  if (remainingBudget <= 0) return { sent: 0, limited: true };

  const campaign = await db.newsletterCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.completedAt) return { sent: 0, limited: false };

  const alreadySent = await db.newsletterSend.findMany({
    where: { campaignId },
    select: { subscriberId: true },
  });
  const sentIds = alreadySent.map((s) => s.subscriberId);

  const pending = await db.newsletterSubscriber.findMany({
    where: {
      confirmedAt: { not: null },
      unsubscribedAt: null,
      id: { notIn: sentIds },
    },
    take: remainingBudget,
    orderBy: { createdAt: "asc" },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let sentCount = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (subscriber) => {
        const ok = await sendSafely(
          newsletterCampaign(
            subscriber.email,
            campaign.subject,
            campaign.body,
            `${siteUrl}/unsubscribe?token=${subscriber.unsubscribeToken}`
          ),
          `newsletter campaign ${campaign.id} to ${subscriber.email}`
        );
        return ok ? subscriber.id : null;
      })
    );

    const delivered = results.filter((id): id is string => id !== null);
    if (delivered.length > 0) {
      await db.newsletterSend.createMany({
        data: delivered.map((subscriberId) => ({ campaignId, subscriberId })),
        skipDuplicates: true,
      });
      sentCount += delivered.length;
    }
  }

  const stillPending = await db.newsletterSubscriber.count({
    where: {
      confirmedAt: { not: null },
      unsubscribedAt: null,
      id: { notIn: [...sentIds, ...pending.map((p) => p.id)] },
    },
  });

  await db.newsletterCampaign.update({
    where: { id: campaignId },
    data: {
      sentCount: { increment: sentCount },
      completedAt: stillPending === 0 ? new Date() : null,
    },
  });

  return { sent: sentCount, limited: pending.length >= remainingBudget && stillPending > 0 };
}

const ComposeInput = z.object({
  subject: z.string().min(1, "Enter a subject").max(200),
  body: z.string().min(1, "Enter a message").max(20000),
});

export type ComposeState = { error?: string; success?: string };

export async function sendNewsletter(
  _prev: ComposeState,
  formData: FormData
): Promise<ComposeState> {
  await requireAdmin();

  const parsed = ComposeInput.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }

  const recipientCount = await db.newsletterSubscriber.count({
    where: { confirmedAt: { not: null }, unsubscribedAt: null },
  });
  if (recipientCount === 0) {
    return { error: "There are no confirmed subscribers to send to." };
  }

  const campaign = await db.newsletterCampaign.create({
    data: { subject: parsed.data.subject, body: parsed.data.body },
  });

  const { sent, limited } = await sendCampaignBatch(campaign.id);

  revalidatePath("/admin/newsletter");

  if (sent === 0 && limited) {
    return {
      error:
        "Today's send limit is already used up. This campaign was saved — resume it from the list below once the limit resets.",
    };
  }

  return {
    success: limited
      ? `Sent to ${sent} of ${recipientCount} subscribers. The daily limit was reached — resume sending tomorrow.`
      : `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}.`,
  };
}

export async function resumeCampaign(formData: FormData) {
  await requireAdmin();
  const campaignId = String(formData.get("campaignId"));
  await sendCampaignBatch(campaignId);
  revalidatePath("/admin/newsletter");
}
