import { ProductCatalog } from "@/components/ProductCatalog";
import { getPageIntros } from "@/lib/settings";

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
export default async function PrintsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; artwork?: string }>;
}) {
  const [{ type, artwork }, intros] = await Promise.all([searchParams, getPageIntros()]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="border-b border-rule pb-8">
        <p className="eyebrow">Paper</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
          Prints
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">{intros.prints}</p>

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

      <ProductCatalog
        category="PRINT"
        basePath="/prints"
        productTypeSlug={type}
        artworkSlug={artwork}
      />
    </section>
  );
}
