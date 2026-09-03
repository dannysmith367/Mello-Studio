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

export async function getPublishedArtworks(
  limit?: number,
  opts: { kind?: "ARTWORK" | "STUDIO" } = {}
) {
  return db.artwork.findMany({
    where: { status: "PUBLISHED", ...(opts.kind ? { kind: opts.kind } : {}) },
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

/**
 * Category is a filter over one catalog, not a separate tree. A specific
 * product type ("Hoodies") and an artwork narrow it further — /apparel and
 * /prints are category pages with those two filters layered on top.
 */
export async function getProductsByCategory(
  category?: "APPAREL" | "PRINT" | "ACCESSORY",
  opts: { productTypeSlug?: string; artworkSlug?: string } = {}
) {
  return db.product.findMany({
    where: {
      published: true,
      ...(category ? { productType: { category } } : {}),
      ...(opts.productTypeSlug ? { productType: { slug: opts.productTypeSlug } } : {}),
      ...(opts.artworkSlug ? { artwork: { slug: opts.artworkSlug } } : {}),
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
 * as five formats is one tile, not five. Tiles always show the artwork
 * itself (never a garment mockup) since the piece, not any one format, is
 * what's being browsed here; format-specific mockups belong on the detail
 * pages. `fromPriceCents` is the cheapest published product matching the
 * same filter, so an "apparel" listing prices by the cheapest apparel
 * product even if the piece also has a cheaper print. `formats` is every
 * distinct product type that piece is available in ("Tee", "Hoodie",
 * "Poster"), in the same order they're set up in the admin, so a tile says
 * up front what there actually is to buy.
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
    // STUDIO pieces (e.g. the logo) exist to carry merch, not to be browsed
    // as art, so every artwork-first listing excludes them.
    where: { status: "PUBLISHED", kind: "ARTWORK", products: { some: productFilter } },
    select: {
      id: true,
      slug: true,
      title: true,
      featured: true,
      assets: true,
      products: {
        where: productFilter,
        select: {
          retailPriceCents: true,
          productType: { select: { name: true, sortOrder: true } },
        },
      },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return artworks.map(({ products, ...artwork }) => {
    const formats = [...new Map(products.map((p) => [p.productType.name, p.productType.sortOrder]))]
      .sort(([, a], [, b]) => a - b)
      .map(([name]) => name);

    return {
      ...artwork,
      fromPriceCents: Math.min(...products.map((p) => p.retailPriceCents)),
      formats,
    };
  });
}

/**
 * Products made from STUDIO artwork (brand assets like the logo) — listed
 * directly as product tiles on /merch rather than grouped under an artwork
 * tile, since there's no piece of art to browse behind them.
 */
export async function getStudioProducts() {
  return db.product.findMany({
    where: { published: true, artwork: { kind: "STUDIO" } },
    include: {
      productType: true,
      artwork: { include: { assets: true } },
      variants: { where: { active: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Types that can actually show up in a format row — published work in
 * them, and a tile image set. Shared by /shop (no category — every type),
 * /apparel and /prints (scoped to just that category's types).
 */
export async function getFormatTypes(category?: "APPAREL" | "PRINT" | "ACCESSORY") {
  return db.productType.findMany({
    where: {
      imageUrl: { not: null },
      products: { some: { published: true } },
      ...(category ? { category } : {}),
    },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true },
  });
}

/** The secondary "piece" filter on /apparel and /prints — every artwork with a published product in view. */
export async function getArtworksForCategoryFilter(
  category: "APPAREL" | "PRINT" | "ACCESSORY",
  productTypeSlug?: string
) {
  return db.artwork.findMany({
    where: {
      status: "PUBLISHED",
      products: {
        some: {
          published: true,
          productType: {
            category,
            ...(productTypeSlug ? { slug: productTypeSlug } : {}),
          },
        },
      },
    },
    select: { slug: true, title: true },
    orderBy: { title: "asc" },
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
