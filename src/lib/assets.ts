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

type MockupAsset = AssetLike & { sortOrder: number; providerVariantIds: string[] };

/**
 * All mockups belonging to one product, in Printify's order (default shot
 * first). Scoped to the product's own variants where that mapping exists —
 * an artwork can carry more than one product's mockups — and falls back to
 * every mockup on the artwork when no variant is tagged (e.g. a
 * manually-created product, or mockups imported before this existed).
 */
export function productMockups<T extends MockupAsset>(
  assets: T[],
  providerVariantIds: (string | null)[]
): T[] {
  const mockups = assets.filter((a) => a.kind === "MOCKUP");
  const ids = new Set(providerVariantIds.filter((id): id is string => Boolean(id)));

  const scoped =
    ids.size > 0
      ? mockups.filter(
          (m) => m.providerVariantIds.length === 0 || m.providerVariantIds.some((id) => ids.has(id))
        )
      : mockups;

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
