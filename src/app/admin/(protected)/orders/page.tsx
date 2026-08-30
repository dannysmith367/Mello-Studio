import Link from "next/link";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { retryFulfillment } from "./actions";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  FULFILLMENT_PENDING: "Fulfilment pending",
  SUBMITTED_TO_FULFILLMENT: "Sent to printer",
  IN_PRODUCTION: "In production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function OrdersPage() {
  const orders = await db.order.findMany({
    where: { status: { not: "PENDING_PAYMENT" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: true,
      shippingAddress: true,
      fulfillmentOrders: { include: { shipments: true } },
    },
  });

  const failed = orders.filter((o) =>
    o.fulfillmentOrders.some((f) => f.status === "FAILED")
  );

  return (
    <>
      <h1 className="font-display text-2xl font-medium tracking-tight">Orders</h1>

      {failed.length > 0 && (
        <p className="mt-4 border border-iris/40 bg-surface px-4 py-3 font-data text-[0.625rem] leading-relaxed text-muted">
          {failed.length} order{failed.length === 1 ? " has" : "s have"} a failed
          fulfilment submission. The payment went through — these need retrying.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="mt-6 border border-rule bg-surface px-6 py-16 text-center">
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            No orders yet
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-rule bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="font-data text-sm">{order.orderNumber}</p>
                  <p className="mt-1 font-data text-[0.625rem] text-muted">
                    {order.email || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-data text-sm">{formatCents(order.totalCents)}</p>
                  <p className="mt-1 font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </p>
                </div>
              </div>

              <ul className="mt-4 border-t border-rule pt-3 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 py-1">
                    <span className="truncate text-muted">
                      {item.productName}
                      {item.variantLabel ? ` · ${item.variantLabel}` : ""} ×{item.quantity}
                    </span>
                    <span className="shrink-0 font-data text-xs">
                      {formatCents(item.lineTotalCents)}
                    </span>
                  </li>
                ))}
              </ul>

              {order.shippingAddress && (
                <p className="mt-3 font-data text-[0.625rem] leading-relaxed text-muted">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName},{" "}
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
                  {order.shippingAddress.city} {order.shippingAddress.region}{" "}
                  {order.shippingAddress.postalCode} {order.shippingAddress.country}
                </p>
              )}

              {order.fulfillmentOrders.map((fulfillment) => (
                <div key={fulfillment.id} className="mt-3 border-t border-rule pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                      {fulfillment.provider} · {fulfillment.status}
                      {fulfillment.providerOrderId ? ` · ${fulfillment.providerOrderId}` : ""}
                    </p>
                    {fulfillment.status === "FAILED" && (
                      <form action={retryFulfillment}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="btn-ghost">Retry</button>
                      </form>
                    )}
                  </div>

                  {fulfillment.lastError && (
                    <p className="mt-2 font-data text-[0.625rem] text-iris">
                      {fulfillment.lastError}
                    </p>
                  )}

                  {fulfillment.shipments.map((shipment) => (
                    <p key={shipment.id} className="mt-2 font-data text-[0.625rem] text-muted">
                      {shipment.carrier} {shipment.trackingNumber}
                      {shipment.trackingUrl && (
                        <Link
                          href={shipment.trackingUrl}
                          className="ml-2 text-bone hover:underline"
                        >
                          Track
                        </Link>
                      )}
                    </p>
                  ))}
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
