import { query } from "@/lib/db";
import {
  isArchivedOrCanceled,
  isDraftStatus,
  type DashboardEvent,
} from "@/lib/dashboard-data";

type DashboardEventProjectionRow = {
  id: string;
  title: string | null;
  created_at: string | null;
  start_at_raw: string | null;
  end_at_raw: string | null;
  tz: string | null;
  location_text: string | null;
  location_lat: number | string | null;
  location_lng: number | string | null;
  cover_image_url: string | null;
  status: string | null;
  category: string | null;
  updated_at_raw: string | null;
  number_of_guests: number | string | null;
  reminder_count: number | string | null;
  created_via: string | null;
};

function parseIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseNumber(value: number | string | null | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseCount(value: number | string | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function buildMapsUrl(locationText: string | null): string | null {
  if (!locationText) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`;
}

function toDashboardEvent(row: DashboardEventProjectionRow): DashboardEvent | null {
  const startAt = parseIso(row.start_at_raw);
  if (!startAt) return null;

  const locationText = normalizeText(row.location_text);
  const title = normalizeText(row.title) || "Event";
  const updatedAt =
    parseIso(row.updated_at_raw) || parseIso(row.created_at) || null;

  return {
    id: row.id,
    title,
    startAt,
    endAt: parseIso(row.end_at_raw),
    tz: normalizeText(row.tz),
    locationText,
    locationLat: parseNumber(row.location_lat),
    locationLng: parseNumber(row.location_lng),
    coverImageUrl: normalizeText(row.cover_image_url),
    status: normalizeText(row.status)?.toLowerCase() || null,
    category: normalizeText(row.category),
    updatedAt,
    numberOfGuests: parseCount(row.number_of_guests),
    reminderCount: parseCount(row.reminder_count),
    mapsUrl: buildMapsUrl(locationText),
    createdVia: normalizeText(row.created_via)?.toLowerCase() || null,
  };
}

const DASHBOARD_EVENTS_SQL = `
  select
    id,
    title,
    created_at,
    coalesce(
      data->>'startAt',
      data->>'startISO',
      data->>'start',
      data->'fieldsGuess'->>'start',
      data->'event'->>'start'
    ) as start_at_raw,
    coalesce(
      data->>'endAt',
      data->>'endISO',
      data->>'end',
      data->'fieldsGuess'->>'end',
      data->'event'->>'end'
    ) as end_at_raw,
    coalesce(
      data->>'tz',
      data->>'timezone',
      data->'fieldsGuess'->>'timezone',
      data->'event'->>'timezone'
    ) as tz,
    coalesce(
      data->>'locationText',
      data->>'location',
      data->'fieldsGuess'->>'location',
      data->'event'->>'location'
    ) as location_text,
    coalesce(
      case
        when (data ? 'locationLat') and (data->>'locationLat') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          then (data->>'locationLat')::double precision
      end,
      case
        when (data ? 'lat') and (data->>'lat') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          then (data->>'lat')::double precision
      end,
      case
        when (data->'event' ? 'locationLat') and (data->'event'->>'locationLat') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          then (data->'event'->>'locationLat')::double precision
      end
    ) as location_lat,
    coalesce(
      case
        when (data ? 'locationLng') and (data->>'locationLng') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          then (data->>'locationLng')::double precision
      end,
      case
        when (data ? 'lng') and (data->>'lng') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          then (data->>'lng')::double precision
      end,
      case
        when (data->'event' ? 'locationLng') and (data->'event'->>'locationLng') ~ '^-?[0-9]+(\\.[0-9]+)?$'
          then (data->'event'->>'locationLng')::double precision
      end
    ) as location_lng,
    coalesce(
      data->>'coverImageUrl',
      data->>'thumbnail',
      data->>'heroImage',
      case
        when coalesce(data->'attachment'->>'type', '') like 'image/%'
          then data->'attachment'->>'dataUrl'
      end
    ) as cover_image_url,
    lower(trim(coalesce(data->>'status', ''))) as status,
    nullif(trim(coalesce(data->>'category', '')), '') as category,
    coalesce(data->>'updatedAt', created_at::text) as updated_at_raw,
    coalesce(
      case
        when (data ? 'numberOfGuests') and (data->>'numberOfGuests') ~ '^-?[0-9]+$'
          then greatest((data->>'numberOfGuests')::integer, 0)
      end,
      0
    ) as number_of_guests,
    case
      when jsonb_typeof(data->'reminders') = 'array'
        then jsonb_array_length(data->'reminders')
      else 0
    end as reminder_count,
    nullif(lower(trim(coalesce(data->>'createdVia', ''))), '') as created_via
  from event_history
  where user_id = $1
  order by created_at desc nulls last, id desc
  limit $2
`;

export async function listDashboardEventsForOwner(
  userId: string,
  limit = 200
): Promise<DashboardEvent[]> {
  const max = Math.max(1, Math.min(500, Math.floor(limit)));
  const rows = await query<DashboardEventProjectionRow>(DASHBOARD_EVENTS_SQL, [
    userId,
    max,
  ]);
  return (rows.rows || [])
    .map((row) => toDashboardEvent(row))
    .filter((row): row is DashboardEvent => Boolean(row));
}

export function buildDashboardCollections(
  events: DashboardEvent[],
  nowMs = Date.now()
): {
  allDrafts: DashboardEvent[];
  drafts: DashboardEvent[];
  upcoming: DashboardEvent[];
  nextEvent: DashboardEvent | null;
  upcomingIn30DaysCount: number;
  upcomingIn7DaysCount: number;
  nextEventInDays: number | null;
} {
  const allDrafts = events
    .filter((event) => isDraftStatus(event.status))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  const upcoming = events
    .filter((event) => {
      const startMs = new Date(event.startAt).getTime();
      return startMs > nowMs && !isArchivedOrCanceled(event.status);
    })
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

  const nextEvent = upcoming[0] || null;
  const upcomingIn30DaysCount = upcoming.filter((event) => {
    const diff = new Date(event.startAt).getTime() - nowMs;
    return diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const upcomingIn7DaysCount = upcoming.filter((event) => {
    const diff = new Date(event.startAt).getTime() - nowMs;
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const nextEventInDays = nextEvent
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nextEvent.startAt).getTime() - nowMs) /
            (24 * 60 * 60 * 1000)
        )
      )
    : null;

  return {
    allDrafts,
    drafts: allDrafts.slice(0, 3),
    upcoming,
    nextEvent,
    upcomingIn30DaysCount,
    upcomingIn7DaysCount,
    nextEventInDays,
  };
}
