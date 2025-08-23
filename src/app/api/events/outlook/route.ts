import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NormalizedEvent, toMicrosoftEvent } from "@/lib/mappers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const tokenData = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    if (!tokenData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const providers = (tokenData as any).providers || {};
    const m = providers.microsoft || {};
    const refreshToken = m.refreshToken as string | undefined;
    if (!refreshToken) {
      return NextResponse.json({ error: "Microsoft not connected" }, { status: 400 });
    }

    const body: (NormalizedEvent & { intakeId?: string | null }) = await request.json();
    const graphBody = toMicrosoftEvent(body);

    // Exchange refresh token for access token
    const tenant = process.env.OUTLOOK_TENANT_ID || "common";
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", process.env.OUTLOOK_CLIENT_ID!);
    params.append("client_secret", process.env.OUTLOOK_CLIENT_SECRET!);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);
    // Ensure the refreshed access token includes calendar scopes
    params.append("scope", "openid email profile offline_access Calendars.ReadWrite");

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!tokenResp.ok) {
      let detail: any = null;
      try { detail = await tokenResp.json(); } catch {}
      const text = !detail ? await tokenResp.text().catch(() => "") : "";
      const message =
        detail?.error_description ||
        detail?.error?.message ||
        detail?.message ||
        text ||
        "Failed to refresh token";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const tokens: { access_token?: string } = await tokenResp.json();
    const accessToken = tokens.access_token;
    if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 500 });

    const createResp = await fetch("https://graph.microsoft.com/v1.0/me/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(graphBody),
    });
    if (!createResp.ok) {
      let detail: any = null;
      try { detail = await createResp.json(); } catch {}
      const text = !detail ? await createResp.text().catch(() => "") : "";
      const message =
        detail?.error?.message ||
        detail?.message ||
        text ||
        "Failed to create event";
      return NextResponse.json({ error: message, debug: { request: graphBody } }, { status: 500 });
    }
    const created: { webLink?: string; id?: string } = await createResp.json();

    // Removed Supabase status update

    return NextResponse.json({ webLink: created.webLink, id: created.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


