import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const source =
    body?.source === "snap" || body?.source === "gymnastics" ? body.source : null;

  if (!source) {
    return NextResponse.json(
      { error: "Valid signup source is required." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true, source });
  response.cookies.set("envitefy_signup_source", source, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
