"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

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
  const root = base || "product";
  let candidate = root;
  let n = 2;
  while (await db.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

/** Money arrives from forms as dollars. It is stored as integer cents. */
const dollarsToCents = z
  .string()
  .or(z.number())
  .transform((v) => Math.round(Number(v) * 100))
  .refine((v) => Number.isFinite(v) && v >= 0, "Enter a valid amount");

const CreateInput = z.object({
  artworkId: z.string().min(1),
  productTypeId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  baseCostCents: dollarsToCents,
  retailPriceCents: dollarsToCents,
  fulfillmentProvider: z.enum(["PRINTIFY", "PRINTFUL", "MANUAL"]),
});

export async function createProduct(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = CreateInput.safeParse({
    artworkId: formData.get("artworkId"),
    productTypeId: formData.get("productTypeId"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    baseCostCents: formData.get("baseCost") ?? "0",
    retailPriceCents: formData.get("retailPrice") ?? "0",
    fulfillmentProvider: formData.get("fulfillmentProvider") ?? "PRINTIFY",
  });

  if (!parsed.success) return { error: "Check the fields and try again." };

  const { name, ...rest } = parsed.data;
  const product = await db.product.create({
    data: {
      ...rest,
      name,
      slug: await uniqueSlug(slugify(name)),
      description: rest.description || null,
      published: false,
    },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

const UpdateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  baseCostCents: dollarsToCents,
  retailPriceCents: dollarsToCents,
  fulfillmentProvider: z.enum(["PRINTIFY", "PRINTFUL", "MANUAL"]),
  providerProductId: z.string().max(200).optional(),
  published: z.coerce.boolean(),
  featured: z.coerce.boolean(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
});

export async function updateProduct(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = UpdateInput.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    baseCostCents: formData.get("baseCost") ?? "0",
    retailPriceCents: formData.get("retailPrice") ?? "0",
    fulfillmentProvider: formData.get("fulfillmentProvider"),
    providerProductId: formData.get("providerProductId") ?? undefined,
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
    seoTitle: formData.get("seoTitle") ?? undefined,
    seoDescription: formData.get("seoDescription") ?? undefined,
  });

  if (!parsed.success) return { error: "Check the fields and try again." };

  const { id, ...data } = parsed.data;

  // Publishing with no active variant would put a product on the site that
  // cannot be added to a bag.
  if (data.published) {
    const active = await db.productVariant.count({
      where: { productId: id, active: true },
    });
    if (active === 0) {
      return { error: "Add at least one variant before publishing." };
    }
  }

  await db.product.update({
    where: { id },
    data: {
      ...data,
      description: data.description || null,
      providerProductId: data.providerProductId || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { saved: true };
}

const VariantInput = z.object({
  productId: z.string().min(1),
  size: z.string().max(60).optional(),
  color: z.string().max(60).optional(),
  colorHex: z.string().max(9).optional(),
  sku: z.string().min(1).max(80),
  providerVariantId: z.string().max(120).optional(),
  priceOverride: z.string().optional(),
});

export async function addVariant(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = VariantInput.safeParse({
    productId: formData.get("productId"),
    size: formData.get("size") ?? undefined,
    color: formData.get("color") ?? undefined,
    colorHex: formData.get("colorHex") ?? undefined,
    sku: formData.get("sku"),
    providerVariantId: formData.get("providerVariantId") ?? undefined,
    priceOverride: formData.get("priceOverride") ?? undefined,
  });

  if (!parsed.success) return { error: "A SKU is required." };

  const { productId, priceOverride, ...rest } = parsed.data;

  const existing = await db.productVariant.findUnique({ where: { sku: rest.sku } });
  if (existing) return { error: `SKU ${rest.sku} is already in use.` };

  await db.productVariant.create({
    data: {
      productId,
      ...rest,
      size: rest.size || null,
      color: rest.color || null,
      colorHex: rest.colorHex || null,
      providerVariantId: rest.providerVariantId || null,
      priceOverrideCents:
        priceOverride && priceOverride.trim() !== ""
          ? Math.round(Number(priceOverride) * 100)
          : null,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  return { saved: true };
}

export async function toggleVariant(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("variantId"));
  const variant = await db.productVariant.findUnique({ where: { id } });
  if (!variant) return;

  await db.productVariant.update({
    where: { id },
    data: { active: !variant.active },
  });
  revalidatePath(`/admin/products/${variant.productId}`);
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("variantId"));
  const variant = await db.productVariant.findUnique({ where: { id } });
  if (!variant) return;

  // Deleting a variant referenced by an order would break the order history.
  const ordered = await db.orderItem.count({ where: { variantId: id } });
  if (ordered > 0) {
    await db.productVariant.update({ where: { id }, data: { active: false } });
  } else {
    await db.productVariant.delete({ where: { id } });
  }
  revalidatePath(`/admin/products/${variant.productId}`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  const ordered = await db.orderItem.count({ where: { productId: id } });
  if (ordered > 0) {
    await db.product.update({ where: { id }, data: { published: false } });
    revalidatePath("/admin/products");
    return;
  }

  await db.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
