import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
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
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const redirectPath = readRedirectPath(searchParams.get("state"));
    if (!code) {
      if (redirectPath) {
        const redirectUrl = new URL(await absoluteUrl(redirectPath));
        redirectUrl.searchParams.set("outlookAuth", "not-stored");
        redirectUrl.searchParams.set(
          "outlookAuthReason",
          searchParams.get("error") || "missing_code",
        );
        return NextResponse.redirect(redirectUrl);
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

    const tokens: { access_token?: string; refresh_token?: string } = await tokenResp.json();
    const refresh = tokens.refresh_token;
    if (!refresh) return NextResponse.json({ error: "No refresh token" }, { status: 400 });

    // Persist refresh token to the database for the signed-in user and set preference
    let tokenPersisted = false;
    try {
      const secret =
        process.env.AUTH_SECRET ??
        process.env.NEXTAUTH_SECRET ??
        (process.env.NODE_ENV === "production" ? undefined : "dev-build-secret");
      const tokenData = await getToken({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: request as any,
        secret,
      });
      const email = (tokenData as any)?.email as string | undefined;
      if (email) {
        await saveMicrosoftRefreshToken(email, refresh);
        await updatePreferredProviderByEmail({ email, preferredProvider: "microsoft" });
        tokenPersisted = true;
      }
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
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set({
      name: "o_refresh",
      value: refresh,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
