"use client";

import { useState, useTransition } from "react";
import { setCollectionArtworks } from "./actions";

type Artwork = { id: string; title: string; status: string };

export function ArtworksPanel({
  collectionId,
  artworks,
  selectedIds,
}: {
  collectionId: string;
  artworks: Artwork[];
  selectedIds: string[];
}) {
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    const formData = new FormData();
    formData.set("collectionId", collectionId);
    for (const id of selected) formData.append("artworkIds", id);
    startTransition(async () => {
      await setCollectionArtworks(formData);
      setSaved(true);
    });
  }

  if (artworks.length === 0) {
    return (
      <p className="mt-4 font-data text-xs text-muted">
        No artwork exists yet — upload a piece first.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <ul className="max-h-96 overflow-y-auto border border-rule">
        {artworks.map((artwork) => (
          <li key={artwork.id} className="border-b border-rule last:border-0">
            <label className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-surface">
              <input
                type="checkbox"
                checked={selected.has(artwork.id)}
                onChange={() => toggle(artwork.id)}
                className="h-4 w-4 accent-iris"
              />
              <span className="truncate">{artwork.title}</span>
              {artwork.status === "DRAFT" && (
                <span className="font-data text-[0.625rem] text-muted">draft</span>
              )}
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn-ghost">
          {pending ? "Saving…" : "Save artworks"}
        </button>
        <span className="font-data text-[0.625rem] text-muted">
          {selected.size} selected
        </span>
        {saved && !pending && (
          <span className="font-data text-[0.625rem] text-muted">Saved.</span>
        )}
      </div>
    </div>
  );
}
