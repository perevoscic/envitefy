import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions } from "@/lib/auth";
import { getUserIdByEmail, query } from "@/lib/db";
import { sendRsvpConfirmationEmail } from "@/lib/email";
import { buildPublicAssetUrl } from "@/lib/public-asset-url";
import {
  createServerTimingTracker,
  isTimingRequested,
  type ServerTimingTracker,
} from "@/lib/server-timing";
import { buildCalendarLinks, ensureEndIso } from "@/utils/calendar-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionLike = {
  user?: {
    email?: string | null;
    name?: string | null;
  } | null;
} | null;

type RsvpMutationBody = {
  response?: unknown;
  name?: unknown;
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  target?: unknown;
};

type RsvpTarget = {
  email?: unknown;
  name?: unknown;
  userId?: unknown;
};

type EventDetailsRow = {
  title: string;
  data: Record<string, unknown> | null;
  public_slug: string | null;
};

let rsvpTableReady: boolean | null = null;
let rsvpTableCheckInflight: Promise<boolean> | null = null;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

function isRsvpResponse(value: string | null): value is "yes" | "no" | "maybe" {
  return value === "yes" || value === "no" || value === "maybe";
}

function firstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function normalizePlaceLabelForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/['\u2019]s\b/g, "s")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isSamePlaceLabel(left: string, right: string): boolean {
  const normalizedLeft = normalizePlaceLabelForComparison(left);
  const normalizedRight = normalizePlaceLabelForComparison(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight || normalizedRight.includes(normalizedLeft);
}

function nestedRecord(
  record: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!record) return null;
  return asRecord(record[key]);
}

function getEventStartRaw(data: Record<string, unknown> | null): string | null {
  const fieldsGuess = nestedRecord(data, "fieldsGuess");
  const event = nestedRecord(data, "event");
  return firstString(data?.startAt, data?.startISO, data?.start, fieldsGuess?.start, event?.start);
}

function getEventEndRaw(data: Record<string, unknown> | null): string | null {
  const fieldsGuess = nestedRecord(data, "fieldsGuess");
  const event = nestedRecord(data, "event");
  return firstString(data?.endAt, data?.endISO, data?.end, fieldsGuess?.end, event?.end);
}

function getEventTimezone(data: Record<string, unknown> | null): string | null {
  const fieldsGuess = nestedRecord(data, "fieldsGuess");
  const event = nestedRecord(data, "event");
  return firstString(data?.timezone, data?.tz, fieldsGuess?.timezone, event?.timezone);
}

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildDateLabel(data: Record<string, unknown> | null): string | null {
  const start = parseDate(getEventStartRaw(data));
  if (!start) return null;
  const end = parseDate(getEventEndRaw(data));
  const timeZone = getEventTimezone(data) || undefined;
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  };

  try {
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const startLabel = formatter.format(start);
    if (!end || end.getTime() <= start.getTime()) return startLabel;
    return `${startLabel} - ${formatter.format(end)}`;
  } catch {
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const startLabel = formatter.format(start);
    if (!end || end.getTime() <= start.getTime()) return startLabel;
    return `${startLabel} - ${formatter.format(end)}`;
  }
}

function buildLocationLabel(data: Record<string, unknown> | null): string | null {
  const fieldsGuess = nestedRecord(data, "fieldsGuess");
  const event = nestedRecord(data, "event");
  const venue = firstString(
    data?.venue,
    data?.venueName,
    data?.placeName,
    event?.venue,
    event?.venueName,
    event?.placeName,
  );
  const location = firstString(
    data?.locationText,
    data?.locationLabel,
    data?.locationName,
    data?.location,
    data?.address,
    fieldsGuess?.location,
    fieldsGuess?.locationName,
    event?.location,
    event?.locationName,
    event?.address,
  );
  if (venue && location && !isSamePlaceLabel(venue, location)) {
    return `${venue}, ${location}`;
  }
  return location || venue;
}

function buildEventTitle(row: EventDetailsRow): string {
  const data = row.data;
  const fieldsGuess = nestedRecord(data, "fieldsGuess");
  const event = nestedRecord(data, "event");
  return firstString(row.title, data?.title, fieldsGuess?.title, event?.title) || "Event";
}

function isSafeEmailImageSource(value: string): boolean {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

function resolveRsvpEmailEventImageUrl(
  eventId: string,
  data: Record<string, unknown> | null,
): string | null {
  const attachment = nestedRecord(data, "attachment");
  const attachmentType = String(attachment?.type || "").trim().toLowerCase();
  const studioCard = nestedRecord(data, "studioCard");
  const publicEvent = nestedRecord(data, "publicEvent");

  const candidates: Array<{
    value: unknown;
    inlineVariant?: "thumbnail" | "hero" | "attachment";
  }> = [
    { value: data?.coverImageUrl },
    { value: data?.thumbnail, inlineVariant: "thumbnail" },
    { value: data?.customHeroImage, inlineVariant: "hero" },
    { value: data?.heroImage, inlineVariant: "hero" },
    ...(attachmentType.startsWith("image/")
      ? [{ value: attachment?.dataUrl, inlineVariant: "attachment" as const }]
      : []),
    { value: attachment?.previewImageUrl },
    { value: attachment?.thumbnailUrl },
    { value: studioCard?.imageUrl },
    { value: publicEvent?.imageUrl },
  ];

  for (const candidate of candidates) {
    const raw = firstString(candidate.value);
    if (!raw) continue;
    if (/^data:image\//i.test(raw)) {
      if (!candidate.inlineVariant) continue;
      const params = new URLSearchParams({ variant: candidate.inlineVariant });
      return buildPublicAssetUrl(`/api/events/${eventId}/thumbnail?${params.toString()}`);
    }
    if (!isSafeEmailImageSource(raw)) continue;
    return buildPublicAssetUrl(raw);
  }

  return null;
}

function getEventDescription(data: Record<string, unknown> | null): string | null {
  const event = nestedRecord(data, "event");
  return firstString(data?.description, data?.details, data?.notes, event?.description);
}

function isEventAllDay(data: Record<string, unknown> | null): boolean {
  return data?.allDay === true || data?.fullDay === true;
}

function getEventReminderMinutes(data: Record<string, unknown> | null): number[] | null {
  const reminders = data?.reminders;
  if (!Array.isArray(reminders)) return null;
  const minutes = reminders
    .map((item) => {
      const record = asRecord(item);
      const value = record?.minutes;
      return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
    })
    .filter((value): value is number => value !== null);
  return minutes.length ? minutes : null;
}

async function buildRsvpCalendarLinks(params: {
  title: string;
  data: Record<string, unknown> | null;
  locationLabel: string | null;
}): Promise<Array<{ label: string; url: string }> | null> {
  const startRaw = getEventStartRaw(params.data);
  if (!parseDate(startRaw)) return null;
  const startIso = startRaw as string;
  const allDay = isEventAllDay(params.data);
  const endIso = ensureEndIso(startIso, getEventEndRaw(params.data), allDay);
  const links = buildCalendarLinks({
    title: params.title,
    description: getEventDescription(params.data) || "",
    location: params.locationLabel || "",
    startIso,
    endIso,
    timezone: getEventTimezone(params.data) || "",
    allDay,
    reminders: getEventReminderMinutes(params.data),
    recurrence: firstString(params.data?.recurrence) || null,
  });
  const appleUrl = await absoluteUrl(links.appleInline);
  return [
    { label: "Apple Calendar", url: appleUrl },
    { label: "Google Calendar", url: links.google },
    { label: "Outlook Calendar", url: links.outlook },
  ];
}

function maskEmailForLog(email: string): string {
  if (!email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const prefix = user?.slice(0, 2) || "*";
  return `${prefix}***@${domain}`;
}

async function ensureRsvpTableReady() {
  if (rsvpTableReady === true) return true;
  if (rsvpTableCheckInflight) return rsvpTableCheckInflight;

  rsvpTableCheckInflight = (async () => {
    try {
      const res = await query<{ exists: string | null }>(
        `select to_regclass('public.rsvp_responses')::text as exists`,
      );
      const ready = Boolean(res.rows[0]?.exists);
      rsvpTableReady = ready;
      return ready;
    } catch {
      rsvpTableReady = false;
      return false;
    } finally {
      rsvpTableCheckInflight = null;
    }
  })();

  return rsvpTableCheckInflight;
}

function jsonWithTiming(
  timing: ServerTimingTracker,
  payload: Record<string, unknown>,
  init?: ResponseInit,
) {
  const body = timing.enabled
    ? {
        ...payload,
        timings: timing.toObject(),
      }
    : payload;
  const response = NextResponse.json(body, init);
  timing.applyHeader(response);
  return response;
}

async function assertRsvpBackendReady(timing: ServerTimingTracker) {
  const ready = await timing.time("table_check", () => ensureRsvpTableReady());
  if (!ready) {
    return jsonWithTiming(timing, { error: "RSVP backend is not initialized" }, { status: 503 });
  }
  return null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const backendError = await assertRsvpBackendReady(timing);
    if (backendError) return backendError;

    const { id: eventId } = await timing.time("params", () => params);

    if (!eventId) {
      return jsonWithTiming(timing, { error: "Event ID required" }, { status: 400 });
    }

    const eventRes = await timing.time("event_details", () =>
      query<EventDetailsRow>(
        `SELECT title, data, public_slug FROM event_history WHERE id = $1 LIMIT 1`,
        [eventId],
      ),
    );
    const eventRow = eventRes.rows[0] || null;
    if (!eventRow) {
      return jsonWithTiming(timing, { error: "Event not found" }, { status: 404 });
    }

    const rawBody = await timing.time("body_parse", () => req.json());
    const body = (asRecord(rawBody) || {}) as RsvpMutationBody;

    const responseValue = asTrimmedString(body.response);
    if (!isRsvpResponse(responseValue)) {
      return jsonWithTiming(
        timing,
        { error: "Valid response required (yes/no/maybe)" },
        { status: 400 },
      );
    }

    const name = asTrimmedString(body.name);
    const email = asTrimmedString(body.email);
    const firstName = asTrimmedString(body.firstName);
    const lastName = asTrimmedString(body.lastName);

    const finalName =
      firstName && lastName ? `${firstName.trim()} ${lastName.trim()}` : name || null;

    const session = (await timing.time("session", () =>
      getServerSession(authOptions),
    )) as SessionLike;
    const sessionUser = session?.user || null;

    const userId = sessionUser?.email
      ? await timing.time("user_lookup", () => getUserIdByEmail(String(sessionUser.email)))
      : null;

    const rsvpEmail = email || sessionUser?.email || null;
    const rsvpName = finalName || sessionUser?.name || null;

    if (!rsvpName || !rsvpEmail) {
      return jsonWithTiming(timing, { error: "Name and email required for RSVP" }, { status: 400 });
    }

    if (userId) {
      await timing.time("upsert_user", () =>
        query(
          `
        INSERT INTO rsvp_responses (event_id, user_id, email, name, first_name, last_name, phone, message, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
        ON CONFLICT (event_id, user_id) WHERE user_id IS NOT NULL
        DO UPDATE SET response = EXCLUDED.response, email = EXCLUDED.email, name = EXCLUDED.name,
        first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, phone = EXCLUDED.phone,
        message = EXCLUDED.message, updated_at = now()
      `,
          [eventId, userId, rsvpEmail, rsvpName, firstName, lastName, null, null, responseValue],
        ),
      );
    } else {
      await timing.time("upsert_email", () =>
        query(
          `
        INSERT INTO rsvp_responses (event_id, email, name, first_name, last_name, phone, message, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (event_id, email) WHERE email IS NOT NULL
        DO UPDATE SET response = EXCLUDED.response, name = EXCLUDED.name,
        first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, phone = EXCLUDED.phone,
        message = EXCLUDED.message, updated_at = now()
      `,
          [eventId, rsvpEmail, rsvpName, firstName, lastName, null, null, responseValue],
        ),
      );
    }

    const publicSlug = firstString(eventRow.public_slug, eventRow.data?.publicSlug);
    const eventUrl = await timing.time("event_url", () =>
      absoluteUrl(`/event/${encodeURIComponent(publicSlug || eventId)}`),
    );
    const eventTitle = buildEventTitle(eventRow);
    const dateLabel = buildDateLabel(eventRow.data);
    const locationLabel = buildLocationLabel(eventRow.data);
    const eventImageUrl = resolveRsvpEmailEventImageUrl(eventId, eventRow.data);
    const calendarLinks = await timing.time("calendar_links", () =>
      buildRsvpCalendarLinks({
        title: eventTitle,
        data: eventRow.data,
        locationLabel,
      }),
    );

    void (async () => {
      try {
        await sendRsvpConfirmationEmail({
          toEmail: rsvpEmail,
          guestName: rsvpName,
          eventTitle,
          eventUrl,
          response: responseValue,
          dateLabel,
          locationLabel,
          eventImageUrl,
          eventImageAlt: eventTitle,
          calendarLinks,
        });
      } catch (err) {
        console.error("[rsvp] confirmation email failed", {
          to: maskEmailForLog(rsvpEmail),
          eventId,
          error: errorMessage(err, "Failed to send RSVP confirmation email"),
        });
      }
    })();

    return jsonWithTiming(timing, { ok: true });
  } catch (err: unknown) {
    console.error("[rsvp] POST error:", err);
    return jsonWithTiming(
      timing,
      { error: errorMessage(err, "Failed to submit RSVP") },
      { status: 500 },
    );
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const backendError = await assertRsvpBackendReady(timing);
    if (backendError) return backendError;

    const { id: eventId } = await timing.time("params", () => params);

    const statsRes = await timing.time("stats_query", () =>
      query(
        `
      SELECT response, COUNT(*) as count FROM rsvp_responses WHERE event_id = $1 GROUP BY response
    `,
        [eventId],
      ),
    );

    const stats: Record<string, number> = { yes: 0, no: 0, maybe: 0 };
    for (const row of statsRes.rows) {
      if (String(row.response) in stats)
        stats[row.response as keyof typeof stats] = Number(row.count);
    }

    const eventRes = await timing.time("event_query", () =>
      query(`SELECT data FROM event_history WHERE id = $1 LIMIT 1`, [eventId]),
    );
    const eventData = asRecord(eventRes.rows[0]?.data);
    const numberOfGuests = eventData ? Number(eventData.numberOfGuests) || 0 : 0;

    const totalFilled = stats.yes + stats.maybe + stats.no;
    const remaining = Math.max(0, numberOfGuests - totalFilled);

    const session = (await timing.time("session", () =>
      getServerSession(authOptions),
    )) as SessionLike;
    const sessionUserEmail = session?.user?.email || null;
    let isOwner = false;

    if (sessionUserEmail) {
      const ownerCheck = await timing.time("owner_check", () =>
        query(
          `
        SELECT u.email FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 LIMIT 1
      `,
          [eventId],
        ),
      );
      isOwner = ownerCheck.rows[0]?.email === sessionUserEmail;
    }

    const baseResponse: Record<string, unknown> = {
      ok: true,
      stats,
      numberOfGuests,
      remaining,
      filled: totalFilled,
    };

    if (!isOwner) return jsonWithTiming(timing, baseResponse);

    const responsesRes = await timing.time("responses_query", () =>
      query(
        `
      SELECT name, first_name as "firstName", last_name as "lastName", phone, message, email, response, created_at, updated_at
      FROM rsvp_responses WHERE event_id = $1 ORDER BY created_at DESC
    `,
        [eventId],
      ),
    );

    return jsonWithTiming(timing, {
      ...baseResponse,
      responses: responsesRes.rows.map((row) => ({
        ...row,
        response: String(row.response),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (err: unknown) {
    console.error("[rsvp] GET error:", err);
    return jsonWithTiming(
      timing,
      { error: errorMessage(err, "Failed to fetch RSVP") },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const backendError = await assertRsvpBackendReady(timing);
    if (backendError) return backendError;

    const { id: eventId } = await timing.time("params", () => params);
    const session = (await timing.time("session", () =>
      getServerSession(authOptions),
    )) as SessionLike;
    const sessionUserEmail = session?.user?.email || null;
    if (!sessionUserEmail)
      return jsonWithTiming(timing, { error: "Unauthorized" }, { status: 401 });

    const ownerCheck = await timing.time("owner_check", () =>
      query(
        `
      SELECT u.id FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 AND u.email = $2 LIMIT 1
    `,
        [eventId, sessionUserEmail],
      ),
    );
    if (ownerCheck.rows.length === 0)
      return jsonWithTiming(timing, { error: "Forbidden" }, { status: 403 });

    const rawBody = await timing.time("body_parse", () => req.json());
    const body = (asRecord(rawBody) || {}) as RsvpMutationBody;
    const responseValue = asTrimmedString(body.response);
    if (!isRsvpResponse(responseValue)) {
      return jsonWithTiming(timing, { error: "Valid response required" }, { status: 400 });
    }

    const target = (asRecord(body.target) || {}) as RsvpTarget;
    const tEmail = asTrimmedString(target.email);
    const tName = asTrimmedString(target.name);
    const tUserId = asTrimmedString(target.userId);

    if (tUserId) {
      await timing.time("update_user", () =>
        query(
          `UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND user_id = $3`,
          [responseValue, eventId, tUserId],
        ),
      );
    } else if (tEmail) {
      await timing.time("update_email", () =>
        query(
          `UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND lower(email) = lower($3)`,
          [responseValue, eventId, tEmail],
        ),
      );
    } else if (tName) {
      await timing.time("update_name", () =>
        query(
          `UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND email IS NULL AND user_id IS NULL AND lower(name) = lower($3)`,
          [responseValue, eventId, tName],
        ),
      );
    }

    return jsonWithTiming(timing, { ok: true });
  } catch (err: unknown) {
    return jsonWithTiming(timing, { error: errorMessage(err, "Failed update") }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const backendError = await assertRsvpBackendReady(timing);
    if (backendError) return backendError;

    const { id: eventId } = await timing.time("params", () => params);
    const session = (await timing.time("session", () =>
      getServerSession(authOptions),
    )) as SessionLike;
    const sessionUserEmail = session?.user?.email || null;
    if (!sessionUserEmail)
      return jsonWithTiming(timing, { error: "Unauthorized" }, { status: 401 });

    const ownerCheck = await timing.time("owner_check", () =>
      query(
        `
      SELECT u.id FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 AND u.email = $2 LIMIT 1
    `,
        [eventId, sessionUserEmail],
      ),
    );
    if (ownerCheck.rows.length === 0)
      return jsonWithTiming(timing, { error: "Forbidden" }, { status: 403 });

    const rawBody = await timing.time("body_parse", () => req.json().catch(() => ({})));
    const body = (asRecord(rawBody) || {}) as RsvpMutationBody;
    const target = (asRecord(body.target) || {}) as RsvpTarget;
    const tEmail = asTrimmedString(target.email);
    const tName = asTrimmedString(target.name);
    const tUserId = asTrimmedString(target.userId);

    let resultCount = 0;
    if (tUserId) {
      const res = await timing.time("delete_user", () =>
        query(`DELETE FROM rsvp_responses WHERE event_id = $1 AND user_id = $2`, [
          eventId,
          tUserId,
        ]),
      );
      resultCount = res.rowCount || 0;
    } else if (tEmail) {
      const res = await timing.time("delete_email", () =>
        query(`DELETE FROM rsvp_responses WHERE event_id = $1 AND lower(email) = lower($2)`, [
          eventId,
          tEmail,
        ]),
      );
      resultCount = res.rowCount || 0;
    } else if (tName) {
      const res = await timing.time("delete_name", () =>
        query(
          `DELETE FROM rsvp_responses WHERE event_id = $1 AND email IS NULL AND user_id IS NULL AND lower(name) = lower($2)`,
          [eventId, tName],
        ),
      );
      resultCount = res.rowCount || 0;
    }

    return jsonWithTiming(timing, { ok: true, deleted: resultCount });
  } catch (err: unknown) {
    return jsonWithTiming(timing, { error: errorMessage(err, "Failed delete") }, { status: 500 });
  }
}
