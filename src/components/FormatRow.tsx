import Image from "next/image";
import Link from "next/link";

type FormatType = { id: string; name: string; slug: string; imageUrl: string | null };

/**
 * Primary format navigation — "shop by type" — not a small strip. One tile
 * per sellable format (tee, hoodie, print…), large enough to be an obvious
 * entry point in its own right. Only types with a tile image set ever
 * reach here (see getFormatTypes), so the row simply doesn't render until
 * an admin sets one.
 */
export function FormatRow({
  types,
  activeSlug,
  basePath = "/shop",
}: {
  types: FormatType[];
  activeSlug?: string;
  basePath?: string;
}) {
  return (
    <div className="mt-8 border-b border-rule pb-10">
      <p className="eyebrow">Shop by type</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {types.map((type) => {
          const active = type.slug === activeSlug;
          return (
            <Link
              key={type.id}
              href={active ? basePath : `${basePath}?type=${type.slug}`}
              className="group block"
            >
              <div
                className={`relative aspect-square overflow-hidden bg-surface transition-colors ${
                  active ? "ring-2 ring-bone" : "ring-1 ring-rule group-hover:ring-muted"
                }`}
              >
                {type.imageUrl && (
                  <Image
                    src={type.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    unoptimized
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/90 to-transparent px-3 pb-3 pt-8">
                  <p
                    className={`font-display text-base font-medium tracking-tight transition-colors sm:text-lg ${
                      active ? "text-bone" : "text-bone/90 group-hover:text-bone"
                    }`}
                  >
                    {type.name}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
