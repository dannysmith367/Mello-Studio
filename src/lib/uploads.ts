import "server-only";
import { randomUUID } from "node:crypto";
import { storage, type BucketKey } from "./storage";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff"];
const MAX_IMAGE_BYTES = 200 * 1024 * 1024;

export type SignedImageUpload = { key: string; token: string };
export type RequestImageUploadResult = SignedImageUpload | { error: string };

/**
 * Step 1 of any admin or public image upload: validates the file and issues
 * a signed URL so the browser uploads straight to Supabase, bypassing the
 * serverless function body-size limit. Shared by every upload flow (artwork
 * originals, the About page portrait, support photos) so this validation
 * and signed-URL dance lives in exactly one place rather than being copied
 * per feature.
 *
 * Caller is responsible for its own auth/rate-limit check — this has no
 * request context of its own to check one with.
 */
export async function requestImageUpload(input: {
  filename: string;
  contentType: string;
  bytes: number;
  /** Defaults to "originals" — the private bucket artwork masters live in. */
  bucket?: BucketKey;
  /** e.g. "support" -> key becomes "support/2026/<uuid>.jpg". */
  keyPrefix?: string;
}): Promise<RequestImageUploadResult> {
  if (!ACCEPTED_IMAGE_TYPES.includes(input.contentType)) {
    return { error: "Upload a JPEG, PNG, WebP or TIFF." };
  }
  if (input.bytes > MAX_IMAGE_BYTES) {
    return { error: "That file is over 200 MB." };
  }
  if (!storage.isConfigured) {
    return { error: "Storage is not configured. Add your Supabase keys to .env." };
  }

  const extension = input.filename.split(".").pop()?.toLowerCase() ?? "bin";
  const year = new Date().getFullYear();
  const key = input.keyPrefix
    ? `${input.keyPrefix}/${year}/${randomUUID()}.${extension}`
    : `${year}/${randomUUID()}.${extension}`;

  try {
    const signed = await storage.createSignedUpload(input.bucket ?? "originals", key);
    return { key: signed.key, token: signed.token };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed." };
  }
}
