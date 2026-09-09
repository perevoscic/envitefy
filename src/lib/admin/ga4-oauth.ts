import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import {
  createCalendarOAuthState,
  finishCalendarOAuth,
  readCalendarOAuthState,
  setCalendarOAuthCookie,
} from "@/lib/calendar-oauth-state";
import { getIsAdminByEmail } from "@/lib/db";
import { saveGa4Connection } from "@/lib/admin/ga4-connection";

const PROVIDER = "google-analytics";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

function redirectToAnalytics(request: Request, result: string) {
  const url = new URL("/admin/analytics", request.url);
  url.searchParams.set("analyticsAuth", result);
  return finishCalendarOAuth(NextResponse.redirect(url), PROVIDER);
}

export async function beginGa4OAuth(request: Request): Promise<NextResponse> {
  const account = await getAuthenticatedRequestUser(request);
  if (!account.ok) {
    return NextResponse.json(
      { error: "Sign in before connecting Google Analytics" },
      { status: 401 },
    );
  }
  if (!(await getIsAdminByEmail(account.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { state, nonce } = await createCalendarOAuthState(account, PROVIDER, null);
  const url = createOAuthClient().generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", ANALYTICS_SCOPE],
    prompt: "consent select_account",
    state,
  });
  return setCalendarOAuthCookie(NextResponse.redirect(url), PROVIDER, nonce);
}

export async function completeGa4OAuth(
  request: Request,
  account: { userId: string; email: string },
): Promise<NextResponse | null> {
  const connection = await readCalendarOAuthState(request, account, PROVIDER);
  if (!connection) return null;
  if (!(await getIsAdminByEmail(account.email))) {
    return finishCalendarOAuth(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      PROVIDER,
    );
  }
  const params = new URL(request.url).searchParams;
  if (params.get("error") === "access_denied") return redirectToAnalytics(request, "cancelled");
  const code = params.get("code");
  if (!code || params.has("error")) return redirectToAnalytics(request, "failed");

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    const scopes = new Set((tokens.scope || "").split(/\s+/));
    if (!scopes.has(ANALYTICS_SCOPE) && !scopes.has("https://www.googleapis.com/auth/analytics")) {
      return redirectToAnalytics(request, "missing-scope");
    }
    if (!tokens.refresh_token) return redirectToAnalytics(request, "missing-refresh-token");
    if (!tokens.id_token) return redirectToAnalytics(request, "identity-error");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const identity = ticket.getPayload();
    if (!identity?.email || !identity.email_verified) {
      return redirectToAnalytics(request, "identity-error");
    }
    await saveGa4Connection(
      { email: identity.email, refreshToken: tokens.refresh_token },
      account.userId,
    );
    return redirectToAnalytics(request, "connected");
  } catch {
    return redirectToAnalytics(request, "failed");
  }
}
