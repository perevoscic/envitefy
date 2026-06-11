import { NextResponse } from "next/server";
import { normalizeSignupIntent, signupSourceForIntent } from "@/lib/signup-intent";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const intent = normalizeSignupIntent(body?.intent ?? body?.source);
  const source =
    body?.source === "snap" || body?.source === "gymnastics"
      ? body.source
      : intent
        ? signupSourceForIntent(intent)
        : null;

  if (!source) {
    return NextResponse.json(
      { error: "Valid signup source is required." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true, source, intent });
  response.cookies.set("envitefy_signup_source", source, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  if (intent) {
    response.cookies.set("envitefy_signup_intent", intent, {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}
