"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateShippingSettings, type SettingsState } from "./actions";
import type { ShippingSettings } from "@/lib/settings";

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

export function ShippingSettingsForm({ shipping }: { shipping: ShippingSettings }) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateShippingSettings, {});

  return (
    <form action={formAction} className="max-w-xl">
      <label htmlFor="flat" className="eyebrow block">Flat shipping rate</label>
      <input
        id="flat"
        name="flat"
        type="number"
        step="0.01"
        min="0"
        defaultValue={(shipping.flatCents / 100).toFixed(2)}
        className={field}
        placeholder="6.00"
      />

      <label htmlFor="freeThreshold" className="eyebrow mt-5 block">
        Free shipping above
      </label>
      <input
        id="freeThreshold"
        name="freeThreshold"
        type="number"
        step="0.01"
        min="0"
        defaultValue={(shipping.freeThresholdCents / 100).toFixed(2)}
        className={field}
        placeholder="75.00"
      />
      <p className="mt-2 font-data text-[0.625rem] text-muted">
        Orders at or above this subtotal ship free. Set to 0 to disable — every order pays the flat rate.
      </p>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.saved && <p className="mt-5 font-data text-xs text-muted">Saved.</p>}

      <Save />
    </form>
  );
}
