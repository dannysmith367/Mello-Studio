import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { thumbnailAsset } from "@/lib/assets";
import { formatCents, marginCents, marginPercent } from "@/lib/money";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const [products, artworkCount] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        productType: true,
        artwork: { include: { assets: true } },
        _count: { select: { variants: true } },
      },
    }),
    db.artwork.count(),
  ]);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">Products</h1>
        {artworkCount > 0 && (
          <Link href="/admin/products/new" className="btn-ghost">
            New product
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="mt-6 border border-rule bg-surface px-6 py-20 text-center">
          <p className="font-display text-lg">No products yet</p>
          <p className="mt-2 max-w-sm mx-auto text-sm text-muted">
            {artworkCount === 0
              ? "Upload artwork first — every product is made from a piece."
              : "Make a product from a piece of artwork. One artwork can carry as many products as you like."}
          </p>
          <Link
            href={artworkCount === 0 ? "/admin/artwork/new" : "/admin/products/new"}
            className="btn-ghost mt-6 inline-block"
          >
            {artworkCount === 0 ? "Upload artwork" : "New product"}
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-rule">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-rule bg-surface text-left font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                <th className="px-3 py-2.5 font-normal">Product</th>
                <th className="px-3 py-2.5 font-normal">Type</th>
                <th className="px-3 py-2.5 font-normal">Price</th>
                <th className="px-3 py-2.5 font-normal">Margin</th>
                <th className="px-3 py-2.5 font-normal">Variants</th>
                <th className="px-3 py-2.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const thumb = thumbnailAsset(product.artwork.assets, {
                  preferMockup: product.productType.category === "APPAREL",
                });
                const margin = marginCents(product.retailPriceCents, product.baseCostCents);
                return (
                  <tr key={product.id} className="border-b border-rule last:border-0">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-3 hover:text-muted"
                      >
                        <span className="relative block h-9 w-9 shrink-0 overflow-hidden bg-surface">
                          {thumb?.url && (
                            <Image src={thumb.url} alt="" fill sizes="36px" className="object-cover" unoptimized />
                          )}
                        </span>
                        <span className="truncate">{product.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{product.productType.name}</td>
                    <td className="px-3 py-2.5 font-data text-xs">
                      {formatCents(product.retailPriceCents)}
                    </td>
                    <td className="px-3 py-2.5 font-data text-xs">
                      <span className={margin <= 0 ? "text-iris" : "text-muted"}>
                        {formatCents(margin)} ·{" "}
                        {marginPercent(product.retailPriceCents, product.baseCostCents)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-data text-xs text-muted">
                      {product._count.variants}
                    </td>
                    <td className="px-3 py-2.5 font-data text-[0.625rem] uppercase tracking-[0.14em]">
                      {product.published ? "Live" : "Draft"}
                      {product.featured ? " · Featured" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
