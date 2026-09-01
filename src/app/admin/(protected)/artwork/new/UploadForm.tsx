"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ingestArtwork, requestUpload } from "../actions";

type Stage = "idle" | "uploading" | "processing" | "done";

export function UploadForm({
  supabaseUrl,
  supabaseAnonKey,
  bucket,
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  bucket: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [medium, setMedium] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = stage === "uploading" || stage === "processing";

  async function handleSubmit() {
    setError(null);

    if (!file) return setError("Choose an image first.");
    if (!title.trim()) return setError("Give the piece a title.");

    setStage("uploading");

    const signed = await requestUpload({
      filename: file.name,
      contentType: file.type,
      bytes: file.size,
    });

    if ("error" in signed) {
      setStage("idle");
      return setError(signed.error ?? "Upload failed.");
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

    const result = await ingestArtwork({
      originalKey: signed.key,
      title: title.trim(),
      medium: medium.trim() || undefined,
      yearCreated: year || undefined,
      description: description.trim() || undefined,
    });

    if ("error" in result) {
      setStage("idle");
      return setError(result.error ?? "Could not process that image.");
    }

    setStage("done");
    router.push(`/admin/artwork/${result.id}`);
  }

  const field =
    "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

  return (
    <div className="mt-6 max-w-xl">
      <label htmlFor="file" className="eyebrow block">Image file</label>
      <input
        id="file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff"
        disabled={busy}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setError(null);
        }}
        className={field}
      />
      <p className="mt-2 font-data text-[0.625rem] text-muted">
        Upload the largest version you have. The original is stored untouched and is the only file that can make a print later.
      </p>

      <label htmlFor="title" className="eyebrow mt-6 block">Title</label>
      <input
        id="title"
        value={title}
        disabled={busy}
        onChange={(e) => setTitle(e.target.value)}
        className={field}
      />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="medium" className="eyebrow block">Medium</label>
          <input
            id="medium"
            value={medium}
            disabled={busy}
            placeholder="Acrylic on canvas"
            onChange={(e) => setMedium(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="year" className="eyebrow block">Year</label>
          <input
            id="year"
            type="number"
            value={year}
            disabled={busy}
            placeholder="2021"
            onChange={(e) => setYear(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <label htmlFor="description" className="eyebrow mt-5 block">Description</label>
      <textarea
        id="description"
        rows={3}
        value={description}
        disabled={busy}
        onChange={(e) => setDescription(e.target.value)}
        className={field}
      />

      {error && (
        <p role="alert" className="mt-5 font-data text-xs text-iris">{error}</p>
      )}

      <button onClick={handleSubmit} disabled={busy} className="btn-solid mt-7 w-full sm:w-auto">
        {stage === "uploading" ? "Uploading…" : stage === "processing" ? "Processing…" : "Upload artwork"}
      </button>

      <p className="mt-3 font-data text-[0.625rem] text-muted">
        Saved as a draft. Nothing appears on the site until you publish it.
      </p>
    </div>
  );
}