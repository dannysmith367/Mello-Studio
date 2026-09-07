type AssetLike = {
  kind: string;
  url: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Never serve an ORIGINAL to the browser. Prefer WEB, fall back to THUMBNAIL.
 *
 * Pass `preferMockup` for a product whose type is APPAREL — a garment's
 * artwork file is just the flat print, not what the customer is buying.
 * Prints show the artwork itself, so they never pass this.
 */
export function displayAsset<T extends AssetLike>(
  assets: T[],
  { preferMockup = false }: { preferMockup?: boolean } = {}
): T | null {
  if (preferMockup) {
    const mockup = assets.find((a) => a.kind === "MOCKUP");
    if (mockup) return mockup;
  }
  return (
    assets.find((a) => a.kind === "WEB") ??
    assets.find((a) => a.kind === "THUMBNAIL") ??
    null
  );
}

export function thumbnailAsset<T extends AssetLike>(
  assets: T[],
  { preferMockup = false }: { preferMockup?: boolean } = {}
): T | null {
  if (preferMockup) {
    const mockup = assets.find((a) => a.kind === "MOCKUP");
    if (mockup) return mockup;
  }
  return (
    assets.find((a) => a.kind === "THUMBNAIL") ??
    assets.find((a) => a.kind === "WEB") ??
    null
  );
}

type MockupAsset = AssetLike & {
  sortOrder: number;
  providerVariantIds: string[];
  sourceProductId: string | null;
};

/**
 * All mockups belonging to one product, in Printify's order (default shot
 * first). Scoped by `sourceProductId` — set on import/re-sync — since an
 * artwork can carry more than one product's mockups and Printify variant
 * ids are only unique within one blueprint+provider combo: two unrelated
 * products on the same artwork can share the same variant id, so matching
 * on that alone can hand one product's shot to another. Mockups from
 * before `sourceProductId` existed (null) fall back to the old
 * variant-id matching so those old imports keep working.
 */
export function productMockups<T extends MockupAsset>(
  assets: T[],
  productId: string,
  providerVariantIds: (string | null)[]
): T[] {
  const mockups = assets.filter((a) => a.kind === "MOCKUP");

  const own = mockups.filter((m) => m.sourceProductId === productId);
  if (own.length > 0) {
    return [...own].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const legacy = mockups.filter((m) => m.sourceProductId === null);
  const ids = new Set(providerVariantIds.filter((id): id is string => Boolean(id)));
  const scoped =
    ids.size > 0
      ? legacy.filter(
          (m) => m.providerVariantIds.length === 0 || m.providerVariantIds.some((id) => ids.has(id))
        )
      : legacy;

  return [...scoped].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Narrows a product's mockup gallery to the shots depicting one specific
 * variant (e.g. the colour just picked). Falls back to the full gallery
 * when nothing matches that variant, rather than showing nothing. Only
 * needs the variant tagging, not a full asset shape, since by this point
 * the gallery may already have been mapped down to plain {url, altText}.
 */
export function mockupsForVariant<T extends { providerVariantIds: string[] }>(
  mockups: T[],
  providerVariantId: string | null
): T[] {
  if (!providerVariantId) return mockups;
  const matched = mockups.filter((m) => m.providerVariantIds.includes(providerVariantId));
  return matched.length > 0 ? matched : mockups;
}
