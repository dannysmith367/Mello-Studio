import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { thumbnailAsset } from "@/lib/assets";
import { storage } from "@/lib/storage";

export const metadata = { title: "Artwork" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Live",
  ARCHIVED: "Archived",
};

export default async function ArtworkListPage() {
  const artworks = await db.artwork.findMany({
    orderBy: { createdAt: "desc" },
    include: { assets: true, _count: { select: { products: true } } },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">Artwork</h1>
        <Link href="/admin/artwork/new" className="btn-ghost">
          Upload
        </Link>
      </div>

      {!storage.isConfigured && (
        <p className="mt-5 border border-rule bg-surface px-4 py-3 font-data text-[0.6875rem] text-muted">
          Storage is not configured — uploads will fail until Supabase keys are set.
        </p>
      )}

      {artworks.length === 0 ? (
        <div className="mt-6 border border-rule bg-surface px-6 py-20 text-center">
          <p className="font-display text-lg">No artwork yet</p>
          <p className="mt-2 font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            Upload a piece to get started
          </p>
          <Link href="/admin/artwork/new" className="btn-ghost mt-6 inline-block">
            Upload artwork
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artworks.map((artwork) => {
            const thumb = thumbnailAsset(artwork.assets);
            const original = artwork.assets.find((a) => a.kind === "ORIGINAL");
            return (
              <li key={artwork.id} className="border border-rule bg-surface">
                <Link href={`/admin/artwork/${artwork.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-void">
                    {thumb?.url && (
                      <Image
                        src={thumb.url}
                        alt=""
                        fill
                        sizes="240px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">{artwork.title}</p>
                    <p className="mt-1 font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                      {STATUS_LABEL[artwork.status]}
                      {artwork.featured ? " · Featured" : ""}
                    </p>
                    <p className="mt-1 font-data text-[0.625rem] text-muted">
                      {original?.width && original?.height
                        ? `${original.width}×${original.height}`
                        : "—"}
                      {" · "}
                      {artwork._count.products} product
                      {artwork._count.products === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
