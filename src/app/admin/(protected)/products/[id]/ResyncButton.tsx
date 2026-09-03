"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resyncPrintifyProduct } from "../../printify/actions";

export function ResyncButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await resyncPrintifyProduct(productId);
      if ("error" in result && result.error) return setError(result.error);
      setMessage(`Synced — ${result.mockupCount} mockup(s), ${result.updatedVariants} variant(s) updated.`);
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      <button onClick={handleClick} disabled={pending} className="btn-ghost w-full">
        {pending ? "Syncing…" : "Re-sync from Printify"}
      </button>
      <p className="mt-2 font-data text-[0.625rem] text-muted">
        Pulls fresh mockups and variant costs. Never touches retail price or publish status.
      </p>
      {error && <p role="alert" className="mt-2 font-data text-xs text-iris">{error}</p>}
      {message && <p className="mt-2 font-data text-xs text-muted">{message}</p>}
    </div>
  );
}
