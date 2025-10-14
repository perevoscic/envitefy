import { google } from "googleapis";
import { NextResponse } from "next/server";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";
import { getGoogleRefreshToken, saveGoogleRefreshToken, updatePreferredProviderByEmail } from "@/lib/db";

export const runtime = "nodejs";

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const pairs = header.split(";");
  for (const part of pairs) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    if (rawKey === name) {
      const value = rest.join("=");
      try {
        return decodeURIComponent(value || "");
      } catch {
        return value || "";
      }
    }
  }
  return null;
}

function emailFromIdToken(idToken?: string | null): string | undefined {
  if (!idToken) return undefined;
  const parts = idToken.split(".");
  if (parts.length < 2) return undefined;
  const segment = parts[1];
  const paddingLength = (4 - (segment.length % 4)) % 4;
  const padded = segment + "=".repeat(paddingLength);
  try {
    const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json);
    const email = payload?.email;
    return typeof email === "string" && email.trim().length ? email.toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

async function emailFromGoogle(accessToken?: string | null): Promise<string | undefined> {
  if (!accessToken) return undefined;
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    const email = data?.email;
    return typeof email === "string" && email.trim().length ? email.toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

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

    let refresh = tokens.refresh_token || undefined;
    const cookieRefresh = readCookie(request.headers.get("cookie"), "g_refresh");
    if (!refresh && cookieRefresh) {
      refresh = cookieRefresh;
    }

    let sessionEmail = emailFromIdToken(tokens.id_token);
    if (!sessionEmail && tokens.access_token) {
      sessionEmail = await emailFromGoogle(tokens.access_token);
    }

    try {
      if (!refresh && sessionEmail) {
        const storedRefresh = await getGoogleRefreshToken(sessionEmail);
        if (storedRefresh) {
          refresh = storedRefresh;
        }
      }
      if (refresh && sessionEmail) {
        await saveGoogleRefreshToken(sessionEmail, refresh);
        await updatePreferredProviderByEmail({ email: sessionEmail, preferredProvider: "google" });
      }
    } catch {
      // Persistence is best-effort; continue even if storage fails.
    }

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
