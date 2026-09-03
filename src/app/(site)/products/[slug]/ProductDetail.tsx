"use client";

import { useState } from "react";
import Link from "next/link";
import { AddToBag } from "@/components/AddToBag";
import { MockupGallery } from "@/components/MockupGallery";
import { mockupsForVariant } from "@/lib/assets";

type Mockup = { url: string; altText: string | null; providerVariantIds: string[] };
type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  priceOverrideCents: number | null;
  providerVariantId: string | null;
};

export function ProductDetail({
  product,
}: {
  product: {
    id: string;
    name: string;
    description: string | null;
    retailPriceCents: number;
    productTypeName: string;
    variants: Variant[];
    gallery: Mockup[];
    artwork: {
      title: string;
      slug: string;
      medium: string | null;
      yearCreated: number | null;
    };
  };
}) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  const images = mockupsForVariant(product.gallery, activeVariantId);

  return (
    <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <MockupGallery images={images} alt={product.name} />

        <div className="flex flex-col">
          <p className="eyebrow">{product.productTypeName}</p>
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
            variants={product.variants}
            onVariantChange={(v) => setActiveVariantId(v?.providerVariantId ?? null)}
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
              href={`/artwork/${product.artwork.slug}`}
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
