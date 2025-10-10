import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { getUserByEmail } from "@/lib/db";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";

type NonEmptyString = string & { _brand: "NonEmptyString" };

function assertEnv(name: string, value: string | undefined): asserts value is NonEmptyString {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not set`);
  }
}

// Re-export for backwards compatibility
export { createEmailTemplate, escapeHtml };

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

  const greeting = params.recipientName ? `Hi ${escapeHtml(params.recipientName)}` : "Hello";
  
  const body = autoRedeemed
    ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        🎉 Great news! You've received a gift subscription to Snap My Date, and we've already added it to your account.
      </p>
      <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #065F46;">✓ Gift Applied</p>
        <p style="margin: 0; font-size: 15px; color: #047857;">
          Your subscription now includes <strong>${months} additional month${months === 1 ? "" : "s"}</strong> 
          ${params.autoRedeemed?.expiresAt ? `and runs through <strong>${escapeHtml(formatExpiresDate(params.autoRedeemed?.expiresAt))}</strong>` : ""}.
        </p>
      </div>
      ${params.message ? `<div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #737373;">💌 Message from sender:</p>
        <p style="margin: 0; font-size: 15px; color: #4E4E50; font-style: italic;">${escapeHtml(params.message)}</p>
      </div>` : ""}
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        No action needed—just keep snapping and saving your dates!
      </p>
    `
    : `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        🎁 Exciting news! Someone has gifted you <strong>${months} month${months === 1 ? "" : "s"}</strong> of Snap My Date premium access!
      </p>
      ${params.message ? `<div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #737373;">💌 Message from sender:</p>
        <p style="margin: 0; font-size: 15px; color: #4E4E50; font-style: italic;">${escapeHtml(params.message)}</p>
      </div>` : ""}
      <div style="background: #FFFBEB; border: 1px solid #FCD34D; padding: 16px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #92400E;">Your Gift Code:</p>
        <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; color: #78350F; letter-spacing: 2px;">
          ${params.giftCode}
        </p>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        Click the button below to redeem your gift and start enjoying premium features.
      </p>
    `;

  const html = createEmailTemplate({
    preheader,
    title: autoRedeemed ? "Your gift has been added" : "You've received a gift",
    body,
    buttonText: autoRedeemed ? "View My Subscription" : "Redeem My Gift",
    buttonUrl: "https://snapmydate.com/subscription",
    footerText: autoRedeemed 
      ? undefined 
      : `Having trouble? Copy and paste this code on the subscription page: <strong>${params.giftCode}</strong>`,
  });

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
  
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your Snap My Date account.</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Click the button below to create a new password:</p>
  `;
  
  const footerText = `This link will expire soon for your security. If the button doesn't work, copy and paste this URL into your browser:<br/><br/>
    <a href="${escapeHtml(params.resetUrl)}" target="_blank" style="color:#2DD4BF; word-break: break-all;">${escapeHtml(params.resetUrl)}</a><br/><br/>
    If you didn't request this password reset, you can safely ignore this email.`;
  
  const html = createEmailTemplate({
    preheader,
    title: "Reset your password",
    body,
    buttonText: "Reset Your Password",
    buttonUrl: params.resetUrl,
    footerText,
  });

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
  const greeting = greetName ? `Hi ${escapeHtml(greetName)}` : "Hello";
  const preheader = `${senderName || params.ownerEmail} shared "${params.eventTitle}" with you`;
  
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      <strong>${escapeHtml(senderName || params.ownerEmail)}</strong> has shared an event with you on Snap My Date.
    </p>
    <div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2E2C2D;">📅 ${escapeHtml(params.eventTitle)}</p>
    </div>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      View the event details and add it to your calendar.
    </p>
  `;
  
  const footerText = `
    Don't have a Snap My Date account yet? 
    <a href="${escapeHtml(signupUrl)}" target="_blank" style="color:#2DD4BF; text-decoration: none;">Sign up now</a> 
    to manage all your events in one place.
  `;
  
  const html = createEmailTemplate({
    preheader,
    title: "Event shared with you",
    body,
    buttonText: "View & Accept Event",
    buttonUrl: acceptUrl,
    footerText,
  });

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

export async function sendSubscriptionChangeEmail(params: {
  toEmail: string;
  userName?: string | null;
  oldPlan: string;
  newPlan: string;
}): Promise<void> {
  assertEnv("SES_FROM_EMAIL_NO_REPLY", process.env.SES_FROM_EMAIL_NO_REPLY);
  const from = process.env.SES_FROM_EMAIL_NO_REPLY as string;
  const to = params.toEmail;
  
  const planLabels: Record<string, string> = {
    free: "Free Trial",
    monthly: "Monthly Plan",
    yearly: "Yearly Plan",
    FF: "Lifetime Access",
  };
  
  const oldPlanLabel = planLabels[params.oldPlan] || params.oldPlan;
  const newPlanLabel = planLabels[params.newPlan] || params.newPlan;
  
  // Determine email type based on plan changes
  // Upgrade: free → paid, or any → FF
  const isUpgrade = (params.oldPlan === "free" && params.newPlan !== "free") || params.newPlan === "FF";
  // Plan switch: monthly ↔ yearly
  const isPlanSwitch = (params.oldPlan === "monthly" && params.newPlan === "yearly") || 
                       (params.oldPlan === "yearly" && params.newPlan === "monthly");
  
  const subject = isUpgrade
    ? `Welcome to ${newPlanLabel} - Snap My Date`
    : `Your Snap My Date plan has been updated`;
    
  const preheader = isUpgrade 
    ? `You've upgraded from ${oldPlanLabel} to ${newPlanLabel}.`
    : `Your plan has been updated from ${oldPlanLabel} to ${newPlanLabel}.`;
  
  const greeting = params.userName ? `Hi ${escapeHtml(params.userName)}` : "Hello";
  
  const body = isUpgrade && params.newPlan === "FF"
    ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; font-weight: 600; color: #2E2C2D;">
        🎊 Welcome to Snap My Date Family and Friends Club!
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 8px; background: linear-gradient(to right, #f59e0b, #f97316); color: white; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
          ⭐ Lifetime Access
        </span>
      </div>
      <p style="margin: 20px 0 16px 0; font-size: 16px; line-height: 1.6;">
        You've been granted exclusive lifetime access to Snap My Date! This special membership gives you unlimited scans, unlimited storage, and all premium features—forever.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        Start snapping and saving all your important dates with no limits!
      </p>
    `
    : isUpgrade
    ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        🎉 Great news! Your Snap My Date subscription has been upgraded.
      </p>
      <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #065F46;">Subscription Upgraded</p>
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #047857;">
          <span style="text-decoration: line-through; opacity: 0.6;">${escapeHtml(oldPlanLabel)}</span> 
          <span style="font-weight: 700; margin: 0 8px;">→</span> 
          <strong>${escapeHtml(newPlanLabel)}</strong>
        </p>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        You now have unlimited access to all premium features. Start snapping and saving all your important dates!
      </p>
    `
    : `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        Your Snap My Date plan has been updated.
      </p>
      <div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #737373;">Plan Updated</p>
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #4E4E50;">
          <span style="text-decoration: line-through; opacity: 0.6;">${escapeHtml(oldPlanLabel)}</span> 
          <span style="font-weight: 700; margin: 0 8px;">→</span> 
          <strong>${escapeHtml(newPlanLabel)}</strong>
        </p>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        ${isPlanSwitch ? "Your billing cycle has been updated. You'll continue to enjoy unlimited access to all premium features." : "Your plan has been successfully updated."}
      </p>
    `;
  
  const text = [
    `${greeting},`,
    ``,
    `Your Snap My Date ${isUpgrade ? "subscription has been upgraded" : "plan has been updated"}.`,
    ``,
    `Previous: ${oldPlanLabel}`,
    `New: ${newPlanLabel}`,
    ``,
    `View your subscription: https://snapmydate.com/subscription`,
  ].join("\n");

  const html = createEmailTemplate({
    preheader,
    title: isUpgrade ? "Subscription Upgraded!" : "Subscription Updated",
    body,
    buttonText: "View My Subscription",
    buttonUrl: "https://snapmydate.com/subscription",
  });

  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text }, Html: { Data: html } } } },
  });

  try {
    console.log("[email] sendSubscriptionChangeEmail dispatch", {
      to: maskEmail(to),
      oldPlan: params.oldPlan,
      newPlan: params.newPlan,
    });
    const result = await getSes().send(cmd);
    console.log("[email] sendSubscriptionChangeEmail success", {
      to: maskEmail(to),
      messageId: (result as any)?.MessageId || (result as any)?.messageId || null,
    });
  } catch (err: any) {
    console.error("[email] sendSubscriptionChangeEmail failed", {
      to: maskEmail(to),
      error: err?.message,
    });
    throw err;
  }
}

export async function sendPasswordChangeConfirmationEmail(params: {
  toEmail: string;
  userName?: string | null;
}): Promise<void> {
  assertEnv("SES_FROM_EMAIL_NO_REPLY", process.env.SES_FROM_EMAIL_NO_REPLY);
  const from = process.env.SES_FROM_EMAIL_NO_REPLY as string;
  const to = params.toEmail;
  const subject = `Your Snap My Date password was changed`;
  const preheader = `Your password was successfully changed.`;
  const greeting = params.userName ? `Hi ${escapeHtml(params.userName)}` : "Hello";
  
  const timestamp = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      Your Snap My Date password was successfully changed.
    </p>
    <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #065F46;">✓ Password Changed</p>
      <p style="margin: 0; font-size: 13px; color: #047857;">
        <strong>Date:</strong> ${escapeHtml(timestamp)}
      </p>
    </div>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      If you didn't make this change, please contact us immediately to secure your account.
    </p>
  `;
  
  const footerText = `If you didn't change your password, please reset it immediately or contact our support team.`;
  
  const text = [
    `${greeting},`,
    ``,
    `Your Snap My Date password was successfully changed on ${timestamp}.`,
    ``,
    `If you didn't make this change, please contact us immediately.`,
  ].join("\n");

  const html = createEmailTemplate({
    preheader,
    title: "Password Changed",
    body,
    buttonText: "View My Account",
    buttonUrl: "https://snapmydate.com/settings/profile",
    footerText,
  });

  const cmd = new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text }, Html: { Data: html } } } },
  });

  try {
    console.log("[email] sendPasswordChangeConfirmationEmail dispatch", {
      to: maskEmail(to),
    });
    const result = await getSes().send(cmd);
    console.log("[email] sendPasswordChangeConfirmationEmail success", {
      to: maskEmail(to),
      messageId: (result as any)?.MessageId || (result as any)?.messageId || null,
    });
  } catch (err: any) {
    console.error("[email] sendPasswordChangeConfirmationEmail failed", {
      to: maskEmail(to),
      error: err?.message,
    });
    throw err;
  }
}

// escapeHtml is now imported from email-template.ts

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


