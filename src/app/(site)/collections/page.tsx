import Link from "next/link";
import { getPublishedCollections, isCollectionOpen } from "@/lib/queries";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await getPublishedCollections();

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="border-b border-rule pb-6 font-display font-medium tracking-tight text-3xl sm:text-4xl">
        Collections
      </h1>

      {collections.length === 0 ? (
        <p className="mt-10 font-data text-xs uppercase tracking-[0.12em] text-muted">
          No collections published yet
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-b border-rule">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link
                href={`/collections/${collection.slug}`}
                className="flex items-baseline justify-between gap-4 py-6 transition-colors hover:text-muted"
              >
                <div>
                  <span className="font-display font-medium tracking-tight text-2xl">{collection.name}</span>
                  {collection.kind === "DROP" && (
                    <span className="ml-3 font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                      {isCollectionOpen(collection) ? "Open" : "Closed"}
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-data text-xs uppercase tracking-[0.12em] text-muted">
                  {collection._count.artworks} pieces
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
