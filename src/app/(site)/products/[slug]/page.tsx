import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries";
import { displayAsset, productMockups } from "@/lib/assets";
import { ProductDetail } from "./ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };

  const mockups = productMockups(
    product.artwork.assets,
    product.variants.map((v) => v.providerVariantId)
  );
  const asset = mockups[0] ?? displayAsset(product.artwork.assets);
  const title = product.seoTitle ?? product.name;
  const description = product.seoDescription ?? product.description ?? undefined;
  const image = asset?.url ?? "/brand/og-default.png";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
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

  // Prints and posters are the artwork itself, so they never get mockups —
  // this only ever finds shots for a product that actually has them (apparel).
  const mockups = productMockups(
    product.artwork.assets,
    product.variants.map((v) => v.providerVariantId)
  );
  const fallback = displayAsset(product.artwork.assets);
  const gallery =
    mockups.length > 0
      ? mockups.map((m) => ({ url: m.url!, altText: m.altText, providerVariantIds: m.providerVariantIds }))
      : fallback?.url
        ? [{ url: fallback.url, altText: fallback.altText, providerVariantIds: [] }]
        : [];

  return (
    <ProductDetail
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        retailPriceCents: product.retailPriceCents,
        productTypeName: product.productType.name,
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          priceOverrideCents: v.priceOverrideCents,
          providerVariantId: v.providerVariantId,
        })),
        gallery,
        artwork: {
          title: product.artwork.title,
          slug: product.artwork.slug,
          medium: product.artwork.medium,
          yearCreated: product.artwork.yearCreated,
        },
      }}
    />
  );
}
