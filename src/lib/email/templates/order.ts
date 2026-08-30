import { formatCents } from "@/lib/money";
import { escapeHtml, heading, paragraph, shell } from "./layout";
import type { EmailMessage } from "../types";

type OrderLine = {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  lineTotalCents: number;
};

type OrderPayload = {
  orderNumber: string;
  email: string;
  items: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

function lineRows(items: OrderLine[]): string {
  return items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #2A2A2E;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#ECE1D2;">
          ${escapeHtml(item.productName)}
          ${item.variantLabel ? `<br><span style="font-size:12px;color:#8A8A8F;">${escapeHtml(item.variantLabel)} &times;${item.quantity}</span>` : `<br><span style="font-size:12px;color:#8A8A8F;">&times;${item.quantity}</span>`}
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #2A2A2E;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#ECE1D2;white-space:nowrap;">
          ${formatCents(item.lineTotalCents)}
        </td>
      </tr>`
    )
    .join("");
}

function totalRow(label: string, value: string, bold = false) {
  return `<tr>
    <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${bold ? "#ECE1D2" : "#8A8A8F"};">${escapeHtml(label)}</td>
    <td align="right" style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#ECE1D2;">${value}</td>
  </tr>`;
}

export function orderConfirmation(order: OrderPayload): EmailMessage {
  const body = `
    ${heading("Order confirmed")}
    ${paragraph(`Thank you. Mello is getting your order ready — you'll hear from us again when it ships.`)}
    ${paragraph(`Order <strong style="color:#ECE1D2;">${escapeHtml(order.orderNumber)}</strong>`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
      ${lineRows(order.items)}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
      ${totalRow("Subtotal", formatCents(order.subtotalCents))}
      ${order.shippingCents > 0 ? totalRow("Shipping", formatCents(order.shippingCents)) : ""}
      ${order.taxCents > 0 ? totalRow("Tax", formatCents(order.taxCents)) : ""}
      ${totalRow("Total", formatCents(order.totalCents), true)}
    </table>
  `;

  const text = [
    `Order confirmed — ${order.orderNumber}`,
    "",
    ...order.items.map(
      (i) =>
        `${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} x${i.quantity} — ${formatCents(i.lineTotalCents)}`
    ),
    "",
    `Subtotal: ${formatCents(order.subtotalCents)}`,
    order.shippingCents > 0 ? `Shipping: ${formatCents(order.shippingCents)}` : "",
    order.taxCents > 0 ? `Tax: ${formatCents(order.taxCents)}` : "",
    `Total: ${formatCents(order.totalCents)}`,
    "",
    "Mello Studio",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: order.email,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: shell(body, `Your Mello Studio order ${order.orderNumber} is confirmed.`),
    text,
  };
}

export function shippingNotification(payload: {
  orderNumber: string;
  email: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}): EmailMessage {
  const tracking = payload.trackingNumber
    ? paragraph(
        `${escapeHtml(payload.carrier ?? "Carrier")} &middot; <strong style="color:#ECE1D2;">${escapeHtml(payload.trackingNumber)}</strong>`
      )
    : "";

  const link = payload.trackingUrl
    ? `<p style="margin:0 0 16px;"><a href="${payload.trackingUrl}" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#ECE1D2;">Track your parcel</a></p>`
    : "";

  const body = `
    ${heading("Your order has shipped")}
    ${paragraph(`Order <strong style="color:#ECE1D2;">${escapeHtml(payload.orderNumber)}</strong> is on its way.`)}
    ${tracking}
    ${link}
  `;

  const text = [
    `Your order ${payload.orderNumber} has shipped.`,
    payload.carrier && payload.trackingNumber
      ? `${payload.carrier}: ${payload.trackingNumber}`
      : "",
    payload.trackingUrl ?? "",
    "",
    "Mello Studio",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    to: payload.email,
    subject: `Shipped — ${payload.orderNumber}`,
    html: shell(body, `Order ${payload.orderNumber} is on its way.`),
    text,
  };
}
