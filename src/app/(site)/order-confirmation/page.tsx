import Link from "next/link";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

/**
 * Reached by redirect from Stripe. Deliberately read-only: arriving here
 * never marks anything paid. That happens in the webhook, which is the only
 * source that can be verified. If the webhook has not landed yet, this page
 * says the payment is still confirming rather than inventing a status.
 */
export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;

  const order = orderNumber
    ? await db.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
    : null;

  if (!order) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Order not found
        </h1>
        <p className="mt-3 text-sm text-muted">
          Check the link in your confirmation email, or get in touch.
        </p>
        <Link href="/shop" className="btn-ghost mt-8 inline-block">Back to the shop</Link>
      </section>
    );
  }

  const stillConfirming = order.status === "PENDING_PAYMENT";

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="eyebrow">{stillConfirming ? "Almost there" : "Thank you"}</p>
      <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {stillConfirming ? "Confirming your payment" : "Order confirmed"}
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {stillConfirming
          ? "Your payment is going through. This usually takes a few seconds — refresh in a moment."
          : "Mello is getting your order ready. You'll hear from us when it ships."}
      </p>

      <dl className="mt-8 border-y border-rule py-5 font-data text-xs">
        <div className="flex justify-between">
          <dt className="text-muted">Order</dt>
          <dd>{order.orderNumber}</dd>
        </div>
        {order.email && (
          <div className="mt-2 flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="truncate pl-3">{order.email}</dd>
          </div>
        )}
      </dl>

      <ul className="mt-6 divide-y divide-rule border-b border-rule">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm">{item.productName}</p>
              {item.variantLabel && (
                <p className="mt-0.5 font-data text-[0.625rem] text-muted">
                  {item.variantLabel} · ×{item.quantity}
                </p>
              )}
            </div>
            <p className="shrink-0 font-data text-sm">{formatCents(item.lineTotalCents)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2 font-data text-sm">
        {order.shippingCents > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{formatCents(order.shippingCents)}</dd>
          </div>
        )}
        {order.taxCents > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Tax</dt>
            <dd>{formatCents(order.taxCents)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-rule pt-2.5">
          <dt>Total</dt>
          <dd>{formatCents(order.totalCents)}</dd>
        </div>
      </dl>

      {!stillConfirming && order.email && (
        <p className="mt-8 font-data text-[0.625rem] leading-relaxed text-muted">
          A confirmation has been sent to {order.email}.
        </p>
      )}

      <Link href="/shop" className="btn-ghost mt-8 inline-block">Keep shopping</Link>
    </section>
  );
}
