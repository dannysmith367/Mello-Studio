import Link from "next/link";
import { db } from "@/lib/db";
import { listPrintifyProducts, listShops } from "./actions";
import { ImportPanel } from "./ImportPanel";

export const metadata = { title: "Printify" };
export const dynamic = "force-dynamic";

export default async function PrintifyPage() {
  const configured = Boolean(process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID);

  if (!configured) {
    const shopResult = process.env.PRINTIFY_API_KEY ? await listShops() : null;

    return (
      <>
        <h1 className="font-display text-2xl font-medium tracking-tight">Printify</h1>
        <div className="mt-6 max-w-xl border border-rule bg-surface p-6">
          <p className="eyebrow">Not connected</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Add <code className="text-bone">PRINTIFY_API_KEY</code> and{" "}
            <code className="text-bone">PRINTIFY_SHOP_ID</code> to your environment.
          </p>

          {shopResult && "shops" in shopResult && (
            <div className="mt-5 border-t border-rule pt-4">
              <p className="eyebrow">Your shops</p>
              <ul className="mt-2 font-data text-xs">
                {(shopResult.shops ?? []).map((shop) => (
                  <li key={shop.id} className="flex justify-between gap-4 py-1">
                    <span className="text-muted">{shop.title}</span>
                    <span>{shop.id}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-data text-[0.625rem] text-muted">
                Use one of these ids as PRINTIFY_SHOP_ID.
              </p>
            </div>
          )}

          {shopResult && "error" in shopResult && (
            <p className="mt-4 font-data text-xs text-iris">{shopResult.error}</p>
          )}
        </div>
      </>
    );
  }

  const [result, artworks, types] = await Promise.all([
    listPrintifyProducts(),
    db.artwork.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    db.productType.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">Printify</h1>
        <Link
          href="/admin/products"
          className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
        >
          Products →
        </Link>
      </div>

      <p className="mt-2 max-w-lg text-sm text-muted">
        Design the product in Printify, then bring it in here. Structure and cost
        come from Printify; the retail price and everything the customer sees is
        yours.
      </p>

      {"error" in result ? (
        <div className="mt-6 border border-iris/40 bg-surface p-6">
          <p className="eyebrow">Could not load products</p>
          <p className="mt-3 font-data text-xs leading-relaxed text-muted">{result.error}</p>
        </div>
      ) : (
        <ImportPanel products={result.products} artworks={artworks} types={types} />
      )}
    </>
  );
}
