import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductTypeForm } from "../ProductTypeForm";
import { deleteProductType } from "../actions";

export const metadata = { title: "Edit product type" };

export default async function EditProductTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ blocked?: string }>;
}) {
  const { id } = await params;
  const { blocked } = await searchParams;

  const productType = await db.productType.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!productType) notFound();

  return (
    <>
      <Link
        href="/admin/product-types"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Product types
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium tracking-tight">{productType.name}</h1>

      {blocked && (
        <p className="mt-4 border border-iris/40 bg-surface p-4 font-data text-xs text-muted">
          Can&rsquo;t delete — {productType._count.products} product
          {productType._count.products === 1 ? "" : "s"} still use{productType._count.products === 1 ? "s" : ""} this type.
        </p>
      )}

      <div className="mt-6 max-w-xl">
        <ProductTypeForm mode="edit" productType={productType} />
      </div>

      <form action={deleteProductType} className="mt-12 max-w-xl border-t border-rule pt-6">
        <input type="hidden" name="id" value={productType.id} />
        <p className="font-data text-[0.625rem] text-muted">
          {productType._count.products > 0
            ? `Used by ${productType._count.products} product${productType._count.products === 1 ? "" : "s"} — deletion is blocked until they are moved or removed.`
            : "Not used by any product yet."}
        </p>
        <button className="btn-ghost mt-3" disabled={productType._count.products > 0}>
          Delete type
        </button>
      </form>
    </>
  );
}
