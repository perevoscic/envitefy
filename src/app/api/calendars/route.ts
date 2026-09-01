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
    const email = typeof tokenData?.email === "string" ? tokenData.email : undefined;

    // Legacy cookie-based OAuth fallbacks
    const googleCookie = request.cookies.get("g_refresh")?.value;
    const microsoftCookie = request.cookies.get("o_refresh")?.value;

    // The database is authoritative for signed-in users. JWT provider data can outlive a
    // provider-specific disconnect, so it must not keep a disconnected calendar active.
    let googleConnected = false;
    let microsoftConnected = false;
    if (email) {
      try {
        googleConnected = Boolean(await getGoogleRefreshToken(email));
      } catch {}
      try {
        microsoftConnected = Boolean(await getMicrosoftRefreshToken(email));
      } catch {}
    } else {
      googleConnected = Boolean(googleProvider.refreshToken || googleCookie);
      microsoftConnected = Boolean(
        microsoftProvider.connected || microsoftProvider.refreshToken || microsoftCookie,
      );
    }

    const resp: CalendarProviderStatus = {
      google: googleConnected,
      microsoft: microsoftConnected,
      apple: false,
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


