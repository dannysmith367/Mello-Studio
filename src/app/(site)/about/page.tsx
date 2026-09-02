import Image from "next/image";
import Link from "next/link";
import { getPublishedArtworks } from "@/lib/queries";
import { getAboutImageUrl } from "@/lib/settings";
import { thumbnailAsset } from "@/lib/assets";
import { BrandMark } from "@/components/BrandMark";

export const metadata = {
  title: "About",
  description:
    "Mello is a self-taught multidisciplinary artist working across painting, woodburning, glass etching, tattoo design and mixed media.",
};

const MEDIUMS = [
  "Original painting",
  "Concept art",
  "Woodburning",
  "Glass etching",
  "Tattoo design",
  "Mixed media",
];

export default async function AboutPage() {
  const [artworks, portraitUrl] = await Promise.all([
    getPublishedArtworks(3),
    getAboutImageUrl(),
  ]);

  const bio = (
    <div>
      <BrandMark size={56} className="opacity-90" />

      <p className="eyebrow mt-8">About the artist</p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
        Mello
      </h1>

      <div className="mt-10 space-y-6 text-[0.9375rem] leading-[1.75] text-muted">
        <p className="text-bone">
          Mello is a self-taught multidisciplinary artist originally from the
          East Coast, whose creative journey began in childhood. Driven by
          curiosity and a passion for storytelling through art, he has spent
          years developing a distinctive style that blends cultural influences,
          visionary concepts, and raw imagination.
        </p>
        <p>
          His work explores the connection between life, nature, and human
          experience, drawing inspiration from the world around him. Each piece
          reflects a balance of creativity, craftsmanship, and personal
          expression.
        </p>
        <p>
          Rather than limiting himself to a single style, he embraces
          experimentation, allowing each project to evolve naturally into
          something unique.
        </p>
      </div>
    </div>
  );

  return (
    <article>
      <section
        className={
          portraitUrl
            ? "mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24"
            : "mx-auto max-w-3xl px-5 pt-16 sm:px-8 sm:pt-24"
        }
      >
        {portraitUrl ? (
          <div className="grid gap-10 md:grid-cols-2 md:items-start md:gap-14">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface">
              <Image
                src={portraitUrl}
                alt="Portrait of Mello"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
                priority
              />
            </div>
            {bio}
          </div>
        ) : (
          bio
        )}
      </section>

      {/* Mediums as a catalogue list — the range is the point, so it gets
          structure rather than being buried in a sentence. */}
      <section className="mx-auto mt-16 max-w-3xl px-5 sm:px-8">
        <p className="eyebrow">Works in</p>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 border-t border-rule sm:grid-cols-3">
          {MEDIUMS.map((medium) => (
            <li
              key={medium}
              className="border-b border-rule py-3 font-data text-[0.6875rem] uppercase tracking-[0.14em]"
            >
              {medium}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-20 max-w-3xl px-5 sm:px-8">
        <blockquote className="border-l border-rule pl-6 sm:pl-8">
          <p className="font-display text-2xl font-medium leading-[1.3] tracking-tight text-bone sm:text-3xl">
            &ldquo;Art isn&rsquo;t just something I create&mdash;it&rsquo;s how I
            interpret the world.&rdquo;
          </p>
          <footer className="mt-4 font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            Mello
          </footer>
        </blockquote>
      </section>

      <section className="mx-auto mt-20 max-w-3xl px-5 sm:px-8">
        <div className="space-y-6 text-[0.9375rem] leading-[1.75] text-muted">
          <p>
            The goal is simple: to create meaningful artwork that sparks
            imagination, starts conversations, and leaves a lasting impression.
            Whether it&rsquo;s a custom commission or an original piece, every
            creation is made with authenticity, passion, and attention to detail.
          </p>
        </div>
      </section>

      {artworks.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-5 pb-8 sm:px-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {artworks.map((artwork) => {
              const asset = thumbnailAsset(artwork.assets);
              return (
                <Link
                  key={artwork.id}
                  href={`/artwork/${artwork.slug}`}
                  className="group relative aspect-square overflow-hidden bg-surface"
                >
                  {asset?.url && (
                    <Image
                      src={asset.url}
                      alt={asset.altText ?? artwork.title}
                      fill
                      sizes="(max-width: 640px) 33vw, 280px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-ghost">
              See the work
            </Link>
            <Link href="/commissions" className="btn-ghost">
              Commission a piece
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
