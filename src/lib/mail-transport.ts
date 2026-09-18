import nodemailer from "nodemailer";

export type TransactionalEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export function zohoSmtpOptions() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !pass) {
    throw new Error("Zoho email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }
  if (port !== 465 && port !== 587) throw new Error("Zoho SMTP_PORT must be 465 or 587.");
  return {
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    dnsTimeout: 10_000,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
}

/** Transactional mail has one provider. Failures must never silently switch senders/providers. */
export async function sendTransactionalEmail(message: TransactionalEmail): Promise<void> {
  let stage = "configuration";
  try {
    const transporter = nodemailer.createTransport(zohoSmtpOptions());
    stage = "delivery";
    const result: {
      accepted?: Array<string | { address: string }>;
      rejected?: Array<string | { address: string }>;
      messageId?: string;
    } = await transporter.sendMail(message);
    if (!result.accepted?.length || result.rejected?.length) {
      stage = "recipient";
      throw new Error("Zoho did not accept the email recipient.");
    }
    console.info("[email] Zoho accepted message", { messageId: result.messageId || null });
  } catch (error) {
    // Keep credentials, recipients, message bodies and private management links out of logs.
    const details = error && typeof error === "object" ? error : {};
    const code =
      "code" in details &&
      typeof details.code === "string" &&
      /^[A-Z0-9_]{1,32}$/.test(details.code)
        ? details.code
        : "MAIL_ERROR";
    const responseCode =
      "responseCode" in details && typeof details.responseCode === "number"
        ? details.responseCode
        : null;
    const command =
      "command" in details && typeof details.command === "string"
        ? details.command.match(/^(CONN|EHLO|HELO|STARTTLS|AUTH|MAIL|RCPT|DATA)\b/)?.[1]
        : undefined;
    console.error("[email] Zoho delivery failed", { code, responseCode, stage: command || stage });
    throw error;
  }
}
