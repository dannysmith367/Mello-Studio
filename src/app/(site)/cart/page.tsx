import Link from "next/link";
import { getCart } from "@/lib/cart";
import { removeUnavailable } from "@/lib/cart/actions";
import { formatCents } from "@/lib/money";
import { CartLines } from "@/components/CartLines";
import { CheckoutButton } from "@/components/CheckoutButton";
import { isStripeConfigured } from "@/lib/payments/stripe";
import { getShippingSettings, resolveShippingCents } from "@/lib/settings";

export const metadata = { title: "Bag" };

// The cart is per-visitor, so it can never be statically cached.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, shippingSettings] = await Promise.all([getCart(), getShippingSettings()]);
  const shippingCents = resolveShippingCents(cart.subtotalCents, shippingSettings);

  if (cart.lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted">Nothing in here yet.</p>
        <Link href="/shop" className="btn-ghost mt-8 inline-block">
          Browse the shop
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Bag</h1>

      <div className="mt-8">
        <CartLines lines={cart.lines} />
      </div>

      {cart.hasUnavailable && (
        <form action={removeUnavailable} className="mt-5">
          <p className="font-data text-[0.6875rem] leading-relaxed text-muted">
            Some items are no longer available and are not included in the total.
          </p>
          <button className="btn-ghost mt-3">Remove unavailable items</button>
        </form>
      )}

      <dl className="mt-8 space-y-2.5 border-b border-rule pb-6 font-data text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatCents(cart.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd className={shippingCents === 0 ? "text-bone" : "text-muted"}>
            {shippingCents === 0 ? "Free" : formatCents(shippingCents)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Tax</dt>
          <dd className="text-muted">Calculated at checkout</dd>
        </div>
      </dl>

      <CheckoutButton enabled={isStripeConfigured() && cart.subtotalCents > 0} />

      <p className="mt-3 font-data text-[0.625rem] leading-relaxed text-muted">
        Prices are re-checked on the server at checkout. Nothing about cost is
        taken from the browser.
      </p>

      <Link
        href="/shop"
        className="mt-8 inline-block font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted hover:text-bone"
      >
        ← Keep shopping
      </Link>
    </section>
  );
}
