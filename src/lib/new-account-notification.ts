import { normalizeEnvitefySender } from "@/lib/email-sender";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";
import { validGuestEmail } from "@/lib/event-message-types";
import { sendTransactionalEmail, type TransactionalEmail } from "@/lib/mail-transport";
import { buildPublicAssetUrl } from "@/lib/public-asset-url";

export const NEW_ACCOUNT_NOTIFY_EMAIL = "bugjosru@gmail.com";

export type NewAccountSignupNotice = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  method: "email" | "google";
  signupSource?: string | null;
  signupPath?: string | null;
};

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function displayName(account: NewAccountSignupNotice): string {
  const name = [account.firstName, account.lastName].filter(Boolean).join(" ").trim();
  return name || "Not provided";
}

function displaySource(source: string | null | undefined): string {
  const value = source?.trim();
  if (!value) return "Not recorded";
  return value
    .replaceAll("_", " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function signedUpAtLabel(now: Date): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(now);
  return `${formatted} CT`;
}

export function buildNewAccountNotification(
  account: NewAccountSignupNotice,
  now = new Date(),
): TransactionalEmail {
  const email = singleLine(account.email).toLowerCase();
  const name = displayName(account);
  const method = account.method === "google" ? "Google" : "Email and password";
  const source = displaySource(account.signupSource);
  const path = account.signupPath?.trim() || "Not recorded";
  const when = signedUpAtLabel(now);
  const summary = `${name === "Not provided" ? email : name} created an Envitefy account.`;
  const details: Array<[string, string]> = [
    ["Name", name],
    ["Email", email],
    ["Signed up with", method],
    ["Started from", source],
    ["Page", path],
    ["When", when],
  ];
  const usersUrl = buildPublicAssetUrl("/admin/users");
  const from = normalizeEnvitefySender(
    process.env.EMAIL_FROM_NO_REPLY?.trim() ||
      process.env.SMTP_FROM?.trim() ||
      "Envitefy <no-reply@envitefy.com>",
  );
  const body = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${escapeHtml(summary)}</p>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px;">${details
      .map(
        ([label, value]) =>
          `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
      )
      .join("")}</div>`;
  const text = [
    summary,
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    `Admin users: ${usersUrl}`,
    "",
    "Sincerely,",
    "Envitefy Team",
    "CREATE | SHARE | ENJOY",
    "https://envitefy.com",
  ].join("\n");

  return {
    from,
    to: NEW_ACCOUNT_NOTIFY_EMAIL,
    subject: singleLine(`New Envitefy account: ${name === "Not provided" ? email : name}`),
    text,
    html: createEmailTemplate({
      preheader: summary,
      title: "New account",
      body,
      buttonText: "View accounts",
      buttonUrl: usersUrl,
    }),
    ...(validGuestEmail(email) ? { replyTo: email } : {}),
  };
}

/** Tell the owner a new account exists. A mail failure must not block signup. */
export async function notifyNewAccountSignup(account: NewAccountSignupNotice): Promise<void> {
  try {
    await sendTransactionalEmail(buildNewAccountNotification(account));
  } catch (error) {
    const details = error && typeof error === "object" ? error : {};
    const code =
      "code" in details && typeof details.code === "string" && /^[A-Z0-9_]{1,32}$/.test(details.code)
        ? details.code
        : "MAIL_ERROR";
    console.error("[signup] new-account notification failed", { code });
  }
}
