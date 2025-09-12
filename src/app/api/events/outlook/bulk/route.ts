import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NormalizedEvent, toMicrosoftEvent } from "@/lib/mappers";

export const runtime = "nodejs";

type BulkBody = {
  events: (NormalizedEvent & { intakeId?: string | null })[];
};

export async function POST(request: NextRequest) {
  try {
    const secret =
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      (process.env.NODE_ENV === "production" ? undefined : "dev-build-secret");
    const tokenData = await getToken({ req: request as any, secret });
    if (!tokenData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const email = (tokenData as any).email as string | undefined;
    if (!email) return NextResponse.json({ error: "Missing user email" }, { status: 400 });

    let refreshToken: string | null = null;
    try {
      const { getMicrosoftRefreshToken } = await import("@/lib/db");
      refreshToken = await getMicrosoftRefreshToken(email);
    } catch {}
    if (!refreshToken) {
      const providers = (tokenData as any).providers || {};
      const m = providers.microsoft || {};
      if (m.refreshToken) refreshToken = m.refreshToken as string;
    }
    if (!refreshToken) {
      const legacy = request.cookies.get("o_refresh")?.value;
      if (legacy) refreshToken = legacy;
    }
    if (!refreshToken) return NextResponse.json({ error: "Microsoft not connected" }, { status: 400 });

    const body: BulkBody = await request.json();
    const items = Array.isArray(body?.events) ? body.events : [];
    if (!items.length) return NextResponse.json({ error: "No events provided" }, { status: 400 });

    // Exchange refresh token for access token
    const tenant = process.env.OUTLOOK_TENANT_ID || "common";
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("client_id", process.env.OUTLOOK_CLIENT_ID!);
    params.append("client_secret", process.env.OUTLOOK_CLIENT_SECRET!);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);
    params.append("scope", "offline_access https://graph.microsoft.com/Calendars.ReadWrite");

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
        detail?.error_description || detail?.error?.message || detail?.message || text || "Failed to refresh token";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const tokens: { access_token?: string } = await tokenResp.json();
    const accessToken = tokens.access_token;
    if (!accessToken) return NextResponse.json({ error: "No access token" }, { status: 500 });

    const results: { index: number; id?: string | null; webLink?: string | null; error?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      const ev = items[i];
      try {
        const graphBody = toMicrosoftEvent(ev);
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
          const message = detail?.error?.message || detail?.message || text || "Failed to create event";
          results.push({ index: i, error: message });
          continue;
        }
        const created: { webLink?: string; id?: string } = await createResp.json();
        results.push({ index: i, id: created.id || null, webLink: created.webLink || null });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        results.push({ index: i, error: message });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


