import "server-only";
import { ResendProvider } from "./resend";
import type { EmailMessage, EmailProvider } from "./types";

export const email: EmailProvider = new ResendProvider();

/**
 * Sends without ever throwing.
 *
 * Email is a notification, not a transaction. A failed receipt must never
 * roll back a paid order or lose a commission enquiry, so failures are
 * logged and swallowed at the call site.
 */
export async function sendSafely(
  message: EmailMessage,
  context: string
): Promise<boolean> {
  if (!email.isConfigured) {
    console.warn(`[email] Skipped ${context} — no provider configured.`);
    return false;
  }

  try {
    await email.send(message);
    return true;
  } catch (error) {
    console.error(`[email] Failed to send ${context}:`, error);
    return false;
  }
}

export * from "./types";
