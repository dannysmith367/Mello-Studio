"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { subscribe, type SubscribeState } from "@/lib/newsletter";

function Join() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid shrink-0">
      {pending ? "…" : "Join"}
    </button>
  );
}

export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [state, formAction] = useActionState<SubscribeState, FormData>(subscribe, {});

  return (
    <div className="max-w-md">
      <p className="eyebrow">First look</p>
      <h2 className="mt-3 font-display text-2xl font-medium tracking-tight">
        New work, before it goes out
      </h2>
      <p className="mt-2 text-sm text-muted">
        Occasional notes when a piece is finished or a drop opens.
      </p>

      {state.subscribed ? (
        <p className="mt-5 font-data text-xs text-bone">
          You&rsquo;re on the list. Check your inbox.
        </p>
      ) : (
        <form action={formAction} className="mt-5">
          <input type="hidden" name="source" value={source} />
          <div className="flex gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="min-w-0 flex-1 border border-rule bg-transparent px-3 py-2.5 text-sm placeholder:text-muted/60 focus:border-iris focus:outline-none"
            />
            <Join />
          </div>

          {/* Honeypot */}
          <div aria-hidden="true" className="absolute left-[-9999px]">
            <label htmlFor="nl-website">Website</label>
            <input id="nl-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {state.error && (
            <p role="alert" className="mt-2.5 font-data text-xs text-iris">
              {state.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
