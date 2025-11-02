import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, getUserIdByEmail } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ensure rsvp_responses table exists
async function ensureRsvpTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS rsvp_responses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      email text,
      name text,
      response varchar(16) NOT NULL, -- 'yes' | 'no' | 'maybe'
      created_at timestamptz(6) DEFAULT now(),
      updated_at timestamptz(6) DEFAULT now(),
      CONSTRAINT uniq_rsvp_responses_event_email UNIQUE (event_id, email) WHERE email IS NOT NULL,
      CONSTRAINT uniq_rsvp_responses_event_user UNIQUE (event_id, user_id) WHERE user_id IS NOT NULL
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event_id
    ON rsvp_responses(event_id)
  `);
}

// POST /api/events/[id]/rsvp - Submit RSVP response
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureRsvpTable();

    const awaitedParams = await context.params;
    const eventId = awaitedParams.id;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { response, name, email } = body;

    if (!response || !["yes", "no", "maybe"].includes(response)) {
      return NextResponse.json(
        { error: "Valid response required (yes/no/maybe)" },
        { status: 400 }
      );
    }

    const session: any = await getServerSession(authOptions as any);
    const sessionUser: any = (session && (session as any).user) || null;
    let userId: string | null = null;

    if (sessionUser?.email) {
      userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
    }

    // Use provided email or session email, or require one
    const rsvpEmail = email || sessionUser?.email || null;
    const rsvpName = name || sessionUser?.name || null;

    if (!rsvpEmail && !userId) {
      return NextResponse.json(
        { error: "Email or authentication required" },
        { status: 401 }
      );
    }

    // Insert or update RSVP response
    if (userId) {
      // Update existing or insert new response for this user
      await query(
        `
        INSERT INTO rsvp_responses (event_id, user_id, email, name, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT ON CONSTRAINT uniq_rsvp_responses_event_user
        DO UPDATE SET
          response = EXCLUDED.response,
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          updated_at = now()
        `,
        [eventId, userId, rsvpEmail, rsvpName, response]
      );
    } else if (rsvpEmail) {
      // Update existing or insert new response for this email
      await query(
        `
        INSERT INTO rsvp_responses (event_id, email, name, response, updated_at)
        VALUES ($1, $2, $3, $4, now())
        ON CONFLICT ON CONSTRAINT uniq_rsvp_responses_event_email
        DO UPDATE SET
          response = EXCLUDED.response,
          name = EXCLUDED.name,
          updated_at = now()
        `,
        [eventId, rsvpEmail, rsvpName, response]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[rsvp] POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to submit RSVP" },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/rsvp - Get RSVP stats
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureRsvpTable();

    const awaitedParams = await context.params;
    const eventId = awaitedParams.id;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Get RSVP counts
    const statsRes = await query(
      `
      SELECT 
        response,
        COUNT(*) as count
      FROM rsvp_responses
      WHERE event_id = $1
      GROUP BY response
      `,
      [eventId]
    );

    const stats: Record<string, number> = {
      yes: 0,
      no: 0,
      maybe: 0,
    };

    for (const row of statsRes.rows) {
      const r = String(row.response || "");
      const count = Number(row.count || 0);
      if (r in stats) {
        stats[r as keyof typeof stats] = count;
      }
    }

    // Get event's numberOfGuests from event_history
    const eventRes = await query(
      `
      SELECT data
      FROM event_history
      WHERE id = $1
      LIMIT 1
      `,
      [eventId]
    );

    let numberOfGuests = 0;
    if (eventRes.rows.length > 0) {
      const data = eventRes.rows[0].data;
      if (data && typeof data === "object" && typeof data.numberOfGuests === "number") {
        numberOfGuests = data.numberOfGuests;
      }
    }

    const remaining = Math.max(0, numberOfGuests - stats.yes);

    return NextResponse.json({
      ok: true,
      stats,
      numberOfGuests,
      remaining,
      filled: stats.yes,
    });
  } catch (err: any) {
    console.error("[rsvp] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch RSVP stats" },
      { status: 500 }
    );
  }
}
