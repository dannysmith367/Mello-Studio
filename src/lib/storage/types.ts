/**
 * Provider-agnostic storage contract.
 *
 * Nothing outside /lib/storage should import the Supabase SDK. Swapping to
 * R2 or S3 later should mean writing one new module here.
 */

export type BucketKey = "originals" | "public";

export interface SignedUpload {
  /** Storage key the client must upload to. */
  key: string;
  /** Token consumed by the client-side upload call. */
  token: string;
}

export interface StoredObject {
  key: string;
  url: string | null;
  bytes: number;
  mimeType: string;
}

export interface StorageProvider {
  readonly isConfigured: boolean;

  /** Issues a short-lived credential so the browser uploads straight to storage. */
  createSignedUpload(bucket: BucketKey, key: string): Promise<SignedUpload>;

  download(bucket: BucketKey, key: string): Promise<Buffer>;

  upload(
    bucket: BucketKey,
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<StoredObject>;

  remove(bucket: BucketKey, keys: string[]): Promise<void>;

  /** Public CDN URL. Only meaningful for the public bucket. */
  publicUrl(bucket: BucketKey, key: string): string;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env."
    );
    this.name = "StorageNotConfiguredError";
  }
}
