import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  type BucketKey,
  type SignedUpload,
  type StorageProvider,
  type StoredObject,
  StorageNotConfiguredError,
} from "./types";

const BUCKETS: Record<BucketKey, string> = {
  // Private. Master files live here and are never served to a browser.
  originals: process.env.SUPABASE_BUCKET_ORIGINALS ?? "artwork-originals",
  // Public. Web-optimized derivatives, thumbnails and mockups.
  public: process.env.SUPABASE_BUCKET_PUBLIC ?? "artwork-public",
};

export class SupabaseStorage implements StorageProvider {
  private client: SupabaseClient | null = null;

  get isConfigured(): boolean {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  /**
   * Service-role client. This key bypasses row-level security, so it must
   * never reach the browser — every caller here is a server action or route.
   */
  private db(): SupabaseClient {
    if (!this.isConfigured) throw new StorageNotConfiguredError();
    if (!this.client) {
      this.client = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
    }
    return this.client;
  }

  async createSignedUpload(bucket: BucketKey, key: string): Promise<SignedUpload> {
    const { data, error } = await this.db()
      .storage.from(BUCKETS[bucket])
      .createSignedUploadUrl(key);

    if (error || !data) {
      throw new Error(`Could not create upload URL: ${error?.message ?? "unknown"}`);
    }
    // Signed upload URLs expire after two hours.
    return { key: data.path, token: data.token };
  }

  async download(bucket: BucketKey, key: string): Promise<Buffer> {
    const { data, error } = await this.db().storage.from(BUCKETS[bucket]).download(key);
    if (error || !data) {
      throw new Error(`Could not read ${key}: ${error?.message ?? "not found"}`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async upload(
    bucket: BucketKey,
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<StoredObject> {
    const { error } = await this.db()
      .storage.from(BUCKETS[bucket])
      .upload(key, body, { contentType, upsert: true, cacheControl: "31536000" });

    if (error) throw new Error(`Could not write ${key}: ${error.message}`);

    return {
      key,
      url: bucket === "public" ? this.publicUrl(bucket, key) : null,
      bytes: body.byteLength,
      mimeType: contentType,
    };
  }

  async remove(bucket: BucketKey, keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const { error } = await this.db().storage.from(BUCKETS[bucket]).remove(keys);
    if (error) throw new Error(`Could not delete objects: ${error.message}`);
  }

  publicUrl(bucket: BucketKey, key: string): string {
    const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
    return `${base}/storage/v1/object/public/${BUCKETS[bucket]}/${key}`;
  }
}
