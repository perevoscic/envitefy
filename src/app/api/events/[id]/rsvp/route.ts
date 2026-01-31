import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, getUserIdByEmail } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ensure rsvp_responses table exists and has all columns
async function ensureRsvpTable() {
  try {
    // Basic table
    await query(`
      CREATE TABLE IF NOT EXISTS rsvp_responses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        email text,
        name text,
        first_name text,
        last_name text,
        phone text,
        message text,
        response varchar(16) NOT NULL,
        created_at timestamptz(6) DEFAULT now(),
        updated_at timestamptz(6) DEFAULT now()
      )
    `);

    // Ensure all columns exist (for existing tables)
    const columns = ["first_name", "last_name", "phone", "message"];
    for (const col of columns) {
      await query(`ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS ${col} text`);
    }

    // Indices and Constraints
    // We use try-catch for each to avoid stopping if one exists or fails
    try {
      await query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_user ON rsvp_responses(event_id, user_id) WHERE user_id IS NOT NULL`);
    } catch (e) { }

    try {
      await query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_email ON rsvp_responses(event_id, email) WHERE email IS NOT NULL`);
    } catch (e) { }

    try {
      // First cleanup potential duplicates for the name index
      await query(`
        DELETE FROM rsvp_responses WHERE id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id, LOWER(name) ORDER BY updated_at DESC) as rn
            FROM rsvp_responses WHERE email IS NULL AND user_id IS NULL AND name IS NOT NULL
          ) t WHERE rn > 1
        )
      `);
      await query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_name ON rsvp_responses(event_id, LOWER(name)) WHERE email IS NULL AND user_id IS NULL AND name IS NOT NULL`);
    } catch (e) { }

    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event_id ON rsvp_responses(event_id)`);
    } catch (e) { }

  } catch (err: any) {
    console.error("[rsvp] Schema sync error:", err?.message);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureRsvpTable();
    const { id: eventId } = await params;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { response, name, email, firstName, lastName, phone, message } = body;

    if (!response || !["yes", "no", "maybe"].includes(response)) {
      return NextResponse.json({ error: "Valid response required (yes/no/maybe)" }, { status: 400 });
    }

    let finalName = name;
    if (firstName && lastName) {
      finalName = `${firstName.trim()} ${lastName.trim()}`;
    }

    const session: any = await getServerSession(authOptions as any);
    const sessionUser = session?.user || null;
    let userId: string | null = null;

    if (sessionUser?.email) {
      userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
    }

    const rsvpEmail = email || sessionUser?.email || null;
    const rsvpName = finalName || sessionUser?.name || null;

    if (userId) {
      await query(`
        INSERT INTO rsvp_responses (event_id, user_id, email, name, first_name, last_name, phone, message, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
        ON CONFLICT (event_id, user_id) WHERE user_id IS NOT NULL
        DO UPDATE SET response = EXCLUDED.response, email = EXCLUDED.email, name = EXCLUDED.name, 
        first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, phone = EXCLUDED.phone, 
        message = EXCLUDED.message, updated_at = now()
      `, [eventId, userId, rsvpEmail, rsvpName, firstName, lastName, phone, message, response]);
    } else if (rsvpEmail) {
      await query(`
        INSERT INTO rsvp_responses (event_id, email, name, first_name, last_name, phone, message, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (event_id, email) WHERE email IS NOT NULL
        DO UPDATE SET response = EXCLUDED.response, name = EXCLUDED.name, 
        first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, phone = EXCLUDED.phone, 
        message = EXCLUDED.message, updated_at = now()
      `, [eventId, rsvpEmail, rsvpName, firstName, lastName, phone, message, response]);
    } else if (rsvpName?.trim()) {
      const trimmedName = rsvpName.trim();
      await query(`
        INSERT INTO rsvp_responses (event_id, name, first_name, last_name, phone, message, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        ON CONFLICT (event_id, LOWER(name)) WHERE email IS NULL AND user_id IS NULL AND name IS NOT NULL
        DO UPDATE SET response = EXCLUDED.response, first_name = EXCLUDED.first_name, 
        last_name = EXCLUDED.last_name, phone = EXCLUDED.phone, message = EXCLUDED.message, updated_at = now()
      `, [eventId, trimmedName, firstName, lastName, phone, message, response]);
    } else {
      return NextResponse.json({ error: "Name or email required for RSVP" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[rsvp] POST error:", err);
    return NextResponse.json({ error: err?.message || "Failed to submit RSVP" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureRsvpTable();
    const { id: eventId } = await params;

    const statsRes = await query(`
      SELECT response, COUNT(*) as count FROM rsvp_responses WHERE event_id = $1 GROUP BY response
    `, [eventId]);

    const stats: Record<string, number> = { yes: 0, no: 0, maybe: 0 };
    for (const row of statsRes.rows) {
      if (String(row.response) in stats) stats[row.response as keyof typeof stats] = Number(row.count);
    }

    const eventRes = await query(`SELECT data FROM event_history WHERE id = $1 LIMIT 1`, [eventId]);
    let numberOfGuests = 0;
    if (eventRes.rows[0]?.data && typeof eventRes.rows[0].data === "object") {
      numberOfGuests = (eventRes.rows[0].data as any).numberOfGuests || 0;
    }

    const totalFilled = stats.yes + stats.maybe + stats.no;
    const remaining = Math.max(0, numberOfGuests - totalFilled);

    const session: any = await getServerSession(authOptions as any);
    const sessionUserEmail = session?.user?.email || null;
    let isOwner = false;

    if (sessionUserEmail) {
      const ownerCheck = await query(`
        SELECT u.email FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 LIMIT 1
      `, [eventId]);
      isOwner = ownerCheck.rows[0]?.email === sessionUserEmail;
    }

    const baseResponse = { ok: true, stats, numberOfGuests, remaining, filled: totalFilled };

    if (!isOwner) return NextResponse.json(baseResponse);

    const responsesRes = await query(`
      SELECT name, first_name as "firstName", last_name as "lastName", phone, message, email, response, created_at, updated_at
      FROM rsvp_responses WHERE event_id = $1 ORDER BY created_at DESC
    `, [eventId]);

    return NextResponse.json({
      ...baseResponse,
      responses: responsesRes.rows.map(row => ({
        ...row,
        response: String(row.response),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (err: any) {
    console.error("[rsvp] GET error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch RSVP" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const sessionUserEmail = session?.user?.email || null;
    if (!sessionUserEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ownerCheck = await query(`
      SELECT u.id FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 AND u.email = $2 LIMIT 1
    `, [eventId, sessionUserEmail]);
    if (ownerCheck.rows.length === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { response, target } = body;
    const { email: tEmail, name: tNameRaw, userId: tUserId } = target || {};
    const tName = tNameRaw ? String(tNameRaw).trim() : null;

    if (!response || !["yes", "no", "maybe"].includes(response)) {
      return NextResponse.json({ error: "Valid response required" }, { status: 400 });
    }

    if (tUserId) {
      await query(`UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND user_id = $3`, [response, eventId, tUserId]);
    } else if (tEmail) {
      await query(`UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND lower(email) = lower($3)`, [response, eventId, tEmail]);
    } else if (tName) {
      await query(`UPDATE rsvp_responses SET response = $1, updated_at = now() WHERE event_id = $2 AND email IS NULL AND user_id IS NULL AND lower(name) = lower($3)`, [response, eventId, tName]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed update" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session: any = await getServerSession(authOptions as any);
    const sessionUserEmail = session?.user?.email || null;
    if (!sessionUserEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ownerCheck = await query(`
      SELECT u.id FROM event_history e JOIN users u ON e.user_id = u.id WHERE e.id = $1 AND u.email = $2 LIMIT 1
    `, [eventId, sessionUserEmail]);
    if (ownerCheck.rows.length === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { target } = body;
    const { email: tEmail, name: tNameRaw, userId: tUserId } = target || {};
    const tName = tNameRaw ? String(tNameRaw).trim() : null;

    let resultCount = 0;
    if (tUserId) {
      const res = await query(`DELETE FROM rsvp_responses WHERE event_id = $1 AND user_id = $2`, [eventId, tUserId]);
      resultCount = res.rowCount || 0;
    } else if (tEmail) {
      const res = await query(`DELETE FROM rsvp_responses WHERE event_id = $1 AND lower(email) = lower($2)`, [eventId, tEmail]);
      resultCount = res.rowCount || 0;
    } else if (tName) {
      const res = await query(`DELETE FROM rsvp_responses WHERE event_id = $1 AND email IS NULL AND user_id IS NULL AND lower(name) = lower($3)`, [eventId, tName]);
      resultCount = res.rowCount || 0;
    }

    return NextResponse.json({ ok: true, deleted: resultCount });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed delete" }, { status: 500 });
  }
}
