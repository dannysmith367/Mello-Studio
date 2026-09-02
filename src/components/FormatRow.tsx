import Image from "next/image";
import Link from "next/link";

type FormatType = { id: string; name: string; slug: string; imageUrl: string | null };

/**
 * Above the /shop grid — one tile per sellable format (tee, hoodie, print…).
 * Only types with a tile image set ever reach here (see getShopFormatTypes),
 * so the row simply doesn't render until an admin sets one.
 */
export function FormatRow({ types, activeSlug }: { types: FormatType[]; activeSlug?: string }) {
  return (
    <div className="mt-8 grid grid-cols-3 gap-3 border-b border-rule pb-8 sm:grid-cols-4 lg:grid-cols-6">
      {types.map((type) => {
        const active = type.slug === activeSlug;
        return (
          <Link
            key={type.id}
            href={active ? "/shop" : `/shop?type=${type.slug}`}
            className="group block"
          >
            <div
              className={`relative aspect-square overflow-hidden bg-surface ${
                active ? "ring-1 ring-bone" : ""
              }`}
            >
              {type.imageUrl && (
                <Image
                  src={type.imageUrl}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  unoptimized
                />
              )}
            </div>
            <p
              className={`mt-2 text-center font-data text-[0.625rem] uppercase tracking-[0.14em] transition-colors ${
                active ? "text-bone" : "text-muted group-hover:text-bone"
              }`}
            >
              {type.name}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
