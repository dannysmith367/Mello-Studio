import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionBySlug } from "@/lib/queries";
import { thumbnailAsset } from "@/lib/assets";
import { ArtworkCard } from "@/components/ArtworkCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Not found" };
  return {
    title: collection.seoTitle ?? collection.name,
    description: collection.seoDescription ?? collection.description ?? undefined,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection || !collection.published) notFound();

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="border-b border-rule pb-6">
        <p className="eyebrow">
          {collection.kind === "DROP" ? "Drop" : "Series"}
        </p>
        <h1 className="mt-3 font-display font-medium tracking-tight text-3xl sm:text-4xl">{collection.name}</h1>
        {collection.description && (
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
            {collection.description}
          </p>
        )}
        {collection.editionLimit && (
          <p className="mt-3 font-data text-xs uppercase tracking-[0.12em] text-muted">
            Limited to {collection.editionLimit}
          </p>
        )}
      </header>

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
        {collection.artworks.map(({ artwork }, index) => {
          const asset = thumbnailAsset(artwork.assets);
          return (
            <ArtworkCard
              key={artwork.id}
              href={`/shop?artwork=${artwork.slug}`}
              imageUrl={asset?.url ?? null}
              alt={asset?.altText ?? artwork.title}
              title={artwork.title}
              medium={artwork.medium}
              year={artwork.yearCreated}
              priority={index < 4}
            />
          );
        })}
      </div>
    </section>
  );
}
