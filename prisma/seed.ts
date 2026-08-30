import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Seed data uses six pieces from Mello's existing photos, cropped for the web.
 * These are demonstration images only — they are display-resolution snapshots,
 * not print files. Real print files get uploaded through the admin in Phase 4.
 */

const ARTWORKS = [
  {
    slug: "chakra-bloom",
    title: "Chakra Bloom",
    medium: "Coloured pencil on paper",
    yearCreated: 2020,
    featured: true,
    description:
      "A column of light opening through cloud, each centre rendered as its own small bloom.",
  },
  {
    slug: "ganesha-throne",
    title: "Ganesha, Enthroned",
    medium: "Acrylic on cloth",
    yearCreated: 2019,
    featured: false,
    description: "Seated figure against a radiating sun, framed in lotus.",
  },
  {
    slug: "emerald-serpent",
    title: "Emerald Serpent",
    medium: "Acrylic on canvas",
    yearCreated: 2021,
    featured: false,
    description: "A green mask riding a wave of colour over open hands.",
  },
  {
    slug: "the-player",
    title: "The Player",
    medium: "Acrylic on cloth",
    yearCreated: 2019,
    featured: false,
    description: "Figure with guitar against a lattice of sacred geometry.",
  },
  {
    slug: "green-dragon",
    title: "Green Dragon",
    medium: "Ink and acrylic on cloth",
    yearCreated: 2020,
    featured: false,
    description: "Coiled dragon in the flat-line style of traditional flash.",
  },
  {
    slug: "lotus-radiant",
    title: "Lotus Radiant",
    medium: "Acrylic on canvas",
    yearCreated: 2021,
    featured: false,
    description: "Lotus opening under a burst of rays on a night field.",
  },
  {
    slug: "blue-current",
    title: "Blue Current",
    medium: "Acrylic on board",
    yearCreated: 2020,
    featured: false,
    description: "Figure carried on a wash of blue, geometry surfacing through the water.",
  },
  {
    slug: "red-heart-lattice",
    title: "Red Heart Lattice",
    medium: "Acrylic on canvas",
    yearCreated: 2021,
    featured: false,
    description: "Two hearts held inside a lattice of vine and line.",
  },
];

const PRODUCT_TYPES = [
  {
    slug: "classic-tee",
    name: "Classic Tee",
    category: "APPAREL" as const,
    requiresTransparency: true,
    defaultPrintWidthIn: 12,
    defaultPrintHeightIn: 16,
    sortOrder: 1,
  },
  {
    slug: "heavyweight-hoodie",
    name: "Heavyweight Hoodie",
    category: "APPAREL" as const,
    requiresTransparency: true,
    defaultPrintWidthIn: 12,
    defaultPrintHeightIn: 14,
    sortOrder: 2,
  },
  {
    slug: "art-print",
    name: "Art Print",
    category: "PRINT" as const,
    requiresTransparency: false,
    defaultPrintWidthIn: 18,
    defaultPrintHeightIn: 24,
    sortOrder: 3,
  },
  {
    slug: "poster",
    name: "Poster",
    category: "PRINT" as const,
    requiresTransparency: false,
    defaultPrintWidthIn: 24,
    defaultPrintHeightIn: 36,
    sortOrder: 4,
  },
];

const TEE_SIZES = ["S", "M", "L", "XL", "2XL"];
const TEE_COLORS = [
  { color: "Black", hex: "#16181C" },
  { color: "Bone", hex: "#EFEDE6" },
];

async function main() {
  console.log("Seeding Mello Studio…");

  // Product types
  for (const type of PRODUCT_TYPES) {
    await db.productType.upsert({
      where: { slug: type.slug },
      update: type,
      create: type,
    });
  }

  const teeType = await db.productType.findUniqueOrThrow({ where: { slug: "classic-tee" } });
  const printType = await db.productType.findUniqueOrThrow({ where: { slug: "art-print" } });

  // Artwork + assets
  for (const art of ARTWORKS) {
    const artwork = await db.artwork.upsert({
      where: { slug: art.slug },
      update: {},
      create: {
        title: art.title,
        slug: art.slug,
        description: art.description,
        medium: art.medium,
        yearCreated: art.yearCreated,
        featured: art.featured,
        status: "PUBLISHED",
        seoTitle: `${art.title} — original artwork by Mello`,
        seoDescription: art.description,
      },
    });

    const existing = await db.artworkAsset.count({ where: { artworkId: artwork.id } });
    if (existing === 0) {
      await db.artworkAsset.createMany({
        data: [
          {
            artworkId: artwork.id,
            kind: "WEB",
            storageKey: `artwork/${art.slug}.jpg`,
            url: `/artwork/${art.slug}.jpg`,
            mimeType: "image/jpeg",
            altText: `${art.title} by Mello — ${art.medium}`,
          },
          {
            artworkId: artwork.id,
            kind: "THUMBNAIL",
            storageKey: `artwork/${art.slug}-thumb.jpg`,
            url: `/artwork/${art.slug}-thumb.jpg`,
            mimeType: "image/jpeg",
            altText: `${art.title} by Mello`,
          },
        ],
      });
    }

    // One artwork → two products, proving the reuse model.
    const tee = await db.product.upsert({
      where: { slug: `${art.slug}-tee` },
      update: {},
      create: {
        artworkId: artwork.id,
        productTypeId: teeType.id,
        name: `${art.title} Tee`,
        slug: `${art.slug}-tee`,
        description: `${art.title} printed on heavyweight cotton.`,
        baseCostCents: 1450,
        retailPriceCents: 3800,
        fulfillmentProvider: "PRINTIFY",
        published: true,
        featured: art.featured,
      },
    });

    const variantCount = await db.productVariant.count({ where: { productId: tee.id } });
    if (variantCount === 0) {
      await db.productVariant.createMany({
        data: TEE_COLORS.flatMap((c) =>
          TEE_SIZES.map((size) => ({
            productId: tee.id,
            size,
            color: c.color,
            colorHex: c.hex,
            sku: `MS-${art.slug.toUpperCase().slice(0, 8)}-TEE-${c.color.slice(0, 2).toUpperCase()}-${size}`,
          }))
        ),
      });
    }

    const print = await db.product.upsert({
      where: { slug: `${art.slug}-print` },
      update: {},
      create: {
        artworkId: artwork.id,
        productTypeId: printType.id,
        name: `${art.title} Art Print`,
        slug: `${art.slug}-print`,
        description: `Giclée reproduction of ${art.title}, shipped flat.`,
        baseCostCents: 1200,
        retailPriceCents: 5500,
        fulfillmentProvider: "PRINTIFY",
        published: true,
      },
    });

    const printVariants = await db.productVariant.count({ where: { productId: print.id } });
    if (printVariants === 0) {
      await db.productVariant.createMany({
        data: [
          { productId: print.id, size: '12" × 18"', sku: `MS-${art.slug.toUpperCase().slice(0, 8)}-PR-1218` },
          { productId: print.id, size: '18" × 24"', sku: `MS-${art.slug.toUpperCase().slice(0, 8)}-PR-1824` },
        ],
      });
    }
  }

  // Collections: one permanent series, one timed drop — same table.
  const series = await db.collection.upsert({
    where: { slug: "visionary" },
    update: {},
    create: {
      name: "Visionary",
      slug: "visionary",
      kind: "SERIES",
      description: "Sacred geometry, light and figure.",
      published: true,
      sortOrder: 1,
    },
  });

  const drop = await db.collection.upsert({
    where: { slug: "first-edition" },
    update: {},
    create: {
      name: "First Edition",
      slug: "first-edition",
      kind: "DROP",
      description: "The opening run. Closes when it closes.",
      editionLimit: 100,
      opensAt: new Date(),
      published: true,
      sortOrder: 2,
    },
  });

  const seriesSlugs = ["chakra-bloom", "ganesha-throne", "the-player", "lotus-radiant"];
  const dropSlugs = ["emerald-serpent", "green-dragon", "blue-current", "red-heart-lattice"];

  for (const [index, slug] of seriesSlugs.entries()) {
    const artwork = await db.artwork.findUniqueOrThrow({ where: { slug } });
    await db.collectionArtwork.upsert({
      where: { collectionId_artworkId: { collectionId: series.id, artworkId: artwork.id } },
      update: {},
      create: { collectionId: series.id, artworkId: artwork.id, sortOrder: index },
    });
  }

  for (const [index, slug] of dropSlugs.entries()) {
    const artwork = await db.artwork.findUniqueOrThrow({ where: { slug } });
    await db.collectionArtwork.upsert({
      where: { collectionId_artworkId: { collectionId: drop.id, artworkId: artwork.id } },
      update: {},
      create: { collectionId: drop.id, artworkId: artwork.id, sortOrder: index },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
