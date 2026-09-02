export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <p className="eyebrow">Policy</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 font-data text-[0.6875rem] text-muted">Last updated {updated}</p>

      <div className="legal-copy mt-10 space-y-8 text-[0.9375rem] leading-[1.75] text-muted">
        {children}
      </div>
    </article>
  );
}
