import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtworkBySlug } from "@/lib/queries";
import { displayAsset, productMockups } from "@/lib/assets";
import { AddToBag } from "@/components/AddToBag";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork || artwork.status !== "PUBLISHED") return { title: "Not found" };

  const asset = displayAsset(artwork.assets);
  const title = artwork.seoTitle ?? artwork.title;
  const description = artwork.seoDescription ?? artwork.description ?? undefined;
  const image = asset?.url ?? "/brand/og-default.png";

  return {
    title,
    description,
    openGraph: { type: "website", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork || artwork.status !== "PUBLISHED") notFound();

  const asset = displayAsset(artwork.assets);

  // One section per format (tee, hoodie, print…), each with its own
  // variants and its own add-to-bag — a piece sold five ways is one page.
  const groups = new Map<
    string,
    { typeName: string; products: (typeof artwork.products)[number][] }
  >();
  for (const product of artwork.products) {
    const key = product.productType.id;
    const group = groups.get(key);
    if (group) group.products.push(product);
    else groups.set(key, { typeName: product.productType.name, products: [product] });
  }

  return (
    <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface md:sticky md:top-24 md:self-start">
          {asset?.url && (
            <Image
              src={asset.url}
              alt={asset.altText ?? artwork.title}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
              priority
            />
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            {artwork.title}
          </h1>
          {(artwork.medium || artwork.yearCreated) && (
            <p className="mt-2 wall-label text-muted">
              {artwork.medium}
              {artwork.medium && artwork.yearCreated ? ", " : ""}
              {artwork.yearCreated}
            </p>
          )}
          {artwork.description && (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              {artwork.description}
            </p>
          )}

          <div className="mt-10 space-y-10 border-t border-rule pt-8">
            {groups.size === 0 ? (
              <p className="font-data text-xs text-muted">Nothing available in this piece yet.</p>
            ) : (
              [...groups.values()].map((group) => (
                <div key={group.typeName}>
                  <p className="eyebrow">{group.typeName}</p>
                  <div className="mt-5 space-y-8">
                    {group.products.map((product) => {
                      // Prints and posters are the artwork itself — the hero
                      // image already shows them, so no mockups exist and
                      // none is shown here. Apparel gets its default shot.
                      const defaultMockup = productMockups(
                        artwork.assets,
                        product.variants.map((v) => v.providerVariantId)
                      )[0];

                      return (
                        <div key={product.id} className="flex gap-4">
                          {defaultMockup?.url && (
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-surface">
                              <Image
                                src={defaultMockup.url}
                                alt={defaultMockup.altText ?? product.name}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {group.products.length > 1 && (
                              <p className="text-sm font-medium">{product.name}</p>
                            )}
                            <AddToBag
                              productId={product.id}
                              basePriceCents={product.retailPriceCents}
                              variants={product.variants.map((v) => ({
                                id: v.id,
                                size: v.size,
                                color: v.color,
                                colorHex: v.colorHex,
                                priceOverrideCents: v.priceOverrideCents,
                              }))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
