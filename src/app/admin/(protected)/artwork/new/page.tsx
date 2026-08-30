import Link from "next/link";
import { UploadForm } from "./UploadForm";

export const metadata = { title: "Upload artwork" };

export default function NewArtworkPage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const bucket = process.env.SUPABASE_BUCKET_ORIGINALS ?? "artwork-originals";

  return (
    <>
      <Link
        href="/admin/artwork"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Artwork
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">
        Upload artwork
      </h1>

      {supabaseUrl && anonKey ? (
        <UploadForm supabaseUrl={supabaseUrl} supabaseAnonKey={anonKey} bucket={bucket} />
      ) : (
        <div className="mt-6 border border-rule bg-surface p-6">
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            Storage not configured
          </p>
          <p className="mt-3 text-sm text-muted">
            Add <code className="text-bone">SUPABASE_URL</code>,{" "}
            <code className="text-bone">SUPABASE_ANON_KEY</code> and{" "}
            <code className="text-bone">SUPABASE_SERVICE_ROLE_KEY</code> to your
            environment, then create the two storage buckets. Setup steps are in
            the README.
          </p>
        </div>
      )}
    </>
  );
}
