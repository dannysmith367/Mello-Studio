import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const CART_COOKIE = "mello_cart";
const CART_DAYS = 30;

/** Reads the cart session id without creating one. */
export async function getCartSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/**
 * Reads or creates the cart session id.
 *
 * Only call this from a server action or route handler — cookies cannot be
 * set during a server component render.
 */
export async function ensureCartSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const id = randomBytes(24).toString("base64url");
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_DAYS * 24 * 60 * 60,
  });
  return id;
}

export { CART_COOKIE };
