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

/**
 * The public catalog is browsed by artwork, not by product — a piece sold
 * as five formats is one tile, not five. `fromPriceCents` is the cheapest
 * published product matching the same filter, so an "apparel" listing
 * prices by the cheapest apparel product even if the piece also has a
 * cheaper print.
 */
export async function getArtworksWithProducts({
  category,
  productTypeSlug,
}: {
  category?: "APPAREL" | "PRINT" | "ACCESSORY";
  productTypeSlug?: string;
} = {}) {
  const productFilter = {
    published: true,
    ...(category ? { productType: { category } } : {}),
    ...(productTypeSlug ? { productType: { slug: productTypeSlug } } : {}),
  };

  const artworks = await db.artwork.findMany({
    where: { status: "PUBLISHED", products: { some: productFilter } },
    select: {
      id: true,
      slug: true,
      title: true,
      featured: true,
      assets: true,
      products: { where: productFilter, select: { retailPriceCents: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return artworks.map(({ products, ...artwork }) => ({
    ...artwork,
    fromPriceCents: Math.min(...products.map((p) => p.retailPriceCents)),
  }));
}

/** Types that can actually show up in the /shop format row — published work in them, and a tile image set. */
export async function getShopFormatTypes() {
  return db.productType.findMany({
    where: { imageUrl: { not: null }, products: { some: { published: true } } },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true },
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
