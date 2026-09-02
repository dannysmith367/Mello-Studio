import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CollectionForm } from "../CollectionForm";
import { ArtworksPanel } from "../ArtworksPanel";
import { deleteCollection } from "../actions";

export const metadata = { title: "Edit collection" };

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [collection, artworks] = await Promise.all([
    db.collection.findUnique({
      where: { id },
      include: { artworks: { select: { artworkId: true } } },
    }),
    db.artwork.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, status: true },
    }),
  ]);
  if (!collection) notFound();

  return (
    <>
      <Link
        href="/admin/collections"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Collections
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">{collection.name}</h1>
          <p className="mt-1 font-data text-[0.625rem] text-muted">/collections/{collection.slug}</p>

          <div className="mt-6 max-w-xl">
            <CollectionForm mode="edit" collection={collection} />
          </div>

          <form action={deleteCollection} className="mt-12 max-w-xl border-t border-rule pt-6">
            <input type="hidden" name="id" value={collection.id} />
            <p className="font-data text-[0.625rem] text-muted">
              Deleting a collection removes it from the site immediately. Artwork
              itself is untouched.
            </p>
            <button className="btn-ghost mt-3">Delete collection</button>
          </form>
        </div>

        <div>
          <p className="eyebrow">Artwork in this collection</p>
          <ArtworksPanel
            collectionId={collection.id}
            artworks={artworks}
            selectedIds={collection.artworks.map((a) => a.artworkId)}
          />
        </div>
      </div>
    </>
  );
}
