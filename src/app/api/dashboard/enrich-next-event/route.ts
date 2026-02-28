import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, query } from "@/lib/db";
import {
  extractHomeOrigin,
  isArchivedOrCanceled,
  toDashboardEvent,
  type DashboardEvent,
} from "@/lib/dashboard-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRAVEL_TTL_MS = 12 * 60 * 60 * 1000;
const WEATHER_TTL_MS = 3 * 60 * 60 * 1000;
let metricsCacheTableEnsured = false;

type MetricsRow = {
  event_id: string;
  travel_minutes: number | null;
  travel_distance_km: number | null;
  travel_updated_at: string | null;
  weather_summary: string | null;
  weather_temp: number | null;
  weather_updated_at: string | null;
};

function weatherCodeSummary(code: number | null | undefined): string | null {
  if (code == null || !Number.isFinite(code)) return null;
  if (code === 0) return "Clear";
  if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Conditions unavailable";
}

async function ensureMetricsCacheTable() {
  if (metricsCacheTableEnsured) return;
  await query(`
    create table if not exists event_metrics_cache (
      event_id uuid primary key references event_history(id) on delete cascade,
      travel_minutes integer,
      travel_distance_km numeric(8,2),
      travel_updated_at timestamptz(6),
      weather_summary text,
      weather_temp numeric(6,2),
      weather_updated_at timestamptz(6),
      updated_at timestamptz(6) default now()
    )
  `);
  metricsCacheTableEnsured = true;
}

async function getMetrics(eventId: string): Promise<MetricsRow | null> {
  const res = await query<MetricsRow>(
    `select event_id, travel_minutes, travel_distance_km, travel_updated_at, weather_summary, weather_temp, weather_updated_at
     from event_metrics_cache
     where event_id = $1
     limit 1`,
    [eventId]
  );
  return res.rows[0] || null;
}

async function upsertMetrics(
  eventId: string,
  patch: {
    travelMinutes?: number | null;
    travelDistanceKm?: number | null;
    travelUpdatedAt?: string | null;
    weatherSummary?: string | null;
    weatherTemp?: number | null;
    weatherUpdatedAt?: string | null;
  }
) {
  const existing = await getMetrics(eventId);
  const travelMinutes =
    patch.travelMinutes !== undefined ? patch.travelMinutes : existing?.travel_minutes ?? null;
  const travelDistanceKm =
    patch.travelDistanceKm !== undefined
      ? patch.travelDistanceKm
      : existing?.travel_distance_km ?? null;
  const travelUpdatedAt =
    patch.travelUpdatedAt !== undefined
      ? patch.travelUpdatedAt
      : existing?.travel_updated_at ?? null;
  const weatherSummary =
    patch.weatherSummary !== undefined
      ? patch.weatherSummary
      : existing?.weather_summary ?? null;
  const weatherTemp =
    patch.weatherTemp !== undefined ? patch.weatherTemp : existing?.weather_temp ?? null;
  const weatherUpdatedAt =
    patch.weatherUpdatedAt !== undefined
      ? patch.weatherUpdatedAt
      : existing?.weather_updated_at ?? null;

  await query(
    `insert into event_metrics_cache (
      event_id, travel_minutes, travel_distance_km, travel_updated_at, weather_summary, weather_temp, weather_updated_at, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, now())
    on conflict (event_id)
    do update set
      travel_minutes = excluded.travel_minutes,
      travel_distance_km = excluded.travel_distance_km,
      travel_updated_at = excluded.travel_updated_at,
      weather_summary = excluded.weather_summary,
      weather_temp = excluded.weather_temp,
      weather_updated_at = excluded.weather_updated_at,
      updated_at = now()`,
    [
      eventId,
      travelMinutes,
      travelDistanceKm,
      travelUpdatedAt,
      weatherSummary,
      weatherTemp,
      weatherUpdatedAt,
    ]
  );
}

function isCacheFresh(updatedAtIso: string | null, ttlMs: number): boolean {
  if (!updatedAtIso) return false;
  const ms = new Date(updatedAtIso).getTime();
  if (!Number.isFinite(ms)) return false;
  return Date.now() - ms < ttlMs;
}

async function getNextEventForOwner(userId: string): Promise<DashboardEvent | null> {
  const rows = await query<{ id: string; title: string; data: any; created_at: string | null }>(
    `select id, title, (data - 'attachment') as data, created_at
     from event_history
     where user_id = $1
     order by created_at desc nulls last, id desc
     limit 500`,
    [userId]
  );
  const now = Date.now();
  const upcoming = (rows.rows || [])
    .map((row) => toDashboardEvent(row))
    .filter((row): row is DashboardEvent => Boolean(row))
    .filter((row) => new Date(row.startAt).getTime() > now && !isArchivedOrCanceled(row.status))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return upcoming[0] || null;
}

async function fetchTravelMinutesAndDistance(params: {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}): Promise<{ minutes: number | null; distanceKm: number | null }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${params.originLng},${params.originLat};${params.destLng},${params.destLat}?overview=false`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { minutes: null, distanceKm: null };
  const payload = await res.json().catch(() => null);
  const route = payload?.routes?.[0];
  const durationSeconds = Number(route?.duration);
  const distanceMeters = Number(route?.distance);
  const minutes = Number.isFinite(durationSeconds)
    ? Math.max(1, Math.round(durationSeconds / 60))
    : null;
  const distanceKm = Number.isFinite(distanceMeters)
    ? Math.round((distanceMeters / 1000) * 10) / 10
    : null;
  return { minutes, distanceKm };
}

async function fetchWeatherAtEvent(params: {
  lat: number;
  lng: number;
  eventIso: string;
}): Promise<{ summary: string | null; temp: number | null }> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(params.lat));
  url.searchParams.set("longitude", String(params.lng));
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { summary: null, temp: null };
  const payload = await res.json().catch(() => null);
  const times: string[] = Array.isArray(payload?.hourly?.time) ? payload.hourly.time : [];
  const temps: number[] = Array.isArray(payload?.hourly?.temperature_2m)
    ? payload.hourly.temperature_2m
    : [];
  const codes: number[] = Array.isArray(payload?.hourly?.weather_code)
    ? payload.hourly.weather_code
    : [];
  if (!times.length) return { summary: null, temp: null };
  const targetMs = new Date(params.eventIso).getTime();
  let bestIndex = -1;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i += 1) {
    const ts = new Date(times[i]).getTime();
    if (!Number.isFinite(ts)) continue;
    const delta = Math.abs(ts - targetMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = i;
    }
  }
  if (bestIndex < 0) return { summary: null, temp: null };
  const temp = Number.isFinite(Number(temps[bestIndex])) ? Number(temps[bestIndex]) : null;
  const summary = weatherCodeSummary(Number(codes[bestIndex]));
  return { summary, temp };
}

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const forceTravel = Boolean(body?.forceTravel);
    const requestedEventId =
      typeof body?.eventId === "string" && body.eventId.trim() ? body.eventId.trim() : null;

    const nextEvent = await getNextEventForOwner(userId);
    if (!nextEvent) {
      return NextResponse.json({ ok: true, metrics: null, reason: "no-next-event" });
    }
    if (requestedEventId && requestedEventId !== nextEvent.id) {
      return NextResponse.json({ ok: true, metrics: null, reason: "event-not-next" });
    }

    await ensureMetricsCacheTable();
    const [userRes, cached] = await Promise.all([
      query<{ feature_visibility: any }>(
        `select feature_visibility from users where id = $1 limit 1`,
        [userId]
      ),
      getMetrics(nextEvent.id),
    ]);
    const origin = extractHomeOrigin(userRes.rows[0]?.feature_visibility);
    const startMs = new Date(nextEvent.startAt).getTime();
    const nowMs = Date.now();
    const hoursToStart = (startMs - nowMs) / (1000 * 60 * 60);
    const hasDestination = nextEvent.locationLat != null && nextEvent.locationLng != null;

    const travelFresh = isCacheFresh(cached?.travel_updated_at || null, TRAVEL_TTL_MS);
    const weatherFresh = isCacheFresh(cached?.weather_updated_at || null, WEATHER_TTL_MS);

    const canCallTravel =
      hasDestination && !!origin && (hoursToStart <= 72 || forceTravel) && !travelFresh;
    const canCallWeather = hasDestination && hoursToStart <= 24 * 7 && !weatherFresh;

    let travelMinutes = cached?.travel_minutes ?? null;
    let travelDistanceKm = cached?.travel_distance_km ?? null;
    let travelUpdatedAt = cached?.travel_updated_at ?? null;
    let weatherSummary = cached?.weather_summary ?? null;
    let weatherTemp = cached?.weather_temp ?? null;
    let weatherUpdatedAt = cached?.weather_updated_at ?? null;

    if (canCallTravel && origin && nextEvent.locationLat != null && nextEvent.locationLng != null) {
      const travel = await fetchTravelMinutesAndDistance({
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: nextEvent.locationLat,
        destLng: nextEvent.locationLng,
      });
      if (travel.minutes != null || travel.distanceKm != null) {
        travelMinutes = travel.minutes;
        travelDistanceKm = travel.distanceKm;
        travelUpdatedAt = new Date().toISOString();
        await upsertMetrics(nextEvent.id, {
          travelMinutes,
          travelDistanceKm,
          travelUpdatedAt,
        });
      }
    }

    if (canCallWeather && nextEvent.locationLat != null && nextEvent.locationLng != null) {
      const weather = await fetchWeatherAtEvent({
        lat: nextEvent.locationLat,
        lng: nextEvent.locationLng,
        eventIso: nextEvent.startAt,
      });
      if (weather.summary != null || weather.temp != null) {
        weatherSummary = weather.summary;
        weatherTemp = weather.temp;
        weatherUpdatedAt = new Date().toISOString();
        await upsertMetrics(nextEvent.id, {
          weatherSummary,
          weatherTemp,
          weatherUpdatedAt,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      eventId: nextEvent.id,
      metrics: {
        eventId: nextEvent.id,
        travelMinutes,
        travelDistanceKm,
        travelUpdatedAt,
        weatherSummary,
        weatherTemp,
        weatherUpdatedAt,
      },
      meta: {
        hasDestination,
        hasOrigin: Boolean(origin),
        travelWindowEligible: hoursToStart <= 72,
        weatherWindowEligible: hoursToStart <= 24 * 7,
        travelUsedCache: travelFresh,
        weatherUsedCache: weatherFresh,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message || err || "Failed to enrich next event metrics") },
      { status: 500 }
    );
  }
}
