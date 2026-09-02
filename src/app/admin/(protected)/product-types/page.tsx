import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Product types" };

const CATEGORY_LABEL: Record<string, string> = {
  APPAREL: "Apparel",
  PRINT: "Print",
  ACCESSORY: "Accessory",
};

export default async function ProductTypesPage() {
  const types = await db.productType.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">Product types</h1>
        <Link href="/admin/product-types/new" className="btn-ghost">
          New type
        </Link>
      </div>

      {types.length === 0 ? (
        <div className="mt-6 border border-rule bg-surface px-6 py-20 text-center">
          <p className="font-display text-lg">No product types yet</p>
          <p className="mt-2 max-w-sm mx-auto text-sm text-muted">
            A product type is a garment or paper format — "Heavyweight Hoodie",
            "Giclée Print". Every product is built from one.
          </p>
          <Link href="/admin/product-types/new" className="btn-ghost mt-6 inline-block">
            New type
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-rule">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-rule bg-surface text-left font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                <th className="px-3 py-2.5 font-normal" />
                <th className="px-3 py-2.5 font-normal">Name</th>
                <th className="px-3 py-2.5 font-normal">Category</th>
                <th className="px-3 py-2.5 font-normal">Print area</th>
                <th className="px-3 py-2.5 font-normal">Products</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.id} className="border-b border-rule last:border-0">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/product-types/${type.id}`}>
                      <span className="relative block h-9 w-9 overflow-hidden bg-surface">
                        {type.imageUrl && (
                          <Image
                            src={type.imageUrl}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/product-types/${type.id}`}
                      className="hover:text-muted"
                    >
                      {type.name}
                    </Link>
                    <p className="font-data text-[0.625rem] text-muted">/{type.slug}</p>
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {CATEGORY_LABEL[type.category] ?? type.category}
                  </td>
                  <td className="px-3 py-2.5 font-data text-xs text-muted">
                    {type.defaultPrintWidthIn && type.defaultPrintHeightIn
                      ? `${type.defaultPrintWidthIn}″ × ${type.defaultPrintHeightIn}″`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-data text-xs text-muted">
                    {type._count.products}
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
