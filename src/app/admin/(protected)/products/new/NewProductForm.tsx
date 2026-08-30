"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createProduct } from "../actions";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid mt-7">
      {pending ? "Creating…" : "Create product"}
    </button>
  );
}

export function NewProductForm({
  artworks,
  types,
  preselectedArtwork,
}: {
  artworks: { id: string; title: string; status: string }[];
  types: { id: string; name: string; category: string }[];
  preselectedArtwork?: string;
}) {
  const [state, formAction] = useActionState(createProduct, {} as { error?: string });
  const [baseCost, setBaseCost] = useState("");
  const [retail, setRetail] = useState("");

  const margin =
    baseCost && retail ? (Number(retail) - Number(baseCost)).toFixed(2) : null;
  const marginPct =
    baseCost && retail && Number(retail) > 0
      ? Math.round(((Number(retail) - Number(baseCost)) / Number(retail)) * 100)
      : null;

  return (
    <form action={formAction} className="mt-6 max-w-xl">
      <label htmlFor="artworkId" className="eyebrow block">Artwork</label>
      <select
        id="artworkId"
        name="artworkId"
        defaultValue={preselectedArtwork ?? ""}
        required
        className={field}
      >
        <option value="" disabled>Choose a piece</option>
        {artworks.map((a) => (
          <option key={a.id} value={a.id}>
            {a.title}
            {a.status === "DRAFT" ? " (draft)" : ""}
          </option>
        ))}
      </select>

      <label htmlFor="productTypeId" className="eyebrow mt-5 block">Product type</label>
      <select id="productTypeId" name="productTypeId" required className={field} defaultValue="">
        <option value="" disabled>Choose a type</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <label htmlFor="name" className="eyebrow mt-5 block">Product name</label>
      <input id="name" name="name" required className={field} placeholder="Chakra Bloom Tee" />

      <label htmlFor="description" className="eyebrow mt-5 block">Description</label>
      <textarea id="description" name="description" rows={3} className={field} />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="baseCost" className="eyebrow block">Your cost</label>
          <input
            id="baseCost"
            name="baseCost"
            type="number"
            step="0.01"
            min="0"
            value={baseCost}
            onChange={(e) => setBaseCost(e.target.value)}
            className={field}
            placeholder="14.50"
          />
        </div>
        <div>
          <label htmlFor="retailPrice" className="eyebrow block">Retail price</label>
          <input
            id="retailPrice"
            name="retailPrice"
            type="number"
            step="0.01"
            min="0"
            value={retail}
            onChange={(e) => setRetail(e.target.value)}
            className={field}
            placeholder="38.00"
          />
        </div>
      </div>

      {margin && (
        <p className="mt-2.5 font-data text-[0.625rem] text-muted">
          Margin ${margin}
          {marginPct !== null ? ` · ${marginPct}%` : ""}
          {Number(margin) <= 0 ? " — you would lose money on every sale" : ""}
        </p>
      )}

      <label htmlFor="fulfillmentProvider" className="eyebrow mt-5 block">Fulfilled by</label>
      <select
        id="fulfillmentProvider"
        name="fulfillmentProvider"
        defaultValue="PRINTIFY"
        className={field}
      >
        <option value="PRINTIFY">Printify</option>
        <option value="MANUAL">By hand — you ship it</option>
        <option value="PRINTFUL">Printful</option>
      </select>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}

      <Submit />

      <p className="mt-3 font-data text-[0.625rem] text-muted">
        Created as a draft. Add variants next, then publish.
      </p>
    </form>
  );
}
