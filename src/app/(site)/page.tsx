import Link from "next/link";
import { getPublishedArtworks, getProductsByCategory, getPublishedCollections } from "@/lib/queries";
import { thumbnailAsset } from "@/lib/assets";
import { ArtworkMosaic } from "@/components/ArtworkMosaic";
import { ProductGrid } from "@/components/ProductGrid";

/* Landing overlay copy. Condensed from the full bio on /about — it sits over
   artwork, so it has to survive being read in a glance. */
const INTRO =
  "Mello is a self-taught multidisciplinary artist from the East Coast, working across painting, woodburning, glass etching and tattoo design. The work explores the connection between life, nature, and human experience.";

export default async function HomePage() {
  const [artworks, products, collections] = await Promise.all([
    getPublishedArtworks(8, { kind: "ARTWORK" }),
    getProductsByCategory(),
    getPublishedCollections(),
  ]);

  const tiles = artworks.map((artwork) => {
    const asset = thumbnailAsset(artwork.assets);
    return {
      slug: artwork.slug,
      title: artwork.title,
      imageUrl: asset?.url ?? null,
      alt: asset?.altText ?? artwork.title,
    };
  });

  return (
    <>
      {tiles.length > 0 ? (
        <ArtworkMosaic tiles={tiles} intro={INTRO} />
      ) : (
        <section className="flex min-h-[70svh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-display text-5xl font-medium tracking-tight">Mello Studio</h1>
            <p className="mt-4 font-data text-xs uppercase tracking-[0.14em] text-muted">
              Publish artwork in the admin to fill this space
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex items-baseline justify-between border-b border-rule pb-5">
          <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            New releases
          </h2>
          <Link
            href="/shop"
            className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
          >
            Shop all
          </Link>
        </div>

        <div className="mt-8">
          <ProductGrid products={products.slice(0, 8)} />
        </div>
      </section>

      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <h2 className="border-b border-rule pb-5 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Collections
          </h2>
          <ul className="divide-y divide-rule border-b border-rule">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="flex items-baseline justify-between gap-4 py-6 transition-colors hover:text-muted"
                >
                  <span className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                    {collection.name}
                  </span>
                  <span className="shrink-0 font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                    {collection._count.artworks} pieces
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
