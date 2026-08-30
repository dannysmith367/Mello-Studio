"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureCartSessionId, getCartSessionId } from "./session";

const MAX_PER_LINE = 25;

const AddInput = z.object({
  productId: z.string().min(1).max(60),
  variantId: z.string().min(1).max(60),
  quantity: z.coerce.number().int().min(1).max(MAX_PER_LINE).default(1),
});

export type CartActionResult = { error?: string; added?: boolean };

/**
 * Adds a variant to the cart.
 *
 * Note what is *not* accepted: a price. The client sends an id and a
 * quantity, and everything about cost is looked up server-side at checkout.
 */
export async function addToCart(raw: unknown): Promise<CartActionResult> {
  const parsed = AddInput.safeParse(raw);
  if (!parsed.success) return { error: "Something went wrong. Try again." };

  const { productId, variantId, quantity } = parsed.data;

  const variant = await db.productVariant.findFirst({
    where: { id: variantId, productId, active: true, product: { published: true } },
  });
  if (!variant) return { error: "That option isn't available." };

  const sessionId = await ensureCartSessionId();
  const cart = await db.cart.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
  });

  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(existing.quantity + quantity, MAX_PER_LINE) },
    });
  } else {
    await db.cartItem.create({
      data: { cartId: cart.id, productId, variantId, quantity },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { added: true };
}

const QuantityInput = z.object({
  itemId: z.string().min(1).max(60),
  quantity: z.coerce.number().int().min(0).max(MAX_PER_LINE),
});

export async function setQuantity(raw: unknown): Promise<CartActionResult> {
  const parsed = QuantityInput.safeParse(raw);
  if (!parsed.success) return { error: "Invalid quantity." };

  const { itemId, quantity } = parsed.data;
  const sessionId = await getCartSessionId();
  if (!sessionId) return { error: "Your cart expired." };

  // Scope by session so an item id alone cannot mutate someone else's cart.
  const item = await db.cartItem.findFirst({
    where: { id: itemId, cart: { sessionId } },
  });
  if (!item) return { error: "That item is no longer in your bag." };

  if (quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return {};
}

export async function removeFromCart(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId"));
  const sessionId = await getCartSessionId();
  if (!sessionId) return;

  await db.cartItem.deleteMany({ where: { id: itemId, cart: { sessionId } } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

/** Drops lines that are no longer purchasable, so checkout can proceed. */
export async function removeUnavailable(): Promise<void> {
  const sessionId = await getCartSessionId();
  if (!sessionId) return;

  await db.cartItem.deleteMany({
    where: {
      cart: { sessionId },
      OR: [{ product: { published: false } }, { variant: { active: false } }],
    },
  });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
