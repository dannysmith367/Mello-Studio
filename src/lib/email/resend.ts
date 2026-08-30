import "server-only";
import { EmailNotConfiguredError, type EmailMessage, type EmailProvider } from "./types";

/**
 * Resend, called over plain HTTP rather than through their SDK.
 *
 * One less dependency to audit and upgrade, and the request is four lines.
 */
export class ResendProvider implements EmailProvider {
  private get apiKey() {
    return process.env.RESEND_API_KEY;
  }
  private get from() {
    return process.env.EMAIL_FROM;
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.from);
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    if (!this.isConfigured) throw new EmailNotConfiguredError();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo ?? process.env.EMAIL_REPLY_TO ?? undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Resend returned ${response.status}: ${body.slice(0, 300)}`);
    }

    const json = (await response.json()) as { id?: string };
    return { id: json.id ?? "unknown" };
  }
}
