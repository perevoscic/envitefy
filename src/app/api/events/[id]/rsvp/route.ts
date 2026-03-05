import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, getUserIdByEmail } from "@/lib/db";
import {
  createServerTimingTracker,
  isTimingRequested,
  type ServerTimingTracker,
} from "@/lib/server-timing";

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
  phone?: unknown;
  message?: unknown;
  target?: unknown;
};

type RsvpTarget = {
  email?: unknown;
  name?: unknown;
  userId?: unknown;
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

async function ensureRsvpTableReady() {
  if (rsvpTableReady === true) return true;
  if (rsvpTableCheckInflight) return rsvpTableCheckInflight;

  rsvpTableCheckInflight = (async () => {
    try {
      const res = await query<{ exists: string | null }>(
        `select to_regclass('public.rsvp_responses')::text as exists`
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
  init?: ResponseInit
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
    return jsonWithTiming(
      timing,
      { error: "RSVP backend is not initialized" },
      { status: 503 }
    );
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const backendError = await assertRsvpBackendReady(timing);
    if (backendError) return backendError;

    const { id: eventId } = await timing.time("params", () => params);

    if (!eventId) {
      return jsonWithTiming(
        timing,
        { error: "Event ID required" },
        { status: 400 }
      );
    }

    const rawBody = await timing.time("body_parse", () => req.json());
    const body = (asRecord(rawBody) || {}) as RsvpMutationBody;

    const responseValue = asTrimmedString(body.response);
    if (!isRsvpResponse(responseValue)) {
      return jsonWithTiming(
        timing,
        { error: "Valid response required (yes/no/maybe)" },
        { status: 400 }
      );
    }

    const name = asTrimmedString(body.name);
    const email = asTrimmedString(body.email);
    const firstName = asTrimmedString(body.firstName);
    const lastName = asTrimmedString(body.lastName);
    const phone = asTrimmedString(body.phone);
    const message = asTrimmedString(body.message);

    const finalName =
      firstName && lastName
        ? `${firstName.trim()} ${lastName.trim()}`
        : name || null;

    const session = (await timing.time("session", () =>
      getServerSession(authOptions))) as SessionLike;
    const sessionUser = session?.user || null;

    const userId = sessionUser?.email
      ? await timing.time("user_lookup", () =>
          getUserIdByEmail(String(sessionUser.email))
        )
      : null;

    const rsvpEmail = email || sessionUser?.email || null;
    const rsvpName = finalName || sessionUser?.name || null;

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
          [
            eventId,
            userId,
            rsvpEmail,
            rsvpName,
            firstName,
            lastName,
            phone,
            message,
            responseValue,
          ]
        )
      );
    } else if (rsvpEmail) {
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
          [
            eventId,
            rsvpEmail,
            rsvpName,
            firstName,
            lastName,
            phone,
            message,
            responseValue,
          ]
        )
      );
    } else if (rsvpName) {
      await timing.time("upsert_name", () =>
        query(
          `
        INSERT INTO rsvp_responses (event_id, name, first_name, last_name, phone, message, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        ON CONFLICT (event_id, LOWER(name)) WHERE email IS NULL AND user_id IS NULL AND name IS NOT NULL
        DO UPDATE SET response = EXCLUDED.response, first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name, phone = EXCLUDED.phone, message = EXCLUDED.message, updated_at = now()
      `,
          [
            eventId,
            rsvpName,
            firstName,
            lastName,
            phone,
            message,
            responseValue,
          ]
        )
      );
    } else {
      return jsonWithTiming(
        timing,
        { error: "Name or email required for RSVP" },
        { status: 400 }
      );
    }

    return jsonWithTiming(timing, { ok: true });
  } catch (err: unknown) {
    console.error("[rsvp] POST error:", err);
    return jsonWithTiming(
      timing,
      { error: errorMessage(err, "Failed to submit RSVP") },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        [eventId]
      )
    );

    const stats: Record<string, number> = { yes: 0, no: 0, maybe: 0 };
    for (const row of statsRes.rows) {
      if (String(row.response) in stats)
        stats[row.response as keyof typeof stats] = Number(row.count);
    }

    const eventRes = await timing.time("event_query", () =>
      query(`SELECT data FROM event_history WHERE id = $1 LIMIT 1`, [eventId])
    );
    const eventData = asRecord(eventRes.rows[0]?.data);
    const numberOfGuests = eventData ? Number(eventData.numberOfGuests) || 0 : 0;

    const totalFilled = stats.yes + stats.maybe + stats.no;
    const remaining = Math.max(0, numberOfGuests - totalFilled);

    const session = (await timing.time("session", () =>
      getServerSession(authOptions))) as SessionLike;
    const sessionUserEmail = session?.user?.email || null;
    let isOwner = false;

    if (sessionUserEmail) {
      const ownerCheck = await timing.time("owner_check", () =>
        query(
          `
        SELECT u.email FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 LIMIT 1
      `,
          [eventId]
        )
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
        [eventId]
      )
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
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const backendError = await assertRsvpBackendReady(timing);
    if (backendError) return backendError;

    const { id: eventId } = await timing.time("params", () => params);
    const session = (await timing.time("session", () =>
      getServerSession(authOptions))) as SessionLike;
    const sessionUserEmail = session?.user?.email || null;
    if (!sessionUserEmail)
      return jsonWithTiming(
        timing,
        { error: "Unauthorized" },
        { status: 401 }
      );

    const ownerCheck = await timing.time("owner_check", () =>
      query(
        `
      SELECT u.id FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 AND u.email = $2 LIMIT 1
    `,
        [eventId, sessionUserEmail]
      )
    );
    if (ownerCheck.rows.length === 0)
      return jsonWithTiming(timing, { error: "Forbidden" }, { status: 403 });

    const rawBody = await timing.time("body_parse", () => req.json());
    const body = (asRecord(rawBody) || {}) as RsvpMutationBody;
    const responseValue = asTrimmedString(body.response);
    if (!isRsvpResponse(responseValue)) {
      return jsonWithTiming(
        timing,
        { error: "Valid response required" },
        { status: 400 }
      );
    }

    const target = (asRecord(body.target) || {}) as RsvpTarget;
    const tEmail = asTrimmedString(target.email);
    const tName = asTrimmedString(target.name);
    const tUserId = asTrimmedString(target.userId);

    if (tUserId) {
      await timing.time("update_user", () =>
        query(
          `UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND user_id = $3`,
          [responseValue, eventId, tUserId]
        )
      );
    } else if (tEmail) {
      await timing.time("update_email", () =>
        query(
          `UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND lower(email) = lower($3)`,
          [responseValue, eventId, tEmail]
        )
      );
    } else if (tName) {
      await timing.time("update_name", () =>
        query(
          `UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND email IS NULL AND user_id IS NULL AND lower(name) = lower($3)`,
          [responseValue, eventId, tName]
        )
      );
    }

    return jsonWithTiming(timing, { ok: true });
  } catch (err: unknown) {
    return jsonWithTiming(
      timing,
      { error: errorMessage(err, "Failed update") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timing = createServerTimingTracker(isTimingRequested(req));
  try {
    const backendError = await assertRsvpBackendReady(timing);
    if (backendError) return backendError;

    const { id: eventId } = await timing.time("params", () => params);
    const session = (await timing.time("session", () =>
      getServerSession(authOptions))) as SessionLike;
    const sessionUserEmail = session?.user?.email || null;
    if (!sessionUserEmail)
      return jsonWithTiming(
        timing,
        { error: "Unauthorized" },
        { status: 401 }
      );

    const ownerCheck = await timing.time("owner_check", () =>
      query(
        `
      SELECT u.id FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 AND u.email = $2 LIMIT 1
    `,
        [eventId, sessionUserEmail]
      )
    );
    if (ownerCheck.rows.length === 0)
      return jsonWithTiming(timing, { error: "Forbidden" }, { status: 403 });

    const rawBody = await timing.time("body_parse", () =>
      req.json().catch(() => ({}))
    );
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
        ])
      );
      resultCount = res.rowCount || 0;
    } else if (tEmail) {
      const res = await timing.time("delete_email", () =>
        query(
          `DELETE FROM rsvp_responses WHERE event_id = $1 AND lower(email) = lower($2)`,
          [eventId, tEmail]
        )
      );
      resultCount = res.rowCount || 0;
    } else if (tName) {
      const res = await timing.time("delete_name", () =>
        query(
          `DELETE FROM rsvp_responses WHERE event_id = $1 AND email IS NULL AND user_id IS NULL AND lower(name) = lower($2)`,
          [eventId, tName]
        )
      );
      resultCount = res.rowCount || 0;
    }

    return jsonWithTiming(timing, { ok: true, deleted: resultCount });
  } catch (err: unknown) {
    return jsonWithTiming(
      timing,
      { error: errorMessage(err, "Failed delete") },
      { status: 500 }
    );
  }
}
