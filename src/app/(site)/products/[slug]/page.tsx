import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries";
import { displayAsset } from "@/lib/assets";
import { AddToBag } from "@/components/AddToBag";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };

  const asset = displayAsset(product.artwork.assets, {
    preferMockup: product.productType.category === "APPAREL",
  });
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description ?? undefined,
    openGraph: {
      title: product.seoTitle ?? product.name,
      images: asset?.url ? [asset.url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.published) notFound();

  const asset = displayAsset(product.artwork.assets, {
    preferMockup: product.productType.category === "APPAREL",
  });
  return (
    <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          {asset?.url && (
            <Image
              src={asset.url}
              alt={asset.altText ?? product.name}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
              priority
              unoptimized={asset.kind === "MOCKUP"}
            />
          )}
        </div>

        <div className="flex flex-col">
          <p className="eyebrow">{product.productType.name}</p>
          <h1 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}

          <AddToBag
            productId={product.id}
            basePriceCents={product.retailPriceCents}
            variants={product.variants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex,
              priceOverrideCents: v.priceOverrideCents,
            }))}
          />

          <div className="mt-10 border-t border-rule pt-6">
            <p className="eyebrow">The artwork</p>
            <dl className="wall-label mt-3">
              <dd className="font-medium">{product.artwork.title}</dd>
              <div className="mt-1 text-muted">
                {product.artwork.medium}
                {product.artwork.medium && product.artwork.yearCreated ? ", " : ""}
                {product.artwork.yearCreated}
              </div>
            </dl>
            <Link
              href={`/shop?artwork=${product.artwork.slug}`}
              className="mt-3 inline-block font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
            >
              Other formats of this piece →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
