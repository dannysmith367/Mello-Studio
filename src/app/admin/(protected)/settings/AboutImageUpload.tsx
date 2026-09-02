"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { ingestAboutImage, removeAboutImage, requestAboutImageUpload } from "./actions";

type Stage = "idle" | "uploading" | "processing";

export function AboutImageUpload({
  currentUrl,
  supabaseUrl,
  supabaseAnonKey,
  bucket,
}: {
  currentUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  bucket: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = stage !== "idle";

  async function handleUpload() {
    setError(null);
    if (!file) return setError("Choose an image first.");

    setStage("uploading");

    const signed = await requestAboutImageUpload({
      filename: file.name,
      contentType: file.type,
      bytes: file.size,
    });

    if ("error" in signed) {
      setStage("idle");
      return setError(signed.error);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(signed.key, signed.token, file, { contentType: file.type });

    if (uploadError) {
      setStage("idle");
      return setError(`Upload failed: ${uploadError.message}`);
    }

    setStage("processing");

    const result = await ingestAboutImage(signed.key);

    if ("error" in result) {
      setStage("idle");
      return setError(result.error);
    }

    setStage("idle");
    setFile(null);
    router.refresh();
  }

  async function handleRemove() {
    setError(null);
    setStage("processing");
    await removeAboutImage();
    setStage("idle");
    router.refresh();
  }

  const field =
    "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

  return (
    <div className="max-w-xl">
      {currentUrl && (
        <div className="relative aspect-[4/5] w-40 overflow-hidden bg-surface">
          <Image src={currentUrl} alt="" fill sizes="160px" className="object-cover" />
        </div>
      )}

      <label htmlFor="about-image-file" className="eyebrow mt-4 block">
        {currentUrl ? "Replace image" : "Image file"}
      </label>
      <input
        id="about-image-file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff"
        disabled={busy}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setError(null);
        }}
        className={field}
      />

      {error && <p role="alert" className="mt-3 font-data text-xs text-iris">{error}</p>}

      <div className="mt-4 flex items-center gap-4">
        <button onClick={handleUpload} disabled={busy || !file} className="btn-ghost">
          {stage === "uploading" ? "Uploading…" : stage === "processing" ? "Processing…" : "Upload"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
          >
            Remove image
          </button>
        )}
      </div>
    </div>
  );
}
