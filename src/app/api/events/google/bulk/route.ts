import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { google } from "googleapis";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";

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
    const providers = (tokenData as any)?.providers || {};
    const email = (tokenData as any)?.email as string | undefined;
    const g = providers.google || {};
    let refreshToken: string | undefined;
    let accessToken: string | undefined;
    const expiresAt = g.expiresAt as number | undefined;

    // Signed-in calendar access follows the database so disconnect takes effect immediately.
    if (email) {
      try {
        const { getGoogleRefreshToken } = await import("@/lib/db");
        refreshToken = (await getGoogleRefreshToken(email)) || undefined;
      } catch {}
    } else {
      refreshToken = (g.refreshToken as string | undefined) || request.cookies.get("g_refresh")?.value;
      accessToken = g.accessToken as string | undefined;
    }
    if (!refreshToken && !accessToken) {
      const reason = tokenData ? "Google not connected" : "Unauthorized";
      const status = tokenData ? 400 : 401;
      return NextResponse.json({ error: reason }, { status });
    }

    const body: BulkBody = await request.json();
    const items = Array.isArray(body?.events) ? body.events : [];
    if (!items.length) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    if (refreshToken) {
      oAuth2Client.setCredentials({ refresh_token: refreshToken });
    } else if (accessToken) {
      oAuth2Client.setCredentials({ access_token: accessToken, expiry_date: expiresAt });
    }

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const results: { index: number; id?: string | null; htmlLink?: string | null; error?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      const ev = items[i];
      try {
        const requestBody = toGoogleEvent(ev);
        const created = await calendar.events.insert({ calendarId: "primary", requestBody });
        results.push({ index: i, id: created.data.id || null, htmlLink: created.data.htmlLink || null });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        results.push({ index: i, error: message });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const code: number | undefined = (err as any)?.code as number | undefined;
    const lower = String(message || "").toLowerCase();
    if (
      code === 401 ||
      code === 403 ||
      lower.includes("insufficient") ||
      lower.includes("forbidden") ||
      lower.includes("unauthorized") ||
      lower.includes("insufficient authentication scopes")
    ) {
      return NextResponse.json({ error: "Google not connected" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


