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
