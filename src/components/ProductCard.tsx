import Image from "next/image";
import Link from "next/link";
import { formatCents } from "@/lib/money";

/**
 * Retail card. The artwork sits on its own dark plinth so pieces of wildly
 * different palettes still line up as a row.
 */
export function ProductCard({
  href,
  imageUrl,
  imageUnoptimized = false,
  alt,
  name,
  eyebrow,
  priceCents,
  priority = false,
}: {
  href: string;
  imageUrl: string | null;
  imageUnoptimized?: boolean;
  alt: string;
  name: string;
  /** Small label above the name — the artwork title on a category grid, the format on an artwork page. */
  eyebrow: string;
  priceCents: number;
  priority?: boolean;
}) {
  return (
    <article className="group border border-rule bg-surface transition-colors hover:border-muted/50">
      <Link href={href} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-void">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              priority={priority}
              unoptimized={imageUnoptimized}
            />
          ) : (
            <div className="flex h-full items-center justify-center font-data text-xs text-muted">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="p-3.5">
        <p className="eyebrow">{eyebrow}</p>
        <Link href={href} className="mt-2 block text-sm font-medium leading-snug hover:text-muted">
          {name}
        </Link>
        <p className="mt-1 font-data text-xs text-muted">{formatCents(priceCents)}</p>

        <Link href={href} className="btn-ghost mt-3.5 block w-full text-center">
          View
        </Link>
      </div>
    </article>
  );
}