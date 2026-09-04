"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { storage } from "@/lib/storage";
import { buildDerivatives, inspect } from "@/lib/images";
import { requestImageUpload, type RequestImageUploadResult } from "@/lib/uploads";
import {
  ABOUT_IMAGE_KEY,
  PAGE_INTRO_KEYS,
  SHIPPING_KEYS,
  SITE_SETTINGS_TAG,
  SOCIAL_LINK_KEYS,
} from "@/lib/settings";

const urlOrEmpty = z.union([z.literal(""), z.string().trim().url("Enter a valid URL")]);

const Input = z.object({
  x: urlOrEmpty,
  facebook: urlOrEmpty,
  instagram: urlOrEmpty,
  tiktok: urlOrEmpty,
});

export type SettingsState = { error?: string; saved?: boolean };

export async function updateSocialLinks(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireAdmin();

  const parsed = Input.safeParse({
    x: formData.get("x") ?? "",
    facebook: formData.get("facebook") ?? "",
    instagram: formData.get("instagram") ?? "",
    tiktok: formData.get("tiktok") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }

  const entries = Object.entries(SOCIAL_LINK_KEYS) as [keyof typeof SOCIAL_LINK_KEYS, string][];

  await db.$transaction(
    entries.map(([field, key]) =>
      db.siteSetting.upsert({
        where: { key },
        update: { value: parsed.data[field] },
        create: { key, value: parsed.data[field] },
      })
    )
  );

  revalidateTag(SITE_SETTINGS_TAG);
  revalidatePath("/admin/settings");

  return { saved: true };
}

const PageIntroInput = z.object({
  shop: z.string().max(400).optional(),
  apparel: z.string().max(400).optional(),
  prints: z.string().max(400).optional(),
});

export async function updatePageIntros(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireAdmin();

  const parsed = PageIntroInput.safeParse({
    shop: formData.get("shop") ?? "",
    apparel: formData.get("apparel") ?? "",
    prints: formData.get("prints") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }

  const entries = Object.entries(PAGE_INTRO_KEYS) as [keyof typeof PAGE_INTRO_KEYS, string][];

  await db.$transaction(
    entries.map(([field, key]) => {
      const value = parsed.data[field]?.trim() ?? "";
      return db.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    })
  );

  revalidateTag(SITE_SETTINGS_TAG);
  revalidatePath("/admin/settings");
  revalidatePath("/shop");
  revalidatePath("/apparel");
  revalidatePath("/prints");

  return { saved: true };
}

/** Dollars in, whole cents out — matches how every other money field in the admin works. */
const dollarsToCents = z
  .string()
  .or(z.number())
  .transform((v) => Math.round(Number(v) * 100))
  .refine((v) => Number.isFinite(v) && v >= 0, "Enter a valid amount");

const ShippingInput = z.object({
  flatCents: dollarsToCents,
  freeThresholdCents: dollarsToCents,
});

export async function updateShippingSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireAdmin();

  const parsed = ShippingInput.safeParse({
    flatCents: formData.get("flat") ?? "0",
    freeThresholdCents: formData.get("freeThreshold") ?? "0",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };
  }

  const { flatCents, freeThresholdCents } = parsed.data;

  await db.$transaction([
    db.siteSetting.upsert({
      where: { key: SHIPPING_KEYS.flatCents },
      update: { value: String(flatCents) },
      create: { key: SHIPPING_KEYS.flatCents, value: String(flatCents) },
    }),
    db.siteSetting.upsert({
      where: { key: SHIPPING_KEYS.freeThresholdCents },
      update: { value: String(freeThresholdCents) },
      create: { key: SHIPPING_KEYS.freeThresholdCents, value: String(freeThresholdCents) },
    }),
  ]);

  revalidateTag(SITE_SETTINGS_TAG);
  revalidatePath("/admin/settings");
  revalidatePath("/cart");

  return { saved: true };
}

/** Step 1 of the About-image upload — same signed-URL flow artwork uploads use. */
export async function requestAboutImageUpload(input: {
  filename: string;
  contentType: string;
  bytes: number;
}): Promise<RequestImageUploadResult> {
  await requireAdmin();
  return requestImageUpload(input);
}

/**
 * Step 2: the browser has already put the original in Supabase (via the
 * signed URL from step 1). This reads it back, builds the same derivatives
 * artwork uploads build, and keeps only the web-sized one — a portrait
 * needs no print-quality original or separate thumbnail.
 */
export async function ingestAboutImage(
  originalKey: string
): Promise<{ url: string } | { error: string }> {
  await requireAdmin();

  try {
    const original = await storage.download("originals", originalKey);
    await inspect(original); // fails fast on a corrupt/unsupported file
    const { web } = await buildDerivatives(original);

    const stem = originalKey.replace(/\.[^.]+$/, "");
    const webObject = await storage.upload("public", `${stem}-about.webp`, web.body, web.mimeType);

    await db.siteSetting.upsert({
      where: { key: ABOUT_IMAGE_KEY },
      update: { value: webObject.url ?? "" },
      create: { key: ABOUT_IMAGE_KEY, value: webObject.url ?? "" },
    });

    revalidateTag(SITE_SETTINGS_TAG);
    revalidatePath("/admin/settings");
    revalidatePath("/about");

    return { url: webObject.url ?? "" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not process that image.",
    };
  }
}

export async function removeAboutImage(): Promise<void> {
  await requireAdmin();

  await db.siteSetting.upsert({
    where: { key: ABOUT_IMAGE_KEY },
    update: { value: "" },
    create: { key: ABOUT_IMAGE_KEY, value: "" },
  });

  revalidateTag(SITE_SETTINGS_TAG);
  revalidatePath("/admin/settings");
  revalidatePath("/about");
}
