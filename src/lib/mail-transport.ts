import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";

export type TransactionalEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/** Explicit development-only campaign capture; never a delivery fallback. */
async function captureCampaignEmail(message: TransactionalEmail): Promise<boolean> {
  const mailDir = process.env.ENVITEFY_CAMPAIGN_MAIL_DIR;
  if (!mailDir) return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Campaign email capture cannot run in production.");
  }
  const runtimeDir = process.env.ENVITEFY_CAMPAIGN_RUNTIME_DIR;
  if (!runtimeDir) throw new Error("Campaign email capture requires its runtime directory.");
  const campaignRoot = await realpath(path.join(process.cwd(), ".qa", "create-campaign"));
  const runtimeRoot = await realpath(runtimeDir);
  const resolvedMailDir = await realpath(mailDir);
  const relativeRuntime = path.relative(campaignRoot, runtimeRoot);
  if (!relativeRuntime || relativeRuntime.startsWith("..") || path.isAbsolute(relativeRuntime) || resolvedMailDir !== path.join(runtimeRoot, "mail")) {
    throw new Error("Campaign email capture must stay inside its owned runtime directory.");
  }
  const marker: { kind?: string; runtimeDir?: string } = JSON.parse(
    await readFile(path.join(runtimeRoot, ".campaign-runtime.json"), "utf8"),
  );
  if (marker.kind !== "envitefy-create-campaign" || marker.runtimeDir !== runtimeRoot) {
    throw new Error("Campaign email capture requires a valid runtime marker.");
  }
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
  const result = await transport.sendMail(message);
  if (!Buffer.isBuffer(result.message)) throw new Error("Campaign mail capture requires a buffered message.");
  await writeFile(path.join(resolvedMailDir, `${Date.now()}-${randomUUID()}.eml`), result.message, { mode: 0o600 });
  return true;
}

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
    if (await captureCampaignEmail(message)) return;
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
