"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePageIntros, type SettingsState } from "./actions";
import type { PageIntros } from "@/lib/settings";

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

export function PageIntroForm({ intros }: { intros: PageIntros }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updatePageIntros, {});

  return (
    <form action={formAction} className="max-w-xl">
      <label htmlFor="shop" className="eyebrow block">Shop intro</label>
      <textarea id="shop" name="shop" rows={2} defaultValue={intros.shop} className={field} />

      <label htmlFor="apparel" className="eyebrow mt-5 block">Apparel intro</label>
      <textarea id="apparel" name="apparel" rows={2} defaultValue={intros.apparel} className={field} />

      <label htmlFor="prints" className="eyebrow mt-5 block">Prints intro</label>
      <textarea id="prints" name="prints" rows={2} defaultValue={intros.prints} className={field} />

      <p className="mt-3 font-data text-[0.625rem] text-muted">
        Leave a field blank to use the default copy.
      </p>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.saved && <p className="mt-5 font-data text-xs text-muted">Saved.</p>}

      <Save />
    </form>
  );
}
