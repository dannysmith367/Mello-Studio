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
