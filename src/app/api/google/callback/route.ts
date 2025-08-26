import { google } from "googleapis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );
    const { tokens } = await oAuth2Client.getToken(code);
    const refresh = tokens.refresh_token;
    if (refresh) {
      // Persist refresh token in cookie for server use
      const cookieResp = NextResponse.next();
      cookieResp.cookies.set({
        name: "g_refresh",
        value: refresh,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      });
    }

    // If we carried an event in state, create the event now and redirect to it
    if (state) {
      try {
        const json = Buffer.from(state, "base64").toString("utf8");
        const decoded = JSON.parse(decodeURIComponent(json));
        // Build Google client with either refresh or access token
        if (refresh) {
          oAuth2Client.setCredentials({ refresh_token: refresh });
        } else if (tokens.access_token) {
          oAuth2Client.setCredentials({ access_token: tokens.access_token, expiry_date: tokens.expiry_date });
        }
        const calendar = google.calendar({ version: "v3", auth: oAuth2Client as any });
        const requestBody = {
          summary: decoded.title || "Event",
          description: decoded.description || "",
          location: decoded.location || "",
          start: { dateTime: decoded.start, timeZone: decoded.timezone },
          end: { dateTime: decoded.end, timeZone: decoded.timezone },
        } as any;
        const created = await calendar.events.insert({ calendarId: "primary", requestBody });
        const link = created.data.htmlLink || "/";
        // Redirect to a small page that opens the event in a new tab, then returns home
        const openUrl = new URL("/open", request.url);
        openUrl.searchParams.set("url", link);
        return NextResponse.redirect(openUrl);
      } catch {
        // Fall through to home if creation fails
      }
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


