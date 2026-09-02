"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCollection, updateCollection } from "./actions";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: string;
  opensAt: Date | null;
  closesAt: Date | null;
  editionLimit: number | null;
  published: boolean;
};

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, no timezone. */
function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Submit({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid mt-7">
      {pending ? "Saving…" : mode === "create" ? "Create collection" : "Save changes"}
    </button>
  );
}

export function CollectionForm({
  mode,
  collection,
}: {
  mode: "create" | "edit";
  collection?: Collection;
}) {
  const action = mode === "create" ? createCollection : updateCollection;
  const [state, formAction] = useActionState(
    action,
    {} as { error?: string; saved?: boolean }
  );
  const [kind, setKind] = useState(collection?.kind ?? "SERIES");

  return (
    <form action={formAction}>
      {collection && <input type="hidden" name="id" value={collection.id} />}

      <label htmlFor="name" className="eyebrow block">Name</label>
      <input
        id="name"
        name="name"
        required
        defaultValue={collection?.name}
        className={field}
        placeholder="Winter Bloom"
      />

      <label htmlFor="slug" className="eyebrow mt-5 block">Slug</label>
      <input
        id="slug"
        name="slug"
        defaultValue={collection?.slug}
        required={mode === "edit"}
        className={field}
        placeholder={mode === "create" ? "Generated from name if left blank" : undefined}
      />

      <label htmlFor="description" className="eyebrow mt-5 block">Description</label>
      <textarea
        id="description"
        name="description"
        rows={3}
        defaultValue={collection?.description ?? ""}
        className={field}
      />

      <label htmlFor="kind" className="eyebrow mt-5 block">Kind</label>
      <select
        id="kind"
        name="kind"
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        className={field}
      >
        <option value="SERIES">Series — permanent, grows over time</option>
        <option value="DROP">Drop — timed, may be edition-limited</option>
      </select>

      {kind === "DROP" && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="opensAt" className="eyebrow block">Opens</label>
            <input
              id="opensAt"
              name="opensAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(collection?.opensAt ?? null)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="closesAt" className="eyebrow block">Closes</label>
            <input
              id="closesAt"
              name="closesAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(collection?.closesAt ?? null)}
              className={field}
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="editionLimit" className="eyebrow block">Edition limit</label>
            <input
              id="editionLimit"
              name="editionLimit"
              type="number"
              min="1"
              step="1"
              defaultValue={collection?.editionLimit ?? ""}
              className={field}
              placeholder="Leave blank for no limit"
            />
          </div>
        </div>
      )}

      <label className="mt-6 flex items-center gap-2.5">
        <input
          type="checkbox"
          name="published"
          defaultChecked={collection?.published ?? false}
          className="h-4 w-4 accent-iris"
        />
        <span className="text-sm">Published — visible on the site</span>
      </label>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.saved && <p className="mt-5 font-data text-xs text-muted">Saved.</p>}

      <Submit mode={mode} />
    </form>
  );
}
