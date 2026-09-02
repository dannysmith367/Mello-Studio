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

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "product-type";
  let candidate = root;
  let n = 2;
  while (
    await db.productType.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

const dimension = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v > 0), "Enter a valid size in inches")
  .nullable();

const imageUrlOrEmpty = z
  .union([z.literal(""), z.string().trim().url("Enter a valid image URL")])
  .optional()
  .transform((v) => (v ? v : null));

const CreateInput = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  category: z.enum(["APPAREL", "PRINT", "ACCESSORY"]),
  defaultPrintWidthIn: dimension.optional(),
  defaultPrintHeightIn: dimension.optional(),
  imageUrl: imageUrlOrEmpty,
});

type FormState = { error?: string; saved?: boolean };

export async function createProductType(
  _prev: unknown,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = CreateInput.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    category: formData.get("category"),
    defaultPrintWidthIn: formData.get("defaultPrintWidthIn") ?? "",
    defaultPrintHeightIn: formData.get("defaultPrintHeightIn") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };

  const { name, slug, category, defaultPrintWidthIn, defaultPrintHeightIn, imageUrl } = parsed.data;

  const productType = await db.productType.create({
    data: {
      name,
      slug: await uniqueSlug(slugify(slug || name)),
      category,
      defaultPrintWidthIn: defaultPrintWidthIn ?? null,
      defaultPrintHeightIn: defaultPrintHeightIn ?? null,
      imageUrl,
    },
  });

  revalidatePath("/admin/product-types");
  revalidatePath("/shop");
  redirect(`/admin/product-types/${productType.id}`);
}

const UpdateInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  category: z.enum(["APPAREL", "PRINT", "ACCESSORY"]),
  defaultPrintWidthIn: dimension.optional(),
  defaultPrintHeightIn: dimension.optional(),
  imageUrl: imageUrlOrEmpty,
});

export async function updateProductType(
  _prev: unknown,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = UpdateInput.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    defaultPrintWidthIn: formData.get("defaultPrintWidthIn") ?? "",
    defaultPrintHeightIn: formData.get("defaultPrintHeightIn") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields and try again." };

  const { id, name, slug, category, defaultPrintWidthIn, defaultPrintHeightIn, imageUrl } =
    parsed.data;

  const conflict = await db.productType.findFirst({
    where: { slug, id: { not: id } },
    select: { id: true },
  });
  if (conflict) return { error: `Slug "${slug}" is already in use.` };

  await db.productType.update({
    where: { id },
    data: {
      name,
      slug,
      category,
      defaultPrintWidthIn: defaultPrintWidthIn ?? null,
      defaultPrintHeightIn: defaultPrintHeightIn ?? null,
      imageUrl,
    },
  });

  revalidatePath("/admin/product-types");
  revalidatePath("/shop");
  return { saved: true };
}

export async function deleteProductType(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  const used = await db.product.count({ where: { productTypeId: id } });
  if (used > 0) {
    redirect(`/admin/product-types/${id}?blocked=1`);
  }

  await db.productType.delete({ where: { id } });
  revalidatePath("/admin/product-types");
  revalidatePath("/shop");
  redirect("/admin/product-types");
}
