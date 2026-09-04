import { ProductCard } from "./ProductCard";
import { thumbnailAsset, productMockups } from "@/lib/assets";

type DisplayableAsset = {
  kind: string;
  url: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  providerVariantIds: string[];
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  retailPriceCents: number;
  productType: { name: string; category: string };
  artwork: { title: string; yearCreated: number | null; assets: DisplayableAsset[] };
  variants: { providerVariantId: string | null }[];
};

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
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
      {products.map((product, index) => {
        // The product's own default mockup (Printify's ordering) when it
        // has one; otherwise the flat artwork file, same as everywhere else.
        const mockups = productMockups(
          product.artwork.assets,
          product.variants.map((v) => v.providerVariantId)
        );
        const asset =
          mockups[0] ??
          thumbnailAsset(product.artwork.assets, {
            preferMockup: product.productType.category === "APPAREL",
          });

        return (
          <ProductCard
            key={product.id}
            href={`/products/${product.slug}`}
            imageUrl={asset?.url ?? null}
            imageUnoptimized={asset?.kind === "MOCKUP"}
            alt={asset?.altText ?? product.name}
            name={product.name}
            eyebrow={product.artwork.title}
            priceCents={product.retailPriceCents}
            priority={index < 4}
          />
        );
      })}
    </div>
  );
}
