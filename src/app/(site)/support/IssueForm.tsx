"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { requestSupportPhotoUpload, submitIssue } from "./actions";
import { MAX_ISSUE_PHOTOS } from "./constants";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm placeholder:text-muted/50 focus:border-iris focus:outline-none";

const KINDS = [
  ["DEFECT", "Defect"],
  ["DAMAGED_IN_TRANSIT", "Damaged in transit"],
  ["NOT_RECEIVED", "Never arrived"],
  ["WRONG_ITEM", "Wrong item"],
  ["OTHER", "Something else"],
] as const;

type Stage = "idle" | "uploading" | "sending";

export function IssueForm({
  supabaseUrl,
  supabaseAnonKey,
  bucket,
}: {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  bucket: string;
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number][0]>("DEFECT");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const busy = stage !== "idle";

  function handleFiles(list: FileList | null) {
    setFiles([...(list ?? [])].slice(0, MAX_ISSUE_PHOTOS));
  }

  async function handleSubmit() {
    setError(null);

    if (!orderNumber.trim()) return setError("Enter your order number.");
    if (!email.trim()) return setError("Enter your email address.");
    if (description.trim().length < 10) return setError("Tell us a little more.");

    const photoKeys: string[] = [];

    if (files.length > 0) {
      if (!supabaseUrl || !supabaseAnonKey) {
        return setError("Photo uploads aren't available right now — send a report without photos, or try again later.");
      }

      setStage("uploading");
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      for (const file of files) {
        const signed = await requestSupportPhotoUpload({
          filename: file.name,
          contentType: file.type,
          bytes: file.size,
        });

        if ("error" in signed) {
          setStage("idle");
          return setError(signed.error);
        }

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .uploadToSignedUrl(signed.key, signed.token, file, { contentType: file.type });

        if (uploadError) {
          setStage("idle");
          return setError(`Photo upload failed: ${uploadError.message}`);
        }

        photoKeys.push(signed.key);
      }
    }

    setStage("sending");

    const result = await submitIssue({
      orderNumber: orderNumber.trim(),
      email: email.trim(),
      kind,
      description: description.trim(),
      photoKeys,
      website,
    });

    if (result.error) {
      setStage("idle");
      return setError(result.error);
    }

    setStage("idle");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-10 border border-rule bg-surface p-8">
        <p className="font-display text-xl font-medium tracking-tight">Report received</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We read every report personally and will follow up by email soon. Check
          your inbox for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="orderNumber" className="eyebrow block">Order number</label>
          <input
            id="orderNumber"
            value={orderNumber}
            disabled={busy}
            onChange={(e) => setOrderNumber(e.target.value)}
            className={field}
            placeholder="MS-1042"
          />
        </div>
        <div>
          <label htmlFor="email" className="eyebrow block">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <label htmlFor="kind" className="eyebrow mt-5 block">What happened?</label>
      <select
        id="kind"
        value={kind}
        disabled={busy}
        onChange={(e) => setKind(e.target.value as (typeof KINDS)[number][0])}
        className={field}
      >
        {KINDS.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <label htmlFor="description" className="eyebrow mt-5 block">Tell us more</label>
      <textarea
        id="description"
        rows={5}
        value={description}
        disabled={busy}
        onChange={(e) => setDescription(e.target.value)}
        className={field}
        placeholder="What's wrong, and when you noticed it."
      />

      <label htmlFor="photos" className="eyebrow mt-5 block">
        Photos (up to {MAX_ISSUE_PHOTOS})
      </label>
      <input
        id="photos"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
        className={field}
      />
      {files.length > 0 && (
        <p className="mt-2 font-data text-[0.625rem] text-muted">
          {files.length} photo{files.length === 1 ? "" : "s"} selected
        </p>
      )}
      <p className="mt-2 font-data text-[0.625rem] text-muted">
        A photo of the issue speeds up defect and damage claims.
      </p>

      {/* Honeypot. Hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {error && <p role="alert" className="mt-5 font-data text-xs text-iris">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={busy}
        className="btn-solid mt-8 w-full sm:w-auto"
      >
        {stage === "uploading" ? "Uploading photos…" : stage === "sending" ? "Sending…" : "Send report"}
      </button>
    </div>
  );
}
