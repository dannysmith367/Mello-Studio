import { InquiryForm } from "./InquiryForm";

export const metadata = {
  title: "Commissions",
  description:
    "Commission original work from Mello — painting, woodburning, glass etching, tattoo design and mixed media.",
};

const STEPS = [
  ["Enquiry", "Tell Mello what you have in mind. No detail is too rough."],
  ["Conversation", "A back-and-forth about subject, size, medium and where it will live."],
  ["Quote", "A price and a timeline, agreed before any work starts."],
  ["Work", "Progress shared as it goes, with room to adjust."],
  ["Delivery", "The finished piece, shipped or handed over."],
];

export default function CommissionsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="eyebrow">Original work</p>
      <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
        Commissions
      </h1>
      <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
        Mello takes on a small number of commissions across painting, woodburning,
        glass etching, tattoo design and mixed media. Every piece starts as a
        conversation rather than a menu.
      </p>

      <ol className="mt-12 border-t border-rule">
        {STEPS.map(([title, detail], index) => (
          <li key={title} className="flex gap-5 border-b border-rule py-5">
            <span className="font-data text-[0.625rem] text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted">{detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-16 font-display text-2xl font-medium tracking-tight">
        Start an enquiry
      </h2>
      <InquiryForm />
    </section>
  );
}
