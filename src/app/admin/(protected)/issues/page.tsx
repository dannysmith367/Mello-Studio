import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { updateIssue } from "./actions";

export const metadata = { title: "Order issues" };
export const dynamic = "force-dynamic";

const STATUSES = [
  "NEW",
  "CLAIM_FILED",
  "REPLACEMENT_ORDERED",
  "REFUNDED",
  "RESOLVED",
  "DECLINED",
] as const;
type Status = (typeof STATUSES)[number];

function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

const STATUS_LABEL: Record<Status, string> = {
  NEW: "New",
  CLAIM_FILED: "Claim filed",
  REPLACEMENT_ORDERED: "Replacement ordered",
  REFUNDED: "Refunded",
  RESOLVED: "Resolved",
  DECLINED: "Declined",
};

const KIND_LABEL: Record<string, string> = {
  DEFECT: "Defect",
  DAMAGED_IN_TRANSIT: "Damaged in transit",
  NOT_RECEIVED: "Not received",
  WRONG_ITEM: "Wrong item",
  OTHER: "Other",
};

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && isStatus(status) ? status : undefined;

  const [issues, newCount] = await Promise.all([
    db.orderIssue.findMany({
      where: filter ? { status: filter } : undefined,
      orderBy: { createdAt: "desc" },
      include: { order: { include: { items: true } } },
    }),
    db.orderIssue.count({ where: { status: "NEW" } }),
  ]);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">Order issues</h1>
        {newCount > 0 && (
          <span className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-bone">
            {newCount} new
          </span>
        )}
      </div>

      {!process.env.STUDIO_INBOX && (
        <p className="mt-4 border border-rule bg-surface px-4 py-3 font-data text-[0.625rem] leading-relaxed text-muted">
          STUDIO_INBOX is not set, so no alert email is sent when an issue is
          reported. Check this page regularly until it is configured.
        </p>
      )}

      <nav className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-data text-[0.625rem] uppercase tracking-[0.14em]">
        <Link href="/admin/issues" className={!filter ? "text-bone" : "text-muted hover:text-bone"}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/issues?status=${s}`}
            className={filter === s ? "text-bone" : "text-muted hover:text-bone"}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>

      {issues.length === 0 ? (
        <div className="mt-6 border border-rule bg-surface px-6 py-16 text-center">
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            {filter ? `No issues with status "${STATUS_LABEL[filter]}"` : "No issues yet"}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {issues.map((issue) => (
            <li key={issue.id} className="border border-rule bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {issue.orderNumber}
                    {!issue.order && (
                      <span className="ml-2 font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                        unmatched
                      </span>
                    )}
                  </p>
                  <a
                    href={`mailto:${issue.email}`}
                    className="font-data text-[0.6875rem] text-muted hover:text-bone"
                  >
                    {issue.email}
                  </a>
                </div>
                <span className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                  {KIND_LABEL[issue.kind] ?? issue.kind} ·{" "}
                  {issue.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {issue.order && (
                <div className="mt-4 border-t border-rule pt-4">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow">Order {issue.order.orderNumber}</p>
                    <Link
                      href={`/admin/orders`}
                      className="font-data text-[0.625rem] text-muted hover:text-bone"
                    >
                      View orders →
                    </Link>
                  </div>
                  <ul className="mt-2 space-y-1 font-data text-xs text-muted">
                    {issue.order.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4">
                        <span className="truncate">
                          {item.productName}
                          {item.variantLabel ? ` — ${item.variantLabel}` : ""} × {item.quantity}
                        </span>
                        <span className="shrink-0">{formatCents(item.lineTotalCents)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-4 whitespace-pre-wrap border-t border-rule pt-4 text-sm leading-relaxed text-muted">
                {issue.description}
              </p>

              {issue.photoUrls.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {issue.photoUrls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block h-16 w-16 overflow-hidden border border-rule bg-void"
                    >
                      <Image src={url} alt={`Photo ${i + 1}`} fill sizes="64px" className="object-cover" />
                    </a>
                  ))}
                </div>
              )}

              <form action={updateIssue} className="mt-5 flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={issue.id} />
                <div>
                  <label className="eyebrow block" htmlFor={`status-${issue.id}`}>
                    Status
                  </label>
                  <select
                    id={`status-${issue.id}`}
                    name="status"
                    defaultValue={issue.status}
                    className="mt-1.5 border border-rule bg-transparent px-2.5 py-2 text-sm focus:border-iris focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-48 flex-1">
                  <label className="eyebrow block" htmlFor={`notes-${issue.id}`}>
                    Notes
                  </label>
                  <input
                    id={`notes-${issue.id}`}
                    name="internalNotes"
                    defaultValue={issue.internalNotes ?? ""}
                    className="mt-1.5 w-full border border-rule bg-transparent px-2.5 py-2 text-sm focus:border-iris focus:outline-none"
                  />
                </div>
                <button className="btn-ghost">Save</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
