import { randomBytes } from "node:crypto";
import { absoluteUrl } from "@/lib/absolute-url";
import { query } from "@/lib/db";
import { buildIcsFeed } from "./core.mjs";
import { ConciergeV2OperationError } from "./operations";
import { ensureConciergeV2Tables } from "./storage";

type EventPageRow = {
  event_page_id: string;
  workspace_id: string | null;
  program_id: string | null;
  owner_user_id: string | null;
  event_title: string;
};

type FeedRow = {
  id: string;
  workspace_id: string | null;
  user_id: string | null;
  program_id: string | null;
  name: string;
  token: string;
  scope_json: Record<string, any>;
  timezone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type OccurrenceRow = {
  id: string;
  title: string;
  occurrence_type: string;
  start_at: string | null;
  end_at: string | null;
  timezone: string | null;
  location_text: string | null;
  status: string;
  metadata_json: Record<string, any>;
};

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function requireOwner(page: EventPageRow, userId: string | null | undefined) {
  if (!userId) throw new ConciergeV2OperationError("Sign in to manage the calendar feed.", 401);
  if (page.owner_user_id !== userId) {
    throw new ConciergeV2OperationError("You do not have access to this event.", 403);
  }
}

function newToken() {
  return `cal_${randomBytes(18).toString("hex")}`;
}

function normalizeOccurrence(row: OccurrenceRow) {
  const metadata = asRecord(row.metadata_json);
  return {
    id: row.id,
    title: row.title,
    type: row.occurrence_type,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    locationText: row.location_text,
    status: row.status,
    notes: cleanString(metadata.notes || metadata.description, 800) || null,
  };
}

function normalizeFeed(row: FeedRow, feedUrl: string) {
  return {
    id: row.id,
    name: row.name,
    token: row.token,
    timezone: row.timezone,
    isActive: row.is_active,
    feedUrl,
    downloadUrl: feedUrl,
    googleSubscribeUrl: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`,
    scope: asRecord(row.scope_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getEventPage(eventHistoryId: string): Promise<EventPageRow | null> {
  const res = await query<EventPageRow>(
    `select ep.id as event_page_id, ep.workspace_id, ep.program_id, ep.owner_user_id,
       eh.title as event_title
     from event_pages ep
     join event_history eh on eh.id = ep.legacy_event_history_id
     where ep.legacy_event_history_id = $1
     order by ep.created_at desc
     limit 1`,
    [eventHistoryId],
  );
  return res.rows[0] || null;
}

async function getOwnedCalendarPage(params: {
  eventHistoryId: string;
  userId: string;
}): Promise<EventPageRow> {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  requireOwner(page, params.userId);
  if (!page.program_id) throw new ConciergeV2OperationError("Calendar program not found.", 404);
  return page;
}

async function loadOccurrences(programId: string) {
  const rows = await query<OccurrenceRow>(
    `select id, title, occurrence_type, start_at, end_at, timezone, location_text, status, metadata_json
     from event_occurrences
     where program_id = $1
     order by start_at asc nulls last, created_at asc`,
    [programId],
  );
  return rows.rows.map(normalizeOccurrence);
}

async function feedUrlForToken(token: string) {
  return absoluteUrl(`/api/concierge/calendar/${encodeURIComponent(token)}`);
}

async function getActiveFeed(programId: string, userId: string) {
  const res = await query<FeedRow>(
    `select id, workspace_id, user_id, program_id, name, token, scope_json, timezone,
       is_active, created_at, updated_at
     from calendar_feeds
     where program_id = $1 and user_id = $2 and is_active = true
     order by created_at desc
     limit 1`,
    [programId, userId],
  );
  return res.rows[0] || null;
}

async function createFeed(params: {
  page: EventPageRow;
  eventHistoryId: string;
  userId: string;
  timezone?: string | null;
}) {
  const token = newToken();
  const name = `${cleanString(params.page.event_title, 180) || "Envitefy Event"} Schedule`;
  const feed = await query<FeedRow>(
    `insert into calendar_feeds (
       workspace_id, user_id, program_id, name, token, scope_json, timezone, is_active
     )
     values ($1, $2, $3, $4, $5, $6::jsonb, $7, true)
     returning id, workspace_id, user_id, program_id, name, token, scope_json, timezone,
       is_active, created_at, updated_at`,
    [
      params.page.workspace_id,
      params.userId,
      params.page.program_id,
      name,
      token,
      JSON.stringify({
        eventHistoryId: params.eventHistoryId,
        eventPageId: params.page.event_page_id,
        programId: params.page.program_id,
      }),
      cleanString(params.timezone, 80) || "America/Chicago",
    ],
  );
  const row = feed.rows[0];
  if (!row) throw new ConciergeV2OperationError("Unable to create calendar feed.", 500);
  return row;
}

async function getOrCreateFeed(params: {
  page: EventPageRow;
  eventHistoryId: string;
  userId: string;
  timezone?: string | null;
}) {
  const existing = await getActiveFeed(params.page.program_id as string, params.userId);
  if (existing) return existing;
  return createFeed(params);
}

function calendarCounts(occurrences: Array<ReturnType<typeof normalizeOccurrence>>) {
  const active = occurrences.filter((item) => item.status !== "canceled" && item.startAt);
  const now = Date.now();
  const upcoming = active.filter((item) => {
    const time = new Date(String(item.startAt)).getTime();
    return Number.isFinite(time) && time >= now;
  });
  return {
    total: occurrences.length,
    active: active.length,
    upcoming: upcoming.length,
    canceled: occurrences.length - occurrences.filter((item) => item.status !== "canceled").length,
  };
}

function buildIcs(params: {
  name: string;
  occurrences: Array<ReturnType<typeof normalizeOccurrence>>;
}) {
  return buildIcsFeed({
    name: params.name,
    occurrences: params.occurrences.filter((item) => item.status !== "canceled" && item.startAt),
  });
}

export async function getConciergeV2CalendarCenter(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const page = await getOwnedCalendarPage(params);
  const occurrences = await loadOccurrences(page.program_id as string);
  const firstTimezone = occurrences.find((item) => cleanString(item.timezone, 80))?.timezone;
  const feed = await getOrCreateFeed({
    page,
    eventHistoryId: params.eventHistoryId,
    userId: params.userId,
    timezone: firstTimezone,
  });
  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: page.event_page_id,
      title: page.event_title,
    },
    feed: normalizeFeed(feed, await feedUrlForToken(feed.token)),
    counts: calendarCounts(occurrences),
    preview: occurrences.filter((item) => item.status !== "canceled").slice(0, 12),
  };
}

export async function regenerateConciergeV2CalendarFeed(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const page = await getOwnedCalendarPage(params);
  await query(
    `update calendar_feeds
     set is_active = false, updated_at = now()
     where program_id = $1 and user_id = $2 and is_active = true`,
    [page.program_id, params.userId],
  );
  const occurrences = await loadOccurrences(page.program_id as string);
  const firstTimezone = occurrences.find((item) => cleanString(item.timezone, 80))?.timezone;
  const feed = await createFeed({
    page,
    eventHistoryId: params.eventHistoryId,
    userId: params.userId,
    timezone: firstTimezone,
  });
  return {
    feed: normalizeFeed(feed, await feedUrlForToken(feed.token)),
    counts: calendarCounts(occurrences),
    preview: occurrences.filter((item) => item.status !== "canceled").slice(0, 12),
  };
}

export async function buildConciergeV2CalendarIcsByToken(token: string) {
  await ensureConciergeV2Tables();
  const cleanToken = cleanString(token, 120);
  if (!cleanToken) throw new ConciergeV2OperationError("Calendar feed not found.", 404);
  const feedRes = await query<FeedRow>(
    `select id, workspace_id, user_id, program_id, name, token, scope_json, timezone,
       is_active, created_at, updated_at
     from calendar_feeds
     where token = $1 and is_active = true
     limit 1`,
    [cleanToken],
  );
  const feed = feedRes.rows[0];
  if (!feed?.program_id) throw new ConciergeV2OperationError("Calendar feed not found.", 404);
  const occurrences = await loadOccurrences(feed.program_id);
  return {
    filename: `${cleanString(feed.name, 80).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "envitefy-schedule"}.ics`,
    ics: buildIcs({ name: feed.name, occurrences }),
  };
}
