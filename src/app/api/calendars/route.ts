import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleRefreshToken, getMicrosoftRefreshToken } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Read JWT (if present) to infer provider connections
  const tokenData = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  const providersFromJwt: any = (tokenData as any)?.providers || {};
  const email: string | undefined = (tokenData as any)?.email as string | undefined;

  // Legacy cookie-based OAuth fallbacks
  const googleCookie = request.cookies.get("g_refresh")?.value;
  const microsoftCookie = request.cookies.get("o_refresh")?.value;

  // Start with JWT signal or cookie presence
  // Consider Google "connected" only if we have a refresh token (JWT) or legacy cookie
  let googleConnected = Boolean(
    providersFromJwt?.google?.refreshToken ||
      googleCookie
  );
  let microsoftConnected = Boolean(
    providersFromJwt?.microsoft?.connected ||
      providersFromJwt?.microsoft?.refreshToken ||
      microsoftCookie
  );

  // If not connected yet but we have an email, check Supabase token store
  if (email && (!googleConnected || !microsoftConnected)) {
    try {
      if (!googleConnected) {
        const g = await getGoogleRefreshToken(email);
        googleConnected = Boolean(g);
      }
    } catch {
      // Supabase not configured or lookup failed; ignore
    }
    try {
      if (!microsoftConnected) {
        const m = await getMicrosoftRefreshToken(email);
        microsoftConnected = Boolean(m);
      }
    } catch {
      // ignore
    }
  }

  const resp = {
    google: googleConnected,
    microsoft: microsoftConnected,
    apple: Boolean(providersFromJwt?.apple?.connected) || false,
  };

  return NextResponse.json(resp);
}


