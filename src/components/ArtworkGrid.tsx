import { ArtworkCard } from "./ArtworkCard";
import { thumbnailAsset } from "@/lib/assets";
import { formatCents } from "@/lib/money";

type DisplayableAsset = {
  kind: string;
  url: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ArtworkTileData = {
  id: string;
  slug: string;
  title: string;
  assets: DisplayableAsset[];
  fromPriceCents: number;
};

export function ArtworkGrid({ artworks }: { artworks: ArtworkTileData[] }) {
  if (artworks.length === 0) {
    return (
      <div className="border border-rule bg-surface px-6 py-20 text-center">
        <p className="font-display text-xl">Nothing here yet</p>
        <p className="mt-3 font-data text-xs uppercase tracking-[0.14em] text-muted">
          Publish a product to fill this space
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {artworks.map((artwork, index) => {
        const asset = thumbnailAsset(artwork.assets);
        return (
          <ArtworkCard
            key={artwork.id}
            href={`/artwork/${artwork.slug}`}
            imageUrl={asset?.url ?? null}
            alt={asset?.altText ?? artwork.title}
            title={artwork.title}
            price={`From ${formatCents(artwork.fromPriceCents)}`}
            priority={index < 4}
          />
        );
      })}
    </div>
  );
}
