import Link from "next/link";
import { CollectionForm } from "../CollectionForm";

export const metadata = { title: "New collection" };

export default function NewCollectionPage() {
  return (
    <>
      <Link
        href="/admin/collections"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Collections
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">New collection</h1>

      <div className="mt-6 max-w-xl">
        <CollectionForm mode="create" />
      </div>

      <p className="mt-4 max-w-xl font-data text-[0.625rem] text-muted">
        Created as a draft. Add artwork and publish from the next page.
      </p>
    </>
  );
}
