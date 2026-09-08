const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

const SIZE_ALIASES: Record<string, string> = {
  XXL: "2XL",
  "2X": "2XL",
  XXXL: "3XL",
  "3X": "3XL",
  XXXXL: "4XL",
  "4X": "4XL",
  XXXXXL: "5XL",
  "5X": "5XL",
};

function normalizeSize(size: string): string {
  const upper = size.trim().toUpperCase();
  return SIZE_ALIASES[upper] ?? upper;
}

/**
 * Orders sizes in garment order (XS…5XL) rather than alphabetically — SKU-
 * or Printify-derived ordering sorts "2XL" before "L" since it's really
 * sorting strings, not sizes. Recognises common alias spellings (XXL/2XL,
 * XXXL/3XL, ...) so those aren't treated as distinct, unranked sizes. A
 * size outside the known scale sorts after every known size, in its
 * original relative order, rather than being dropped.
 */
export function compareSizes(a: string | null | undefined, b: string | null | undefined): number {
  const rank = (size: string | null | undefined) => {
    if (!size) return Number.POSITIVE_INFINITY;
    const index = SIZE_ORDER.indexOf(normalizeSize(size));
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };
  return rank(a) - rank(b);
}

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort(compareSizes);
}
