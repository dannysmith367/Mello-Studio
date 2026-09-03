import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { displayAsset } from "@/lib/assets";
import { printCapability } from "@/lib/images";
import { EditForm } from "./EditForm";
import { deleteArtwork } from "../actions";

export const metadata = { title: "Edit artwork" };

export default async function EditArtworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ blocked?: string }>;
}) {
  const { id } = await params;
  const { blocked } = await searchParams;
  const artwork = await db.artwork.findUnique({
    where: { id },
    include: { assets: true, products: { include: { productType: true } } },
  });
  if (!artwork) notFound();

  const display = displayAsset(artwork.assets);
  const original = artwork.assets.find((a) => a.kind === "ORIGINAL");
  const capability =
    original?.width && original?.height
      ? printCapability(original.width, original.height)
      : null;

  return (
    <>
      <Link
        href="/admin/artwork"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Artwork
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden border border-rule bg-surface">
            {display?.url && (
              <Image
                src={display.url}
                alt=""
                fill
                sizes="320px"
                className="object-cover"
                unoptimized
              />
            )}
          </div>

          {/* Print capability, so it's obvious before a product is made whether
              this file can actually carry a poster. */}
          {capability && (
            <dl className="mt-4 border border-rule bg-surface p-4 font-data text-[0.625rem]">
              <div className="flex justify-between">
                <dt className="text-muted">Original</dt>
                <dd>
                  {original!.width}×{original!.height} · {capability.megapixels} MP
                </dd>
              </div>
              <div className="mt-2 flex justify-between">
                <dt className="text-muted">Max at 300 DPI</dt>
                <dd>
                  {capability.at300dpi.w}&Prime; × {capability.at300dpi.h}&Prime;
                </dd>
              </div>
              <div className="mt-2 flex justify-between">
                <dt className="text-muted">Max at 150 DPI</dt>
                <dd>
                  {capability.at150dpi.w}&Prime; × {capability.at150dpi.h}&Prime;
                </dd>
              </div>
            </dl>
          )}

          <ul className="mt-4 border border-rule bg-surface p-4 font-data text-[0.625rem]">
            {artwork.assets.map((asset) => (
              <li key={asset.id} className="flex justify-between gap-3 py-1">
                <span className="text-muted">{asset.kind}</span>
                <span className="truncate">
                  {asset.width}×{asset.height}
                </span>
              </li>
            ))}
          </ul>

          {artwork.products.length > 0 && (
            <div className="mt-4 border border-rule bg-surface p-4">
              <p className="eyebrow">Products</p>
              <ul className="mt-2 space-y-1 text-sm">
                {artwork.products.map((product) => (
                  <li key={product.id}>
                    <Link href={`/admin/products`} className="hover:text-muted">
                      {product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">
            {artwork.title}
          </h1>
          <p className="mt-1 font-data text-[0.625rem] text-muted">/{artwork.slug}</p>

          <div className="mt-6">
            <EditForm
              artwork={{
                id: artwork.id,
                title: artwork.title,
                medium: artwork.medium,
                yearCreated: artwork.yearCreated,
                description: artwork.description,
                status: artwork.status,
                featured: artwork.featured,
                kind: artwork.kind,
                seoTitle: artwork.seoTitle,
                seoDescription: artwork.seoDescription,
              }}
            />
          </div>

          <form action={deleteArtwork} className="mt-12 border-t border-rule pt-6">
            <input type="hidden" name="id" value={artwork.id} />
            <p className="font-data text-[0.625rem] text-muted">
              Deleting removes the stored files too. Products using this artwork
              must be removed first.
            </p>
            {blocked && (
              <p role="alert" className="mt-3 font-data text-xs text-iris">
                Remove the products using this artwork first.
              </p>
            )}
            <button className="btn-ghost mt-3">Delete artwork</button>
          </form>
        </div>
      </div>
    </>
  );
}