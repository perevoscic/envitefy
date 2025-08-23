import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

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

    const response = NextResponse.redirect(new URL("/", request.url));
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


