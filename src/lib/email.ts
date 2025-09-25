import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { getUserByEmail } from "@/lib/db";

type NonEmptyString = string & { _brand: "NonEmptyString" };

function assertEnv(name: string, value: string | undefined): asserts value is NonEmptyString {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not set`);
  }
}

let sesClient: any = null;
function getSes(): any {
  if (!sesClient) {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    sesClient = new SESv2Client({ region });
  }
  return sesClient;
}

export async function sendGiftEmail(params: {
  toEmail: string;
  recipientName?: string | null;
  fromEmail?: string | null; // optional reply-to
  giftCode: string;
  quantity: number;
  period: "months" | "years";
  message?: string | null;
  autoRedeemed?: { applied: boolean; expiresAt?: string | null };
}): Promise<void> {
  // Enforce channel-specific sender for gifts; do NOT fall back to other senders
  const fromCandidate = process.env.SES_FROM_EMAIL_GIFT as string | undefined;
  assertEnv("SES_FROM_EMAIL_GIFT", fromCandidate);
  const from = fromCandidate as string;
  const to = params.toEmail;

  const autoRedeemed = params.autoRedeemed?.applied === true;
  const subject = autoRedeemed ? `Your Snap My Date gift has been added` : `You've received a Snap My Date gift`;
  const months = params.period === "years" ? params.quantity * 12 : params.quantity;
  const preheader = autoRedeemed
    ? `We've added ${months} month${months === 1 ? "" : "s"} of Snap My Date to your account.`
    : `You've been gifted ${months} month${months === 1 ? "" : "s"} of Snap My Date.`;
  const text = [
    `Hi${params.recipientName ? ` ${params.recipientName}` : ""},`,
    "",
    preheader,
    "",
    autoRedeemed
      ? `No code needed—your subscription now runs through ${formatExpiresDate(params.autoRedeemed?.expiresAt)}.`
      : `Your gift code: ${params.giftCode}`,
    "",
    params.message ? `Message: ${params.message}` : "",
    "",
    autoRedeemed
      ? "View your subscription: https://snapmydate.com/subscription"
      : "Redeem here: https://snapmydate.com/subscription (Redeem a Snap)",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!doctype html>
  <html><body>
  <p>Hi${params.recipientName ? ` ${params.recipientName}` : ""},</p>
  <p>${preheader}</p>
  ${autoRedeemed ? `<p>Your account has already been extended${params.autoRedeemed?.expiresAt ? ` through <strong>${escapeHtml(formatExpiresDate(params.autoRedeemed?.expiresAt))}</strong>` : ""}. No code needed.</p>` : `<p><strong>Your gift code:</strong> <code>${params.giftCode}</code></p>`}
  ${params.message ? `<p><em>Message:</em> ${escapeHtml(params.message)}</p>` : ""}
  <p><a href="https://snapmydate.com/subscription">${autoRedeemed ? "Manage your subscription" : "Redeem your gift"}</a>${autoRedeemed ? "" : " (click \"Redeem a Snap\")"}.</p>
  </body></html>`;

  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: text },
          Html: { Data: html },
        },
      },
    },
    ReplyToAddresses: params.fromEmail ? [params.fromEmail] : undefined,
  });
  console.log("[email] sendGiftEmail dispatch", {
    to: maskEmail(to),
    hasReplyTo: Boolean(params.fromEmail),
    quantity: params.quantity,
    period: params.period,
    autoRedeemed,
  });
  try {
    const result = await getSes().send(cmd);
    console.log("[email] sendGiftEmail success", {
      to: maskEmail(to),
      messageId: (result as any)?.MessageId || (result as any)?.messageId || null,
      requestId: (result as any)?.$metadata?.requestId || null,
      statusCode: (result as any)?.$metadata?.httpStatusCode || null,
      autoRedeemed,
    });
  } catch (err: any) {
    console.error("[email] sendGiftEmail failed", {
      to: maskEmail(to),
      error: err?.message,
      name: err?.name,
      statusCode: err?.$metadata?.httpStatusCode || null,
      requestId: err?.$metadata?.requestId || null,
      autoRedeemed,
    });
    throw err;
  }
}

export async function sendPasswordResetEmail(params: {
  toEmail: string;
  resetUrl: string;
}): Promise<void> {
  assertEnv("SES_FROM_EMAIL_NO_REPLY", process.env.SES_FROM_EMAIL_NO_REPLY);
  const from = process.env.SES_FROM_EMAIL_NO_REPLY as string;
  const to = params.toEmail;
  const subject = `Reset your Snap My Date password`;
  const preheader = `We received a request to reset your password.`;
  const text = [
    preheader,
    ``,
    `Reset link: ${params.resetUrl}`,
    ``,
    `If you didn't request this, you can ignore this email.`,
  ].join("\n");
  const baseUrl = process.env.NEXTAUTH_URL || process.env.PUBLIC_BASE_URL || "https://snapmydate.com";
  const logoUrl = `${baseUrl}/_next/image?url=%2Fassets%2Flogo.png&w=256&q=90`;
  const safeResetUrl = escapeHtml(params.resetUrl);
  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Reset your password</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Pacifico&display=swap" rel="stylesheet" />
      <style>
        /* Reset (kept minimal for email client compatibility) */
        body,table,td,a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table,td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: 0; text-decoration: none; display: block; }
        a { text-decoration: none; }
        body { margin: 0; padding: 0; background: #FFFBF7; }
        .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
        /* Typography */
        .montserrat { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; }
        .pacifico { font-family: 'Pacifico', 'Brush Script MT', cursive; }
        /* Colors */
        .bg-surface { background: #FFFFFF; }
        .text-fore { color: #4E4E50; }
        .muted { color: #737373; }
        .border { border: 1px solid #E0E0E0; }
        .btn { background: #2DD4BF; color: #FFFFFF !important; border-radius: 12px; padding: 14px 22px; font-weight: 700; display: inline-block; }
        .btn:hover { opacity: 0.95; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; }
        .card { border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
      </style>
    </head>
    <body>
      <div class="preheader">${preheader}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="background:#FFFBF7; padding: 24px 12px;">
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="container">
              <tr>
                <td align="center" style="padding: 8px 0 18px 0;">
                  <a href="${escapeHtml(baseUrl)}" target="_blank" style="display:inline-block;">
                    <img src="${logoUrl}" width="120" height="auto" alt="Snap My Date" style="display:block; margin: 0 auto;" />
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="bg-surface card border" style="border-radius:16px;">
                    <tr>
                      <td style="padding: 28px 28px 8px 28px;" class="montserrat text-fore">
                        <h1 class="pacifico" style="margin:0 0 8px 0; font-size: 28px; line-height: 1.2; color:#2E2C2D;">Snap My Date</h1>
                        <p style="margin: 0; font-size: 16px; color:#4E4E50;">We received a request to reset your password.</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 18px 28px 8px 28px;" class="montserrat">
                        <a href="${safeResetUrl}" class="btn" target="_blank">Reset your password</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 28px 24px 28px;" class="montserrat">
                        <p class="muted" style="margin: 0; font-size: 13px; line-height: 1.6; color:#737373;">This link will expire soon for your security. If the button doesn't work, copy and paste this URL into your browser:</p>
                        <p style="word-break: break-all; font-size: 13px; margin: 6px 0 0 0;">
                          <a href="${safeResetUrl}" target="_blank" style="color:#2DD4BF;">${safeResetUrl}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" class="montserrat" style="padding: 18px 8px 8px 8px;">
                  <p class="muted" style="margin:0; font-size: 12px; line-height: 1.6; color:#737373;">If you didn't request this, you can safely ignore this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: text },
          Html: { Data: html },
        },
      },
    },
  });
  await getSes().send(cmd);
}

export async function sendShareEventEmail(params: {
  toEmail: string;
  ownerEmail: string;
  eventTitle: string;
  eventUrl: string;
  recipientFirstName?: string | null;
  recipientLastName?: string | null;
}): Promise<void> {
  assertEnv("SES_FROM_EMAIL_NO_REPLY", process.env.SES_FROM_EMAIL_NO_REPLY);
  const from = process.env.SES_FROM_EMAIL_NO_REPLY as string;
  const to = params.toEmail;
  // Subject includes sender's name when available, falling back to their email
  let senderName: string | null = null;
  try {
    const sender = await getUserByEmail(params.ownerEmail);
    const full = `${sender?.first_name || ""} ${sender?.last_name || ""}`.trim();
    senderName = full || null;
  } catch {}
  const subject = senderName
    ? `${senderName} shared an event with you on Snap My Date`
    : `An event was shared with you on Snap My Date`;
  const acceptUrl = `${params.eventUrl}?accept=1`;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.PUBLIC_BASE_URL ||
    "https://snapmydate.com";
  const signupUrl = `${baseUrl}/?auth=signup`;
  const text = [
    `${senderName || params.ownerEmail} shared an event with you on Snap My Date.`,
    ``,
    `Title: ${params.eventTitle}`,
    `Link: ${params.eventUrl}`,
    `Accept: ${acceptUrl}`,
    ``,
    `Open the link to view the details or add it to your calendar. You can also accept directly: ${acceptUrl}`,
    ``,
    `Don't have an account? Sign up: ${signupUrl}`,
  ].join("\n");
  const greetName = `${params.recipientFirstName || ""} ${params.recipientLastName || ""}`.trim();
  const greeting = greetName ? `Hi ${escapeHtml(greetName)},` : "Hello,";
  const html = `<!doctype html><html><body>
    <p>${greeting}</p>
    <p>An event was shared with you by ${escapeHtml(senderName || params.ownerEmail)}.</p>
    <p><strong>Title:</strong> ${escapeHtml(params.eventTitle)}</p>
    <p>
      <a href="${escapeHtml(params.eventUrl)}">View the event</a>
      &nbsp;·&nbsp;+
      <a href="${escapeHtml(acceptUrl)}">Accept</a>
    </p>
    <p>Don't have an account? <a href="${escapeHtml(signupUrl)}">Sign up now</a>.</p>
  </body></html>`;
  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text }, Html: { Data: html } } } },
  });
  // Lightweight instrumentation to surface SES delivery outcomes in logs
  try {
    console.log("[email] sendShareEventEmail dispatch", {
      to: maskEmail(to),
      hasOwnerEmail: Boolean(params.ownerEmail),
      hasEventUrl: Boolean(params.eventUrl),
    });
    const result = await getSes().send(cmd);
    console.log("[email] sendShareEventEmail success", {
      to: maskEmail(to),
      messageId: (result as any)?.MessageId || (result as any)?.messageId || null,
      requestId: (result as any)?.$metadata?.requestId || null,
      statusCode: (result as any)?.$metadata?.httpStatusCode || null,
    });
  } catch (err: any) {
    console.error("[email] sendShareEventEmail failed", {
      to: maskEmail(to),
      error: err?.message,
      name: err?.name,
      statusCode: err?.$metadata?.httpStatusCode || null,
      requestId: err?.$metadata?.requestId || null,
    });
    throw err;
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatExpiresDate(raw: string | null | undefined): string {
  if (!raw) return "the end of your gifted period";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "the end of your gifted period";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (!user) return email;
  if (user.length <= 2) {
    return `${user[0] ?? "*"}*@${domain}`;
  }
  const masked = `${user[0]}${"*".repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}`;
  return `${masked}@${domain}`;
}


