import { IssueForm } from "./IssueForm";

export const metadata = {
  title: "Support",
  description: "Report a problem with an order — damage, a defect, a misprint, or a missing package.",
};

export default function SupportPage() {
  const supabaseUrl = process.env.SUPABASE_URL ?? null;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? null;
  const bucket = process.env.SUPABASE_BUCKET_PUBLIC ?? "artwork-public";

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">Order help</p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
        Report an issue
      </h1>
      <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
        Something wrong with an order — damaged, misprinted, defective, wrong,
        or never arrived? Tell us below and we&rsquo;ll sort it out. Defects,
        damage, and misprints reported within 30 days of delivery are replaced
        free, no need to ship anything back.
      </p>

      <IssueForm supabaseUrl={supabaseUrl} supabaseAnonKey={anonKey} bucket={bucket} />
    </section>
  );
}
