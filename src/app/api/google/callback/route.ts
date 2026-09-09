import { CONNECTED_CALENDAR_SYNC_ENABLED } from "@/config/calendar-sync";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { finishCalendarOAuth, readCalendarOAuthState } from "@/lib/calendar-oauth-state";
import { NormalizedEvent, toGoogleEvent } from "@/lib/mappers";
import { absoluteUrl } from "@/lib/absolute-url";
import { resolveSourceIntent } from "@/lib/concierge/creation-intent";
import { saveGoogleRefreshToken, updatePreferredProviderByEmail, insertEventHistory } from "@/lib/db";
import { hasGoogleCalendarEventWriteScope } from "@/lib/google-calendar-oauth";
import { completeGa4OAuth } from "@/lib/admin/ga4-oauth";

export const runtime = "nodejs";

type GoogleCallbackDebug = {
  callbackReached: true;
  hasRefreshToken: boolean;
  hasAccessToken: boolean;
  sessionEmail: string | null;
  tokenPersisted: boolean;
  calendarScopeGranted: boolean;
  persistError: string | null;
};

function googleAuthFailureReason(debug: GoogleCallbackDebug): string {
  if (!debug.calendarScopeGranted) return "missing-calendar-scope";
  if (debug.persistError) return "persist-error";
  if (debug.hasRefreshToken) return "persist-error";
  return "missing-refresh-token";
}

function normalizeInternalRedirect(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }
  return value;
}

export async function GET(request: Request) {
  if (!CONNECTED_CALENDAR_SYNC_ENABLED) {
    return NextResponse.redirect(new URL("/settings#calendars", request.url));
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const account = await getAuthenticatedRequestUser(request);
    if (!account.ok) {
      return NextResponse.json({ error: "Sign in before connecting a calendar" }, { status: 401 });
    }
    const analyticsResponse = await completeGa4OAuth(request, account);
    if (analyticsResponse) return analyticsResponse;
    const connection = await readCalendarOAuthState(request, account, "google");
    if (!connection) {
      return NextResponse.json({ error: "Calendar connection expired or account changed. Reconnect from Settings." }, { status: 400 });
    }
    if (!code) return finishCalendarOAuth(
      NextResponse.json({ error: "Google Calendar authorization was not completed" }, { status: 400 }), "google",
    );
    const state = connection.payload;
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!,
    );
    const { tokens } = await oAuth2Client.getToken(code);
    // Only use credentials returned by this account-bound connection attempt.
    // An old cookie or stored token may belong to a different Google calendar.
    const refresh = tokens.refresh_token || undefined;
    const sessionEmail = account.email;
    const debug: GoogleCallbackDebug = {
      callbackReached: true,
      hasRefreshToken: Boolean(tokens.refresh_token),
      hasAccessToken: Boolean(tokens.access_token),
      sessionEmail: sessionEmail ?? null,
      tokenPersisted: false,
      calendarScopeGranted: hasGoogleCalendarEventWriteScope(tokens.scope),
      persistError: null,
    };

    try {
      if (debug.calendarScopeGranted === false) {
        debug.persistError = "Google Calendar event permission was not granted";
      } else if (refresh && sessionEmail) {
        await saveGoogleRefreshToken(sessionEmail, refresh);
        debug.tokenPersisted = true;
        await updatePreferredProviderByEmail({
          email: sessionEmail,
          preferredProvider: "google",
        });
      }
    } catch (error) {
      // Persistence is best-effort; continue even if storage fails.
      debug.persistError = error instanceof Error ? error.message : String(error);
      console.error("[google/callback] Failed to persist Google refresh token:", error);
    }
    console.info("[google/callback]", debug);

    if (state) {
      try {
        const json = Buffer.from(state, "base64").toString("utf8");
        const decoded = JSON.parse(decodeURIComponent(json));
        const redirectPath =
          decoded?.type === "oauth_redirect" ? normalizeInternalRedirect(decoded.next) : null;
        if (redirectPath) {
          const redirectUrl = new URL(await absoluteUrl(redirectPath));
          redirectUrl.searchParams.set("googleAuth", debug.tokenPersisted ? "stored" : "not-stored");
          if (!debug.tokenPersisted) {
            redirectUrl.searchParams.set("googleAuthReason", googleAuthFailureReason(debug));
          }
          return finishCalendarOAuth(NextResponse.redirect(redirectUrl), "google");
        }
        if (!debug.calendarScopeGranted) throw new Error("Calendar permission was not granted");
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

        // Save to Envitefy history
        try {
          const userId = account.userId;
          // Try to detect category from the normalized event data
          let category: string | null = null;
          try {
            const titleLower = (normalized.title || "").toLowerCase();
            const descLower = (normalized.description || "").toLowerCase();
            const combined = `${titleLower} ${descLower}`;
            if (/birthday|b-day|turns\s+\d+|party for/.test(combined)) {
              category = "Birthdays";
            } else if (/wedding|marriage|ceremony|reception|bride|groom|nupti(al)?|bridal/.test(combined)) {
              category = "Weddings";
            } else if (/baby[-\s]?shower|sprinkle/.test(combined)) {
              category = "Baby Showers";
            } else if (/(doctor|dentist|appointment|check[- ]?up|clinic)/i.test(combined)) {
              category = "Doctor Appointments";
            } else if (/(appointment|meeting|consult)/i.test(combined)) {
              category = "Appointments";
            }
          } catch {}
          
          const sourceIntent = resolveSourceIntent({
            text: [normalized.title, normalized.description].filter(Boolean).join("\n"),
            category,
          });
          const detectedSourceIntent = sourceIntent.detectedSourceIntent;
          const historyOwnership = detectedSourceIntent === "received_invite" ? "invited" : "owned";

          await insertEventHistory({
            userId,
            title: normalized.title || "Event",
            data: {
              ownership: historyOwnership,
              invitedFromScan: detectedSourceIntent === "received_invite",
              sourceContext: {
                type: "ocr_text",
                detectedSourceIntent,
                confidence: sourceIntent.confidence,
                signals: sourceIntent.signals,
                requiresUserConfirmation: sourceIntent.requiresUserConfirmation,
                originalCategory: category || null,
                hasUsableContext: true,
                ambiguity: "none",
              },
              creationIntent: "create_event",
              requestedOutputs: ["event_page"],
              category: category || undefined,
              startISO: normalized.start,
              endISO: normalized.end,
              location: normalized.location || undefined,
              description: normalized.description || undefined,
              timezone: normalized.timezone || undefined,
              reminders: normalized.reminders || undefined,
              createdVia: "ocr",
            },
          });
        } catch (err) {
          // History save is best-effort; continue even if it fails
          console.error("[google/callback] Failed to save to history:", err);
        }

        const openUrl = new URL(await absoluteUrl("/open"));
        openUrl.searchParams.set("url", link);
        if (!state) {
          openUrl.searchParams.set("googleAuth", debug.tokenPersisted ? "stored" : "not-stored");
        }
        return finishCalendarOAuth(NextResponse.redirect(openUrl), "google");
      } catch {
        // Fall through to home if creation fails
      }
    }

    const homeUrl = new URL(await absoluteUrl("/"));
    homeUrl.searchParams.set("googleAuth", debug.tokenPersisted ? "stored" : "not-stored");
    if (!debug.tokenPersisted) {
      homeUrl.searchParams.set("googleAuthReason", googleAuthFailureReason(debug));
    }
    return finishCalendarOAuth(NextResponse.redirect(homeUrl), "google");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
