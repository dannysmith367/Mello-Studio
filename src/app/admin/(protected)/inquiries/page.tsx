import { db } from "@/lib/db";
import { updateInquiry } from "./actions";

export const metadata = { title: "Enquiries" };
export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "IN_CONVERSATION", "QUOTED", "ACCEPTED", "DECLINED", "CLOSED"] as const;

const LABEL: Record<string, string> = {
  NEW: "New",
  IN_CONVERSATION: "Talking",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CLOSED: "Closed",
};

export default async function InquiriesPage() {
  const inquiries = await db.commissionInquiry.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const newCount = inquiries.filter((i) => i.status === "NEW").length;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">
          Commission enquiries
        </h1>
        {newCount > 0 && (
          <span className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-bone">
            {newCount} new
          </span>
        )}
      </div>

      {!process.env.STUDIO_INBOX && (
        <p className="mt-4 border border-rule bg-surface px-4 py-3 font-data text-[0.625rem] leading-relaxed text-muted">
          STUDIO_INBOX is not set, so no alert email is sent when an enquiry
          arrives. Check this page regularly until it is configured.
        </p>
      )}

      {inquiries.length === 0 ? (
        <div className="mt-6 border border-rule bg-surface px-6 py-16 text-center">
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
            No enquiries yet
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="border border-rule bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{inquiry.name}</p>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="font-data text-[0.6875rem] text-muted hover:text-bone"
                  >
                    {inquiry.email}
                  </a>
                  {inquiry.phone && (
                    <span className="ml-3 font-data text-[0.6875rem] text-muted">
                      {inquiry.phone}
                    </span>
                  )}
                </div>
                <span className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                  {LABEL[inquiry.status]} ·{" "}
                  {inquiry.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 font-data text-[0.625rem] sm:grid-cols-4">
                {[
                  ["Medium", inquiry.medium],
                  ["Size", inquiry.sizeNote],
                  ["Budget", inquiry.budgetRange],
                  ["Timeline", inquiry.timeline],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="uppercase tracking-[0.14em] text-muted">{label}</dt>
                    <dd className="mt-1">{value || "—"}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 whitespace-pre-wrap border-t border-rule pt-4 text-sm leading-relaxed text-muted">
                {inquiry.message}
              </p>

              <form action={updateInquiry} className="mt-5 flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={inquiry.id} />
                <div>
                  <label className="eyebrow block" htmlFor={`status-${inquiry.id}`}>
                    Status
                  </label>
                  <select
                    id={`status-${inquiry.id}`}
                    name="status"
                    defaultValue={inquiry.status}
                    className="mt-1.5 border border-rule bg-transparent px-2.5 py-2 text-sm focus:border-iris focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-48 flex-1">
                  <label className="eyebrow block" htmlFor={`notes-${inquiry.id}`}>
                    Notes
                  </label>
                  <input
                    id={`notes-${inquiry.id}`}
                    name="adminNotes"
                    defaultValue={inquiry.adminNotes ?? ""}
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
