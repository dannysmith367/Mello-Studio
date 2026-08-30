"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitInquiry, type InquiryState } from "./actions";

const field =
  "mt-2 w-full border border-rule bg-transparent px-3 py-2.5 text-sm placeholder:text-muted/50 focus:border-iris focus:outline-none";

const BUDGETS = ["Under $500", "$500 – $1,500", "$1,500 – $4,000", "$4,000+", "Not sure yet"];
const TIMELINES = ["No rush", "Within 3 months", "Within a month", "Specific date"];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-solid mt-8 w-full sm:w-auto">
      {pending ? "Sending…" : "Send enquiry"}
    </button>
  );
}

export function InquiryForm() {
  const [state, formAction] = useActionState<InquiryState, FormData>(submitInquiry, {});

  if (state.sent) {
    return (
      <div className="mt-10 border border-rule bg-surface p-8">
        <p className="font-display text-xl font-medium tracking-tight">Enquiry received</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Mello will be in touch. Commissions usually start with a conversation
          about what you have in mind before anything is quoted.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-10 max-w-xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="eyebrow block">Name</label>
          <input id="name" name="name" required className={field} />
        </div>
        <div>
          <label htmlFor="email" className="eyebrow block">Email</label>
          <input id="email" name="email" type="email" required className={field} />
        </div>
      </div>

      <label htmlFor="phone" className="eyebrow mt-5 block">Phone (optional)</label>
      <input id="phone" name="phone" type="tel" className={field} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="medium" className="eyebrow block">Medium</label>
          <input
            id="medium"
            name="medium"
            className={field}
            placeholder="Painting, woodburning, tattoo design…"
          />
        </div>
        <div>
          <label htmlFor="sizeNote" className="eyebrow block">Size</label>
          <input id="sizeNote" name="sizeNote" className={field} placeholder="24&quot; × 36&quot;, or unsure" />
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="budgetRange" className="eyebrow block">Budget</label>
          <select id="budgetRange" name="budgetRange" className={field} defaultValue="">
            <option value="">Prefer not to say</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className="eyebrow block">Timeline</label>
          <select id="timeline" name="timeline" className={field} defaultValue="">
            <option value="">Flexible</option>
            {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <label htmlFor="message" className="eyebrow mt-5 block">What do you have in mind?</label>
      <textarea
        id="message"
        name="message"
        rows={5}
        required
        className={field}
        placeholder="The subject, the feeling, where it will hang — whatever you have so far."
      />

      {/* Honeypot. Hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && (
        <p role="alert" className="mt-5 font-data text-xs text-iris">{state.error}</p>
      )}

      <Submit />
    </form>
  );
}
