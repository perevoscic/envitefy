import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import {
  isMobileAuthRandom,
  mobileAuthCallback,
  mobileReturnPath,
} from "@/lib/mobile-auth-contract";
import {
  issueMobileAuthCode,
  mobileAuthEnabled,
  mobileAuthSecret,
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
    if (!validMobilePost(request, true))
      return NextResponse.json({ error: "Invalid request." }, { status: 403, headers });
    const body = await readMobileAuthBody(request);
    if (!body || !isMobileAuthRandom(body.challenge) || !isMobileAuthRandom(body.state)) {
      return NextResponse.json(
        { error: "Reopen sign-in from the Envitefy app." },
        { status: 400, headers },
      );
    }
    const auth = await getAuthenticatedRequestUser(request);
    if (!auth.ok)
      return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers });
    const options = {
      req: request,
      secret: mobileAuthSecret(),
      secureCookie: process.env.NODE_ENV === "production",
    };
    const token = await getToken(options);
    const raw = await getToken({ ...options, raw: true });
    if (!raw || !token || typeof token.exp !== "number" || token.exp <= Date.now() / 1000) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers });
    }
    const code = await issueMobileAuthCode({
      userId: auth.userId,
      challenge: body.challenge,
      sessionToken: raw,
      sessionExpires: new Date(token.exp * 1000),
      returnTo: mobileReturnPath(typeof body.returnTo === "string" ? body.returnTo : "/"),
    });
    if (!code)
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again later." },
        { status: 429, headers },
      );
    return NextResponse.json({ callback: mobileAuthCallback(code, body.state) }, { headers });
  } catch {
    // Never log tokens, verifier, authorization code, cookies, or full request URL.
    return NextResponse.json(
      { error: "Unable to finish iPhone sign-in. Please try again." },
      { status: 503, headers },
    );
  }
}
