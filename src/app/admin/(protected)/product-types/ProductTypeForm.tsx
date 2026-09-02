"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProductType, updateProductType } from "./actions";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

type ProductType = {
  id: string;
  name: string;
  slug: string;
  category: string;
  defaultPrintWidthIn: number | null;
  defaultPrintHeightIn: number | null;
  imageUrl: string | null;
};

function Submit({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid mt-7">
      {pending ? "Saving…" : mode === "create" ? "Create type" : "Save changes"}
    </button>
  );
}

export function ProductTypeForm({
  mode,
  productType,
}: {
  mode: "create" | "edit";
  productType?: ProductType;
}) {
  const action = mode === "create" ? createProductType : updateProductType;
  const [state, formAction] = useActionState(
    action,
    {} as { error?: string; saved?: boolean }
  );

  return (
    <form action={formAction}>
      {productType && <input type="hidden" name="id" value={productType.id} />}

      <label htmlFor="name" className="eyebrow block">Name</label>
      <input
        id="name"
        name="name"
        required
        defaultValue={productType?.name}
        className={field}
        placeholder="Heavyweight Hoodie"
      />

      <label htmlFor="slug" className="eyebrow mt-5 block">Slug</label>
      <input
        id="slug"
        name="slug"
        defaultValue={productType?.slug}
        required={mode === "edit"}
        className={field}
        placeholder={mode === "create" ? "Generated from name if left blank" : undefined}
      />

      <label htmlFor="category" className="eyebrow mt-5 block">Category</label>
      <select
        id="category"
        name="category"
        defaultValue={productType?.category ?? "APPAREL"}
        className={field}
      >
        <option value="APPAREL">Apparel</option>
        <option value="PRINT">Print</option>
        <option value="ACCESSORY">Accessory</option>
      </select>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="defaultPrintWidthIn" className="eyebrow block">
            Print width (in)
          </label>
          <input
            id="defaultPrintWidthIn"
            name="defaultPrintWidthIn"
            type="number"
            step="0.1"
            min="0"
            defaultValue={productType?.defaultPrintWidthIn ?? ""}
            className={field}
            placeholder="12"
          />
        </div>
        <div>
          <label htmlFor="defaultPrintHeightIn" className="eyebrow block">
            Print height (in)
          </label>
          <input
            id="defaultPrintHeightIn"
            name="defaultPrintHeightIn"
            type="number"
            step="0.1"
            min="0"
            defaultValue={productType?.defaultPrintHeightIn ?? ""}
            className={field}
            placeholder="16"
          />
        </div>
      </div>

      <label htmlFor="imageUrl" className="eyebrow mt-5 block">
        Format tile image URL
      </label>
      <input
        id="imageUrl"
        name="imageUrl"
        type="url"
        defaultValue={productType?.imageUrl ?? ""}
        className={field}
        placeholder="https://…"
      />
      <p className="mt-2 font-data text-[0.625rem] text-muted">
        Shown in the format row on /shop. Leave blank to keep this type out of that row.
      </p>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.saved && <p className="mt-5 font-data text-xs text-muted">Saved.</p>}

      <Submit mode={mode} />
    </form>
  );
}
