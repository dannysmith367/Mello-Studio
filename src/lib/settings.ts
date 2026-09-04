import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";

/**
 * Small admin-editable key/value store, cached across requests so a
 * cache-cold page (the footer renders on every page) isn't a database
 * query every time. The save action busts this by tag, so an edit shows up
 * immediately rather than waiting out the TTL.
 */
export const SITE_SETTINGS_TAG = "site-settings";

export const SOCIAL_LINK_KEYS = {
  x: "social.x",
  facebook: "social.facebook",
  instagram: "social.instagram",
  tiktok: "social.tiktok",
} as const;

export type SocialLinks = Record<keyof typeof SOCIAL_LINK_KEYS, string>;

const getCachedSocialLinks = unstable_cache(
  async (): Promise<SocialLinks> => {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: Object.values(SOCIAL_LINK_KEYS) } },
    });
    const byKey = new Map(rows.map((row) => [row.key, row.value]));

    return {
      x: byKey.get(SOCIAL_LINK_KEYS.x) ?? "",
      facebook: byKey.get(SOCIAL_LINK_KEYS.facebook) ?? "",
      instagram: byKey.get(SOCIAL_LINK_KEYS.instagram) ?? "",
      tiktok: byKey.get(SOCIAL_LINK_KEYS.tiktok) ?? "",
    };
  },
  ["social-links"],
  { tags: [SITE_SETTINGS_TAG], revalidate: 300 }
);

export async function getSocialLinks(): Promise<SocialLinks> {
  return getCachedSocialLinks();
}

export const ABOUT_IMAGE_KEY = "about_image_url";

const getCachedAboutImageUrl = unstable_cache(
  async (): Promise<string> => {
    const row = await db.siteSetting.findUnique({ where: { key: ABOUT_IMAGE_KEY } });
    return row?.value ?? "";
  },
  ["about-image-url"],
  { tags: [SITE_SETTINGS_TAG], revalidate: 300 }
);

export async function getAboutImageUrl(): Promise<string> {
  return getCachedAboutImageUrl();
}

export const SHIPPING_KEYS = {
  flatCents: "shipping_flat_cents",
  freeThresholdCents: "shipping_free_threshold_cents",
} as const;

export type ShippingSettings = {
  flatCents: number;
  /** 0 disables the threshold — nothing ever ships free on price alone. */
  freeThresholdCents: number;
};

const getCachedShippingSettings = unstable_cache(
  async (): Promise<ShippingSettings> => {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: Object.values(SHIPPING_KEYS) } },
    });
    const byKey = new Map(rows.map((row) => [row.key, row.value]));

    return {
      flatCents: Number(byKey.get(SHIPPING_KEYS.flatCents) ?? 0) || 0,
      freeThresholdCents: Number(byKey.get(SHIPPING_KEYS.freeThresholdCents) ?? 0) || 0,
    };
  },
  ["shipping-settings"],
  { tags: [SITE_SETTINGS_TAG], revalidate: 300 }
);

export async function getShippingSettings(): Promise<ShippingSettings> {
  return getCachedShippingSettings();
}

/**
 * The one place that decides what an order actually gets charged for
 * shipping — used identically by the cart summary and checkout, so what
 * the customer sees before paying is exactly what they're charged.
 */
export function resolveShippingCents(subtotalCents: number, settings: ShippingSettings): number {
  if (settings.freeThresholdCents > 0 && subtotalCents >= settings.freeThresholdCents) {
    return 0;
  }
  return settings.flatCents;
}

export const PAGE_INTRO_KEYS = {
  shop: "shop_intro",
  apparel: "apparel_intro",
  prints: "prints_intro",
} as const;

export type PageIntros = Record<keyof typeof PAGE_INTRO_KEYS, string>;

/** Shown until an admin sets something in /admin/settings, and again the moment a field is cleared back to empty. */
export const PAGE_INTRO_DEFAULTS: PageIntros = {
  shop: "Every piece currently available, on cloth and paper.",
  apparel: "Artwork printed on heavyweight cotton. Cut for a relaxed fit.",
  prints:
    "Reproductions of Mello’s original paintings and drawings, printed on archival stock and shipped flat in a rigid mailer.",
};

const getCachedPageIntros = unstable_cache(
  async (): Promise<PageIntros> => {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: Object.values(PAGE_INTRO_KEYS) } },
    });
    const byKey = new Map(rows.map((row) => [row.key, row.value]));

    return {
      shop: byKey.get(PAGE_INTRO_KEYS.shop) || PAGE_INTRO_DEFAULTS.shop,
      apparel: byKey.get(PAGE_INTRO_KEYS.apparel) || PAGE_INTRO_DEFAULTS.apparel,
      prints: byKey.get(PAGE_INTRO_KEYS.prints) || PAGE_INTRO_DEFAULTS.prints,
    };
  },
  ["page-intros"],
  { tags: [SITE_SETTINGS_TAG], revalidate: 300 }
);

export async function getPageIntros(): Promise<PageIntros> {
  return getCachedPageIntros();
}
