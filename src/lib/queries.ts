import { db } from "./db";

/**
 * Read helpers for the public storefront. Kept here so page components
 * stay presentational and database access has one home.
 */

const publishedArtworkSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  yearCreated: true,
  medium: true,
  featured: true,
} as const;

export async function getFeaturedArtwork() {
  return db.artwork.findFirst({
    where: { status: "PUBLISHED", featured: true },
    select: { ...publishedArtworkSelect, assets: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPublishedArtworks(limit?: number) {
  return db.artwork.findMany({
    where: { status: "PUBLISHED" },
    select: { ...publishedArtworkSelect, assets: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getArtworkBySlug(slug: string) {
  return db.artwork.findUnique({
    where: { slug },
    include: {
      assets: true,
      products: {
        where: { published: true },
        include: { productType: true, variants: { where: { active: true } } },
      },
      collections: { include: { collection: true } },
    },
  });
}

/** Category is a filter over one catalog, not a separate tree. */
export async function getProductsByCategory(
  category?: "APPAREL" | "PRINT" | "ACCESSORY"
) {
  return db.product.findMany({
    where: {
      published: true,
      ...(category ? { productType: { category } } : {}),
    },
    include: {
      productType: true,
      artwork: { include: { assets: true } },
      variants: { where: { active: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      productType: true,
      artwork: { include: { assets: true } },
      variants: { where: { active: true }, orderBy: { sku: "asc" } },
    },
  });
}

export async function getPublishedCollections() {
  return db.collection.findMany({
    where: { published: true },
    include: { coverAsset: true, _count: { select: { artworks: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCollectionBySlug(slug: string) {
  return db.collection.findUnique({
    where: { slug },
    include: {
      coverAsset: true,
      artworks: {
        orderBy: { sortOrder: "asc" },
        include: { artwork: { include: { assets: true } } },
      },
    },
  });
}

/** A drop is open if it has dates and we're inside them. Series are always open. */
export function isCollectionOpen(collection: {
  kind: string;
  opensAt: Date | null;
  closesAt: Date | null;
}): boolean {
  if (collection.kind !== "DROP") return true;
  const now = Date.now();
  if (collection.opensAt && now < collection.opensAt.getTime()) return false;
  if (collection.closesAt && now > collection.closesAt.getTime()) return false;
  return true;
}
