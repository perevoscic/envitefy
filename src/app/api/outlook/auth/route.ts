import { CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";
import { NextResponse } from "next/server";
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
  const clientId = process.env.OUTLOOK_CLIENT_ID!;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI!;
  const scopes = "offline_access https://graph.microsoft.com/Calendars.ReadWrite";
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";
  const nextPath = normalizeInternalRedirect(searchParams.get("next")) || "/settings#calendars";
  const payload = nextPath
    ? Buffer.from(
        encodeURIComponent(JSON.stringify({ type: "oauth_redirect", next: nextPath })),
      ).toString("base64")
    : null;
  const { state, nonce } = await createCalendarOAuthState(account, "microsoft", payload);

  const authorizationUrl = new URL(
    `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize`,
  );
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: scopes,
    state,
  }).toString();
  return setCalendarOAuthCookie(NextResponse.redirect(authorizationUrl), "microsoft", nonce);
}


