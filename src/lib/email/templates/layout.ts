/**
 * Email shell.
 *
 * Table-based with inline styles, because email clients are twenty years
 * behind browsers — Outlook still ignores most CSS in a <style> block, and
 * flexbox and CSS variables are unusable here. This is deliberately not how
 * the rest of the site is built.
 */
export function shell(bodyHtml: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0B;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0B;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td style="padding-bottom:28px;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#ECE1D2;">
              Mello Studio
            </td>
          </tr>
          <tr><td style="border-top:1px solid #2A2A2E;padding-top:28px;">${bodyHtml}</td></tr>
          <tr>
            <td style="padding-top:36px;border-top:1px solid #2A2A2E;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#8A8A8F;">
              Mello Studio — original work, made by hand
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const heading = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:500;line-height:1.25;color:#ECE1D2;">${escapeHtml(text)}</h1>`;

export const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#8A8A8F;">${text}</p>`;

export const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="background-color:#ECE1D2;"><a href="${href}" style="display:inline-block;padding:12px 24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#0A0A0B;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;
