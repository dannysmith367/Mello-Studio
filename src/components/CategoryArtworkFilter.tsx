"use client";

import { useRouter } from "next/navigation";

type ArtworkOption = { slug: string; title: string };

/**
 * The secondary filter on a category page — narrows the grid to one piece.
 * Deliberately a plain select rather than a tile row: the format row above
 * it is the primary way in, this is just a way to cut a long grid down.
 */
export function CategoryArtworkFilter({
  artworks,
  activeSlug,
  typeSlug,
  basePath,
}: {
  artworks: ArtworkOption[];
  activeSlug?: string;
  typeSlug?: string;
  basePath: string;
}) {
  const router = useRouter();

  if (artworks.length === 0) return null;

  return (
    <div>
      <label htmlFor="artwork-filter" className="eyebrow block">
        Piece
      </label>
      <select
        id="artwork-filter"
        defaultValue={activeSlug ?? ""}
        onChange={(e) => {
          const params = new URLSearchParams();
          if (typeSlug) params.set("type", typeSlug);
          if (e.target.value) params.set("artwork", e.target.value);
          const query = params.toString();
          router.push(query ? `${basePath}?${query}` : basePath);
        }}
        className="mt-1.5 min-w-48 border border-rule bg-transparent px-2.5 py-2 text-sm focus:border-iris focus:outline-none"
      >
        <option value="">All pieces</option>
        {artworks.map((artwork) => (
          <option key={artwork.slug} value={artwork.slug}>
            {artwork.title}
          </option>
        ))}
      </select>
    </div>
  );
}
