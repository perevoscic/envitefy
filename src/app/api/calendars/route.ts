import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getGoogleRefreshToken, getMicrosoftRefreshToken } from "@/lib/db";

export const runtime = "nodejs";

type CalendarProviderStatus = {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
};

type JsonObject = Record<string, unknown>;

const DISCONNECTED: CalendarProviderStatus = {
  google: false,
  microsoft: false,
  apple: false,
};

function asObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object") return {};
  return value as JsonObject;
}

export async function GET(request: NextRequest) {
  try {
    // Keep secret resolution in sync with auth configuration to avoid token decode failures.
    const secret =
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      "dev-build-secret";

    let tokenData: JsonObject | null = null;
    try {
      const raw = await getToken({ req: request, secret });
      tokenData = asObject(raw);
    } catch (err) {
      // Invalid/mismatched cookies should not break this endpoint.
      try {
        console.warn("[/api/calendars] getToken failed:", String(err));
      } catch {}
      tokenData = null;
    }

    const providersFromJwt = asObject(tokenData?.providers);
    const googleProvider = asObject(providersFromJwt.google);
    const microsoftProvider = asObject(providersFromJwt.microsoft);
    const appleProvider = asObject(providersFromJwt.apple);
    const email = typeof tokenData?.email === "string" ? tokenData.email : undefined;

    // Legacy cookie-based OAuth fallbacks
    const googleCookie = request.cookies.get("g_refresh")?.value;
    const microsoftCookie = request.cookies.get("o_refresh")?.value;

    // Determine connection without cross-user cookie leakage:
    // - If signed in (email present), ignore legacy cookies; rely on JWT/DB
    // - If not signed in, allow legacy cookies as a convenience
    let googleConnected = Boolean(googleProvider.refreshToken);
    if (!googleConnected && !email && googleCookie) {
      googleConnected = true;
    }

    let microsoftConnected = Boolean(
      microsoftProvider.connected || microsoftProvider.refreshToken
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
      } catch {}
      try {
        if (!microsoftConnected) {
          const m = await getMicrosoftRefreshToken(email);
          microsoftConnected = Boolean(m);
        }
      } catch {}
      // Dev-only: if Google still not connected but legacy cookie exists, count it to reduce confusion during setup
      if (
        !googleConnected &&
        process.env.NODE_ENV !== "production" &&
        request.cookies.get("g_refresh")?.value
      ) {
        googleConnected = true;
      }
    }

    const resp: CalendarProviderStatus = {
      google: googleConnected,
      microsoft: microsoftConnected,
      apple: Boolean(appleProvider.connected) || false,
    };

    return NextResponse.json(resp);
  } catch (err) {
    try {
      console.error("[/api/calendars] unexpected failure:", String(err));
    } catch {}
    // Never surface a 500 to the client for connection status checks.
    return NextResponse.json(DISCONNECTED);
  }
}


