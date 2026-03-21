import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import { extractHomeOrigin } from "@/lib/dashboard-data";
import {
  buildDashboardCollections,
  listDashboardEventsForUser,
} from "@/lib/dashboard-query";
import {
  createServerTimingTracker,
  isTimingRequested,
  type ServerTimingTracker,
} from "@/lib/server-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRAVEL_TTL_MS = 1 * 60 * 60 * 1000;
const WEATHER_TTL_MS = 3 * 60 * 60 * 1000;
const WEATHER_FORECAST_WINDOW_HOURS = 24 * 3; // WeatherAPI free-tier 3-day forecast window.
const EXTERNAL_FETCH_TIMEOUT_MS = 4_500;
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
type SessionLike = {
  user?: {
    email?: string | null;
    id?: string | null;
  } | null;
} | null;
type OriginPayload = {
  originLat?: unknown;
  originLng?: unknown;
  originLabel?: unknown;
  forceTravel?: unknown;
  eventId?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

function parseFinite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractLocationLabel(value: unknown): string | null {
  const source = asRecord(value);
  if (!source) return null;
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
  const source = asRecord(featureVisibility);
  if (!source) return null;
  const settings = asRecord(source.settings);
  const profile = asRecord(source.profile);
  const candidates = [
    source.home,
    source.homeLocation,
    source.origin,
    settings?.homeLocation,
    settings?.origin,
    profile?.homeLocation,
    source.homeAddress,
    settings?.homeAddress,
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

function parseBodyOrigin(body: OriginPayload | null):
  | {
      lat: number;
      lng: number;
      label: string | null;
    }
  | null {
  const lat = parseFinite(body?.originLat ?? null);
  const lng = parseFinite(body?.originLng ?? null);
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
  },
  existing?: MetricsRow | null
) {
  const base = existing === undefined ? await getMetrics(eventId) : existing;
  const travelMinutes =
    patch.travelMinutes !== undefined ? patch.travelMinutes : base?.travel_minutes ?? null;
  const travelDistanceKm =
    patch.travelDistanceKm !== undefined
      ? patch.travelDistanceKm
      : base?.travel_distance_km ?? null;
  const travelUpdatedAt =
    patch.travelUpdatedAt !== undefined
      ? patch.travelUpdatedAt
      : base?.travel_updated_at ?? null;
  const weatherSummary =
    patch.weatherSummary !== undefined
      ? patch.weatherSummary
      : base?.weather_summary ?? null;
  const weatherTemp =
    patch.weatherTemp !== undefined ? patch.weatherTemp : base?.weather_temp ?? null;
  const weatherUpdatedAt =
    patch.weatherUpdatedAt !== undefined
      ? patch.weatherUpdatedAt
      : base?.weather_updated_at ?? null;

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

async function fetchWithTimeout(
  input: URL | string,
  init: RequestInit = {},
  timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
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
    const res = await fetchWithTimeout(url.toString(), { cache: "no-store" }).catch(() => null);
    if (!res?.ok) continue;
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
  const res = await fetchWithTimeout(url, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return { minutes: null, distanceKm: null };
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
  const res = await fetchWithTimeout(url.toString(), { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return { summary: null, temp: null };
  const payload = await res.json().catch(() => null);
  const forecast = asRecord(payload)?.forecast;
  const forecastDays = asRecord(forecast)?.forecastday;
  const days = Array.isArray(forecastDays)
    ? forecastDays
    : [];
  const hourly: unknown[] = [];
  for (const day of days) {
    const dayHour = asRecord(day)?.hour;
    if (!Array.isArray(dayHour)) continue;
    for (const hour of dayHour) hourly.push(hour);
  }
  if (!hourly.length) return { summary: null, temp: null };
  const targetMs = new Date(params.eventIso).getTime();
  let bestHour: Record<string, unknown> | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const hour of hourly) {
    const hourRecord = asRecord(hour);
    if (!hourRecord) continue;
    const epoch = parseFinite(hourRecord.time_epoch);
    const ts = epoch != null ? epoch * 1000 : Number.NaN;
    if (!Number.isFinite(ts)) continue;
    const delta = Math.abs(ts - targetMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestHour = hourRecord;
    }
  }
  if (!bestHour) return { summary: null, temp: null };
  const temp = parseFinite(bestHour.temp_f);
  const summaryRaw = asRecord(bestHour.condition)?.text;
  const summary =
    typeof summaryRaw === "string" && summaryRaw.trim() ? summaryRaw.trim() : null;
  return { summary, temp };
}

function respondWithTiming(
  timing: ServerTimingTracker,
  body: Record<string, unknown>,
  init?: ResponseInit
) {
  const response = NextResponse.json(body, init);
  timing.applyHeader(response);
  return response;
}

export async function POST(req: Request) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const session = (await timing.time("session", () =>
      getServerSession(authOptions))) as SessionLike;
    const email = session?.user?.email || undefined;
    if (!email) {
      const body = timing.enabled
        ? { error: "Unauthorized", timings: timing.toObject() }
        : { error: "Unauthorized" };
      return respondWithTiming(timing, body, { status: 401 });
    }
    const userId = await timing.time("user_lookup", () => resolveSessionUserId(session));
    if (!userId) {
      const body = timing.enabled
        ? { error: "Unauthorized", timings: timing.toObject() }
        : { error: "Unauthorized" };
      return respondWithTiming(timing, body, { status: 401 });
    }

    const rawBody = await timing.time("body_parse", () => req.json().catch(() => ({})));
    const body = (asRecord(rawBody) || {}) as OriginPayload;
    const forceTravel = Boolean(body.forceTravel);
    const requestOrigin = parseBodyOrigin(body);
    const requestedEventId =
      typeof body.eventId === "string" && body.eventId.trim() ? body.eventId.trim() : null;

    const events = await timing.time("events", () => listDashboardEventsForUser(userId, 200));
    const { nextEvent } = buildDashboardCollections(events);

    if (!nextEvent) {
      const payload: Record<string, unknown> = {
        ok: true,
        metrics: null,
        reason: "no-next-event",
      };
      if (timing.enabled) payload.timings = timing.toObject();
      return respondWithTiming(timing, payload);
    }
    if (requestedEventId && requestedEventId !== nextEvent.id) {
      const payload: Record<string, unknown> = {
        ok: true,
        metrics: null,
        reason: "event-not-next",
      };
      if (timing.enabled) payload.timings = timing.toObject();
      return respondWithTiming(timing, payload);
    }

    await timing.time("metrics_table", () => ensureMetricsCacheTable());
    const [userRes, cached] = await timing.time("metrics_load", () =>
      Promise.all([
        query<{ feature_visibility: unknown }>(
          `select feature_visibility from users where id = $1 limit 1`,
          [userId]
        ),
        getMetrics(nextEvent.id),
      ])
    );

    const featureVisibility = userRes.rows[0]?.feature_visibility;
    const homeOrigin = extractHomeOrigin(featureVisibility);
    const homeLabel = resolveHomeLabel(featureVisibility);

    const originGeocodePromise =
      !homeOrigin && homeLabel
        ? geocodeWithMapbox(homeLabel).catch(() => null)
        : Promise.resolve(null);
    const destinationPromise =
      nextEvent.locationLat != null && nextEvent.locationLng != null
        ? Promise.resolve({ lat: nextEvent.locationLat, lng: nextEvent.locationLng })
        : nextEvent.locationText
        ? geocodeWithMapbox(nextEvent.locationText).catch(() => null)
        : Promise.resolve(null);

    const [geocodedOrigin, destinationCoords] = await timing.time(
      "geocode",
      () => Promise.all([originGeocodePromise, destinationPromise])
    );

    const origin =
      requestOrigin ||
      homeOrigin ||
      (geocodedOrigin ? { ...geocodedOrigin, label: homeLabel } : null);

    const startMs = new Date(nextEvent.startAt).getTime();
    const nowMs = Date.now();
    const hoursToStart = (startMs - nowMs) / (1000 * 60 * 60);
    const hasDestination = Boolean(destinationCoords);

    const travelFresh = isCacheFresh(cached?.travel_updated_at || null, TRAVEL_TTL_MS);
    const weatherFresh = isCacheFresh(cached?.weather_updated_at || null, WEATHER_TTL_MS);

    const canCallTravel =
      hasDestination &&
      !!origin &&
      !!MAPBOX_ACCESS_TOKEN &&
      (hoursToStart <= 72 || forceTravel) &&
      (forceTravel || !travelFresh);
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

    const [travelResult, weatherResult] = await timing.time("external", async () => {
      const travelPromise =
        canCallTravel && origin && destinationCoords
          ? fetchTravelMinutesAndDistance({
              originLat: origin.lat,
              originLng: origin.lng,
              destLat: destinationCoords.lat,
              destLng: destinationCoords.lng,
            })
          : Promise.resolve<{ minutes: number | null; distanceKm: number | null }>({
              minutes: null,
              distanceKm: null,
            });

      const weatherPromise =
        canCallWeather && destinationCoords
          ? fetchWeatherAtEvent({
              lat: destinationCoords.lat,
              lng: destinationCoords.lng,
              eventIso: nextEvent.startAt,
            })
          : Promise.resolve<{ summary: string | null; temp: number | null }>({
              summary: null,
              temp: null,
            });

      return Promise.all([travelPromise, weatherPromise]);
    });

    const metricsPatch: {
      travelMinutes?: number | null;
      travelDistanceKm?: number | null;
      travelUpdatedAt?: string | null;
      weatherSummary?: string | null;
      weatherTemp?: number | null;
      weatherUpdatedAt?: string | null;
    } = {};

    if (travelResult.minutes != null || travelResult.distanceKm != null) {
      travelMinutes = travelResult.minutes;
      travelDistanceKm = travelResult.distanceKm;
      travelUpdatedAt = new Date().toISOString();
      metricsPatch.travelMinutes = travelMinutes;
      metricsPatch.travelDistanceKm = travelDistanceKm;
      metricsPatch.travelUpdatedAt = travelUpdatedAt;
    }

    if (weatherResult.summary != null || weatherResult.temp != null) {
      weatherSummary = weatherResult.summary;
      weatherTemp = weatherResult.temp;
      weatherUpdatedAt = new Date().toISOString();
      metricsPatch.weatherSummary = weatherSummary;
      metricsPatch.weatherTemp = weatherTemp;
      metricsPatch.weatherUpdatedAt = weatherUpdatedAt;
    }

    if (Object.keys(metricsPatch).length > 0) {
      await timing.time("metrics_upsert", () =>
        upsertMetrics(nextEvent.id, metricsPatch, cached)
      );
    }

    const payload: Record<string, unknown> = {
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
    };

    if (timing.enabled) {
      payload.timings = timing.toObject();
    }
    return respondWithTiming(timing, payload);
  } catch (err: unknown) {
    const message = errorMessage(err, "Failed to enrich next event metrics");
    const body = timing.enabled
      ? {
          error: message,
          timings: timing.toObject(),
        }
      : { error: message };
    return respondWithTiming(timing, body, { status: 500 });
  }
}
