import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export const runtime = "nodejs";

type ContactBody = {
  name?: string;
  email?: string;
  title: string;
  message: string;
};

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v && typeof v === "string" && v.trim().length > 0) return v;
  return undefined;
}

async function sendEmail(params: {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyToEmail?: string;
}): Promise<{ delivered: boolean; messageId?: string }> {
  // Prefer SES if configured
  const sesFrom =
    getEnv("SES_FROM_EMAIL_CONTACT") ||
    getEnv("SES_FROM_EMAIL") ||
    getEnv("SES_FROM_EMAIL_NO_REPLY");
  if (sesFrom) {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    const ses = new SESv2Client({ region });
    const cmd = new SendEmailCommand({
      FromEmailAddress: sesFrom,
      Destination: { ToAddresses: [params.to] },
      Content: {
        Simple: {
          Subject: { Data: params.subject },
          Body: { Text: { Data: params.text } },
        },
      },
      ReplyToAddresses: params.replyToEmail ? [params.replyToEmail] : undefined,
    });
    const info = await ses.send(cmd);
    return { delivered: true, messageId: (info as any)?.MessageId };
  }

  // Fallback to SMTP if available
  const host = getEnv("SMTP_HOST");
  const portStr = getEnv("SMTP_PORT");
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS") || getEnv("SMTP_PASSWORD");
  const secureStr = getEnv("SMTP_SECURE");

  if (!host || !portStr || !user || !pass) {
    // In dev or when neither SES nor SMTP is configured, pretend success without sending.
    return { delivered: false };
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
    from: params.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    replyTo: params.replyToEmail,
  });
  return { delivered: true, messageId: info?.messageId };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactBody;
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim();
    const title = (body.title || "").toString().trim();
    const message = (body.message || "").toString().trim();

    if (!title || !message) {
      return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
    }

    const receiver = getEnv("CONTACT_TO") || "contact@snapmydate.com";
    const from =
      getEnv("SES_FROM_EMAIL_CONTACT") ||
      getEnv("SES_FROM_EMAIL") ||
      getEnv("SES_FROM_EMAIL_NO_REPLY") ||
      getEnv("SMTP_FROM") ||
      "no-reply@snapmydate.com";

    const subject = `[Contact] ${title}`;
    const text = [
      `Name: ${name || "(not provided)"}`,
      `Email: ${email || "(not provided)"}`,
      "",
      message,
    ].join("\n");

    let delivered = false;
    try {
      const res = await sendEmail({ from, to: receiver || from, subject, text, replyToEmail: email || undefined });
      delivered = !!res.delivered;
    } catch {
      delivered = false;
    }

    return NextResponse.json({ ok: true, delivered });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid request" }, { status: 400 });
  }
}


