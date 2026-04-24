import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const CONTACT_TO = "contact@envitefy.com";

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
  subject: string;
  text: string;
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
  const from = getEnv("SMTP_FROM") || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  } as any);

  const info = await transporter.sendMail({
    from,
    to: CONTACT_TO,
    subject: params.subject,
    text: params.text,
    replyTo: params.replyToEmail,
  });
  return { messageId: info?.messageId };
}

export async function POST(req: NextRequest) {
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

  if (!title || !message) {
    return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
  }

  const subject = `[Contact] ${title}`;
  const text = [
    `Name: ${name || "(not provided)"}`,
    `Email: ${email || "(not provided)"}`,
    "",
    message,
  ].join("\n");

  try {
    const res = await sendEmail({
      subject,
      text,
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
