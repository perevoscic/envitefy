/**
 * Resend integration for bulk/marketing emails (REST-only)
 * Uses direct HTTP calls to avoid optional peer deps in the SDK.
 */

import { createEmailTemplate } from "./email-template";

function assertApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is required to send emails");
  return key;
}

async function resendHttpSend(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = assertApiKey();

  const doSend = async (fromValue: string) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromValue,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, text } as const;
  };

  // First try with provided From
  const first = await doSend(params.from);
  if (first.ok) return;

  // If domain not verified, Resend returns 400/422. Retry with onboarding.
  const maybeDomainError = /domain|from address|verified/i.test(first.text || "");
  if (maybeDomainError || first.status === 400 || first.status === 422) {
    const fallbackFrom = process.env.RESEND_FROM_EMAIL || "Snap My Date <onboarding@resend.dev>";
    const second = await doSend(fallbackFrom);
    if (second.ok) return;
    throw new Error(`Resend HTTP ${second.status}: ${second.text || "send failed"}`);
  }

  throw new Error(`Resend HTTP ${first.status}: ${first.text || "send failed"}`);
}

export interface BulkEmailParams {
  subject: string;
  body: string; // HTML content for email body
  fromEmail?: string; // defaults to SES_FROM_EMAIL_NO_REPLY or RESEND_FROM_EMAIL
  recipients: Array<{
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }>;
  buttonText?: string;
  buttonUrl?: string;
}

export interface BulkEmailResult {
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Send bulk emails using Resend with batching
 */
export async function sendBulkEmail(
  params: BulkEmailParams
): Promise<BulkEmailResult> {
  const fromEmail =
    params.fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SES_FROM_EMAIL_NO_REPLY ||
    "Snap My Date <onboarding@resend.dev>";

  // Resend free tier: 2 requests/second. We'll send 1 at a time with 550ms delay to be safe.
  const RATE_LIMIT_BATCH = 1;
  const RATE_LIMIT_DELAY = 550; // ms between emails (just over 500ms minimum)

  const result: BulkEmailResult = { sent: 0, failed: 0, errors: [] };

  // Process recipients in small batches to respect rate limits
  for (let i = 0; i < params.recipients.length; i += RATE_LIMIT_BATCH) {
    const batch = params.recipients.slice(i, i + RATE_LIMIT_BATCH);

    // Send this batch in parallel (up to 2 at a time)
    const emailPromises = batch.map(async (recipient) => {
      try {
        const userName = recipient.firstName || null;
        const greeting = userName ? `Hi ${userName}` : "Hello";
        const firstName = recipient.firstName || "";
        const lastName = recipient.lastName || "";

        let personalizedBody = params.body
          .replace(/\{\{greeting\}\}/g, greeting)
          .replace(/\{\{firstName\}\}/g, firstName)
          .replace(/\{\{lastName\}\}/g, lastName);

        const html = createEmailTemplate({
          title: params.subject,
          body: personalizedBody,
          buttonText: params.buttonText,
          buttonUrl: params.buttonUrl,
          footerText:
            "You're receiving this because you have a Snap My Date account.",
        });

        await resendHttpSend({
          from: fromEmail,
          to: recipient.email,
          subject: params.subject,
          html,
        });

        result.sent++;
        console.log(`[resend] ✓ Sent to ${recipient.email} (${result.sent}/${params.recipients.length})`);
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          email: recipient.email,
          error: error?.message || "Unknown error",
        });
        console.error(`[resend] ✗ Failed to send to ${recipient.email}:`, error?.message);
      }
    });

    await Promise.all(emailPromises);

    // Delay before next batch (except for the last batch)
    if (i + RATE_LIMIT_BATCH < params.recipients.length) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY));
    }
  }

  return result;
}

export async function sendTestEmail(toEmail: string): Promise<boolean> {
  try {
    const html = createEmailTemplate({
      title: "Resend Integration Test",
      body: `
        <p>Hi there,</p>
        <p>This is a test email to verify your Resend integration is working correctly.</p>
        <p>If you're seeing this, everything is set up properly! 🎉</p>
      `,
      footerText: "This is a test email from Snap My Date admin.",
    });

    await resendHttpSend({
      from:
        process.env.RESEND_FROM_EMAIL ||
        process.env.SES_FROM_EMAIL_NO_REPLY ||
        "Snap My Date <onboarding@resend.dev>",
      to: toEmail,
      subject: "Resend Test Email",
      html,
    });

    return true;
  } catch (error) {
    console.error("[resend] Test email failed:", error);
    return false;
  }
}

