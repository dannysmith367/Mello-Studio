import { escapeHtml, heading, paragraph, shell } from "./layout";
import type { EmailMessage } from "../types";

type IssueReport = {
  orderNumber: string;
  email: string;
  kind: string;
  description: string;
  photoUrls: string[];
};

const KIND_LABEL: Record<string, string> = {
  DEFECT: "Defect",
  DAMAGED_IN_TRANSIT: "Damaged in transit",
  NOT_RECEIVED: "Not received",
  WRONG_ITEM: "Wrong item",
  OTHER: "Other",
};

/** Sent to the studio. Reply-to is the customer, so replying just works. */
export function orderIssueAlert(issue: IssueReport, to: string): EmailMessage {
  const rows = [
    ["Order", issue.orderNumber],
    ["Email", issue.email],
    ["Issue", KIND_LABEL[issue.kind] ?? issue.kind],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:5px 12px 5px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#8A8A8F;">${escapeHtml(String(label))}</td><td style="padding:5px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#ECE1D2;">${escapeHtml(String(value))}</td></tr>`
    )
    .join("");

  const photoLinks =
    issue.photoUrls.length > 0
      ? paragraph(
          issue.photoUrls
            .map(
              (url, i) =>
                `<a href="${escapeHtml(url)}" style="color:#ECE1D2;">Photo ${i + 1}</a>`
            )
            .join(" &middot; ")
        )
      : "";

  const body = `
    ${heading("New order issue reported")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">${rows}</table>
    <div style="border-top:1px solid #2A2A2E;padding-top:16px;">
      ${paragraph(escapeHtml(issue.description).replace(/\n/g, "<br>"))}
      ${photoLinks}
    </div>
  `;

  return {
    to,
    replyTo: issue.email,
    subject: `Order issue — ${issue.orderNumber}`,
    html: shell(body, `${issue.email} reported an issue with order ${issue.orderNumber}.`),
    text: `New order issue\n\nOrder: ${issue.orderNumber}\nFrom: ${issue.email}\nIssue: ${KIND_LABEL[issue.kind] ?? issue.kind}\n\n${issue.description}${
      issue.photoUrls.length > 0 ? `\n\nPhotos:\n${issue.photoUrls.join("\n")}` : ""
    }`,
  };
}

/** Sent to the customer, so they know it arrived and know what to expect. */
export function orderIssueAcknowledgement(issue: IssueReport): EmailMessage {
  const body = `
    ${heading("Your report has arrived")}
    ${paragraph(`Thanks for letting us know about order ${escapeHtml(issue.orderNumber)}. We read every report personally and will follow up soon.`)}
    ${paragraph("If this turns out to be a defect, damage in transit, or a misprint, we'll send a free replacement once we've confirmed it from your photos — no need to ship anything back.")}
    ${paragraph("A quick note on what we can't cover: because every piece is made to order, we're not able to offer returns or exchanges for sizing or a change of mind.")}
  `;

  return {
    to: issue.email,
    subject: `We have your report — order ${issue.orderNumber}`,
    html: shell(body, "We have your order issue report."),
    text: `Thanks for letting us know about order ${issue.orderNumber}. We read every report personally and will follow up soon.\n\nIf this turns out to be a defect, damage in transit, or a misprint, we'll send a free replacement once we've confirmed it from your photos — no need to ship anything back.\n\nA quick note on what we can't cover: because every piece is made to order, we're not able to offer returns or exchanges for sizing or a change of mind.\n\nMello Studio`,
  };
}
