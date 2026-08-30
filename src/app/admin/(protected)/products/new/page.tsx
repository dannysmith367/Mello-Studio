import Link from "next/link";
import { db } from "@/lib/db";
import { NewProductForm } from "./NewProductForm";

export const metadata = { title: "New product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ artwork?: string }>;
}) {
  const { artwork: preselected } = await searchParams;

  const [artworks, types] = await Promise.all([
    db.artwork.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, status: true },
    }),
    db.productType.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <Link
        href="/admin/products"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Products
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">New product</h1>

      {types.length === 0 ? (
        <p className="mt-6 border border-rule bg-surface p-6 text-sm text-muted">
          No product types exist yet. Run <code className="text-bone">npm run db:seed</code> to
          create the starting set, or add them in the database.
        </p>
      ) : (
        <NewProductForm artworks={artworks} types={types} preselectedArtwork={preselected} />
      )}
    </>
  );
}
