import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Collections" };

export default async function CollectionsAdminPage() {
  const collections = await db.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { artworks: true } } },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">Collections</h1>
        <Link href="/admin/collections/new" className="btn-ghost">
          New collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="mt-6 border border-rule bg-surface px-6 py-20 text-center">
          <p className="font-display text-lg">No collections yet</p>
          <p className="mt-2 max-w-sm mx-auto text-sm text-muted">
            A series groups artwork thematically; a drop is timed and may be
            edition-limited.
          </p>
          <Link href="/admin/collections/new" className="btn-ghost mt-6 inline-block">
            New collection
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-rule">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-rule bg-surface text-left font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                <th className="px-3 py-2.5 font-normal">Name</th>
                <th className="px-3 py-2.5 font-normal">Kind</th>
                <th className="px-3 py-2.5 font-normal">Artworks</th>
                <th className="px-3 py-2.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.id} className="border-b border-rule last:border-0">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/collections/${collection.id}`} className="hover:text-muted">
                      {collection.name}
                    </Link>
                    <p className="font-data text-[0.625rem] text-muted">/collections/{collection.slug}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {collection.kind === "DROP" ? "Drop" : "Series"}
                  </td>
                  <td className="px-3 py-2.5 font-data text-xs text-muted">
                    {collection._count.artworks}
                  </td>
                  <td className="px-3 py-2.5 font-data text-[0.625rem] uppercase tracking-[0.14em]">
                    {collection.published ? "Live" : "Draft"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
