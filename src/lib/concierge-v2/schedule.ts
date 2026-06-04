import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { getEventHistoryById, query, updateEventHistoryData } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { detectScheduleConflicts } from "./core.mjs";
import { ConciergeV2OperationError } from "./operations";
import { ensureConciergeV2Tables } from "./storage";

type EventPageRow = {
  event_page_id: string;
  workspace_id: string | null;
  program_id: string | null;
  owner_user_id: string | null;
  legacy_event_history_id: string;
  event_title: string;
};

type SeriesRow = {
  id: string;
  title: string;
  series_type: string;
  recurrence_rule: string | null;
  start_time_local: string | null;
  duration_minutes: number | null;
  timezone: string | null;
  status: string;
  metadata_json: Record<string, any>;
};

type OccurrenceRow = {
  id: string;
  workspace_id: string | null;
  program_id: string | null;
  series_id: string | null;
  owner_user_id: string | null;
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
  if (!userId) throw new ConciergeV2OperationError("Sign in to manage the schedule.", 401);
  if (page.owner_user_id !== userId) {
    throw new ConciergeV2OperationError("You do not have access to this event.", 403);
  }
}

function nullableIso(value: any, label: string): string | null | undefined {
  if (value === undefined) return undefined;
  const text = cleanString(value, 100);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    throw new ConciergeV2OperationError(`Invalid ${label}.`, 400);
  }
  return parsed.toISOString();
}

function normalizeOccurrence(row: OccurrenceRow) {
  const metadata = asRecord(row.metadata_json);
  return {
    id: row.id,
    seriesId: row.series_id,
    title: row.title,
    type: row.occurrence_type,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    locationText: row.location_text,
    status: row.status,
    notes: cleanString(metadata.notes || metadata.description, 800) || null,
    participantIds: Array.isArray(metadata.participantIds) ? metadata.participantIds : [],
    resourceIds: Array.isArray(metadata.resourceIds) ? metadata.resourceIds : [],
  };
}

function normalizeSeries(row: SeriesRow) {
  return {
    id: row.id,
    title: row.title,
    type: row.series_type,
    recurrenceRule: row.recurrence_rule,
    startTimeLocal: row.start_time_local,
    durationMinutes: row.duration_minutes,
    timezone: row.timezone,
    status: row.status,
  };
}

async function getEventPage(eventHistoryId: string): Promise<EventPageRow | null> {
  const res = await query<EventPageRow>(
    `select ep.id as event_page_id, ep.workspace_id, ep.program_id, ep.owner_user_id,
       ep.legacy_event_history_id, eh.title as event_title
     from event_pages ep
     join event_history eh on eh.id = ep.legacy_event_history_id
     where ep.legacy_event_history_id = $1
     order by ep.created_at desc
     limit 1`,
    [eventHistoryId],
  );
  return res.rows[0] || null;
}

async function getOwnedSchedulePage(params: {
  eventHistoryId: string;
  userId: string;
}): Promise<EventPageRow> {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  requireOwner(page, params.userId);
  if (!page.program_id) throw new ConciergeV2OperationError("Schedule program not found.", 404);
  return page;
}

async function loadSeries(programId: string) {
  const rows = await query<SeriesRow>(
    `select id, title, series_type, recurrence_rule, start_time_local, duration_minutes,
       timezone, status, metadata_json
     from event_series
     where program_id = $1
     order by created_at asc`,
    [programId],
  );
  return rows.rows.map(normalizeSeries);
}

async function loadOccurrences(programId: string) {
  const rows = await query<OccurrenceRow>(
    `select id, workspace_id, program_id, series_id, owner_user_id, title, occurrence_type,
       start_at, end_at, timezone, location_text, status, metadata_json
     from event_occurrences
     where program_id = $1
     order by start_at asc nulls last, created_at asc`,
    [programId],
  );
  return rows.rows.map(normalizeOccurrence);
}

function buildConflicts(occurrences: Array<ReturnType<typeof normalizeOccurrence>>) {
  return detectScheduleConflicts(
    occurrences
      .filter((item) => item.status !== "canceled")
      .map((item) => ({
        ...item,
        venueId: item.locationText,
      })),
  ).map((conflict) => ({
    occurrenceIds: Array.isArray(conflict.occurrenceIds) ? conflict.occurrenceIds : [],
    reason: cleanString(conflict.reason, 100) || "overlap",
    participantIds: Array.isArray(conflict.participantIds) ? conflict.participantIds : [],
    resourceIds: Array.isArray(conflict.resourceIds) ? conflict.resourceIds : [],
  }));
}

function scheduleCounts(occurrences: Array<ReturnType<typeof normalizeOccurrence>>) {
  const active = occurrences.filter((item) => item.status !== "canceled");
  const deadlines = active.filter((item) => item.type === "deadline").length;
  const canceled = occurrences.length - active.length;
  return {
    total: occurrences.length,
    active: active.length,
    canceled,
    deadlines,
  };
}

async function republishSchedule(params: {
  eventHistoryId: string;
  userId: string;
  occurrences: Array<ReturnType<typeof normalizeOccurrence>>;
}) {
  const event = await getEventHistoryById(params.eventHistoryId);
  if (!event) return;
  const data = asRecord(event.data);
  const active = params.occurrences.filter((item) => item.status !== "canceled");
  const first = active.find((item) => item.startAt) || params.occurrences.find((item) => item.startAt) || null;
  const nextData = {
    ...data,
    startAt: first?.startAt || data.startAt || null,
    startISO: first?.startAt || data.startISO || null,
    start: first?.startAt || data.start || null,
    endAt: first?.endAt || data.endAt || null,
    endISO: first?.endAt || data.endISO || null,
    end: first?.endAt || data.end || null,
    timezone: first?.timezone || cleanString(data.timezone, 80) || "America/Chicago",
    tz: first?.timezone || cleanString(data.tz, 80) || "America/Chicago",
    location: first?.locationText || data.location || "",
    locationText: first?.locationText || data.locationText || "",
    scheduleHub: {
      ...asRecord(data.scheduleHub),
      enabled: true,
      items: params.occurrences,
      occurrences: params.occurrences,
      updatedAt: new Date().toISOString(),
    },
    publicEvent: {
      ...asRecord(data.publicEvent),
      scheduleItems: params.occurrences,
    },
    scheduleItems: params.occurrences,
  };
  await updateEventHistoryData(params.eventHistoryId, nextData);
  invalidateUserHistory(params.userId);
  invalidateUserDashboard(params.userId);
}

export async function getConciergeV2ScheduleHub(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const page = await getOwnedSchedulePage(params);
  const [series, occurrences] = await Promise.all([
    loadSeries(page.program_id as string),
    loadOccurrences(page.program_id as string),
  ]);
  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: page.event_page_id,
      title: page.event_title,
    },
    series,
    occurrences,
    conflicts: buildConflicts(occurrences),
    counts: scheduleCounts(occurrences),
  };
}

export async function createConciergeV2Occurrence(params: {
  eventHistoryId: string;
  userId: string;
  title: string;
  occurrenceType?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  locationText?: string | null;
  notes?: string | null;
}) {
  const page = await getOwnedSchedulePage(params);
  const title = cleanString(params.title, 220);
  if (!title) throw new ConciergeV2OperationError("Schedule title is required.", 400);
  const startAt = nullableIso(params.startAt, "start time") ?? null;
  const endAt = nullableIso(params.endAt, "end time") ?? null;
  const timezone = cleanString(params.timezone, 80) || "America/Chicago";
  const occurrenceType = cleanString(params.occurrenceType, 80) || "event";
  const locationText = cleanString(params.locationText, 220) || null;
  const notes = cleanString(params.notes, 1000) || null;
  const row = await query<OccurrenceRow>(
    `insert into event_occurrences (
       workspace_id, program_id, owner_user_id, title, occurrence_type,
       start_at, end_at, timezone, location_text, status, metadata_json
     )
     values ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, $8, $9, 'scheduled', $10::jsonb)
     returning id, workspace_id, program_id, series_id, owner_user_id, title, occurrence_type,
       start_at, end_at, timezone, location_text, status, metadata_json`,
    [
      page.workspace_id,
      page.program_id,
      params.userId,
      title,
      occurrenceType,
      startAt,
      endAt,
      timezone,
      locationText,
      JSON.stringify({ notes, createdVia: "schedule_hub" }),
    ],
  );
  const occurrences = await loadOccurrences(page.program_id as string);
  await republishSchedule({ eventHistoryId: params.eventHistoryId, userId: params.userId, occurrences });
  return normalizeOccurrence(row.rows[0]);
}

export async function updateConciergeV2Occurrence(params: {
  eventHistoryId: string;
  occurrenceId: string;
  userId: string;
  title?: string | null;
  occurrenceType?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  locationText?: string | null;
  status?: string | null;
  notes?: string | null;
}) {
  const page = await getOwnedSchedulePage(params);
  const current = await query<OccurrenceRow>(
    `select id, workspace_id, program_id, series_id, owner_user_id, title, occurrence_type,
       start_at, end_at, timezone, location_text, status, metadata_json
     from event_occurrences
     where id = $1 and program_id = $2
     limit 1`,
    [params.occurrenceId, page.program_id],
  );
  const row = current.rows[0];
  if (!row) throw new ConciergeV2OperationError("Schedule item not found.", 404);
  const status = cleanString(params.status, 40).toLowerCase();
  if (status && !["scheduled", "tentative", "canceled", "done"].includes(status)) {
    throw new ConciergeV2OperationError("Unsupported schedule status.", 400);
  }
  const metadata = {
    ...asRecord(row.metadata_json),
    ...(params.notes !== undefined ? { notes: cleanString(params.notes, 1000) || null } : {}),
    updatedVia: "schedule_hub",
  };
  const updated = await query<OccurrenceRow>(
    `update event_occurrences
     set title = $3,
         occurrence_type = $4,
         start_at = $5::timestamptz,
         end_at = $6::timestamptz,
         timezone = $7,
         location_text = $8,
         status = $9,
         metadata_json = $10::jsonb,
         updated_at = now()
     where id = $1 and program_id = $2
     returning id, workspace_id, program_id, series_id, owner_user_id, title, occurrence_type,
       start_at, end_at, timezone, location_text, status, metadata_json`,
    [
      params.occurrenceId,
      page.program_id,
      cleanString(params.title, 220) || row.title,
      cleanString(params.occurrenceType, 80) || row.occurrence_type,
      nullableIso(params.startAt, "start time") ?? row.start_at,
      nullableIso(params.endAt, "end time") ?? row.end_at,
      cleanString(params.timezone, 80) || row.timezone || "America/Chicago",
      params.locationText === undefined ? row.location_text : cleanString(params.locationText, 220) || null,
      status || row.status,
      JSON.stringify(metadata),
    ],
  );
  const occurrences = await loadOccurrences(page.program_id as string);
  await republishSchedule({ eventHistoryId: params.eventHistoryId, userId: params.userId, occurrences });
  return normalizeOccurrence(updated.rows[0]);
}
