"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid mt-6 w-full">
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="mt-8">
      {next && <input type="hidden" name="next" value={next} />}

      <label htmlFor="email" className="eyebrow block">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        className="mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none"
      />

      <label htmlFor="password" className="eyebrow mt-5 block">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none"
      />

      {state.error && (
        <p role="alert" className="mt-4 font-data text-xs text-iris">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
