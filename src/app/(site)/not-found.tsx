import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display font-medium tracking-tight text-3xl">That piece isn&rsquo;t here</h1>
      <p className="mt-4 text-sm text-muted">
        It may have been unpublished, or the link may be wrong.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-block border border-bone px-6 py-3 font-data text-xs uppercase tracking-[0.12em] hover:bg-bone hover:text-void"
      >
        Browse the shop
      </Link>
    </section>
  );
}
