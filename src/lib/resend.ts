/**
 * Resend integration for bulk/marketing emails
 */

import { Resend } from "resend";
import { createEmailTemplate } from "./email-template";

// Lazy initialize the Resend client so builds don't fail when the key
// is not present at compile time (e.g., CI build step without secrets).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send emails");
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export interface BulkEmailParams {
  subject: string;
  body: string; // HTML content for email body
  fromEmail?: string; // defaults to SES_FROM_EMAIL_NO_REPLY
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
 * Resend has a batch limit of 100 emails per request
 */
export async function sendBulkEmail(
  params: BulkEmailParams
): Promise<BulkEmailResult> {
  const fromEmail =
    params.fromEmail ||
    process.env.SES_FROM_EMAIL_NO_REPLY ||
    "Snap My Date <no-reply@snapmydate.com>";

  const BATCH_SIZE = 100;
  const batches: typeof params.recipients[] = [];

  // Split recipients into batches
  for (let i = 0; i < params.recipients.length; i += BATCH_SIZE) {
    batches.push(params.recipients.slice(i, i + BATCH_SIZE));
  }

  const result: BulkEmailResult = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Process batches sequentially to respect rate limits
  for (const batch of batches) {
    try {
      // Resend batch API expects an array of email objects
      const emailPromises = batch.map(async (recipient) => {
        try {
          // Generate personalized email content
          const userName = recipient.firstName || null;
          const greeting = userName ? `Hi ${userName}` : "Hello";
          const firstName = recipient.firstName || "";
          const lastName = recipient.lastName || "";

          // Replace all placeholders
          let personalizedBody = params.body
            .replace(/\{\{greeting\}\}/g, greeting)
            .replace(/\{\{firstName\}\}/g, firstName)
            .replace(/\{\{lastName\}\}/g, lastName);

          const html = createEmailTemplate({
            title: params.subject,
            body: personalizedBody,
            buttonText: params.buttonText,
            buttonUrl: params.buttonUrl,
            footerText: "You're receiving this because you have a Snap My Date account.",
          });

          // Send individual email
          await getResend().emails.send({
            from: fromEmail,
            to: recipient.email,
            subject: params.subject,
            html,
          });

          result.sent++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            email: recipient.email,
            error: error.message || "Unknown error",
          });
        }
      });

      // Wait for all emails in this batch
      await Promise.all(emailPromises);

      // Small delay between batches to avoid rate limiting
      if (batches.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      // Batch-level error
      batch.forEach((recipient) => {
        result.failed++;
        result.errors.push({
          email: recipient.email,
          error: error.message || "Batch send failed",
        });
      });
    }
  }

  return result;
}

/**
 * Send a test email to verify Resend configuration
 */
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

    await getResend().emails.send({
      from: process.env.SES_FROM_EMAIL_NO_REPLY || "Snap My Date <no-reply@snapmydate.com>",
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

