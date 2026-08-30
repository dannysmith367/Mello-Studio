type AssetLike = {
  kind: string;
  url: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
};

/** Never serve an ORIGINAL to the browser. Prefer WEB, fall back to THUMBNAIL. */
export function displayAsset<T extends AssetLike>(assets: T[]): T | null {
  return (
    assets.find((a) => a.kind === "WEB") ??
    assets.find((a) => a.kind === "THUMBNAIL") ??
    null
  );
}

export function thumbnailAsset<T extends AssetLike>(assets: T[]): T | null {
  return (
    assets.find((a) => a.kind === "THUMBNAIL") ??
    assets.find((a) => a.kind === "WEB") ??
    null
  );
}
