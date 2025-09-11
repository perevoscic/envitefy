import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleRefreshToken, getMicrosoftRefreshToken } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Read JWT (if present) to infer provider connections
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-build-secret");
  const tokenData = await getToken({ req: request as any, secret });
  const providersFromJwt: any = (tokenData as any)?.providers || {};
  const email: string | undefined = (tokenData as any)?.email as string | undefined;

  // Legacy cookie-based OAuth fallbacks
  const googleCookie = request.cookies.get("g_refresh")?.value;
  const microsoftCookie = request.cookies.get("o_refresh")?.value;

  // Determine connection without cross-user cookie leakage:
  // - If signed in (email present), ignore legacy cookies; rely on JWT/DB
  // - If not signed in, allow legacy cookies as a convenience
  let googleConnected = Boolean(
    providersFromJwt?.google?.refreshToken
  );
  if (!googleConnected && !email && googleCookie) {
    googleConnected = true;
  }

  let microsoftConnected = Boolean(
    providersFromJwt?.microsoft?.connected ||
      providersFromJwt?.microsoft?.refreshToken
  );
  if (!microsoftConnected && !email && microsoftCookie) {
    microsoftConnected = true;
  }

  // If not connected yet but we have an email, check database token store
  if (email && (!googleConnected || !microsoftConnected)) {
    try {
      if (!googleConnected) {
        const g = await getGoogleRefreshToken(email);
        googleConnected = Boolean(g);
      }
    } catch {
      // Database lookup failed; ignore
    }
    try {
      if (!microsoftConnected) {
        const m = await getMicrosoftRefreshToken(email);
        microsoftConnected = Boolean(m);
      }
    } catch {
      // ignore
    }
    // Dev-only: if Google still not connected but legacy cookie exists, count it to reduce confusion during setup
    if (!googleConnected && process.env.NODE_ENV !== "production" && request.cookies.get("g_refresh")?.value) {
      googleConnected = true;
    }
  }

  const resp = {
    google: googleConnected,
    microsoft: microsoftConnected,
    apple: Boolean(providersFromJwt?.apple?.connected) || false,
  };

  return NextResponse.json(resp);
}


