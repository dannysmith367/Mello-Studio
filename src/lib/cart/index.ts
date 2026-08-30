import "server-only";
import { db } from "@/lib/db";
import { getCartSessionId } from "./session";

export type CartLine = {
  id: string;
  quantity: number;
  productId: string;
  productSlug: string;
  productName: string;
  typeName: string;
  variantId: string;
  variantLabel: string | null;
  sku: string;
  imageUrl: string | null;
  unitPriceCents: number;
  lineTotalCents: number;
  /** Set when the product or variant is no longer purchasable. */
  unavailable: string | null;
};

export type CartSummary = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  hasUnavailable: boolean;
};

const EMPTY: CartSummary = {
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  hasUnavailable: false,
};

function variantLabel(variant: { size: string | null; color: string | null }): string | null {
  const parts = [variant.color, variant.size].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : null;
}

/**
 * Builds the cart from the database.
 *
 * Prices are always resolved here from the product and variant records. The
 * browser never supplies a price, and nothing about a line item's cost is
 * stored in the cart — only quantity. That is what makes price tampering
 * structurally impossible rather than merely validated against.
 */
export async function getCart(): Promise<CartSummary> {
  const sessionId = await getCartSessionId();
  if (!sessionId) return EMPTY;

  const cart = await db.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: true,
          product: {
            include: {
              productType: true,
              artwork: { include: { assets: true } },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) return EMPTY;

  const lines: CartLine[] = cart.items.map((item) => {
    const unitPriceCents =
      item.variant.priceOverrideCents ?? item.product.retailPriceCents;

    let unavailable: string | null = null;
    if (!item.product.published) unavailable = "No longer available";
    else if (!item.variant.active) unavailable = "That option sold out";

    const thumb =
      item.product.artwork.assets.find((a) => a.kind === "THUMBNAIL") ??
      item.product.artwork.assets.find((a) => a.kind === "WEB");

    return {
      id: item.id,
      quantity: item.quantity,
      productId: item.productId,
      productSlug: item.product.slug,
      productName: item.product.name,
      typeName: item.product.productType.name,
      variantId: item.variantId,
      variantLabel: variantLabel(item.variant),
      sku: item.variant.sku,
      imageUrl: thumb?.url ?? null,
      unitPriceCents,
      lineTotalCents: unitPriceCents * item.quantity,
      unavailable,
    };
  });

  const purchasable = lines.filter((line) => !line.unavailable);

  return {
    lines,
    itemCount: purchasable.reduce((n, line) => n + line.quantity, 0),
    subtotalCents: purchasable.reduce((n, line) => n + line.lineTotalCents, 0),
    hasUnavailable: lines.some((line) => line.unavailable),
  };
}

/** Cheap count for the header badge. */
export async function getCartCount(): Promise<number> {
  const sessionId = await getCartSessionId();
  if (!sessionId) return 0;

  const result = await db.cartItem.aggregate({
    _sum: { quantity: true },
    where: { cart: { sessionId }, product: { published: true }, variant: { active: true } },
  });
  return result._sum.quantity ?? 0;
}
