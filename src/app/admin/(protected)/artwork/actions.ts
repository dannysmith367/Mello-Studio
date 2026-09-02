"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";
import { storage } from "@/lib/storage";
import { buildDerivatives, inspect } from "@/lib/images";
import { requestImageUpload } from "@/lib/uploads";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "untitled";
  let candidate = root;
  let n = 2;
  while (await db.artwork.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

/**
 * Step 1 of upload. The browser sends the file straight to Supabase using
 * this credential, so a large original never passes through a serverless
 * function — those cap out around 6 MB of request body on Netlify.
 */
export async function requestUpload(input: {
  filename: string;
  contentType: string;
  bytes: number;
}) {
  await requireAdmin();
  return requestImageUpload(input);
}

const IngestInput = z.object({
  originalKey: z.string().min(1).max(400),
  title: z.string().min(1).max(200),
  medium: z.string().max(200).optional(),
  yearCreated: z.coerce.number().int().min(1900).max(2100).optional(),
  description: z.string().max(4000).optional(),
});

/**
 * Step 2 of upload. Reads the original back out of the private bucket,
 * builds derivatives, and writes the Artwork plus its assets.
 *
 * Created as DRAFT. Nothing reaches the storefront until it is published
 * deliberately.
 */
export async function ingestArtwork(raw: unknown) {
  await requireAdmin();

  const parsed = IngestInput.safeParse(raw);
  if (!parsed.success) return { error: "Check the title and year." };

  const { originalKey, title, medium, yearCreated, description } = parsed.data;

  try {
    const original = await storage.download("originals", originalKey);
    const info = await inspect(original);
    const { web, thumb } = await buildDerivatives(original);

    const slug = await uniqueSlug(slugify(title));
    const stem = originalKey.replace(/\.[^.]+$/, "");

    const [webObject, thumbObject] = await Promise.all([
      storage.upload("public", `${stem}-web.webp`, web.body, web.mimeType),
      storage.upload("public", `${stem}-thumb.webp`, thumb.body, thumb.mimeType),
    ]);

    const artwork = await db.artwork.create({
      data: {
        title,
        slug,
        medium: medium || null,
        yearCreated: yearCreated ?? null,
        description: description || null,
        status: "DRAFT",
        assets: {
          create: [
            {
              kind: "ORIGINAL",
              storageKey: originalKey,
              url: null,
              width: info.width,
              height: info.height,
              hasAlpha: info.hasAlpha,
              mimeType: `image/${info.format}`,
              bytes: original.byteLength,
            },
            {
              kind: "WEB",
              storageKey: webObject.key,
              url: webObject.url,
              width: web.width,
              height: web.height,
              mimeType: web.mimeType,
              bytes: webObject.bytes,
              altText: `${title} by Mello`,
            },
            {
              kind: "THUMBNAIL",
              storageKey: thumbObject.key,
              url: thumbObject.url,
              width: thumb.width,
              height: thumb.height,
              mimeType: thumb.mimeType,
              bytes: thumbObject.bytes,
              altText: `${title} by Mello`,
            },
          ],
        },
      },
    });

    revalidatePath("/admin/artwork");
    return { id: artwork.id, slug: artwork.slug };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not process that image.",
    };
  }
}

const UpdateInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  medium: z.string().max(200).optional(),
  yearCreated: z.union([z.coerce.number().int().min(1900).max(2100), z.literal("")]).optional(),
  description: z.string().max(4000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.coerce.boolean(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
});

export async function updateArtwork(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = UpdateInput.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    medium: formData.get("medium") ?? undefined,
    yearCreated: formData.get("yearCreated") ?? undefined,
    description: formData.get("description") ?? undefined,
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    seoTitle: formData.get("seoTitle") ?? undefined,
    seoDescription: formData.get("seoDescription") ?? undefined,
  });

  if (!parsed.success) return { error: "Check the fields and try again." };

  const { id, yearCreated, ...rest } = parsed.data;

  await db.artwork.update({
    where: { id },
    data: {
      ...rest,
      medium: rest.medium || null,
      description: rest.description || null,
      seoTitle: rest.seoTitle || null,
      seoDescription: rest.seoDescription || null,
      yearCreated: yearCreated === "" || yearCreated === undefined ? null : yearCreated,
    },
  });

  revalidatePath("/admin/artwork");
  revalidatePath("/");
  return { saved: true };
}

/** Removes the database rows and the stored files together. */
export async function deleteArtwork(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const artwork = await db.artwork.findUnique({
    where: { id },
    include: { assets: true, products: { select: { id: true } } },
  });
  if (!artwork) redirect("/admin/artwork");

  if (artwork.products.length > 0) {
    redirect(`/admin/artwork/${id}?blocked=1`);
  }

  const originals = artwork.assets.filter((a) => a.kind === "ORIGINAL").map((a) => a.storageKey);
  const publics = artwork.assets.filter((a) => a.kind !== "ORIGINAL").map((a) => a.storageKey);

  await Promise.allSettled([
    storage.remove("originals", originals),
    storage.remove("public", publics),
  ]);

  await db.artwork.delete({ where: { id } });
  revalidatePath("/admin/artwork");
  redirect("/admin/artwork");
}