import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Unsubscribe", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe via an unguessable token. No login, no confirmation
 * step — making people work to leave is how you end up marked as spam.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let done = false;
  if (token) {
    const result = await db.newsletterSubscriber.updateMany({
      where: { unsubscribeToken: token, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
    done = result.count > 0;
  }

  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
      <h1 className="font-display text-2xl font-medium tracking-tight">
        {done ? "You're unsubscribed" : "Already unsubscribed"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {done
          ? "You won't hear from Mello Studio again unless you sign up another time."
          : "That link has already been used, or the address isn't on the list."}
      </p>
      <Link href="/" className="btn-ghost mt-8 inline-block">Back to the site</Link>
    </section>
  );
}
