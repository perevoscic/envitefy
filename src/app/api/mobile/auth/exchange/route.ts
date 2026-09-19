import { NextRequest, NextResponse } from "next/server";
import {
  consumeMobileAuthCode,
  mobileAuthEnabled,
  readMobileAuthBody,
  validMobilePost,
} from "@/lib/mobile-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

export async function POST(request: NextRequest) {
  if (!mobileAuthEnabled())
    return NextResponse.json(
      { error: "iPhone sign-in is not enabled yet." },
      { status: 503, headers },
    );
  try {
    if (!validMobilePost(request, false))
      return NextResponse.json({ error: "Invalid request." }, { status: 403, headers });
    const body = await readMobileAuthBody(request);
    if (!body || typeof body.code !== "string" || typeof body.verifier !== "string") {
      return NextResponse.json({ error: "Invalid sign-in handoff." }, { status: 400, headers });
    }
    const handoff = await consumeMobileAuthCode(body.code, body.verifier);
    if (!handoff)
      return NextResponse.json(
        { error: "Sign-in expired or was already used. Please try again." },
        { status: 401, headers },
      );
    const response = NextResponse.json({ returnTo: handoff.return_to }, { headers });
    const name =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      expires: new Date(handoff.session_expires),
    };
    // Match NextAuth's chunking for sessions larger than a browser cookie.
    const chunks = handoff.session_token.match(/.{1,3933}/g) || [];
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name === name || cookie.name.startsWith(`${name}.`))
        response.cookies.set(cookie.name, "", { ...options, maxAge: 0 });
    }
    chunks.forEach((chunk, index) => {
      response.cookies.set(chunks.length === 1 ? name : `${name}.${index}`, chunk, options);
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to finish iPhone sign-in. Please try again." },
      { status: 503, headers },
    );
  }
}
