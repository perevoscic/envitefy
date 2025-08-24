import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";
import { getGoogleRefreshToken } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const tokenData = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    const providers = (tokenData as any)?.providers || {};
    const email = (tokenData as any)?.email as string | undefined;
    const g = providers.google || {};
    let refreshToken = g.refreshToken as string | undefined;
    let accessToken = g.accessToken as string | undefined;
    const expiresAt = g.expiresAt as number | undefined;

    // Fallback: accept refresh token from our legacy cookie if present
    if (!refreshToken && !accessToken) {
      const legacy = request.cookies.get("g_refresh")?.value;
      if (legacy) refreshToken = legacy;
    }
    // Fallback: load refresh token from Supabase if available
    if (!refreshToken && !accessToken && email) {
      try {
        const supa = await getGoogleRefreshToken(email);
        if (supa) refreshToken = supa;
      } catch {}
    }
    if (!refreshToken && !accessToken) {
      const reason = tokenData ? "Google not connected" : "Unauthorized";
      const status = tokenData ? 400 : 401;
      return NextResponse.json({ error: reason }, { status });
    }

    const body: NormalizedEvent & { intakeId?: string | null } = await request.json();
    const requestBody = toGoogleEvent(body);

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
    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody,
    });

    // Removed Supabase status update

    return NextResponse.json({ htmlLink: created.data.htmlLink, id: created.data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


