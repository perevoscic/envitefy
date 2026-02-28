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
const WEATHER_FORECAST_WINDOW_HOURS = 24 * 3; // WeatherAPI free-tier 3-day forecast window.
let metricsCacheTableEnsured = false;
const MAPBOX_ACCESS_TOKEN =
  process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY || null;
const WEATHERAPI_KEY =
  process.env.WEATHERAPI_KEY || process.env.WEATHERAPI_API_KEY || null;

type MetricsRow = {
  event_id: string;
  travel_minutes: number | null;
  travel_distance_km: number | null;
  travel_updated_at: string | null;
  weather_summary: string | null;
  weather_temp: number | null;
  weather_updated_at: string | null;
};

function parseFinite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractLocationLabel(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, any>;
  const candidates = [
    source.label,
    source.name,
    source.address,
    source.text,
    source.location,
    source.query,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function resolveHomeLabel(featureVisibility: unknown): string | null {
  if (!featureVisibility || typeof featureVisibility !== "object") return null;
  const source = featureVisibility as Record<string, any>;
  const candidates = [
    source?.home,
    source?.homeLocation,
    source?.origin,
    source?.settings?.homeLocation,
    source?.settings?.origin,
    source?.profile?.homeLocation,
    source?.homeAddress,
    source?.settings?.homeAddress,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    const label = extractLocationLabel(candidate);
    if (label) return label;
  }
  return null;
}

function parseInlineLatLng(text: string): { lat: number; lng: number } | null {
  const match = text.match(
    /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/
  );
  if (!match) return null;
  const lat = parseFinite(match[1]);
  const lng = parseFinite(match[2]);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseBodyOrigin(body: any):
  | {
      lat: number;
      lng: number;
      label: string | null;
    }
  | null {
  const lat = parseFinite(body?.originLat);
  const lng = parseFinite(body?.originLng);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const label =
    typeof body?.originLabel === "string" && body.originLabel.trim()
      ? body.originLabel.trim()
      : null;
  return { lat, lng, label };
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

async function geocodeWithMapbox(queryText: string): Promise<{ lat: number; lng: number } | null> {
  const raw = queryText.trim();
  if (!raw || !MAPBOX_ACCESS_TOKEN) return null;
  const inline = parseInlineLatLng(raw);
  if (inline) return inline;
  const candidates = Array.from(
    new Set(
      [
        raw,
        raw.split("\n")[0]?.trim() || "",
        raw.replace(/\s{2,}/g, " ").trim(),
        (() => {
          const index = raw.search(/\d{1,6}\s+/);
          return index >= 0 ? raw.slice(index).trim() : "";
        })(),
      ].filter(Boolean)
    )
  );

  for (const candidate of candidates) {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(candidate)}.json`
    );
    url.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
    url.searchParams.set("limit", "1");
    url.searchParams.set("types", "address,poi,place,postcode,neighborhood,locality");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) continue;
    const payload = await res.json().catch(() => null);
    const center = payload?.features?.[0]?.center;
    if (!Array.isArray(center) || center.length < 2) continue;
    const lng = parseFinite(center[0]);
    const lat = parseFinite(center[1]);
    if (lat == null || lng == null) continue;
    return { lat, lng };
  }
  return null;
}

async function fetchTravelMinutesAndDistance(params: {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}): Promise<{ minutes: number | null; distanceKm: number | null }> {
  if (!MAPBOX_ACCESS_TOKEN) return { minutes: null, distanceKm: null };
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${params.originLng},${params.originLat};${params.destLng},${params.destLat}`
  );
  url.searchParams.set("overview", "false");
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("access_token", MAPBOX_ACCESS_TOKEN);
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
  if (!WEATHERAPI_KEY) return { summary: null, temp: null };
  const url = new URL("https://api.weatherapi.com/v1/forecast.json");
  url.searchParams.set("key", WEATHERAPI_KEY);
  url.searchParams.set("q", `${params.lat},${params.lng}`);
  url.searchParams.set("days", "3");
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { summary: null, temp: null };
  const payload = await res.json().catch(() => null);
  const days: Array<any> = Array.isArray(payload?.forecast?.forecastday)
    ? payload.forecast.forecastday
    : [];
  const hourly: Array<any> = [];
  for (const day of days) {
    if (!Array.isArray(day?.hour)) continue;
    for (const hour of day.hour) hourly.push(hour);
  }
  if (!hourly.length) return { summary: null, temp: null };
  const targetMs = new Date(params.eventIso).getTime();
  let bestHour: any = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const hour of hourly) {
    const epoch = parseFinite(hour?.time_epoch);
    const ts = epoch != null ? epoch * 1000 : Number.NaN;
    if (!Number.isFinite(ts)) continue;
    const delta = Math.abs(ts - targetMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestHour = hour;
    }
  }
  if (!bestHour) return { summary: null, temp: null };
  const temp = parseFinite(bestHour?.temp_f);
  const summaryRaw = bestHour?.condition?.text;
  const summary =
    typeof summaryRaw === "string" && summaryRaw.trim() ? summaryRaw.trim() : null;
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
    const requestOrigin = parseBodyOrigin(body);
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
    const featureVisibility = userRes.rows[0]?.feature_visibility;
    const homeOrigin = extractHomeOrigin(featureVisibility);
    const homeLabel = resolveHomeLabel(featureVisibility);
    const geocodedOrigin =
      !homeOrigin && homeLabel ? await geocodeWithMapbox(homeLabel).catch(() => null) : null;
    const origin =
      requestOrigin ||
      homeOrigin ||
      (geocodedOrigin ? { ...geocodedOrigin, label: homeLabel } : null);
    const startMs = new Date(nextEvent.startAt).getTime();
    const nowMs = Date.now();
    const hoursToStart = (startMs - nowMs) / (1000 * 60 * 60);
    const destinationCoords =
      nextEvent.locationLat != null && nextEvent.locationLng != null
        ? { lat: nextEvent.locationLat, lng: nextEvent.locationLng }
        : nextEvent.locationText
        ? await geocodeWithMapbox(nextEvent.locationText).catch(() => null)
        : null;
    const hasDestination = Boolean(destinationCoords);

    const travelFresh = isCacheFresh(cached?.travel_updated_at || null, TRAVEL_TTL_MS);
    const weatherFresh = isCacheFresh(cached?.weather_updated_at || null, WEATHER_TTL_MS);

    const canCallTravel =
      hasDestination &&
      !!origin &&
      !!MAPBOX_ACCESS_TOKEN &&
      (hoursToStart <= 72 || forceTravel) &&
      !travelFresh;
    const canCallWeather =
      hasDestination &&
      !!WEATHERAPI_KEY &&
      hoursToStart <= WEATHER_FORECAST_WINDOW_HOURS &&
      !weatherFresh;

    let travelMinutes = cached?.travel_minutes ?? null;
    let travelDistanceKm = cached?.travel_distance_km ?? null;
    let travelUpdatedAt = cached?.travel_updated_at ?? null;
    let weatherSummary = cached?.weather_summary ?? null;
    let weatherTemp = cached?.weather_temp ?? null;
    let weatherUpdatedAt = cached?.weather_updated_at ?? null;

    if (canCallTravel && origin && destinationCoords) {
      const travel = await fetchTravelMinutesAndDistance({
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destinationCoords.lat,
        destLng: destinationCoords.lng,
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

    if (canCallWeather && destinationCoords) {
      const weather = await fetchWeatherAtEvent({
        lat: destinationCoords.lat,
        lng: destinationCoords.lng,
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
        originSource: requestOrigin
          ? "request"
          : homeOrigin
          ? "profile"
          : geocodedOrigin
          ? "profile-geocoded"
          : "none",
        travelWindowEligible: hoursToStart <= 72,
        weatherWindowEligible: hoursToStart <= WEATHER_FORECAST_WINDOW_HOURS,
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
