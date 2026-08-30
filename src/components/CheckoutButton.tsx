"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startCheckout, type CheckoutState } from "@/lib/checkout";

function Button({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();

  if (!enabled) {
    return (
      <button disabled className="btn-ghost mt-7 w-full">
        Checkout — payments not configured
      </button>
    );
  }

  return (
    <button type="submit" disabled={pending} className="btn-solid mt-7 w-full">
      {pending ? "Taking you to checkout…" : "Checkout"}
    </button>
  );
}

export function CheckoutButton({ enabled }: { enabled: boolean }) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(startCheckout, {});

  return (
    <form action={formAction}>
      <Button enabled={enabled} />
      {state.error && (
        <p role="alert" className="mt-3 font-data text-xs text-iris">{state.error}</p>
      )}
    </form>
  );
}
