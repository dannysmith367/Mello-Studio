import { ProductCard } from "./ProductCard";
import { thumbnailAsset } from "@/lib/assets";

type DisplayableAsset = {
  kind: string;
  url: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  retailPriceCents: number;
  productType: { name: string };
  artwork: { title: string; yearCreated: number | null; assets: DisplayableAsset[] };
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
        const asset = thumbnailAsset(product.artwork.assets);
        return (
          <ProductCard
            key={product.id}
            href={`/products/${product.slug}`}
            imageUrl={asset?.url ?? null}
            alt={asset?.altText ?? product.name}
            name={product.name}
            typeName={product.productType.name}
            priceCents={product.retailPriceCents}
            priority={index < 4}
          />
        );
      })}
    </div>
  );
}
