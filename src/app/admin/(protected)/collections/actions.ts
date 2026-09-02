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
  const root = base || "collection";
  let candidate = root;
  let n = 2;
  while (
    await db.collection.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
  ) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? new Date(v) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), "Enter a valid date");

const optionalInt = z
  .union([z.string(), z.number()])
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Enter a whole number")
  .nullable()
  .optional();

const CreateInput = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  kind: z.enum(["SERIES", "DROP"]),
  opensAt: optionalDate,
  closesAt: optionalDate,
  editionLimit: optionalInt,
  published: z.coerce.boolean(),
});

type FormState = { error?: string; saved?: boolean };

export async function createCollection(
  _prev: unknown,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = CreateInput.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") ?? undefined,
    kind: formData.get("kind") ?? "SERIES",
    opensAt: formData.get("opensAt") ?? undefined,
    closesAt: formData.get("closesAt") ?? undefined,
    editionLimit: formData.get("editionLimit") ?? "",
    published: formData.get("published") === "on",
  });

  if (!parsed.success) return { error: "Check the fields and try again." };

  const { name, slug, description, kind, opensAt, closesAt, editionLimit, published } =
    parsed.data;

  const collection = await db.collection.create({
    data: {
      name,
      slug: await uniqueSlug(slugify(slug || name)),
      description: description || null,
      kind,
      opensAt,
      closesAt,
      editionLimit,
      published,
    },
  });

  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  redirect(`/admin/collections/${collection.id}`);
}

const UpdateInput = CreateInput.extend({
  id: z.string().min(1),
  slug: z.string().min(1).max(120),
});

export async function updateCollection(
  _prev: unknown,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = UpdateInput.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? undefined,
    kind: formData.get("kind"),
    opensAt: formData.get("opensAt") ?? undefined,
    closesAt: formData.get("closesAt") ?? undefined,
    editionLimit: formData.get("editionLimit") ?? "",
    published: formData.get("published") === "on",
  });

  if (!parsed.success) return { error: "Check the fields and try again." };

  const { id, slug, ...rest } = parsed.data;

  const conflict = await db.collection.findFirst({
    where: { slug, id: { not: id } },
    select: { id: true },
  });
  if (conflict) return { error: `Slug "${slug}" is already in use.` };

  await db.collection.update({
    where: { id },
    data: { ...rest, slug, description: rest.description || null },
  });

  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  revalidatePath(`/collections/${slug}`);
  return { saved: true };
}

export async function deleteCollection(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  const collection = await db.collection.findUnique({ where: { id }, select: { slug: true } });
  if (!collection) redirect("/admin/collections");

  await db.collection.delete({ where: { id } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  redirect("/admin/collections");
}

const ArtworksInput = z.object({
  collectionId: z.string().min(1),
  artworkIds: z.array(z.string()),
});

/** Replaces the full membership set — simplest way to keep it consistent. */
export async function setCollectionArtworks(formData: FormData) {
  await requireAdmin();

  const parsed = ArtworksInput.safeParse({
    collectionId: formData.get("collectionId"),
    artworkIds: formData.getAll("artworkIds").map(String),
  });
  if (!parsed.success) return;

  const { collectionId, artworkIds } = parsed.data;

  await db.$transaction([
    db.collectionArtwork.deleteMany({ where: { collectionId } }),
    db.collectionArtwork.createMany({
      data: artworkIds.map((artworkId, index) => ({
        collectionId,
        artworkId,
        sortOrder: index,
      })),
    }),
  ]);

  revalidatePath(`/admin/collections/${collectionId}`);
  revalidatePath("/collections");
}
