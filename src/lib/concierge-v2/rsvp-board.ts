import { query } from "@/lib/db";
import { ConciergeV2OperationError } from "./operations";
import { ensureConciergeV2Tables } from "./storage";

type EventPageRow = {
  event_page_id: string;
  owner_user_id: string | null;
  event_title: string;
  event_data: Record<string, any> | null;
};

type RsvpRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  message: string | null;
  response: string;
  answers_json: Record<string, any>;
  adult_count: number | null;
  kid_count: number | null;
  allergy_notes: string | null;
  created_at: string;
  updated_at: string;
};

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function numberValue(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function rsvpStatus(value: any): "yes" | "maybe" | "no" {
  const status = cleanString(value, 20).toLowerCase();
  return status === "maybe" || status === "no" ? status : "yes";
}

function requireOwner(page: EventPageRow, userId: string | null | undefined) {
  if (!userId) throw new ConciergeV2OperationError("Sign in to manage RSVPs.", 401);
  if (page.owner_user_id !== userId) {
    throw new ConciergeV2OperationError("You do not have access to this event.", 403);
  }
}

async function ensureRsvpV2Columns() {
  await query(`alter table rsvp_responses add column if not exists answers_json jsonb not null default '{}'::jsonb`);
  await query(`alter table rsvp_responses add column if not exists adult_count integer`);
  await query(`alter table rsvp_responses add column if not exists kid_count integer`);
  await query(`alter table rsvp_responses add column if not exists allergy_notes text`);
}

async function getEventPage(eventHistoryId: string): Promise<EventPageRow | null> {
  const res = await query<EventPageRow>(
    `select ep.id as event_page_id, ep.owner_user_id, eh.title as event_title, eh.data as event_data
     from event_pages ep
     join event_history eh on eh.id = ep.legacy_event_history_id
     where ep.legacy_event_history_id = $1
     order by ep.created_at desc
     limit 1`,
    [eventHistoryId],
  );
  return res.rows[0] || null;
}

async function getOwnedRsvpPage(params: {
  eventHistoryId: string;
  userId: string;
}): Promise<EventPageRow> {
  await ensureConciergeV2Tables();
  await ensureRsvpV2Columns();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  requireOwner(page, params.userId);
  return page;
}

function expectedGuestCount(data: Record<string, any> | null) {
  const record = asRecord(data);
  return numberValue(
    record.numberOfGuests ??
      record.expectedGuestCount ??
      record.expectedGuests ??
      asRecord(record.rsvp)?.expectedGuestCount ??
      asRecord(record.rsvp)?.expectedGuests,
  );
}

function answerLabel(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferMode(data: Record<string, any> | null): string {
  const record = asRecord(data);
  const candidates = [
    record.category,
    record.vertical,
    record.intent,
    record.eventType,
    asRecord(record.publicEvent)?.category,
    asRecord(record.conciergeV2)?.mode,
  ];
  for (const candidate of candidates) {
    const value = cleanString(candidate, 80);
    if (value) return value.replace(/[_-]+/g, " ");
  }
  return "event";
}

function normalizeRsvp(row: RsvpRow) {
  const answers = asRecord(row.answers_json);
  const status = rsvpStatus(row.response);
  const displayName =
    cleanString(row.name, 180) ||
    [cleanString(row.first_name, 80), cleanString(row.last_name, 80)].filter(Boolean).join(" ") ||
    cleanString(row.email, 240) ||
    "Guest";
  const adultCount = numberValue(row.adult_count ?? answers.adult_count ?? answers.adults);
  const kidCount = numberValue(row.kid_count ?? answers.kid_count ?? answers.kids ?? answers.children);
  const allergyNotes =
    cleanString(row.allergy_notes, 1000) ||
    cleanString(answers.allergies, 1000) ||
    cleanString(answers.allergy_notes, 1000) ||
    null;
  const foodChoice =
    cleanString(answers.food_choice, 300) ||
    cleanString(answers.meal_choice, 300) ||
    cleanString(answers.lunch_needed, 300) ||
    null;
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: displayName,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    message: row.message,
    response: status,
    answers,
    adultCount,
    kidCount,
    allergyNotes,
    foodChoice,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function summarizeResponses(responses: Array<ReturnType<typeof normalizeRsvp>>, expectedGuests: number) {
  const counts = { yes: 0, maybe: 0, no: 0, pending: 0 };
  let adults = 0;
  let kids = 0;
  let allergies = 0;
  for (const response of responses) {
    counts[response.response] += 1;
    adults += response.adultCount;
    kids += response.kidCount;
    if (response.allergyNotes) allergies += 1;
  }
  const filled = counts.yes + counts.maybe + counts.no;
  counts.pending = expectedGuests > 0 ? Math.max(0, expectedGuests - filled) : 0;
  return {
    ...counts,
    filled,
    expectedGuests,
    adults,
    kids,
    allergies,
  };
}

function buildAnswerFields(responses: Array<ReturnType<typeof normalizeRsvp>>) {
  const fields = new Map<string, { key: string; label: string; count: number }>();
  for (const response of responses) {
    for (const [key, value] of Object.entries(response.answers)) {
      if (value === null || value === undefined || value === "") continue;
      const current = fields.get(key);
      fields.set(key, {
        key,
        label: current?.label || answerLabel(key),
        count: (current?.count || 0) + 1,
      });
    }
  }
  return [...fields.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function csvCell(value: any): string {
  const text = Array.isArray(value) ? value.join("; ") : value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function getConciergeV2RsvpBoard(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const page = await getOwnedRsvpPage(params);
  const responsesRes = await query<RsvpRow>(
    `select id, user_id, email, name, first_name, last_name, phone, message,
       response, answers_json, adult_count, kid_count, allergy_notes, created_at, updated_at
     from rsvp_responses
     where event_id = $1
     order by updated_at desc, created_at desc`,
    [params.eventHistoryId],
  );
  const responses = responsesRes.rows.map(normalizeRsvp);
  const expectedGuests = expectedGuestCount(page.event_data);
  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: page.event_page_id,
      title: page.event_title,
      mode: inferMode(page.event_data),
    },
    summary: summarizeResponses(responses, expectedGuests),
    answerFields: buildAnswerFields(responses),
    responses,
  };
}

export async function updateConciergeV2RsvpResponse(params: {
  eventHistoryId: string;
  userId: string;
  rsvpId: string;
  response: string;
}) {
  await getOwnedRsvpPage(params);
  const status = rsvpStatus(params.response);
  const updated = await query<RsvpRow>(
    `update rsvp_responses
     set response = $3, updated_at = now()
     where id = $1 and event_id = $2
     returning id, user_id, email, name, first_name, last_name, phone, message,
       response, answers_json, adult_count, kid_count, allergy_notes, created_at, updated_at`,
    [params.rsvpId, params.eventHistoryId, status],
  );
  const row = updated.rows[0];
  if (!row) throw new ConciergeV2OperationError("RSVP response not found.", 404);
  return normalizeRsvp(row);
}

export async function buildConciergeV2RsvpCsv(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const board = await getConciergeV2RsvpBoard(params);
  const answerKeys = board.answerFields.map((field) => field.key);
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Status",
    "Adults",
    "Kids",
    "Allergies",
    "Food Choice",
    "Message",
    "Updated At",
    ...board.answerFields.map((field) => field.label),
  ];
  const lines = [
    headers.map(csvCell).join(","),
    ...board.responses.map((response) =>
      [
        response.name,
        response.email,
        response.phone,
        response.response,
        response.adultCount,
        response.kidCount,
        response.allergyNotes,
        response.foodChoice,
        response.message,
        response.updatedAt,
        ...answerKeys.map((key) => response.answers[key]),
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  return {
    filename: `${cleanString(board.event.title, 80).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "event"}-rsvps.csv`,
    csv: `${lines.join("\n")}\n`,
  };
}
