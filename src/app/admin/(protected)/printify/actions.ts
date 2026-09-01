"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { PrintifyProvider } from "@/lib/fulfillment/printify";
import type { PrintifyOption, PrintifyVariant } from "@/lib/fulfillment/printify/client";

const provider = new PrintifyProvider();

/**
 * Resolves a variant's colour and size from Printify's option model.
 *
 * Printify stores variant options as an array of numeric option-value ids;
 * the human-readable names live in the product's `options` array. This walks
 * that indirection so we store "Black / L" rather than [2734, 18].
 */
function resolveOptions(variant: PrintifyVariant, options: PrintifyOption[]) {
  let color: string | null = null;
  let colorHex: string | null = null;
  let size: string | null = null;

  for (const optionId of variant.options ?? []) {
    for (const option of options) {
      const value = option.values.find((v) => v.id === optionId);
      if (!value) continue;

      const name = option.name.toLowerCase();
      if (name.includes("color") || name.includes("colour")) {
        color = value.title;
        colorHex = value.colors?.[0] ?? null;
      } else if (name.includes("size")) {
        size = value.title;
      }
    }
  }

  // Fall back to splitting the title, which is formatted "Colour / Size".
  if (!color && !size && variant.title?.includes(" / ")) {
    const [first, second] = variant.title.split(" / ");
    color = first ?? null;
    size = second ?? null;
  }

  return { color, colorHex, size };
}

export async function listPrintifyProducts() {
  await requireAdmin();

  if (!provider.isConfigured) {
    return { error: "Add PRINTIFY_API_KEY and PRINTIFY_SHOP_ID to your environment." };
  }

  try {
    const products = await provider.client().listProducts();
    const imported = await db.product.findMany({
      where: { providerProductId: { not: null } },
      select: { providerProductId: true },
    });
    const importedIds = new Set(imported.map((p) => p.providerProductId));

    return {
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
image: (p.images ?? []).find((i) => i.is_default)?.src ?? (p.images ?? [])[0]?.src ?? null,
        variantCount: (p.variants ?? []).filter((v) => v.is_enabled !== false).length,
                alreadyImported: importedIds.has(p.id),
      })),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not reach Printify." };
  }
}

export async function listShops() {
  await requireAdmin();
  if (!provider.isConfigured) return { error: "Printify is not configured." };

  try {
    return { shops: await provider.client().listShops() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not reach Printify." };
  }
}

const ImportInput = z.object({
  printifyProductId: z.string().min(1),
  artworkId: z.string().min(1),
  productTypeId: z.string().min(1),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || "product";
  let n = 2;
  while (await db.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

/**
 * Pulls one Printify product into our catalog.
 *
 * We take structure and cost from Printify. We do not take retail price —
 * that is a business decision that belongs to us, and Printify's suggested
 * price is only a default to be edited. This is the whole point of the
 * architecture: Printify fulfils, we own the storefront.
 */
export async function importPrintifyProduct(raw: unknown) {
  await requireAdmin();

  const parsed = ImportInput.safeParse(raw);
  if (!parsed.success) return { error: "Choose an artwork and a product type." };

  const { printifyProductId, artworkId, productTypeId } = parsed.data;

  const existing = await db.product.findFirst({
    where: { providerProductId: printifyProductId },
  });
  if (existing) {
    return { error: "That Printify product has already been imported.", id: existing.id };
  }

  try {
    const remote = await provider.client().getProduct(printifyProductId);
    const enabled = (remote.variants ?? []).filter((v) => v.is_enabled !== false);

    if (enabled.length === 0) {
      return { error: "That Printify product has no enabled variants." };
    }

    // Cost varies by size, so the lowest is the honest headline figure.
    const costs = enabled.map((v) => v.cost ?? 0).filter((c) => c > 0);
    const baseCostCents = costs.length > 0 ? Math.min(...costs) : 0;
    const suggested = enabled.map((v) => v.price ?? 0).filter((p) => p > 0);
    const retailPriceCents = suggested.length > 0 ? Math.min(...suggested) : baseCostCents * 2;

    const product = await db.product.create({
      data: {
        artworkId,
        productTypeId,
        name: remote.title,
        slug: await uniqueSlug(slugify(remote.title)),
        description: remote.description?.replace(/<[^>]+>/g, "").trim() || null,
        baseCostCents,
        retailPriceCents,
        fulfillmentProvider: "PRINTIFY",
        providerProductId: remote.id,
        providerShopId: process.env.PRINTIFY_SHOP_ID ?? null,
        published: false,
      },
    });

    // Variant SKUs must be unique across the catalog; Printify SKUs are only
    // unique within a product, so prefix with our product id.
    const seen = new Set<string>();
    const variantData = enabled.map((variant) => {
      const { color, colorHex, size } = resolveOptions(variant, (remote.options ?? []) as PrintifyOption[]);
      let sku = variant.sku?.trim() || `${remote.id}-${variant.id}`;
      if (seen.has(sku)) sku = `${sku}-${variant.id}`;
      seen.add(sku);

      return {
        productId: product.id,
        size,
        color,
        colorHex,
        sku: sku.slice(0, 80),
        providerVariantId: String(variant.id),
        // Only store an override where this variant costs more than the base.
        priceOverrideCents:
          variant.cost && variant.cost > baseCostCents
            ? retailPriceCents + (variant.cost - baseCostCents)
            : null,
        active: true,
      };
    });

    await db.productVariant.createMany({ data: variantData, skipDuplicates: true });

    revalidatePath("/admin/products");
    revalidatePath("/admin/printify");
    return { id: product.id, variantCount: variantData.length };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import failed." };
  }
}