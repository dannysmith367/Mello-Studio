import Image from "next/image";
import Link from "next/link";

type Tile = {
  slug: string;
  title: string;
  imageUrl: string | null;
  alt: string;
};

/**
 * The landing field: eight artwork tiles under an oversized wordmark.
 *
 * Tiles are dimmed by default so the wordmark stays readable across all of
 * them and the grid reads as one surface. Hovering brings a single piece up
 * to full brightness, which is the only "reveal" on the page.
 */
export function ArtworkMosaic({
  tiles,
  intro,
}: {
  tiles: Tile[];
  intro?: string;
}) {
  return (
    <section className="relative min-h-[88svh] w-full overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-4 gap-px bg-rule md:grid-cols-4 md:grid-rows-2">
        {tiles.map((tile) => (
          <Link
            key={tile.slug}
            href={`/shop?artwork=${tile.slug}`}
            className="mosaic-tile relative overflow-hidden bg-surface"
            aria-label={tile.title}
          >
            {tile.imageUrl && (
              <Image
                src={tile.imageUrl}
                alt={tile.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
                priority
              />
            )}
          </Link>
        ))}
      </div>

      {/* The mark sits above the field and ignores pointer events so the tiles
          underneath stay clickable. The logo carries no wordmark, so the name
          is set in type beneath it — the brand is too new to go unnamed. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-5 px-4">
        <Image
          src="/brand/mello-mark.png"
          alt=""
          aria-hidden="true"
          width={690}
          height={652}
          priority
          className="w-[clamp(9rem,26vw,20rem)] drop-shadow-[0_4px_60px_rgba(0,0,0,0.6)]"
        />
        <h1 className="text-center font-display text-[clamp(1.5rem,5.5vw,3rem)] font-medium uppercase leading-none tracking-[0.22em] text-bone drop-shadow-[0_2px_30px_rgba(0,0,0,0.7)]">
          Mello Studio
        </h1>
      </div>

      {intro && (
        <div className="absolute bottom-7 left-5 max-w-xs sm:bottom-9 sm:left-8 sm:max-w-md">
          <p className="pointer-events-none text-[0.8125rem] leading-relaxed text-bone/85 drop-shadow-[0_1px_12px_rgba(0,0,0,0.85)] sm:text-sm">
            {intro}
          </p>
          <Link
            href="/about"
            className="mt-2.5 inline-block font-data text-[0.625rem] uppercase tracking-[0.18em] text-bone/70 drop-shadow-[0_1px_12px_rgba(0,0,0,0.85)] transition-colors hover:text-bone"
          >
            About the artist →
          </Link>
        </div>
      )}
    </section>
  );
}
