import { CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { GOOGLE_CALENDAR_EVENT_WRITE_SCOPE } from "@/lib/google-calendar-oauth";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { createCalendarOAuthState, setCalendarOAuthCookie } from "@/lib/calendar-oauth-state";

export const runtime = "nodejs";

function normalizeInternalRedirect(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

export async function GET(request: Request) {
  if (!CONNECTED_CALENDAR_SYNC_ENABLED) {
    return NextResponse.redirect(new URL("/settings#calendars", request.url));
  }

  const account = await getAuthenticatedRequestUser(request);
  if (!account.ok) {
    return NextResponse.json({ error: "Sign in before connecting a calendar" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const includeAnalyticsScope = searchParams.get("analytics") === "1";
  const explicitState = searchParams.get("state") || undefined;
  const nextPath = normalizeInternalRedirect(searchParams.get("next"));
  const redirectState =
    !explicitState && nextPath
      ? Buffer.from(
          encodeURIComponent(JSON.stringify({ type: "oauth_redirect", next: nextPath })),
        ).toString("base64")
      : undefined;
  const { state, nonce } = await createCalendarOAuthState(
    account, "google", explicitState ?? redirectState ?? null,
  );
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  const scopes = [
    GOOGLE_CALENDAR_EVENT_WRITE_SCOPE,
    "openid",
    "email",
    "profile",
  ];
  if (includeAnalyticsScope) {
    scopes.push("https://www.googleapis.com/auth/analytics.readonly");
  }

  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    scope: scopes,
    // Calendar connections need a fresh offline token even when Google remembers an older grant.
    prompt: "consent",
    ...(includeAnalyticsScope && process.env.GOOGLE_ANALYTICS_OAUTH_EMAIL
      ? { login_hint: process.env.GOOGLE_ANALYTICS_OAUTH_EMAIL }
      : {}),
    state,
  });
  return setCalendarOAuthCookie(NextResponse.redirect(url), "google", nonce);
}

