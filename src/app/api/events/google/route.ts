import { getCalendarSyncPauseResponse } from "@/lib/calendar-sync-pause";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getGoogleCalendarRefreshToken } from "@/lib/google-calendar-connection";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const pausedResponse = getCalendarSyncPauseResponse();
  if (pausedResponse) return pausedResponse;

  try {
    const account = await getAuthenticatedRequestUser(request);
    if (!account.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const refreshToken = await getGoogleCalendarRefreshToken(account.email);
    if (!refreshToken) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

    const body: NormalizedEvent & { intakeId?: string | null } = await request.json();
    const requestBody = toGoogleEvent(body);

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody,
    });

    // Removed status update

    return NextResponse.json({ htmlLink: created.data.htmlLink, id: created.data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const code: number | undefined = (err as any)?.code as number | undefined;
    const lower = String(message || "").toLowerCase();
    // Map insufficient scope/authorization errors to 401 so the client can start calendar OAuth
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


