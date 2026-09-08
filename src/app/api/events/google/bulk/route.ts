import { getCalendarSyncPauseResponse } from "@/lib/calendar-sync-pause";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getGoogleCalendarRefreshToken } from "@/lib/google-calendar-connection";
import { google } from "googleapis";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";

export const runtime = "nodejs";

type BulkBody = {
  events: (NormalizedEvent & { intakeId?: string | null })[];
};

export async function POST(request: NextRequest) {
  const pausedResponse = getCalendarSyncPauseResponse();
  if (pausedResponse) return pausedResponse;

  try {
    const account = await getAuthenticatedRequestUser(request);
    if (!account.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const refreshToken = await getGoogleCalendarRefreshToken(account.email);
    if (!refreshToken) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

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
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

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


