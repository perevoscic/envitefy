import { getUserByEmail } from "@/lib/db";
import { normalizeEnvitefySender, SIGNUP_FORMS_SENDER } from "@/lib/email-sender";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";
import { sendTransactionalEmail } from "@/lib/mail-transport";
import { buildPublicAssetUrl, resolvePublicAssetOrigin } from "@/lib/public-asset-url";
import { validGuestEmail } from "@/lib/event-message-types";
import { formatSignupDateRange } from "@/lib/signup-display";
import type { SignupForm, SignupResponse } from "@/types/signup";

// Re-export for backwards compatibility
export { createEmailTemplate, escapeHtml };

const signupTextSignature =
  "\n\nSincerely,\nEnvitefy Team\nCREATE | SHARE | ENJOY\nhttps://envitefy.com";

function resolveNoReplySender() {
  return {
    from: normalizeEnvitefySender(
      process.env.EMAIL_FROM_NO_REPLY?.trim() ||
        process.env.SMTP_FROM?.trim() ||
        "Envitefy <no-reply@envitefy.com>",
    ),
  };
}

export async function sendPasswordResetEmail(params: {
  toEmail: string;
  resetUrl: string;
}): Promise<void> {
  const { from } = resolveNoReplySender();
  const to = params.toEmail;
  const subject = `Reset your Envitefy password`;
  const preheader = `We received a request to reset your password.`;
  const text = [
    preheader,
    ``,
    `Reset link: ${params.resetUrl}`,
    ``,
    `If you didn't request this, you can ignore this email.`,
  ].join("\n");

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your Envitefy account.</p>
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

  await sendTransactionalEmail({ from, to, subject, text, html });
}

export async function sendShareEventEmail(params: {
  toEmail: string;
  ownerEmail: string;
  eventTitle: string;
  eventUrl: string;
  recipientFirstName?: string | null;
  recipientLastName?: string | null;
}): Promise<void> {
  const { from } = resolveNoReplySender();
  const to = params.toEmail;
  // Subject includes sender's name when available, falling back to their email
  let senderName: string | null = null;
  try {
    const sender = await getUserByEmail(params.ownerEmail);
    const full = `${sender?.first_name || ""} ${sender?.last_name || ""}`.trim();
    senderName = full || null;
  } catch {}
  const subject = senderName
    ? `${senderName} shared an event with you on Envitefy`
    : `An event was shared with you on Envitefy`;
  const acceptUrl = `${params.eventUrl}?accept=1`;
  const baseUrl = resolvePublicAssetOrigin();
  const signupUrl = `${baseUrl}/snap`;
  const text = [
    `${senderName || params.ownerEmail} shared an event with you on Envitefy.`,
    ``,
    `Title: ${params.eventTitle}`,
    `Link: ${params.eventUrl}`,
    `Accept: ${acceptUrl}`,
    ``,
    `Open the link to view the details or add it to your calendar. You can also accept directly: ${acceptUrl}`,
    ``,
    `Need an account? Start with Snap: ${signupUrl}`,
  ].join("\n");
  const greetName = `${params.recipientFirstName || ""} ${params.recipientLastName || ""}`.trim();
  const greeting = greetName ? `Hi ${escapeHtml(greetName)}` : "Hello";
  const preheader = `${senderName || params.ownerEmail} shared "${params.eventTitle}" with you`;

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      <strong>${escapeHtml(senderName || params.ownerEmail)}</strong> has shared an event with you on Envitefy.
    </p>
    <div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2E2C2D;">📅 ${escapeHtml(params.eventTitle)}</p>
    </div>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
      View the event details and add it to your calendar.
    </p>
  `;

  const footerText = `
    Need an Envitefy account? 
    <a href="${escapeHtml(signupUrl)}" target="_blank" style="color:#2DD4BF; text-decoration: none;">Start with Snap</a> 
    to manage and save shared events.
  `;

  const html = createEmailTemplate({
    preheader,
    title: "Event shared with you",
    body,
    buttonText: "View & Accept Event",
    buttonUrl: acceptUrl,
    footerText,
  });

  await sendTransactionalEmail({ from, to, subject, text, html });
}

export async function sendPasswordChangeConfirmationEmail(params: {
  toEmail: string;
  userName?: string | null;
}): Promise<void> {
  const { from } = resolveNoReplySender();
  const to = params.toEmail;
  const subject = `Your Envitefy password was changed`;
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
      Your Envitefy password was successfully changed.
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
    `Your Envitefy password was successfully changed on ${timestamp}.`,
    ``,
    `If you didn't make this change, please contact us immediately.`,
  ].join("\n");

  const html = createEmailTemplate({
    preheader,
    title: "Password Changed",
    body,
    buttonText: "View My Account",
    buttonUrl: "https://envitefy.com/settings/profile",
    footerText,
  });

  await sendTransactionalEmail({ from, to, subject, text, html });
}

export async function sendRsvpConfirmationEmail(params: {
  toEmail: string;
  guestName?: string | null;
  eventTitle: string;
  eventUrl: string;
  response: "yes" | "no" | "maybe";
  dateLabel?: string | null;
  locationLabel?: string | null;
  eventImageUrl?: string | null;
  eventImageAlt?: string | null;
  calendarLinks?: Array<{ label: string; url: string }> | null;
}): Promise<void> {
  // Declined guests receive neither RSVP confirmations nor host announcements.
  if (params.response === "no") return;
  const { from } = resolveNoReplySender();
  const to = params.toEmail;
  const statusLabel =
    params.response === "yes" ? "Going" : "Maybe";
  const subject = `RSVP ${statusLabel.toLowerCase()}: ${params.eventTitle}`;
  const preheader = `Your RSVP for ${params.eventTitle} is saved.`;
  const greeting = params.guestName ? `Hi ${escapeHtml(params.guestName)}` : "Hello";
  const eventImageUrl =
    typeof params.eventImageUrl === "string" && /^https?:\/\//i.test(params.eventImageUrl.trim())
      ? params.eventImageUrl.trim()
      : null;
  const eventImageAlt =
    typeof params.eventImageAlt === "string" && params.eventImageAlt.trim()
      ? params.eventImageAlt.trim()
      : params.eventTitle;
  const eventImageBlock = eventImageUrl
    ? `
    <div style="margin:0 0 18px 0; border-radius:14px; overflow:hidden; border:1px solid #E5E7EB; background:#F9FAFB;">
      <img src="${escapeHtml(eventImageUrl)}" width="544" alt="${escapeHtml(eventImageAlt)}" style="display:block; width:100%; max-width:544px; height:auto; border:0; outline:none; text-decoration:none;" />
    </div>`
    : "";

  const detailsRows = [
    `<p style="margin:0 0 4px 0; font-size:14px;"><strong>RSVP:</strong> ${escapeHtml(statusLabel)}</p>`,
    params.dateLabel
      ? `<p style="margin:0 0 4px 0; font-size:14px;"><strong>When:</strong> ${escapeHtml(params.dateLabel)}</p>`
      : "",
    params.locationLabel
      ? `<p style="margin:0 0 4px 0; font-size:14px;"><strong>Where:</strong> ${escapeHtml(params.locationLabel)}</p>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const calendarRows = params.calendarLinks?.length
    ? `
    <p style="margin:24px 0 8px 0; font-size:13px; color:#737373; text-align:center;">Choose your calendar:</p>
    <p style="margin:0 0 18px 0; font-size:14px; line-height:1.7; text-align:center;">
      ${params.calendarLinks
        .map(
          (link) =>
            `<a href="${escapeHtml(link.url)}" target="_blank" style="color:#7F67D3; font-weight:600; text-decoration:none;">${escapeHtml(link.label)}</a>`,
        )
        .join('<span style="color:#D1D5DB;"> &nbsp;|&nbsp; </span>')}
    </p>`
    : "";

  const body = `
    <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">${greeting},</p>
    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
      Your RSVP for <strong>${escapeHtml(params.eventTitle)}</strong> is saved.
    </p>
    ${eventImageBlock}
    <div style="background:#F9FAFB; border:1px solid #E5E7EB; padding:14px 16px; border-radius:10px; margin:16px 0;">
      ${detailsRows}
    </div>
    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
      Use the event link below if you need to review details or update your response.
    </p>
    ${calendarRows}
  `;

  const footerText = `If the button does not work, copy and paste this link into your browser:<br/><br/>
    <a href="${escapeHtml(params.eventUrl)}" target="_blank" style="color:#7F67D3; word-break: break-all;">${escapeHtml(params.eventUrl)}</a>`;

  const html = createEmailTemplate({
    preheader,
    title: `RSVP ${statusLabel}`,
    body,
    buttonText: "View Event Details",
    buttonUrl: params.eventUrl,
    footerText,
  });

  const text = [
    `Your RSVP for ${params.eventTitle} is saved.`,
    "",
    `RSVP: ${statusLabel}`,
    params.dateLabel ? `When: ${params.dateLabel}` : undefined,
    params.locationLabel ? `Where: ${params.locationLabel}` : undefined,
    params.calendarLinks?.length
      ? `Choose your calendar:\n${params.calendarLinks.map((link) => `- ${link.label}: ${link.url}`).join("\n")}`
      : undefined,
    "",
    `Event link: ${params.eventUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTransactionalEmail({ from, to, subject, text, html });
}

export async function sendHostRsvpNotificationEmail(params: {
  toEmail: string;
  hostName?: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  response: "yes" | "no" | "maybe";
  eventTitle: string;
  dashboardUrl: string;
  dateLabel?: string | null;
  locationLabel?: string | null;
  message?: string | null;
  adultCount?: number | null;
  kidCount?: number | null;
  allergyNotes?: string | null;
}): Promise<void> {
  const { from } = resolveNoReplySender();
  const label = { yes: "Yes — Going", no: "No — Declined", maybe: "Maybe" }[params.response];
  const summary = `${params.guestName} responded ${label} to ${params.eventTitle}.`;
  const details = [
    ["Guest", params.guestName],
    ["Response", label],
    ["Email", params.guestEmail],
    ["Phone", params.guestPhone],
    ["When", params.dateLabel],
    ["Where", params.locationLabel],
    ["Adults", params.adultCount != null ? String(params.adultCount) : null],
    ["Children", params.kidCount != null ? String(params.kidCount) : null],
    ["Allergy notes", params.allergyNotes],
    ["Guest note", params.message],
  ].filter((row): row is [string, string] => typeof row[1] === "string" && Boolean(row[1]));
  const html = createEmailTemplate({
    preheader: summary,
    title: "Guest RSVP",
    body: `<p style="font-size:16px;line-height:1.6;">${params.hostName ? `Hi ${escapeHtml(params.hostName)},` : "Hello,"}</p>
      <p style="font-size:16px;line-height:1.6;">${escapeHtml(summary)}</p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px;">${details.map(([name, value]) => `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;"><strong>${escapeHtml(name)}:</strong> ${escapeHtml(value).replace(/\r?\n/g, "<br/>")}</p>`).join("")}</div>`,
    buttonText: "View RSVPs",
    buttonUrl: params.dashboardUrl,
    footerText: validGuestEmail(params.guestEmail) ? "Reply to this email to reach the guest." : undefined,
  });
  await sendTransactionalEmail({
    from,
    to: params.toEmail,
    subject: `Guest RSVP: ${params.guestName} · ${params.eventTitle}`.replace(/[\r\n]+/g, " "),
    ...(validGuestEmail(params.guestEmail) ? { replyTo: params.guestEmail } : {}),
    html,
    text: `${summary}\n\n${details.map(([name, value]) => `${name}: ${value}`).join("\n")}\n\nView RSVPs: ${params.dashboardUrl}${signupTextSignature}`,
  });
}

export async function sendEventUpdateEmail(params: {
  toEmail: string;
  subject: string;
  body: string;
  eventTitle: string;
  eventUrl: string;
  replyTo: string | null;
}): Promise<void> {
  const { from } = resolveNoReplySender();
  const html = createEmailTemplate({
    preheader: `An update about ${params.eventTitle}`,
    title: params.subject,
    body: `<p style="font-size:14px;color:#737373;">${escapeHtml(params.eventTitle)}</p>
      <div style="font-size:16px;line-height:1.6;overflow-wrap:anywhere;">${escapeHtml(params.body).replace(/\r?\n/g, "<br/>")}</div>`,
    buttonText: "View event",
    buttonUrl: params.eventUrl,
    footerText: params.replyTo ? "Reply to this email to reach the host." : "Open the event for host contact details.",
  });
  await sendTransactionalEmail({
    from, to: params.toEmail, subject: params.subject,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    html,
    text: `${params.eventTitle}\n\n${params.body}\n\nView event: ${params.eventUrl}${params.replyTo ? `\nReply to: ${params.replyTo}` : ""}${signupTextSignature}`,
  });
}

export async function sendSignupConfirmationEmail(params: {
  toEmail: string;
  userName?: string | null;
  eventTitle: string;
  eventUrl?: string | null;
  manageUrl?: string | null;
  form: SignupForm;
  response: SignupResponse;
}): Promise<void> {
  const from = SIGNUP_FORMS_SENDER;
  const to = params.toEmail;

  const status = params.response.status === "waitlisted" ? "Waitlisted" : "Confirmed";
  const subject = `${status}: ${params.eventTitle}`;
  const preheader = `${status} for ${params.eventTitle}`;

  const startLabel = formatSignupDateRange(params.form);
  const locationLabel = [params.form.venue, params.form.location].filter(Boolean).join(" · ");

  const formatTime = (value?: string | null): string | null => {
    if (!value) return null;
    const [hh, mm] = value.split(":");
    const hour = Number.parseInt(hh || "0", 10);
    const minute = Number.parseInt(mm || "0", 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
    const suffix = hour >= 12 ? "PM" : "AM";
    const h12 = ((hour + 11) % 12) + 1;
    const mmPad = String(minute).padStart(2, "0");
    return `${h12}:${mmPad} ${suffix}`;
  };

  const slotSummaries = (() => {
    const entries: string[] = [];
    for (const sel of params.response.slots || []) {
      const section = params.form.sections.find((s) => s.id === sel.sectionId);
      const slot = section?.slots.find((s) => s.id === sel.slotId);
      if (!section || !slot) continue;
      const qty = sel.quantity && sel.quantity > 1 ? ` ×${sel.quantity}` : "";
      const range = (() => {
        const a = formatTime(slot.startTime);
        const b = formatTime(slot.endTime);
        if (a && b) return `${a} – ${b}`;
        if (a) return `Starts ${a}`;
        if (b) return `Ends ${b}`;
        return null;
      })();
      entries.push(`${section.title}: ${slot.label}${qty}${range ? ` (${range})` : ""}`);
    }
    return entries;
  })();

  const header = params.form.header || null;
  const headerBg = header?.backgroundCss || header?.backgroundColor || "#F5F5F4";
  const text1 = header?.textColor1 || "#4E4E50";
  const text2 = header?.textColor2 || "#111827";
  const emailImageUrl = (value?: string | null): string | null => {
    if (!value) return null;
    if (/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(value)) return value;
    const url = buildPublicAssetUrl(value);
    return /^https?:\/\//i.test(url) ? url : null;
  };
  const bannerSrc = emailImageUrl(header?.images?.[0]?.dataUrl);
  const squareSrc = emailImageUrl(header?.backgroundImage?.dataUrl || header?.images?.[1]?.dataUrl);

  const headerPreview = `
    <div style="border:1px solid #E5E7EB; border-radius: 14px; overflow: hidden; background:${escapeHtml(headerBg)};">
      <div style="padding:18px;">
        ${bannerSrc ? `<img src="${escapeHtml(bannerSrc)}" alt="${escapeHtml(params.eventTitle)}" style="width:100%; height:180px; object-fit:cover; border-radius: 12px; border:1px solid #E5E7EB;" />` : ""}
        <div style="display:flex; gap:16px; align-items:flex-start; margin-top:${bannerSrc ? "12px" : "0"};">
          ${squareSrc ? `<img src="${escapeHtml(squareSrc)}" alt="${escapeHtml(params.eventTitle)}" width="140" height="140" style="border-radius:12px; object-fit:cover; border:1px solid #E5E7EB;" />` : ""}
          <div style="flex:1; min-width:0;">
            ${header?.groupName ? `<div style="font-weight:600; font-size:14px; color:${escapeHtml(text1)}; margin:4px 0 6px 0;">${escapeHtml(header.groupName)}</div>` : ""}
            <div style="font-weight:700; font-size:20px; color:${escapeHtml(text2)};">${escapeHtml(params.eventTitle || "Smart sign-up")}</div>
          </div>
        </div>
      </div>
    </div>`;

  const greeting = params.userName ? `Hi ${escapeHtml(params.userName)}` : "Hello";
  const body = `
    <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6;">${greeting},</p>
    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">You're <strong>${escapeHtml(status)}</strong> for <strong>${escapeHtml(params.eventTitle)}</strong>.</p>
    <div style="background:#F9FAFB; border:1px solid #E5E7EB; padding:14px 16px; border-radius:10px; margin:16px 0;">
      ${startLabel ? `<p style="margin:0 0 4px 0; font-size:14px;"><strong>Date:</strong> ${escapeHtml(startLabel)}</p>` : ""}
      ${locationLabel ? `<p style="margin:0 0 4px 0; font-size:14px;"><strong>Location:</strong> ${escapeHtml(locationLabel)}</p>` : ""}
      ${slotSummaries.length ? `<p style="margin:8px 0 0 0; font-size:14px;"><strong>Your signup — roles, items or shifts:</strong><br/> ${slotSummaries.map((s) => `• ${escapeHtml(s)}`).join("<br/>")}</p>` : ""}
    </div>
    ${headerPreview}
    ${params.eventUrl && params.manageUrl ? `<p style="font-size:14px;line-height:1.6;"><a href="${escapeHtml(params.eventUrl)}" style="color:#59439e;text-decoration:underline;">View signup form</a></p>` : ""}
  `;

  const html = createEmailTemplate({
    preheader,
    title: `${status} for ${params.eventTitle}`,
    body,
    buttonText: params.manageUrl
      ? "Update or cancel my signup"
      : params.eventUrl
        ? "View signup form"
        : undefined,
    buttonUrl: params.manageUrl || params.eventUrl || undefined,
  });

  const text = [
    `${status} for ${params.eventTitle}`,
    startLabel ? `Date: ${startLabel}` : undefined,
    locationLabel ? `Location: ${locationLabel}` : undefined,
    slotSummaries.length
      ? `Your signup — roles, items or shifts:\n${slotSummaries.map((s) => `- ${s}`).join("\n")}`
      : undefined,
    params.manageUrl ? `Update or cancel my signup: ${params.manageUrl}` : undefined,
    params.eventUrl ? `Open signup form: ${params.eventUrl}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTransactionalEmail({ from, to, subject, text: text + signupTextSignature, html });
}

export async function sendSignupRecoveryEmail(params: {
  toEmail: string;
  eventTitle: string;
  links: { name: string; url: string }[];
}): Promise<void> {
  const from = SIGNUP_FORMS_SENDER;
  const explanation =
    "You can update or cancel your signup below. If you didn’t request this email, you can ignore it.";
  const html = createEmailTemplate({
    title: `Manage your signup: ${params.eventTitle}`,
    preheader: "Update or cancel your signup",
    body: `<p>${escapeHtml(explanation)}</p>${params.links.length > 1 ? params.links.map((link) => `<p><strong>${escapeHtml(link.name)}</strong><br/><a href="${escapeHtml(link.url)}" style="color:#59439e;text-decoration:underline;">Update or cancel my signup</a></p>`).join("") : ""}`,
    buttonText: params.links.length === 1 ? "Update or cancel my signup" : undefined,
    buttonUrl: params.links.length === 1 ? params.links[0].url : undefined,
  });
  await sendTransactionalEmail({
    from,
    to: params.toEmail,
    subject: `Manage your signup: ${params.eventTitle}`,
    text: `${explanation}\n\n${params.links.map((link) => `${link.name}: ${link.url}`).join("\n\n")}${signupTextSignature}`,
    html,
  });
}
