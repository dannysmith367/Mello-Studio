import { db } from "@/lib/db";
import { ComposeForm } from "./ComposeForm";
import { resumeCampaign } from "./actions";

export const metadata = { title: "Newsletter" };

export default async function NewsletterAdminPage() {
  const [total, confirmed, unsubscribed, campaigns] = await Promise.all([
    db.newsletterSubscriber.count(),
    db.newsletterSubscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
    db.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <>
      <h1 className="font-display text-2xl font-medium tracking-tight">Newsletter</h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="border border-rule bg-surface p-5">
          <p className="eyebrow">Total subscribers</p>
          <p className="mt-2.5 font-display text-3xl font-medium tracking-tight">{total}</p>
        </div>
        <div className="border border-rule bg-surface p-5">
          <p className="eyebrow">Confirmed</p>
          <p className="mt-2.5 font-display text-3xl font-medium tracking-tight">{confirmed}</p>
        </div>
        <div className="border border-rule bg-surface p-5">
          <p className="eyebrow">Unsubscribed</p>
          <p className="mt-2.5 font-display text-3xl font-medium tracking-tight">{unsubscribed}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium tracking-tight">Compose</h2>
        <div className="mt-4">
          <ComposeForm recipientCount={confirmed} />
        </div>
      </section>

      {campaigns.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-lg font-medium tracking-tight">Past campaigns</h2>
          <div className="mt-4 overflow-x-auto border border-rule">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-rule bg-surface text-left font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                  <th className="px-3 py-2.5 font-normal">Subject</th>
                  <th className="px-3 py-2.5 font-normal">Sent</th>
                  <th className="px-3 py-2.5 font-normal">Status</th>
                  <th className="px-3 py-2.5 font-normal" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-rule last:border-0">
                    <td className="px-3 py-2.5 truncate">{campaign.subject}</td>
                    <td className="px-3 py-2.5 font-data text-xs text-muted">
                      {campaign.sentCount}
                    </td>
                    <td className="px-3 py-2.5 font-data text-[0.625rem] uppercase tracking-[0.14em]">
                      {campaign.completedAt ? "Complete" : "In progress"}
                    </td>
                    <td className="px-3 py-2.5">
                      {!campaign.completedAt && (
                        <form action={resumeCampaign}>
                          <input type="hidden" name="campaignId" value={campaign.id} />
                          <button className="font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted hover:text-bone">
                            Resume
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-lg font-medium tracking-tight">Subscribers</h2>
        <SubscriberList />
      </section>
    </>
  );
}

async function SubscriberList() {
  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  if (subscribers.length === 0) {
    return <p className="mt-4 font-data text-xs text-muted">No subscribers yet.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto border border-rule">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-rule bg-surface text-left font-data text-[0.625rem] uppercase tracking-[0.14em] text-muted">
            <th className="px-3 py-2.5 font-normal">Email</th>
            <th className="px-3 py-2.5 font-normal">Source</th>
            <th className="px-3 py-2.5 font-normal">Status</th>
            <th className="px-3 py-2.5 font-normal">Joined</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id} className="border-b border-rule last:border-0">
              <td className="px-3 py-2.5 truncate">{subscriber.email}</td>
              <td className="px-3 py-2.5 text-muted">{subscriber.source ?? "—"}</td>
              <td className="px-3 py-2.5 font-data text-[0.625rem] uppercase tracking-[0.14em]">
                {subscriber.unsubscribedAt
                  ? "Unsubscribed"
                  : subscriber.confirmedAt
                    ? "Confirmed"
                    : "Pending"}
              </td>
              <td className="px-3 py-2.5 font-data text-xs text-muted">
                {subscriber.createdAt.toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {subscribers.length === 200 && (
        <p className="border-t border-rule bg-surface px-3 py-2.5 font-data text-[0.625rem] text-muted">
          Showing the 200 most recent.
        </p>
      )}
    </div>
  );
}
