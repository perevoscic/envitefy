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

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      return NextResponse.json({ error: text || "Failed to refresh token" }, { status: 500 });
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
      const text = await createResp.text();
      return NextResponse.json({ error: text || "Failed to create event" }, { status: 500 });
    }
    const created: { webLink?: string; id?: string } = await createResp.json();

    // Removed Supabase status update

    return NextResponse.json({ webLink: created.webLink, id: created.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


