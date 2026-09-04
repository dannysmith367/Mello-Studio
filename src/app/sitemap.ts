import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Without this, Next prerenders the sitemap once at build time and it goes
// stale until the next deploy — a newly published artwork or product would
// never show up. Regenerating hourly keeps it current without hitting the
// database on every crawler request.
export const revalidate = 3600;

/**
 * Everything that isn't pulled from the database. Cart, order-confirmation
 * and unsubscribe are per-visitor and excluded — nothing there is worth a
 * search engine indexing, and cart/order-confirmation are already blocked
 * in robots.ts.
 */
const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/apparel", changeFrequency: "daily", priority: 0.8 },
  { path: "/prints", changeFrequency: "daily", priority: 0.8 },
  { path: "/merch", changeFrequency: "weekly", priority: 0.6 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/commissions", changeFrequency: "monthly", priority: 0.5 },
  { path: "/support", changeFrequency: "monthly", priority: 0.3 },
  { path: "/shipping", changeFrequency: "yearly", priority: 0.3 },
  { path: "/returns", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, products] = await Promise.all([
    db.artwork.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${siteUrl}${path}`,
      changeFrequency,
      priority,
    })
  );

  const artworkEntries: MetadataRoute.Sitemap = artworks.map((artwork) => ({
    url: `${siteUrl}/artwork/${artwork.slug}`,
    lastModified: artwork.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...artworkEntries, ...productEntries];
}
