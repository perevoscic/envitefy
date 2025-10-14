import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";
import { saveGoogleRefreshToken, updatePreferredProviderByEmail } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const nextRequest = NextRequest.from(request);
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
      if (xfProto && xfHost) return (xfProto || "") + "://" + (xfHost || "");
      const host = req.headers.get("host");
      if (host) {
        const proto = host.includes("localhost") ? "http" : "https";
        return proto + "://" + host;
      }
      try {
        return new URL(req.url).origin;
      } catch {
        return "";
      }
    };
    const baseUrl = deriveBaseUrl(request);

    let refresh = tokens.refresh_token;
    let sessionEmail: string | undefined;

    try {
      const secret =
        process.env.AUTH_SECRET ??
        process.env.NEXTAUTH_SECRET ??
        (process.env.NODE_ENV === "production" ? undefined : "dev-build-secret");
      const tokenData = await getToken({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: nextRequest as any,
        secret,
      });
      sessionEmail = (tokenData as any)?.email as string | undefined;
      const storedRefresh = (tokenData as any)?.providers?.google?.refreshToken as string | undefined;
      if (!refresh && storedRefresh) {
        refresh = storedRefresh;
      }
      if (refresh && sessionEmail) {
        await saveGoogleRefreshToken(sessionEmail, refresh);
        await updatePreferredProviderByEmail({ email: sessionEmail, preferredProvider: "google" });
      }
    } catch {
      // Ignore persistence failures; cookie below still enables server-side use
    }

    // If we carried an event in state, create the event now and redirect to it
    if (state) {
      try {
        const json = Buffer.from(state, "base64").toString("utf8");
        const decoded = JSON.parse(decodeURIComponent(json));
        const reminders = Array.isArray(decoded?.reminders)
          ? decoded.reminders
              .map((entry: any) => {
                const candidate =
                  typeof entry === "number"
                    ? entry
                    : typeof entry?.minutes === "number"
                      ? entry.minutes
                      : Number(entry?.minutes);
                const minutes = typeof candidate === "number" ? candidate : Number(candidate);
                return Number.isFinite(minutes) ? { minutes } : null;
              })
              .filter((value: { minutes: number } | null): value is { minutes: number } => value !== null)
          : [];
        const normalized: NormalizedEvent = {
          title:
            typeof decoded?.title === "string" && decoded.title.trim().length
              ? decoded.title
              : "Event",
          description: typeof decoded?.description === "string" ? decoded.description : "",
          location: typeof decoded?.location === "string" ? decoded.location : "",
          start:
            typeof decoded?.start === "string" && decoded.start
              ? decoded.start
              : new Date().toISOString(),
          end:
            typeof decoded?.end === "string" && decoded.end
              ? decoded.end
              : typeof decoded?.start === "string" && decoded.start
                ? decoded.start
                : new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          timezone:
            typeof decoded?.timezone === "string" && decoded.timezone.trim().length
              ? decoded.timezone
              : "UTC",
          allDay: Boolean(decoded?.allDay),
          recurrence:
            typeof decoded?.recurrence === "string" && decoded.recurrence.trim().length
              ? decoded.recurrence
              : null,
          reminders: reminders.length ? reminders : null,
        };

        if (refresh) {
          oAuth2Client.setCredentials({ refresh_token: refresh });
        } else if (tokens.access_token) {
          oAuth2Client.setCredentials({ access_token: tokens.access_token, expiry_date: tokens.expiry_date });
        }

        const calendar = google.calendar({ version: "v3", auth: oAuth2Client as any });
        const requestBody = toGoogleEvent(normalized);
        const created = await calendar.events.insert({ calendarId: "primary", requestBody });
        const link = created.data.htmlLink || "/";
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
