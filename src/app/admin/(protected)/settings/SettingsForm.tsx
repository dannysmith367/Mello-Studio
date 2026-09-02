"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateSocialLinks, type SettingsState } from "./actions";
import type { SocialLinks } from "@/lib/settings";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid mt-7">
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function SettingsForm({ social }: { social: SocialLinks }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateSocialLinks, {});

  return (
    <form action={formAction} className="max-w-xl">
      <label htmlFor="x" className="eyebrow block">X (Twitter)</label>
      <input
        id="x"
        name="x"
        type="url"
        defaultValue={social.x}
        className={field}
        placeholder="https://x.com/yourhandle"
      />

      <label htmlFor="facebook" className="eyebrow mt-5 block">Facebook</label>
      <input
        id="facebook"
        name="facebook"
        type="url"
        defaultValue={social.facebook}
        className={field}
        placeholder="https://facebook.com/yourpage"
      />

      <label htmlFor="instagram" className="eyebrow mt-5 block">Instagram</label>
      <input
        id="instagram"
        name="instagram"
        type="url"
        defaultValue={social.instagram}
        className={field}
        placeholder="https://instagram.com/yourhandle"
      />

      <label htmlFor="tiktok" className="eyebrow mt-5 block">TikTok</label>
      <input
        id="tiktok"
        name="tiktok"
        type="url"
        defaultValue={social.tiktok}
        className={field}
        placeholder="https://tiktok.com/@yourhandle"
      />

      <p className="mt-3 font-data text-[0.625rem] text-muted">
        Leave a field blank to hide that icon from the footer.
      </p>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.saved && <p className="mt-5 font-data text-xs text-muted">Saved.</p>}

      <Save />
    </form>
  );
}
