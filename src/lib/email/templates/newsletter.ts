import { escapeHtml, heading, paragraph, shell } from "./layout";
import type { EmailMessage } from "../types";

export function newsletterWelcome(to: string, unsubscribeUrl: string): EmailMessage {
  const body = `
    ${heading("You're on the list")}
    ${paragraph("You'll hear from Mello Studio when a piece is finished or an edition opens. Not often, and never for the sake of it.")}
    <p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#8A8A8F;">
      <a href="${unsubscribeUrl}" style="color:#8A8A8F;">Unsubscribe</a>
    </p>
  `;

  return {
    to,
    subject: "You're on the list — Mello Studio",
    html: shell(body, "You'll hear from Mello Studio when new work lands."),
    text: `You're on the list.\n\nYou'll hear from Mello Studio when a piece is finished or an edition opens.\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
}

/** Turns plain-text paragraphs (blank-line separated) into `<p>` tags. */
function paragraphsToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => paragraph(escapeHtml(block).replace(/\n/g, "<br>")))
    .join("");
}

export function newsletterCampaign(
  to: string,
  subject: string,
  body: string,
  unsubscribeUrl: string
): EmailMessage {
  const html = `
    ${heading(subject)}
    ${paragraphsToHtml(body)}
    <p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#8A8A8F;">
      <a href="${unsubscribeUrl}" style="color:#8A8A8F;">Unsubscribe</a>
    </p>
  `;

  return {
    to,
    subject,
    html: shell(html, subject),
    text: `${body}\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
}
