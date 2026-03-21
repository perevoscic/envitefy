import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  isDraftStatus,
  isScannedInviteCreatedVia,
  type DashboardEvent,
} from "@/lib/dashboard-data";
import {
  buildDashboardCollections,
  type DashboardEventQueryDiagnostics,
  listDashboardEventsForUser,
} from "@/lib/dashboard-query";
import {
  getDashboardRefreshInflight,
  getDashboardResponseCache,
} from "@/lib/dashboard-cache";
import {
  createServerTimingTracker,
  isTimingRequested,
  type ServerTimingTracker,
} from "@/lib/server-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const WEATHER_FORECAST_WINDOW_HOURS = 24 * 3; // WeatherAPI free-tier 3-day forecast window.
const WEATHERAPI_KEY =
  process.env.WEATHERAPI_KEY || process.env.WEATHERAPI_API_KEY || null;
const DASHBOARD_CACHE_TTL_MS = 15_000;
const DASHBOARD_STALE_TTL_MS = 60_000;

type DashboardMetricsCache = {
  eventId: string;
  travelMinutes: number | null;
  travelDistanceKm: number | null;
  travelUpdatedAt: string | null;
  weatherSummary: string | null;
  weatherTemp: number | null;
  weatherUpdatedAt: string | null;
};

type DashboardPayload = Record<string, unknown>;
type SessionLike = {
  user?: {
    email?: string | null;
    id?: string | null;
  } | null;
} | null;

let metricsCacheTableExists: boolean | null = null;
const dashboardResponseCache = getDashboardResponseCache();
const dashboardRefreshInflight = getDashboardRefreshInflight();

function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

function isStatementTimeoutError(err: unknown): boolean {
  const anyErr = err as { code?: unknown; message?: unknown } | null;
  const code = String(anyErr?.code || "");
  const message = String(anyErr?.message || "");
  return code === "57014" || /statement timeout|canceling statement due to statement timeout/i.test(message);
}

function buildEmptyDashboardPayload(): DashboardPayload {
  return {
    ok: true,
    nextEvent: null,
    snapshot: {
      upcomingCount30Days: 0,
      upcomingCount7Days: 0,
      nextEventInDays: null,
    },
    upcoming: [],
    rsvp: null,
    setupHealth: {
      flags: [],
    },
    checklist: {
      source: "derived",
      items: [],
    },
    drafts: {
      count: 0,
      items: [],
    },
    metricsCache: null,
    metricsEligibility: {
      weatherEligible: false,
      travelWindowEligible: false,
    },
    degraded: true,
    diagnostics: {
      emptyReason: "statement-timeout",
      degradedReason: "statement_timeout",
    },
  };
}

function buildDashboardEmptyReason(params: {
  sourceRowCount: number;
  returnedEventCount: number;
  droppedMissingStartCount: number;
  nextEvent: DashboardEvent | null;
  upcomingCount: number;
}): string | null {
  if (params.nextEvent) return null;
  if (params.sourceRowCount <= 0) return "no-history-rows";
  if (
    params.returnedEventCount <= 0 &&
    params.droppedMissingStartCount >= params.sourceRowCount
  ) {
    return "row-filtered-no-start";
  }
  if (params.returnedEventCount <= 0) return "no-parseable-dashboard-events";
  if (params.upcomingCount <= 0) return "no-upcoming-events";
  return "no-next-event";
}

async function getCachedMetrics(
  eventId: string,
  timing?: ServerTimingTracker
): Promise<DashboardMetricsCache | null> {
  const read = async () => {
    if (metricsCacheTableExists == null) {
      const exists = await query<{ exists: string | null }>(
        `select to_regclass('public.event_metrics_cache')::text as exists`
      );
      metricsCacheTableExists = Boolean(exists.rows[0]?.exists);
    }
    if (!metricsCacheTableExists) return null;
    const res = await query<{
      event_id: string;
      travel_minutes: number | null;
      travel_distance_km: number | null;
      travel_updated_at: string | null;
      weather_summary: string | null;
      weather_temp: number | null;
      weather_updated_at: string | null;
    }>(
      `select event_id, travel_minutes, travel_distance_km, travel_updated_at, weather_summary, weather_temp, weather_updated_at
       from event_metrics_cache
       where event_id = $1
       limit 1`,
      [eventId]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      eventId: row.event_id,
      travelMinutes: row.travel_minutes,
      travelDistanceKm: row.travel_distance_km,
      travelUpdatedAt: row.travel_updated_at,
      weatherSummary: row.weather_summary,
      weatherTemp: row.weather_temp,
      weatherUpdatedAt: row.weather_updated_at,
    };
  };
  try {
    return timing ? await timing.time("metrics_cache", read) : await read();
  } catch {
    return null;
  }
}

function buildSetupHealth(nextEvent: DashboardEvent | null, rsvpTotalForEvent: number) {
  if (!nextEvent) return [];
  if (nextEvent.ownership === "invited") return [];
  const flags: Array<{ key: string; label: string }> = [];
  const createdVia = String(nextEvent.createdVia || "").toLowerCase();
  const isScannedOrUploaded = isScannedInviteCreatedVia(createdVia);
  if (!nextEvent.locationText) {
    flags.push({ key: "location", label: "Location not resolved" });
  }
  if (!nextEvent.coverImageUrl) {
    flags.push({ key: "cover", label: "Cover image missing" });
  }
  const hasGuests = nextEvent.numberOfGuests > 0 || rsvpTotalForEvent > 0;
  if (!hasGuests && !isScannedOrUploaded) {
    flags.push({ key: "guests", label: "No guests or invites" });
  }
  if (nextEvent.reminderCount <= 0) {
    flags.push({ key: "reminders", label: "No reminder scheduled" });
  }
  if (isDraftStatus(nextEvent.status)) {
    flags.push({ key: "draft", label: "Still draft" });
  }
  return flags;
}

async function computeDashboardPayload(
  userId: string,
  userEmail: string,
  timing?: ServerTimingTracker
): Promise<DashboardPayload> {
  const eventResult = timing
    ? await timing.time("events", () => listDashboardEventsForUser(userId, 200))
    : await listDashboardEventsForUser(userId, 200);
  const events = eventResult.events;
  const now = Date.now();
  const {
    allDrafts,
    drafts,
    upcoming,
    nextEvent,
    upcomingIn30DaysCount,
    upcomingIn7DaysCount,
    nextEventInDays,
  } = buildDashboardCollections(events, now);
  const emptyReason = buildDashboardEmptyReason({
    sourceRowCount: eventResult.diagnostics.sourceRowCount,
    returnedEventCount: eventResult.diagnostics.returnedEventCount,
    droppedMissingStartCount: eventResult.diagnostics.droppedMissingStartCount,
    nextEvent,
    upcomingCount: upcoming.length,
  });
  const diagnostics: DashboardEventQueryDiagnostics & {
    emptyReason: string | null;
  } = {
    ...eventResult.diagnostics,
    emptyReason,
  };

  const rsvp = {
    going: 0,
    maybe: 0,
    declined: 0,
    pending: Math.max(0, nextEvent?.numberOfGuests || 0),
    recent: [] as Array<{
      id: string;
      name: string;
      status: "going" | "maybe" | "declined" | "pending";
      updatedAt: string | null;
    }>,
  };

  if (nextEvent) {
    const loadRsvp = async () => {
      try {
        const [grouped, recentRows] = await Promise.all([
          query<{ response: string; count: string }>(
            `select response, count(*)::text as count
             from rsvp_responses
             where event_id = $1
             group by response`,
            [nextEvent.id]
          ),
          query<{
            id: string;
            name: string | null;
            first_name: string | null;
            last_name: string | null;
            email: string | null;
            response: string;
            updated_at: string | null;
          }>(
            `select id::text as id, name, first_name, last_name, email, response, updated_at
             from rsvp_responses
             where event_id = $1
             order by updated_at desc nulls last
             limit 3`,
            [nextEvent.id]
          ),
        ]);

        for (const row of grouped.rows || []) {
          const key = String(row.response || "").toLowerCase();
          const count = Number(row.count || 0);
          if (key === "yes") rsvp.going = count;
          if (key === "no") rsvp.declined = count;
          if (key === "maybe") rsvp.maybe = count;
        }
        const filled = rsvp.going + rsvp.maybe + rsvp.declined;
        rsvp.pending = Math.max(0, (nextEvent.numberOfGuests || 0) - filled);
        rsvp.recent = (recentRows.rows || []).map((row) => {
          const fullName = [row.first_name, row.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
          const displayName =
            fullName ||
            String(row.name || "").trim() ||
            String(row.email || "").trim() ||
            "Guest";
          const responseKey = String(row.response || "").toLowerCase();
          const status: "going" | "maybe" | "declined" | "pending" =
            responseKey === "yes"
              ? "going"
              : responseKey === "no"
              ? "declined"
              : responseKey === "maybe"
              ? "maybe"
              : "pending";
          return {
            id: row.id,
            name: displayName,
            status,
            updatedAt: row.updated_at,
          };
        });
      } catch {
        // RSVP table may not exist in some environments.
      }
    };
    if (timing) {
      await timing.time("rsvp", loadRsvp);
    } else {
      await loadRsvp();
    }
  }

  // Per-user RSVP lookup: check if the signed-in user has RSVP'd to any dashboard events.
  const allEventIds = [
    ...(nextEvent ? [nextEvent.id] : []),
    ...upcoming.map((e) => e.id),
  ].filter((id, i, arr) => arr.indexOf(id) === i);

  const userRsvpMap = new Map<string, "yes" | "no" | "maybe">();
  if (allEventIds.length > 0) {
    const loadUserRsvp = async () => {
      try {
        const res = await query<{ event_id: string; response: string }>(
          `select distinct on (event_id) event_id::text as event_id, response
           from rsvp_responses
           where event_id = ANY($1)
             and (user_id = $2 OR lower(email) = lower($3))
           order by event_id, updated_at desc nulls last`,
          [allEventIds, userId, userEmail]
        );
        for (const row of res.rows || []) {
          const r = String(row.response || "").toLowerCase();
          if (r === "yes" || r === "no" || r === "maybe") {
            userRsvpMap.set(row.event_id, r);
          }
        }
      } catch {}
    };
    if (timing) {
      await timing.time("user_rsvp", loadUserRsvp);
    } else {
      await loadUserRsvp();
    }
  }

  if (nextEvent) {
    nextEvent.userRsvpResponse = userRsvpMap.get(nextEvent.id) ?? null;
  }
  for (const ev of upcoming) {
    ev.userRsvpResponse = userRsvpMap.get(ev.id) ?? null;
  }

  const setupHealthFlags = buildSetupHealth(
    nextEvent,
    rsvp.going + rsvp.maybe + rsvp.declined
  );
  const derivedChecklist = nextEvent
    ? setupHealthFlags.map((flag) => ({
        id: `derived-${flag.key}`,
        title:
          flag.key === "location"
            ? "Resolve event location coordinates"
            : flag.key === "cover"
            ? "Upload a cover image"
            : flag.key === "guests"
            ? "Add guests or send invites"
            : flag.key === "reminders"
            ? "Set at least one reminder"
            : "Publish draft event",
        done: false,
        dueAt: nextEvent.startAt,
      }))
    : [];

  const metricsCache = nextEvent
    ? await getCachedMetrics(nextEvent.id, timing)
    : null;
  const nextEventHours = nextEvent ? hoursUntil(nextEvent.startAt) : null;

  return {
    ok: true,
    nextEvent,
    snapshot: {
      upcomingCount30Days: upcomingIn30DaysCount,
      upcomingCount7Days: upcomingIn7DaysCount,
      nextEventInDays,
    },
    upcoming: upcoming.slice(0, 12),
    rsvp: nextEvent ? rsvp : null,
    setupHealth: {
      flags: setupHealthFlags,
    },
    checklist: {
      source: "derived",
      items: derivedChecklist,
    },
    drafts: {
      count: allDrafts.length,
      items: drafts.map((event) => ({
        id: event.id,
        title: event.title,
        updatedAt: event.updatedAt,
        startAt: event.startAt,
      })),
    },
    metricsCache,
    metricsEligibility: {
      weatherEligible: Boolean(
        nextEvent &&
          (nextEvent.locationLat != null && nextEvent.locationLng != null
            ? true
            : Boolean(nextEvent.locationText)) &&
          nextEventHours != null &&
          nextEventHours <= WEATHER_FORECAST_WINDOW_HOURS &&
          WEATHERAPI_KEY
      ),
      travelWindowEligible: Boolean(
        nextEvent && nextEventHours != null && nextEventHours <= 72
      ),
    },
    diagnostics,
  };
}

function getOrCreateRefresh(userId: string, userEmail: string): Promise<DashboardPayload> {
  const existing = dashboardRefreshInflight.get(userId);
  if (existing) return existing;
  const promise = (async () => {
    const payload = await computeDashboardPayload(userId, userEmail);
    dashboardResponseCache.set(userId, { at: Date.now(), payload });
    return payload;
  })().finally(() => {
    dashboardRefreshInflight.delete(userId);
  });
  dashboardRefreshInflight.set(userId, promise);
  return promise;
}

function withTiming(
  timing: ServerTimingTracker,
  body: Record<string, unknown>,
  init?: ResponseInit
) {
  const response = NextResponse.json(body, init);
  timing.applyHeader(response);
  return response;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const timing = createServerTimingTracker(isTimingRequested(url));
  try {
    const session = (await timing.time("session", () =>
      getServerSession(authOptions))) as SessionLike;
    const email = session?.user?.email || undefined;
    if (!email) {
      const body = timing.enabled
        ? {
            error: "Unauthorized",
            timings: timing.toObject(),
          }
        : { error: "Unauthorized" };
      return withTiming(timing, body, { status: 401 });
    }

    const userId = await timing.time("user_lookup", () => resolveSessionUserId(session));
    if (!userId) {
      const body = timing.enabled
        ? {
            error: "Unauthorized",
            timings: timing.toObject(),
          }
        : { error: "Unauthorized" };
      return withTiming(timing, body, { status: 401 });
    }

    const refresh = url.searchParams.get("refresh") === "1";
    if (refresh) {
      dashboardResponseCache.delete(userId);
    }

    const cached = dashboardResponseCache.get(userId);
    const cacheAgeMs = cached ? Date.now() - cached.at : null;

    if (cached && cacheAgeMs != null && cacheAgeMs < DASHBOARD_CACHE_TTL_MS) {
      const body = timing.enabled
        ? {
            ...cached.payload,
            timings: timing.toObject({
              cache: { state: "fresh", ageMs: cacheAgeMs },
            }),
          }
        : cached.payload;
      return withTiming(timing, body);
    }

    if (cached && cacheAgeMs != null && cacheAgeMs < DASHBOARD_STALE_TTL_MS) {
      // Serve stale immediately, refresh in background, and avoid duplicate refresh calls.
      void getOrCreateRefresh(userId, email).catch(() => undefined);
      const body = timing.enabled
        ? {
            ...cached.payload,
            timings: timing.toObject({
              cache: { state: "stale", ageMs: cacheAgeMs, refreshStarted: true },
            }),
          }
        : cached.payload;
      return withTiming(timing, body);
    }

    if (dashboardRefreshInflight.has(userId)) {
      timing.addStep("coalesced_wait", 0);
    }
    const payload = await timing.time("dashboard_compute", () =>
      getOrCreateRefresh(userId, email)
    );

    const body = timing.enabled
      ? {
          ...payload,
          timings: timing.toObject({
            cache: {
              state: "miss",
              ageMs: cacheAgeMs,
            },
          }),
        }
      : payload;

    return withTiming(timing, body);
  } catch (err: unknown) {
    const timedOut = isStatementTimeoutError(err);
    if (!timedOut && process.env.NODE_ENV !== "production") {
      console.error("[api/dashboard] GET failed", err);
    }
    const message = errorMessage(err, "Failed to load dashboard");
    const body = timedOut
      ? timing.enabled
        ? {
            ...buildEmptyDashboardPayload(),
            error: message,
            timings: timing.toObject({
              degraded: { reason: "statement_timeout" },
            }),
          }
        : {
            ...buildEmptyDashboardPayload(),
            error: message,
          }
      : timing.enabled
        ? {
            error: message,
            timings: timing.toObject(),
          }
        : { error: message };
    return withTiming(
      timing,
      body,
      timedOut ? { status: 200 } : { status: 500 }
    );
  }
}
