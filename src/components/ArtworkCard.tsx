import Image from "next/image";
import Link from "next/link";

export function ArtworkCard({
  href,
  imageUrl,
  alt,
  title,
  medium,
  year,
  formats,
  price,
  priority = false,
}: {
  href: string;
  imageUrl: string | null;
  alt: string;
  title: string;
  medium?: string | null;
  year?: number | null;
  /** Distinct product types this piece is available in — "Tee · Hoodie · Poster". */
  formats?: string[];
  price?: string | null;
  priority?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-data text-xs text-muted">
            No image
          </div>
        )}
      </div>

      <dl className="wall-label mt-3 border-t border-rule pt-2.5">
        <dd className="font-medium">{title}</dd>
        {(medium || year) && (
          <div className="mt-1 text-muted">
            {medium}
            {medium && year ? ", " : ""}
            {year}
          </div>
        )}
        {formats && formats.length > 0 && (
          <div className="mt-1 text-muted">{formats.join(" · ")}</div>
        )}
        {price && <div className="mt-1.5">{price}</div>}
      </dl>
    </Link>
  );
}
