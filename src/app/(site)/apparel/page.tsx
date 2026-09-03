import { ProductCatalog } from "@/components/ProductCatalog";

export const metadata = { title: "Apparel" };

export default async function ApparelPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; artwork?: string }>;
}) {
  const { type, artwork } = await searchParams;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="border-b border-rule pb-8">
        <p className="eyebrow">Cloth</p>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
          Apparel
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          Artwork printed on heavyweight cotton. Cut for a relaxed fit.
        </p>
      </header>

      <ProductCatalog
        category="APPAREL"
        basePath="/apparel"
        productTypeSlug={type}
        artworkSlug={artwork}
      />
    </section>
  );
}
