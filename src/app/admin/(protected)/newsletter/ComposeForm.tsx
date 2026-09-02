"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendNewsletter, type ComposeState } from "./actions";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

function Send({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || count === 0} className="btn-solid mt-6">
      {pending ? "Sending…" : `Send to ${count} subscriber${count === 1 ? "" : "s"}`}
    </button>
  );
}

export function ComposeForm({ recipientCount }: { recipientCount: number }) {
  const [state, formAction] = useActionState<ComposeState, FormData>(sendNewsletter, {});

  return (
    <form action={formAction} className="max-w-xl">
      <label htmlFor="subject" className="eyebrow block">Subject</label>
      <input id="subject" name="subject" required maxLength={200} className={field} />

      <label htmlFor="body" className="eyebrow mt-5 block">Message</label>
      <textarea
        id="body"
        name="body"
        rows={10}
        required
        maxLength={20000}
        className={field}
        placeholder="Blank lines separate paragraphs."
      />

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.success && <p className="mt-5 font-data text-xs text-muted">{state.success}</p>}

      <Send count={recipientCount} />
    </form>
  );
}
