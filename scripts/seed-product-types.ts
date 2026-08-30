import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Product types are rows, not code. Adding hats or stickers later means
 * adding a row here (or in the database) — no migration, no deploy.
 *
 * Print areas are approximate defaults used to warn when an artwork is too
 * low-resolution for the product. Adjust them to match the blueprint you
 * actually choose in Printify.
 */
const TYPES = [
  { slug: "classic-tee", name: "Classic Tee", category: "APPAREL", requiresTransparency: true, defaultPrintWidthIn: 12, defaultPrintHeightIn: 16, sortOrder: 1 },
  { slug: "heavyweight-hoodie", name: "Heavyweight Hoodie", category: "APPAREL", requiresTransparency: true, defaultPrintWidthIn: 12, defaultPrintHeightIn: 14, sortOrder: 2 },
  { slug: "long-sleeve", name: "Long Sleeve", category: "APPAREL", requiresTransparency: true, defaultPrintWidthIn: 12, defaultPrintHeightIn: 16, sortOrder: 3 },
  { slug: "art-print", name: "Art Print", category: "PRINT", requiresTransparency: false, defaultPrintWidthIn: 12, defaultPrintHeightIn: 18, sortOrder: 4 },
  { slug: "poster", name: "Poster", category: "PRINT", requiresTransparency: false, defaultPrintWidthIn: 18, defaultPrintHeightIn: 24, sortOrder: 5 },
  { slug: "canvas", name: "Canvas", category: "PRINT", requiresTransparency: false, defaultPrintWidthIn: 16, defaultPrintHeightIn: 20, sortOrder: 6 },
  { slug: "sticker", name: "Sticker", category: "ACCESSORY", requiresTransparency: true, defaultPrintWidthIn: 3, defaultPrintHeightIn: 3, sortOrder: 7 },
  { slug: "hat", name: "Embroidered Hat", category: "ACCESSORY", requiresTransparency: true, defaultPrintWidthIn: 4, defaultPrintHeightIn: 2, sortOrder: 8 },
] as const;

async function main() {
  for (const type of TYPES) {
    await db.productType.upsert({
      where: { slug: type.slug },
      update: { ...type },
      create: { ...type },
    });
  }
  console.log(`Ready: ${TYPES.length} product types.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
