import { getProductsByCategory } from "@/lib/queries";
import { ProductGrid } from "./ProductGrid";

/**
 * /shop and /apparel are the same catalog under different filters, not
 * separate trees. Prints have their own page because the buying questions
 * differ enough to deserve it.
 */
export async function CatalogPage({
  title,
  eyebrow,
  intro,
  category,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  category?: "APPAREL" | "PRINT" | "ACCESSORY";
}) {
  const products = await getProductsByCategory(category);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="border-b border-rule pb-8">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">{intro}</p>}
      </header>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
