import { getArtworksWithProducts, getFormatTypes } from "@/lib/queries";
import { ArtworkGrid } from "./ArtworkGrid";
import { FormatRow } from "./FormatRow";

/**
 * /shop, /apparel and /prints are the same catalog under different filters,
 * not separate trees. All three browse by artwork — a piece sold as five
 * formats is one tile, not five — with the sellable products underneath it
 * on the artwork's own page.
 */
export async function CatalogPage({
  title,
  eyebrow,
  intro,
  category,
  productTypeSlug,
  showFormatRow = false,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  category?: "APPAREL" | "PRINT" | "ACCESSORY";
  productTypeSlug?: string;
  showFormatRow?: boolean;
}) {
  const [artworks, formatTypes] = await Promise.all([
    getArtworksWithProducts({ category, productTypeSlug }),
    showFormatRow ? getFormatTypes() : Promise.resolve([]),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="border-b border-rule pb-8">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">{intro}</p>}
      </header>

      {formatTypes.length > 0 && <FormatRow types={formatTypes} activeSlug={productTypeSlug} />}

      <div className="mt-10">
        <ArtworkGrid artworks={artworks} />
      </div>
    </section>
  );
}
