import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { saveGoogleRefreshToken, updatePreferredProviderByEmail } from "@/lib/db";

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
    // Compute external base URL to avoid 0.0.0.0:8080 redirects behind proxies
    const deriveBaseUrl = (req: Request): string => {
      const configured = process.env.NEXTAUTH_URL || process.env.PUBLIC_BASE_URL;
      if (configured) return configured;
      const xfProto = req.headers.get("x-forwarded-proto");
      const xfHost = req.headers.get("x-forwarded-host");
      if (xfProto && xfHost) return `${xfProto}://${xfHost}`;
      const host = req.headers.get("host");
      if (host) {
        const proto = host.includes("localhost") ? "http" : "https";
        return `${proto}://${host}`;
      }
      try {
        return new URL(req.url).origin;
      } catch {
        return "";
      }
    };
    const baseUrl = deriveBaseUrl(request);
    const refresh = tokens.refresh_token;
    // Persist refresh token to the database for the signed-in user
    try {
      const tokenData = await getToken({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET,
      });
      const email = (tokenData as any)?.email as string | undefined;
      if (refresh && email) {
        await saveGoogleRefreshToken(email, refresh);
        // Also mark Google as preferred provider for future prompts
        await updatePreferredProviderByEmail({ email, preferredProvider: "google" });
      }
    } catch {
      // Ignore persistence failures; cookie below still enables server-side use
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
        const openUrl = new URL("/open", baseUrl || request.url);
        openUrl.searchParams.set("url", link);
        const redirectResp = NextResponse.redirect(openUrl);
        if (refresh) {
          redirectResp.cookies.set({
            name: "g_refresh",
            value: refresh,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
          });
        }
        return redirectResp;
      } catch {
        // Fall through to home if creation fails
      }
    }

    const homeRedirect = NextResponse.redirect(new URL("/", baseUrl || request.url));
    if (refresh) {
      homeRedirect.cookies.set({
        name: "g_refresh",
        value: refresh,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return homeRedirect;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


