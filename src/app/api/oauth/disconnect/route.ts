import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import {
  deleteStoredOAuthTokens,
  getGoogleRefreshToken,
  getUserByEmail,
  updatePreferredProviderByEmail,
} from "@/lib/db";

export const runtime = "nodejs";

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;

async function revokeGoogleToken(token: string | null) {
  if (!token) return;
  try {
    const response = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
    if (!response.ok) {
      console.warn("[oauth-disconnect] Google token revocation was not confirmed", response.status);
    }
  } catch (error) {
    console.warn("[oauth-disconnect] Google token revocation failed; local token will still be removed", error);
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedRequestUser(request);
  if (!authUser.ok || !authUser.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const provider = body?.provider === "google" || body?.provider === "microsoft"
    ? body.provider
    : body?.provider == null
      ? undefined
      : null;
  if (provider === null) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  if (!provider || provider === "google") {
    await revokeGoogleToken(await getGoogleRefreshToken(authUser.email));
  }
  const deleted = await deleteStoredOAuthTokens(authUser.email, provider);
  const user = await getUserByEmail(authUser.email);
  if (!provider || user?.preferred_provider === provider) {
    await updatePreferredProviderByEmail({
      email: authUser.email,
      preferredProvider: null,
    });
  }

  const response = NextResponse.json({
    ok: true,
    deleted,
    disconnectedProvider: provider || "all",
    reauthenticationRequired: !provider,
  });
  response.headers.set("Cache-Control", "no-store");
  const cookieNames = provider
    ? [provider === "google" ? "g_refresh" : "o_refresh"]
    : ["g_refresh", "o_refresh", ...SESSION_COOKIE_NAMES];
  for (const name of cookieNames) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
