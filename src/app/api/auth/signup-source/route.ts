import { NextResponse } from "next/server";
import { readCookieValue } from "@/lib/legal-acceptance";
import { normalizeSignupIntent, resolveSignupContext } from "@/lib/signup-intent";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (
    (body?.intent != null && !normalizeSignupIntent(body.intent)) ||
    (body?.source != null && !normalizeSignupIntent(body.source))
  ) {
    return NextResponse.json({ error: "Valid signup source is required." }, { status: 400 });
  }
  const { intent, source, path } = resolveSignupContext({
    intent: body?.intent,
    source: body?.source,
    path: body?.path,
    previousIntent:
      readCookieValue(req.headers.get("cookie"), "envitefy_signup_intent") ||
      readCookieValue(req.headers.get("cookie"), "envitefy_signup_source"),
    previousPath: readCookieValue(req.headers.get("cookie"), "envitefy_signup_path"),
  });
  const response = NextResponse.json({ ok: true, source, intent });
  const options = {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  response.cookies.set("envitefy_signup_source", source, options);
  response.cookies.set("envitefy_signup_intent", intent, options);
  response.cookies.set("envitefy_signup_path", path || "", {
    ...options,
    maxAge: path ? options.maxAge : 0,
  });
  return response;
}
