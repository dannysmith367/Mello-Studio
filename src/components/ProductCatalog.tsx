import {
  getArtworksForCategoryFilter,
  getFormatTypes,
  getProductsByCategory,
} from "@/lib/queries";
import { FormatRow } from "./FormatRow";
import { CategoryArtworkFilter } from "./CategoryArtworkFilter";
import { ProductGrid } from "./ProductGrid";

/**
 * The body of a category page (/apparel, /prints): format row, then a
 * product grid — one tile per published product, not per artwork. Someone
 * here has already decided they want a garment or a print; they need to
 * see the actual items, not a painting standing in for five of them.
 */
export async function ProductCatalog({
  category,
  basePath,
  productTypeSlug,
  artworkSlug,
}: {
  category: "APPAREL" | "PRINT" | "ACCESSORY";
  basePath: string;
  productTypeSlug?: string;
  artworkSlug?: string;
}) {
  const [products, formatTypes, artworks] = await Promise.all([
    getProductsByCategory(category, { productTypeSlug, artworkSlug }),
    getFormatTypes(category),
    getArtworksForCategoryFilter(category, productTypeSlug),
  ]);

  return (
    <>
      {formatTypes.length > 0 && (
        <FormatRow types={formatTypes} activeSlug={productTypeSlug} basePath={basePath} />
      )}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <CategoryArtworkFilter
          artworks={artworks}
          activeSlug={artworkSlug}
          typeSlug={productTypeSlug}
          basePath={basePath}
        />
        <p className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
          {products.length} item{products.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </>
  );
}
