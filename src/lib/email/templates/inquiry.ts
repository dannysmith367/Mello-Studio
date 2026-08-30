import { escapeHtml, heading, paragraph, shell } from "./layout";
import type { EmailMessage } from "../types";

type Inquiry = {
  name: string;
  email: string;
  phone?: string | null;
  medium?: string | null;
  sizeNote?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  message: string;
};

/** Sent to the studio. Reply-to is the enquirer, so replying just works. */
export function inquiryAlert(inquiry: Inquiry, to: string): EmailMessage {
  const rows = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone],
    ["Medium", inquiry.medium],
    ["Size", inquiry.sizeNote],
    ["Budget", inquiry.budgetRange],
    ["Timeline", inquiry.timeline],
  ]
    .filter(([, value]) => Boolean(value))
    .map(
      ([label, value]) =>
        `<tr><td style="padding:5px 12px 5px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#8A8A8F;">${escapeHtml(String(label))}</td><td style="padding:5px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#ECE1D2;">${escapeHtml(String(value))}</td></tr>`
    )
    .join("");

  const body = `
    ${heading("New commission enquiry")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">${rows}</table>
    <div style="border-top:1px solid #2A2A2E;padding-top:16px;">
      ${paragraph(escapeHtml(inquiry.message).replace(/\n/g, "<br>"))}
    </div>
  `;

  return {
    to,
    replyTo: inquiry.email,
    subject: `Commission enquiry — ${inquiry.name}`,
    html: shell(body, `${inquiry.name} is asking about a commission.`),
    text: `New commission enquiry\n\nFrom: ${inquiry.name} <${inquiry.email}>\n\n${inquiry.message}`,
  };
}

/** Sent to the enquirer, so they know it arrived. */
export function inquiryAcknowledgement(inquiry: Inquiry): EmailMessage {
  const body = `
    ${heading("Your enquiry has arrived")}
    ${paragraph(`Thanks for getting in touch about a commission. Mello reads every enquiry personally and will reply soon.`)}
    ${paragraph(`Commissions usually start with a conversation about what you have in mind before anything is quoted, so there's nothing to decide yet.`)}
  `;

  return {
    to: inquiry.email,
    subject: "Your commission enquiry — Mello Studio",
    html: shell(body, "Mello has your commission enquiry."),
    text: "Thanks for getting in touch about a commission. Mello reads every enquiry personally and will reply soon.\n\nMello Studio",
  };
}
