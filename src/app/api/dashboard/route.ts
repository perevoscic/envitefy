import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, query } from "@/lib/db";
import {
  isArchivedOrCanceled,
  isDraftStatus,
  toDashboardEvent,
  type DashboardEvent,
} from "@/lib/dashboard-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardMetricsCache = {
  eventId: string;
  travelMinutes: number | null;
  travelDistanceKm: number | null;
  travelUpdatedAt: string | null;
  weatherSummary: string | null;
  weatherTemp: number | null;
  weatherUpdatedAt: string | null;
};

function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}

async function getCachedMetrics(eventId: string): Promise<DashboardMetricsCache | null> {
  try {
    const exists = await query<{ exists: string | null }>(
      `select to_regclass('public.event_metrics_cache')::text as exists`
    );
    if (!exists.rows[0]?.exists) return null;
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
  } catch {
    return null;
  }
}

async function getTasksForEvent(eventId: string): Promise<
  Array<{ id: string; title: string; done: boolean; dueAt: string | null }>
> {
  const candidates = ["tasks", "event_tasks"];
  for (const tableName of candidates) {
    try {
      const tableExists = await query<{ exists: string | null }>(
        `select to_regclass($1)::text as exists`,
        [`public.${tableName}`]
      );
      if (!tableExists.rows[0]?.exists) continue;
      const res = await query<{
        id: string;
        title: string;
        done: boolean | null;
        due_at: string | null;
      }>(
        `select id::text as id, title, done, due_at
         from ${tableName}
         where event_id::text = $1
         order by coalesce(due_at, now() + interval '100 years') asc, id asc
         limit 30`,
        [eventId]
      );
      return (res.rows || []).map((row) => ({
        id: row.id,
        title: row.title,
        done: Boolean(row.done),
        dueAt: row.due_at,
      }));
    } catch {
      // Try next candidate table name.
    }
  }
  return [];
}

function buildSetupHealth(nextEvent: DashboardEvent | null, rsvpTotalForEvent: number) {
  if (!nextEvent) return [];
  const flags: Array<{ key: string; label: string }> = [];
  if (!nextEvent.locationText || nextEvent.locationLat == null || nextEvent.locationLng == null) {
    flags.push({ key: "location", label: "Location not resolved" });
  }
  if (!nextEvent.coverImageUrl) {
    flags.push({ key: "cover", label: "Cover image missing" });
  }
  const hasGuests = nextEvent.numberOfGuests > 0 || rsvpTotalForEvent > 0;
  if (!hasGuests) {
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

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email = session?.user?.email as string | undefined;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session?.user?.id || (await getUserIdByEmail(email));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await query<{ id: string; title: string; data: any; created_at: string | null }>(
      `select id, title, data, created_at
       from event_history
       where user_id = $1
       order by created_at desc nulls last, id desc
       limit 500`,
      [userId]
    );

    const now = Date.now();
    const parsed = (rows.rows || [])
      .map((row) => toDashboardEvent(row))
      .filter((item): item is DashboardEvent => Boolean(item));

    const allDrafts = parsed
      .filter((event) => isDraftStatus(event.status))
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    const drafts = allDrafts.slice(0, 3);

    const upcoming = parsed
      .filter((event) => {
        const startMs = new Date(event.startAt).getTime();
        return startMs > now && !isArchivedOrCanceled(event.status);
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const nextEvent = upcoming[0] || null;
    const upcomingIn30DaysCount = upcoming.filter((event) => {
      const diff = new Date(event.startAt).getTime() - now;
      return diff <= 30 * 24 * 60 * 60 * 1000;
    }).length;
    const upcomingIn7DaysCount = upcoming.filter((event) => {
      const diff = new Date(event.startAt).getTime() - now;
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const nextEventInDays = nextEvent
      ? Math.max(0, Math.ceil((new Date(nextEvent.startAt).getTime() - now) / (24 * 60 * 60 * 1000)))
      : null;

    let rsvp = {
      going: 0,
      maybe: 0,
      declined: 0,
      pending: Math.max(0, nextEvent?.numberOfGuests || 0),
      recent: [] as Array<{ id: string; name: string; status: "going" | "maybe" | "declined" | "pending"; updatedAt: string | null }>,
    };

    if (nextEvent) {
      try {
        const grouped = await query<{ response: string; count: string }>(
          `select response, count(*)::text as count
           from rsvp_responses
           where event_id = $1
           group by response`,
          [nextEvent.id]
        );
        for (const row of grouped.rows || []) {
          const key = String(row.response || "").toLowerCase();
          const count = Number(row.count || 0);
          if (key === "yes") rsvp.going = count;
          if (key === "no") rsvp.declined = count;
          if (key === "maybe") rsvp.maybe = count;
        }
        const filled = rsvp.going + rsvp.maybe + rsvp.declined;
        rsvp.pending = Math.max(0, (nextEvent.numberOfGuests || 0) - filled);

        const recentRows = await query<{
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
        );
        rsvp.recent = (recentRows.rows || []).map((row) => {
          const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
          const displayName =
            fullName || String(row.name || "").trim() || String(row.email || "").trim() || "Guest";
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
    }

    const setupHealthFlags = buildSetupHealth(nextEvent, rsvp.going + rsvp.maybe + rsvp.declined);
    const tasks = nextEvent ? await getTasksForEvent(nextEvent.id) : [];
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

    const metricsCache = nextEvent ? await getCachedMetrics(nextEvent.id) : null;
    const nextEventHours = nextEvent ? hoursUntil(nextEvent.startAt) : null;

    return NextResponse.json({
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
        source: tasks.length > 0 ? "tasks" : "derived",
        items: tasks.length > 0 ? tasks : derivedChecklist,
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
            nextEvent.locationLat != null &&
            nextEvent.locationLng != null &&
            nextEventHours != null &&
            nextEventHours <= 24 * 7
        ),
        travelWindowEligible: Boolean(nextEvent && nextEventHours != null && nextEventHours <= 72),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message || err || "Failed to load dashboard") },
      { status: 500 }
    );
  }
}
