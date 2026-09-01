import Link from "next/link";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { configuredProviders } from "@/lib/fulfillment";

export const metadata = { title: "Overview" };

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <div className="border border-rule bg-surface p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2.5 font-display text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block hover:border-muted">{body}</Link> : body;
}

export default async function AdminOverview() {
  const [artworkCount, productCount, publishedCount, orderCount, revenue, newInquiries] =
    await Promise.all([
      db.artwork.count(),
      db.product.count(),
      db.product.count({ where: { published: true } }),
      db.order.count(),
      db.order.aggregate({
        _sum: { totalCents: true },
        where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED", "REFUNDED"] } },
      }),
      db.commissionInquiry.count({ where: { status: "NEW" } }),
    ]);

  const providers = configuredProviders();

  return (
    <>
      <h1 className="font-display text-2xl font-medium tracking-tight">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Artwork" value={String(artworkCount)} href="/admin/artwork" />
        <Stat label="Products" value={String(productCount)} href="/admin/products" />
        <Stat label="Published" value={String(publishedCount)} />
        <Stat label="Orders" value={String(orderCount)} href="/admin/orders" />
        <Stat label="Revenue" value={formatCents(revenue._sum.totalCents ?? 0)} />
        <Stat label="New enquiries" value={String(newInquiries)} href="/admin/inquiries" />
      </div>

      {/* Honest status, so it's never unclear what is actually wired up. */}
      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-tight">
          Integration status
        </h2>
        <dl className="mt-4 divide-y divide-rule border-y border-rule font-data text-[0.6875rem] uppercase tracking-[0.14em]">
          {[
            ["Database", "Connected"],
            ["Artwork upload", "Connected"],
            ["Cart", "Connected"],
            [
              "Stripe",
              process.env.STRIPE_SECRET_KEY
                ? process.env.STRIPE_WEBHOOK_SECRET
                  ? "Connected"
                  : "Key set — webhook secret missing"
                : "No key set",
            ],
            [
              "Printify",
              providers.includes("PRINTIFY") ? "Connected" : "No credentials set",
            ],
            [
              "Email",
              process.env.RESEND_API_KEY && process.env.EMAIL_FROM
                ? "Connected"
                : "No provider configured",
            ],
          ].map(([label, status]) => (
            <div key={label} className="flex justify-between gap-4 py-3">
              <dt className="text-muted">{label}</dt>
              <dd className={status === "Connected" ? "text-bone" : "text-muted"}>
                {status}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
