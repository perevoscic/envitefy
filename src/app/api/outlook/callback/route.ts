import { CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";
import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { finishCalendarOAuth, readCalendarOAuthState } from "@/lib/calendar-oauth-state";
import { saveMicrosoftRefreshToken, updatePreferredProviderByEmail } from "@/lib/db";
import { absoluteUrl } from "@/lib/absolute-url";

export const runtime = "nodejs";

function normalizeInternalRedirect(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

function readRedirectPath(state: string | null): string | null {
  if (!state) return null;
  try {
    const json = Buffer.from(state, "base64").toString("utf8");
    const decoded: { type?: string; next?: string } = JSON.parse(decodeURIComponent(json));
    return decoded.type === "oauth_redirect"
      ? normalizeInternalRedirect(decoded.next || null)
      : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!CONNECTED_CALENDAR_SYNC_ENABLED) {
    return NextResponse.redirect(new URL("/settings#calendars", request.url));
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const account = await getAuthenticatedRequestUser(request);
    if (!account.ok) {
      return NextResponse.json({ error: "Sign in before connecting a calendar" }, { status: 401 });
    }
    const connection = await readCalendarOAuthState(request, account, "microsoft");
    if (!connection) {
      return NextResponse.json({ error: "Calendar connection expired or account changed. Reconnect from Settings." }, { status: 400 });
    }
    const redirectPath = readRedirectPath(connection.payload);
    if (!code) {
      if (redirectPath) {
        const redirectUrl = new URL(await absoluteUrl(redirectPath));
        redirectUrl.searchParams.set("outlookAuth", "not-stored");
        redirectUrl.searchParams.set(
          "outlookAuthReason",
          searchParams.get("error") || "missing_code",
        );
        return finishCalendarOAuth(NextResponse.redirect(redirectUrl), "microsoft");
      }
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const tenant = process.env.OUTLOOK_TENANT_ID || "common";
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", process.env.OUTLOOK_CLIENT_ID!);
    params.append("client_secret", process.env.OUTLOOK_CLIENT_SECRET!);
    params.append("redirect_uri", process.env.OUTLOOK_REDIRECT_URI!);
    params.append("grant_type", "authorization_code");
    params.append("code", code);

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      return NextResponse.json({ error: text || "Token exchange failed" }, { status: 500 });
    }

    const tokens: { access_token?: string; refresh_token?: string; scope?: string } = await tokenResp.json();
    const refresh = tokens.refresh_token;
    if (!refresh) return NextResponse.json({ error: "No refresh token" }, { status: 400 });
    // Microsoft may omit scope when it matches the fixed scopes requested by /auth.
    const grantedScopes = tokens.scope ?? "Calendars.ReadWrite";
    if (!grantedScopes.split(/\s+/).some((scope) =>
      decodeURIComponent(scope).toLowerCase() === "calendars.readwrite" ||
      decodeURIComponent(scope).toLowerCase() === "https://graph.microsoft.com/calendars.readwrite"
    )) {
      return finishCalendarOAuth(NextResponse.json({ error: "Calendar permission was not granted" }, { status: 400 }), "microsoft");
    }

    // Persist refresh token to the database for the signed-in user and set preference
    let tokenPersisted = false;
    try {
      const email = account.email;
      await saveMicrosoftRefreshToken(email, refresh);
      await updatePreferredProviderByEmail({ email, preferredProvider: "microsoft" });
      tokenPersisted = true;
    } catch {
      // ignore persistence errors
    }

    const redirectUrl = new URL(await absoluteUrl(redirectPath || "/"));
    if (redirectPath) {
      redirectUrl.searchParams.set("outlookAuth", tokenPersisted ? "stored" : "not-stored");
      if (!tokenPersisted) {
        redirectUrl.searchParams.set("outlookAuthReason", "token_not_persisted");
      }
    }
    return finishCalendarOAuth(NextResponse.redirect(redirectUrl), "microsoft");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
