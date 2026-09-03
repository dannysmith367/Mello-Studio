import { getStudioProducts } from "@/lib/queries";
import { ProductGrid } from "@/components/ProductGrid";

export const metadata = {
  title: "Merch",
  description: "Mello Studio branded merchandise.",
};

/**
 * Studio-branded goods (the logo, not a piece of art) have no artwork worth
 * browsing behind them, so this lists products directly rather than
 * grouping them under an artwork tile the way /shop, /apparel and /prints do.
 */
export default async function MerchPage() {
  const products = await getStudioProducts();

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="border-b border-rule pb-8">
        <p className="eyebrow">Studio</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
          Merch
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          Mello Studio branded goods — for wearing the name, not the art.
        </p>
      </header>

      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
