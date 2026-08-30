"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProduct } from "../actions";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

type Product = {
  id: string;
  name: string;
  description: string | null;
  baseCostCents: number;
  retailPriceCents: number;
  fulfillmentProvider: string;
  providerProductId: string | null;
  published: boolean;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid mt-7">
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function ProductForm({ product }: { product: Product }) {
  const [state, formAction] = useActionState(
    updateProduct,
    {} as { error?: string; saved?: boolean }
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={product.id} />

      <label htmlFor="name" className="eyebrow block">Product name</label>
      <input id="name" name="name" defaultValue={product.name} className={field} required />

      <label htmlFor="description" className="eyebrow mt-5 block">Description</label>
      <textarea
        id="description"
        name="description"
        rows={3}
        defaultValue={product.description ?? ""}
        className={field}
      />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="baseCost" className="eyebrow block">Your cost</label>
          <input
            id="baseCost"
            name="baseCost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(product.baseCostCents / 100).toFixed(2)}
            className={field}
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
            defaultValue={(product.retailPriceCents / 100).toFixed(2)}
            className={field}
          />
        </div>
      </div>

      <label htmlFor="fulfillmentProvider" className="eyebrow mt-5 block">Fulfilled by</label>
      <select
        id="fulfillmentProvider"
        name="fulfillmentProvider"
        defaultValue={product.fulfillmentProvider}
        className={field}
      >
        <option value="PRINTIFY">Printify</option>
        <option value="MANUAL">By hand — you ship it</option>
        <option value="PRINTFUL">Printful</option>
      </select>

      <label htmlFor="providerProductId" className="eyebrow mt-5 block">
        Provider product ID
      </label>
      <input
        id="providerProductId"
        name="providerProductId"
        defaultValue={product.providerProductId ?? ""}
        className={field}
        placeholder="Filled in automatically when imported"
      />

      <div className="mt-6 space-y-3 border-t border-rule pt-6">
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="published"
            defaultChecked={product.published}
            className="h-4 w-4 accent-iris"
          />
          <span className="text-sm">Published — visible on the site</span>
        </label>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product.featured}
            className="h-4 w-4 accent-iris"
          />
          <span className="text-sm">Featured</span>
        </label>
      </div>

      <fieldset className="mt-8 border-t border-rule pt-6">
        <legend className="eyebrow">Search listing</legend>
        <label htmlFor="seoTitle" className="eyebrow mt-4 block">Page title</label>
        <input id="seoTitle" name="seoTitle" defaultValue={product.seoTitle ?? ""} className={field} />
        <label htmlFor="seoDescription" className="eyebrow mt-5 block">Meta description</label>
        <textarea
          id="seoDescription"
          name="seoDescription"
          rows={2}
          defaultValue={product.seoDescription ?? ""}
          className={field}
        />
      </fieldset>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.saved && <p className="mt-5 font-data text-xs text-muted">Saved.</p>}

      <Save />
    </form>
  );
}
