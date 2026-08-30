import "server-only";
import sharp from "sharp";

export const WEB_MAX_EDGE = 2000;
export const THUMB_MAX_EDGE = 700;

export type Derivative = {
  body: Buffer;
  width: number;
  height: number;
  mimeType: string;
};

export type SourceInfo = {
  width: number;
  height: number;
  format: string;
  hasAlpha: boolean;
};

export async function inspect(source: Buffer): Promise<SourceInfo> {
  const meta = await sharp(source).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? "unknown",
    hasAlpha: Boolean(meta.hasAlpha),
  };
}

/**
 * Builds the web-sized and thumbnail derivatives.
 *
 * The original is never modified or re-encoded — it stays in the private
 * bucket exactly as uploaded, because it is the only copy that can produce
 * a print file later.
 *
 * `withoutEnlargement` matters: a small upload stays small rather than being
 * upscaled into something that looks sharp on screen but isn't.
 */
export async function buildDerivatives(
  source: Buffer
): Promise<{ web: Derivative; thumb: Derivative }> {
  const [web, thumb] = await Promise.all([
    render(source, WEB_MAX_EDGE, 82),
    render(source, THUMB_MAX_EDGE, 76),
  ]);
  return { web, thumb };
}

async function render(
  source: Buffer,
  maxEdge: number,
  quality: number
): Promise<Derivative> {
  const pipeline = sharp(source, { failOn: "none" })
    .rotate() // honour EXIF orientation from phone photos
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .webp({ quality });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return { body: data, width: info.width, height: info.height, mimeType: "image/webp" };
}

/**
 * Rough print-size guidance from pixel dimensions. Printify recommends 300 DPI
 * for most products and accepts 150 for large-format items viewed at distance,
 * so this reports the largest print each file can honestly support.
 */
export function printCapability(width: number, height: number) {
  const shortEdge = Math.min(width, height);
  const longEdge = Math.max(width, height);
  return {
    at300dpi: { w: +(shortEdge / 300).toFixed(1), h: +(longEdge / 300).toFixed(1) },
    at150dpi: { w: +(shortEdge / 150).toFixed(1), h: +(longEdge / 150).toFixed(1) },
    megapixels: +((width * height) / 1_000_000).toFixed(1),
  };
}
