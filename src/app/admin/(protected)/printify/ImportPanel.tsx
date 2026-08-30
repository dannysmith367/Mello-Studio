"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importPrintifyProduct } from "./actions";

type RemoteProduct = {
  id: string;
  title: string;
  image: string | null;
  variantCount: number;
  alreadyImported: boolean;
};

const field =
  "w-full border border-rule bg-transparent px-2.5 py-2 text-sm focus:border-iris focus:outline-none";

function ProductRow({
  product,
  artworks,
  types,
}: {
  product: RemoteProduct;
  artworks: { id: string; title: string }[];
  types: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [artworkId, setArtworkId] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleImport() {
    if (!artworkId || !productTypeId) {
      return setMessage("Pick an artwork and a product type first.");
    }
    setMessage(null);

    startTransition(async () => {
      const result = await importPrintifyProduct({
        printifyProductId: product.id,
        artworkId,
        productTypeId,
      });

      if ("error" in result && result.error) return setMessage(result.error);
      router.push(`/admin/products/${result.id}`);
    });
  }

  return (
    <li className="border border-rule bg-surface p-4">
      <div className="flex gap-4">
        {product.image && (
          // Printify serves mockups from its own CDN; no optimisation needed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            className="h-20 w-20 shrink-0 object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.title}</p>
          <p className="mt-1 font-data text-[0.625rem] text-muted">
            {product.variantCount} variant{product.variantCount === 1 ? "" : "s"}
            {product.alreadyImported ? " · already imported" : ""}
          </p>
        </div>
      </div>

      {!product.alreadyImported && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="eyebrow block">Artwork</label>
              <select
                value={artworkId}
                onChange={(e) => setArtworkId(e.target.value)}
                className={`${field} mt-1.5`}
              >
                <option value="">Choose…</option>
                {artworks.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block">Product type</label>
              <select
                value={productTypeId}
                onChange={(e) => setProductTypeId(e.target.value)}
                className={`${field} mt-1.5`}
              >
                <option value="">Choose…</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleImport} disabled={pending} className="btn-ghost mt-4">
            {pending ? "Importing…" : "Import"}
          </button>

          {message && (
            <p role="alert" className="mt-3 font-data text-xs text-iris">{message}</p>
          )}
        </>
      )}
    </li>
  );
}

export function ImportPanel({
  products,
  artworks,
  types,
}: {
  products: RemoteProduct[];
  artworks: { id: string; title: string }[];
  types: { id: string; name: string }[];
}) {
  if (products.length === 0) {
    return (
      <div className="mt-6 border border-rule bg-surface px-6 py-16 text-center">
        <p className="font-display text-lg">No products in your Printify shop</p>
        <p className="mt-2 text-sm text-muted">
          Build one in Printify first, then come back here.
        </p>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="mt-6 border border-rule bg-surface px-6 py-16 text-center">
        <p className="font-display text-lg">Upload artwork first</p>
        <p className="mt-2 text-sm text-muted">
          Every product is tied to a piece, so the site can show other formats of
          the same artwork.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid gap-4 lg:grid-cols-2">
      {products.map((product) => (
        <ProductRow key={product.id} product={product} artworks={artworks} types={types} />
      ))}
    </ul>
  );
}
