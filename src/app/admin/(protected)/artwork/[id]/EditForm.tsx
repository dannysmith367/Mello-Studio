"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateArtwork } from "../actions";

type Artwork = {
  id: string;
  title: string;
  medium: string | null;
  yearCreated: number | null;
  description: string | null;
  status: string;
  featured: boolean;
  kind: string;
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

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm focus:border-iris focus:outline-none";

export function EditForm({ artwork }: { artwork: Artwork }) {
  const [state, formAction] = useActionState(updateArtwork, {} as { error?: string; saved?: boolean });

  return (
    <form action={formAction} className="max-w-xl">
      <input type="hidden" name="id" value={artwork.id} />

      <label htmlFor="title" className="eyebrow block">Title</label>
      <input id="title" name="title" defaultValue={artwork.title} className={field} required />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="medium" className="eyebrow block">Medium</label>
          <input id="medium" name="medium" defaultValue={artwork.medium ?? ""} className={field} />
        </div>
        <div>
          <label htmlFor="yearCreated" className="eyebrow block">Year</label>
          <input
            id="yearCreated"
            name="yearCreated"
            type="number"
            defaultValue={artwork.yearCreated ?? ""}
            className={field}
          />
        </div>
      </div>

      <label htmlFor="description" className="eyebrow mt-5 block">Description</label>
      <textarea
        id="description"
        name="description"
        rows={3}
        defaultValue={artwork.description ?? ""}
        className={field}
      />

      <label htmlFor="status" className="eyebrow mt-5 block">Status</label>
      <select id="status" name="status" defaultValue={artwork.status} className={field}>
        <option value="DRAFT">Draft — not on the site</option>
        <option value="PUBLISHED">Published — live</option>
        <option value="ARCHIVED">Archived — hidden</option>
      </select>

      <label className="mt-5 flex items-center gap-2.5">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={artwork.featured}
          className="h-4 w-4 accent-iris"
        />
        <span className="text-sm">Feature on the landing page</span>
      </label>

      <label htmlFor="kind" className="eyebrow mt-5 block">Kind</label>
      <select id="kind" name="kind" defaultValue={artwork.kind} className={field}>
        <option value="ARTWORK">Artwork — browsable as a piece</option>
        <option value="STUDIO">Studio asset — brand art that only carries merch</option>
      </select>
      <p className="mt-2 font-data text-[0.625rem] text-muted">
        Studio assets (like the logo) stay out of the shop, apparel, print and
        homepage browsing — their products show up on /merch instead.
      </p>

      <fieldset className="mt-8 border-t border-rule pt-6">
        <legend className="eyebrow">Search listing</legend>
        <label htmlFor="seoTitle" className="eyebrow mt-4 block">Page title</label>
        <input id="seoTitle" name="seoTitle" defaultValue={artwork.seoTitle ?? ""} className={field} />

        <label htmlFor="seoDescription" className="eyebrow mt-5 block">Meta description</label>
        <textarea
          id="seoDescription"
          name="seoDescription"
          rows={2}
          defaultValue={artwork.seoDescription ?? ""}
          className={field}
        />
      </fieldset>

      {state.error && <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>}
      {state.saved && <p className="mt-5 font-data text-xs text-muted">Saved.</p>}

      <Save />
    </form>
  );
}
