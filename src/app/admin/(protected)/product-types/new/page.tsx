import Link from "next/link";
import { ProductTypeForm } from "../ProductTypeForm";

export const metadata = { title: "New product type" };

export default function NewProductTypePage() {
  return (
    <>
      <Link
        href="/admin/product-types"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Product types
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">New product type</h1>

      <div className="mt-6 max-w-xl">
        <ProductTypeForm mode="create" />
      </div>
    </>
  );
}
