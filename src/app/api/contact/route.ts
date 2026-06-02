import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

export const runtime = "nodejs";

const CONTACT_TO = "no-reply@envitefy.com";
const CONTACT_FROM = "Envitefy <no-reply@envitefy.com>";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_MESSAGES = 5;
const RATE_LIMIT_MAX_KEYS = 1000;

type ContactBody = {
  name?: string;
  email?: string;
  recaptchaToken?: string | null;
  title: string;
  message: string;
  website?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const contactRateLimitStore = new Map<string, RateLimitEntry>();

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v && typeof v === "string" && v.trim().length > 0) return v;
  return undefined;
}

function getRateLimitKey(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const connectingIp = req.headers.get("cf-connecting-ip")?.trim();
  const ip = forwardedFor || realIp || connectingIp || "unknown";
  const userAgent = (req.headers.get("user-agent") || "unknown").slice(0, 80);
  return `${ip}:${userAgent}`;
}

function checkRateLimit(req: NextRequest) {
  const now = Date.now();
  if (contactRateLimitStore.size > RATE_LIMIT_MAX_KEYS) {
    for (const [key, entry] of contactRateLimitStore) {
      if (entry.resetAt <= now) contactRateLimitStore.delete(key);
    }
  }

  const key = getRateLimitKey(req);
  const current = contactRateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    contactRateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_MESSAGES) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendEmail(params: {
  subject: string;
  text: string;
  html: string;
  replyToEmail?: string;
}): Promise<{ messageId?: string }> {
  const host = getEnv("SMTP_HOST");
  const portStr = getEnv("SMTP_PORT");
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS") || getEnv("SMTP_PASSWORD");
  const secureStr = getEnv("SMTP_SECURE");

  if (!host || !portStr || !user || !pass) {
    throw new Error(
      "Contact email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS or SMTP_PASSWORD.",
    );
  }

  const port = Number.parseInt(portStr, 10) || 587;
  const secure = (secureStr || "").toLowerCase() === "true" || port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  } as any);

  const info = await transporter.sendMail({
    from: CONTACT_FROM,
    to: CONTACT_TO,
    subject: params.subject,
    text: params.text,
    html: params.html,
    replyTo: params.replyToEmail,
  });
  return { messageId: info?.messageId };
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many contact messages. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  let body: ContactBody;

  try {
    body = (await req.json()) as ContactBody;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid request" }, { status: 400 });
  }

  const name = (body.name || "").toString().trim();
  const email = (body.email || "").toString().trim();
  const title = (body.title || "").toString().trim();
  const message = (body.message || "").toString().trim();
  const recaptchaToken = typeof body.recaptchaToken === "string" ? body.recaptchaToken.trim() : "";
  const website = (body.website || "").toString().trim();

  if (website) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  if (!title || !message) {
    return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
  }

  const recaptcha = await verifyRecaptchaToken(recaptchaToken, {
    action: "contact",
    logPrefix: "contact",
    minimumScore: 0.5,
  });
  if (!recaptcha.ok) {
    return NextResponse.json(
      { error: "Security verification failed. Please try again." },
      { status: 400 },
    );
  }

  const subject = `[Email From Contact Form] ${title}`;
  const text = [
    `Name: ${name || "(not provided)"}`,
    `Email: ${email || "(not provided)"}`,
    "",
    message,
    "",
    "This email is coming from Envitefy Contact Form.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${escapeHtml(name || "(not provided)")}</p>
      <p style="margin: 0 0 16px 0;"><strong>Email:</strong> ${escapeHtml(email || "(not provided)")}</p>
      <div style="white-space: pre-wrap; margin: 0 0 24px 0;">${escapeHtml(message)}</div>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        This email is coming from Envitefy Contact Form.
      </p>
    </div>
  `;

  try {
    const res = await sendEmail({
      subject,
      text,
      html,
      replyToEmail: email || undefined,
    });

    return NextResponse.json({
      ok: true,
      delivered: true,
      messageId: res.messageId || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to send message" }, { status: 500 });
  }
}
