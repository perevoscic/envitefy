import { NextResponse } from "next/server";
import {
  createLegalAcceptanceToken,
  LEGAL_ACCEPTANCE_COOKIE_NAME,
  legalAcceptanceCookieMaxAge,
} from "@/lib/legal-acceptance";
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/lib/legal-versions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (
    body?.ageConfirmed !== true ||
    body?.termsAccepted !== true ||
    body?.privacyAcknowledged !== true ||
    body?.termsVersion !== CURRENT_TERMS_VERSION ||
    body?.privacyVersion !== CURRENT_PRIVACY_VERSION ||
    (body?.source !== "email_signup" && body?.source !== "google_signup")
  ) {
    return NextResponse.json(
      { error: "You must confirm your age and accept the current legal terms." },
      { status: 400 },
    );
  }

  const { token } = await createLegalAcceptanceToken({
    headers: request.headers,
    source: body.source,
  });
  const response = NextResponse.json({
    ok: true,
    termsVersion: CURRENT_TERMS_VERSION,
    privacyVersion: CURRENT_PRIVACY_VERSION,
  });
  response.cookies.set(LEGAL_ACCEPTANCE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: legalAcceptanceCookieMaxAge,
  });
  return response;
}
