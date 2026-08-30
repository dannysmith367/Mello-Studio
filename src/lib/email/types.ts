/**
 * Provider-agnostic email contract.
 *
 * Nothing outside /lib/email should know which service sends mail, the same
 * way nothing outside /lib/fulfillment knows about Printify.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailProvider {
  readonly isConfigured: boolean;
  send(message: EmailMessage): Promise<{ id: string }>;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
    this.name = "EmailNotConfiguredError";
  }
}
