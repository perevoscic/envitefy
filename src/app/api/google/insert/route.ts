import { google } from "googleapis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, start, end, location, description, timezone = "America/Chicago" } = body || {};

    const refreshToken = (request.headers.get("x-refresh-token") || "").trim();
    if (!refreshToken) return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
    const event: {
      summary: string;
      description: string;
      location: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
    } = {
      summary: title || "Event",
      description: description || "",
      location: location || "",
      start: { dateTime: start, timeZone: timezone },
      end: { dateTime: end, timeZone: timezone }
    };

    const created = await calendar.events.insert({ calendarId: "primary", requestBody: event });
    return NextResponse.json({ htmlLink: created.data.htmlLink });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


