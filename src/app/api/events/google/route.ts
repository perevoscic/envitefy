import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const tokenData = await getToken({ req: request as any });
    if (!tokenData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const providers = (tokenData as any).providers || {};
    const g = providers.google || {};
    const refreshToken = g.refreshToken;
    if (!refreshToken) {
      return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    }

    const body: NormalizedEvent = await request.json();
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
    return NextResponse.json({ htmlLink: created.data.htmlLink, id: created.data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


