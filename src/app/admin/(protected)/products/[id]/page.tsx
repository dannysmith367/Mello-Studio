import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { displayAsset } from "@/lib/assets";
import { printCapability } from "@/lib/images";
import { formatCents, marginCents, marginPercent } from "@/lib/money";
import { ProductForm } from "./ProductForm";
import { VariantPanel } from "./VariantPanel";
import { deleteProduct } from "../actions";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      productType: true,
      artwork: { include: { assets: true } },
      variants: { orderBy: { sku: "asc" } },
    },
  });
  if (!product) notFound();

  const display = displayAsset(product.artwork.assets, {
    preferMockup: product.productType.category === "APPAREL",
  });
  const original = product.artwork.assets.find((a) => a.kind === "ORIGINAL");
  const margin = marginCents(product.retailPriceCents, product.baseCostCents);

  // Can this artwork actually carry this product at print quality?
  const printArea =
    product.productType.defaultPrintWidthIn && product.productType.defaultPrintHeightIn
      ? {
          w: product.productType.defaultPrintWidthIn,
          h: product.productType.defaultPrintHeightIn,
        }
      : null;

  const capability =
    original?.width && original?.height
      ? printCapability(original.width, original.height)
      : null;

  const tooSmall =
    printArea && capability
      ? capability.at300dpi.w < printArea.w || capability.at300dpi.h < printArea.h
      : false;

  return (
    <>
      <Link
        href="/admin/products"
        className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Products
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden border border-rule bg-surface">
            {display?.url && (
              <Image src={display.url} alt="" fill sizes="280px" className="object-cover" unoptimized />
            )}
          </div>

          <dl className="mt-4 border border-rule bg-surface p-4 font-data text-[0.625rem]">
            <div className="flex justify-between">
              <dt className="text-muted">Artwork</dt>
              <dd className="truncate pl-2">{product.artwork.title}</dd>
            </div>
            <div className="mt-2 flex justify-between">
              <dt className="text-muted">Type</dt>
              <dd>{product.productType.name}</dd>
            </div>
            <div className="mt-2 flex justify-between">
              <dt className="text-muted">Margin</dt>
              <dd className={margin <= 0 ? "text-iris" : ""}>
                {formatCents(margin)} ·{" "}
                {marginPercent(product.retailPriceCents, product.baseCostCents)}%
              </dd>
            </div>
          </dl>

          {tooSmall && printArea && capability && (
            <p className="mt-4 border border-iris/40 bg-surface p-4 font-data text-[0.625rem] leading-relaxed text-muted">
              This artwork tops out at {capability.at300dpi.w}&Prime; ×{" "}
              {capability.at300dpi.h}&Prime; at 300 DPI, but a {product.productType.name}{" "}
              prints at {printArea.w}&Prime; × {printArea.h}&Prime;. It will print soft.
              Upload a larger original before publishing.
            </p>
          )}

          <Link
            href={`/admin/artwork/${product.artworkId}`}
            className="mt-4 inline-block font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
          >
            Edit artwork →
          </Link>
        </div>

        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">{product.name}</h1>
          <p className="mt-1 font-data text-[0.625rem] text-muted">/products/{product.slug}</p>

          <div className="mt-6 max-w-xl">
            <ProductForm
              product={{
                id: product.id,
                name: product.name,
                description: product.description,
                baseCostCents: product.baseCostCents,
                retailPriceCents: product.retailPriceCents,
                fulfillmentProvider: product.fulfillmentProvider,
                providerProductId: product.providerProductId,
                published: product.published,
                featured: product.featured,
                seoTitle: product.seoTitle,
                seoDescription: product.seoDescription,
              }}
            />
          </div>

          <VariantPanel
            productId={product.id}
            variants={product.variants}
            fallbackPriceCents={product.retailPriceCents}
          />

          <form action={deleteProduct} className="mt-12 border-t border-rule pt-6">
            <input type="hidden" name="id" value={product.id} />
            <p className="font-data text-[0.625rem] text-muted">
              Products that appear in an order are unpublished rather than deleted,
              so order history stays intact.
            </p>
            <button className="btn-ghost mt-3">Delete product</button>
          </form>
        </div>
      </div>
    </>
  );
}
