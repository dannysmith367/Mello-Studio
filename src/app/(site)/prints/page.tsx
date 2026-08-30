import { getProductsByCategory } from "@/lib/queries";
import { ProductGrid } from "@/components/ProductGrid";

export const metadata = {
  title: "Prints",
  description:
    "Giclée art prints and posters of Mello's original work, printed on archival stock and shipped flat.",
};

/**
 * Prints get their own page rather than sharing the apparel template.
 * What a print buyer needs to know — paper, size, edition, how it ships —
 * is different from what an apparel buyer needs, so the page says it up front.
 */
export default async function PrintsPage() {
  const products = await getProductsByCategory("PRINT");

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="border-b border-rule pb-8">
        <p className="eyebrow">Paper</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
          Prints
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          Reproductions of Mello&rsquo;s original paintings and drawings, printed
          on archival stock and shipped flat in a rigid mailer.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 font-data text-[0.6875rem] sm:grid-cols-4">
          <div>
            <dt className="uppercase tracking-[0.14em] text-muted">Sizes</dt>
            <dd className="mt-1.5">12&Prime; × 18&Prime; · 18&Prime; × 24&Prime;</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.14em] text-muted">Stock</dt>
            <dd className="mt-1.5">Archival matte</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.14em] text-muted">Shipping</dt>
            <dd className="mt-1.5">Flat, rigid mailer</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.14em] text-muted">Signed</dt>
            <dd className="mt-1.5">On request</dd>
          </div>
        </dl>
      </header>

      <div className="mt-10">
        <ProductGrid products={products} />
      </div>

      <p className="mt-12 border-t border-rule pt-6 font-data text-[0.6875rem] leading-relaxed text-muted">
        Print specs above are placeholders until the print provider is chosen.
        Paper weight, finish and true sizes get set in Phase&nbsp;11.
      </p>
    </section>
  );
}
