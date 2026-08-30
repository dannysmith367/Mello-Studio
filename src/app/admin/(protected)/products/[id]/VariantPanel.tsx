"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addVariant, deleteVariant, toggleVariant } from "../actions";
import { formatCents } from "@/lib/money";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  sku: string;
  providerVariantId: string | null;
  priceOverrideCents: number | null;
  active: boolean;
};

const field =
  "w-full border border-rule bg-transparent px-2.5 py-2 text-sm focus:border-iris focus:outline-none";

function Add() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-ghost mt-4">
      {pending ? "Adding…" : "Add variant"}
    </button>
  );
}

export function VariantPanel({
  productId,
  variants,
  fallbackPriceCents,
}: {
  productId: string;
  variants: Variant[];
  fallbackPriceCents: number;
}) {
  const [state, formAction] = useActionState(
    addVariant,
    {} as { error?: string; saved?: boolean }
  );

  return (
    <section className="mt-12 border-t border-rule pt-8">
      <h2 className="font-display text-lg font-medium tracking-tight">Variants</h2>
      <p className="mt-1.5 font-data text-[0.625rem] text-muted">
        Each size and colour combination a customer can buy. A product needs at
        least one before it can be published.
      </p>

      {variants.length > 0 && (
        <div className="mt-5 overflow-x-auto border border-rule">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-rule bg-surface text-left font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                <th className="px-3 py-2 font-normal">SKU</th>
                <th className="px-3 py-2 font-normal">Size</th>
                <th className="px-3 py-2 font-normal">Colour</th>
                <th className="px-3 py-2 font-normal">Price</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-rule last:border-0">
                  <td className="px-3 py-2 font-data text-[0.6875rem]">{v.sku}</td>
                  <td className="px-3 py-2">{v.size ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {v.colorHex && (
                        <span
                          className="inline-block h-3 w-3 shrink-0 border border-rule"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      {v.color ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-data text-xs">
                    {formatCents(v.priceOverrideCents ?? fallbackPriceCents)}
                    {v.priceOverrideCents === null && (
                      <span className="ml-1 text-muted">(base)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-data text-[0.625rem] uppercase tracking-[0.14em]">
                    {v.active ? "Active" : "Off"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <form action={toggleVariant}>
                        <input type="hidden" name="variantId" value={v.id} />
                        <button className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted hover:text-bone">
                          {v.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteVariant}>
                        <input type="hidden" name="variantId" value={v.id} />
                        <button className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted hover:text-bone">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form action={formAction} className="mt-6 max-w-2xl">
        <input type="hidden" name="productId" value={productId} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="sku" className="eyebrow block">SKU</label>
            <input id="sku" name="sku" required className={`${field} mt-2`} placeholder="MS-BLOOM-TEE-BK-L" />
          </div>
          <div>
            <label htmlFor="size" className="eyebrow block">Size</label>
            <input id="size" name="size" className={`${field} mt-2`} placeholder="L" />
          </div>
          <div>
            <label htmlFor="color" className="eyebrow block">Colour</label>
            <input id="color" name="color" className={`${field} mt-2`} placeholder="Black" />
          </div>
          <div>
            <label htmlFor="colorHex" className="eyebrow block">Swatch</label>
            <input id="colorHex" name="colorHex" className={`${field} mt-2`} placeholder="#16181C" />
          </div>
          <div>
            <label htmlFor="priceOverride" className="eyebrow block">Price override</label>
            <input
              id="priceOverride"
              name="priceOverride"
              type="number"
              step="0.01"
              className={`${field} mt-2`}
              placeholder="blank = base"
            />
          </div>
          <div>
            <label htmlFor="providerVariantId" className="eyebrow block">Provider ID</label>
            <input id="providerVariantId" name="providerVariantId" className={`${field} mt-2`} />
          </div>
        </div>

        {state.error && <p role="alert" className="mt-4 font-data text-xs text-iris">{state.error}</p>}

        <Add />
      </form>
    </section>
  );
}
