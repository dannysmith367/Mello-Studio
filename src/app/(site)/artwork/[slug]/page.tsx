import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtworkBySlug } from "@/lib/queries";
import { displayAsset, productMockups } from "@/lib/assets";
import { ProductCard } from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork || artwork.status !== "PUBLISHED") return { title: "Not found" };

  const asset = displayAsset(artwork.assets);
  const title = artwork.seoTitle ?? artwork.title;
  const description = artwork.seoDescription ?? artwork.description ?? undefined;
  const image = asset?.url ?? "/brand/og-default.png";

  return {
    title,
    description,
    openGraph: { type: "website", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork || artwork.status !== "PUBLISHED") notFound();

  const heroAsset = displayAsset(artwork.assets);

  return (
    <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          {heroAsset?.url && (
            <Image
              src={heroAsset.url}
              alt={heroAsset.altText ?? artwork.title}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
              priority
            />
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            {artwork.title}
          </h1>
          {(artwork.medium || artwork.yearCreated) && (
            <p className="mt-2 wall-label text-muted">
              {artwork.medium}
              {artwork.medium && artwork.yearCreated ? ", " : ""}
              {artwork.yearCreated}
            </p>
          )}
          {artwork.description && (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              {artwork.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-16 border-t border-rule pt-10">
        <p className="eyebrow">Available as</p>

        {artwork.products.length === 0 ? (
          <p className="mt-4 font-data text-xs text-muted">Nothing available in this piece yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artwork.products.map((product) => {
              // A product's own default mockup (Printify's ordering) when it
              // has one — prints don't, so they fall back to the artwork
              // itself, the same rule every other grid in the site follows.
              const mockups = productMockups(
                artwork.assets,
                product.variants.map((v) => v.providerVariantId)
              );
              const asset = mockups[0] ?? heroAsset;

              return (
                <ProductCard
                  key={product.id}
                  href={`/products/${product.slug}`}
                  imageUrl={asset?.url ?? null}
                  imageUnoptimized={asset?.kind === "MOCKUP"}
                  alt={asset?.altText ?? product.name}
                  name={product.name}
                  eyebrow={product.productType.name}
                  priceCents={product.retailPriceCents}
                />
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
