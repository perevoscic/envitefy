import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, getUserIdByEmail } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ensure rsvp_responses table exists
async function ensureRsvpTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS rsvp_responses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        email text,
        name text,
        response varchar(16) NOT NULL, -- 'yes' | 'no' | 'maybe'
        created_at timestamptz(6) DEFAULT now(),
        updated_at timestamptz(6) DEFAULT now()
      )
    `);
  } catch (err: any) {
    // If table creation fails, log but continue - table might already exist
    // If the error is about invalid syntax, the table might need to be dropped and recreated
    console.error("[rsvp] Table creation error:", err?.message);
    // Don't throw - allow the function to continue and try to create indexes
  }
  
  // Create partial unique indexes (PostgreSQL doesn't support WHERE in table constraints)
  // Drop old indexes and constraints first if they exist (in case they were created incorrectly)
  try {
    await query(`DROP INDEX IF EXISTS uniq_rsvp_responses_event_email`);
  } catch {}
  
  try {
    await query(`DROP INDEX IF EXISTS uniq_rsvp_responses_event_user`);
  } catch {}
  
  // Also try to drop constraints if they exist (though they shouldn't with WHERE clauses)
  try {
    await query(`ALTER TABLE rsvp_responses DROP CONSTRAINT IF EXISTS uniq_rsvp_responses_event_email`);
  } catch {}
  
  try {
    await query(`ALTER TABLE rsvp_responses DROP CONSTRAINT IF EXISTS uniq_rsvp_responses_event_user`);
  } catch {}
  
  // Now create the indexes with proper syntax
  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_email
      ON rsvp_responses(event_id, email)
      WHERE email IS NOT NULL
    `);
  } catch (err: any) {
    console.error("[rsvp] Index creation error (email):", err?.message);
  }
  
  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_user
      ON rsvp_responses(event_id, user_id)
      WHERE user_id IS NOT NULL
    `);
  } catch (err: any) {
    console.error("[rsvp] Index creation error (user):", err?.message);
  }
  
  // Add unique constraint for name-based RSVPs when email and user_id are both NULL
  // Use case-insensitive matching by storing normalized name
  // First, clean up any existing duplicates before creating the index
  try {
    // Delete duplicate name-based RSVPs, keeping only the most recent one
    await query(`
      DELETE FROM rsvp_responses
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY event_id, LOWER(TRIM(name))
              ORDER BY updated_at DESC, created_at DESC
            ) as rn
          FROM rsvp_responses
          WHERE email IS NULL AND user_id IS NULL AND name IS NOT NULL
        ) t
        WHERE rn > 1
      )
    `);
  } catch (err: any) {
    // Ignore errors - table might not exist yet or no duplicates
    console.log("[rsvp] Duplicate cleanup (if any):", err?.message);
  }
  
  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_name
      ON rsvp_responses(event_id, LOWER(TRIM(name)))
      WHERE email IS NULL AND user_id IS NULL AND name IS NOT NULL
    `);
  } catch (err: any) {
    console.error("[rsvp] Index creation error (name):", err?.message);
  }
  
  try {
    await query(`
      CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event_id
      ON rsvp_responses(event_id)
    `);
  } catch (err: any) {
    console.error("[rsvp] Index creation error (event_id):", err?.message);
  }
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

    // Use provided email or session email, or generate anonymous identifier
    const rsvpEmail = email || sessionUser?.email || null;
    const rsvpName = name || sessionUser?.name || null;

    // Allow anonymous RSVPs if no email/user - use session name or generate identifier
    // This ensures RSVPs can be tracked even without authentication
    if (!rsvpEmail && !userId) {
      // For anonymous users without email, try to use session name or generate identifier
      if (!rsvpName || !rsvpName.trim()) {
        // Generate a temporary identifier based on session or browser fingerprint
        // This allows tracking RSVPs even without explicit user info
        const sessionId = sessionUser?.name || `anonymous-${Date.now()}`;
        await query(
          `
          INSERT INTO rsvp_responses (event_id, email, name, response, updated_at)
          VALUES ($1, NULL, $2, $3, now())
          `,
          [eventId, sessionId, response]
        );
        return NextResponse.json({ ok: true });
      }
    }

    // Insert or update RSVP response
    // Priority: user_id > email > name (for anonymous RSVPs)
    // Strategy: Always check for existing RSVP first, then insert or update accordingly
    
    if (userId) {
      // Update existing or insert new response for this user
      await query(
        `
        INSERT INTO rsvp_responses (event_id, user_id, email, name, response, updated_at)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT (event_id, user_id)
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
        ON CONFLICT (event_id, email)
        DO UPDATE SET
          response = EXCLUDED.response,
          name = EXCLUDED.name,
          updated_at = now()
        `,
        [eventId, rsvpEmail, rsvpName, response]
      );
    } else if (rsvpName && rsvpName.trim()) {
      // Anonymous RSVP with name - check if there's already an RSVP for this name
      // Use case-insensitive matching and trim whitespace
      const trimmedName = rsvpName.trim();
      
      // First check if there's an existing RSVP for this name (case-insensitive, without email/user_id)
      const existingRes = await query(
        `
        SELECT id FROM rsvp_responses
        WHERE event_id = $1 
          AND LOWER(TRIM(name)) = LOWER($2)
          AND email IS NULL 
          AND user_id IS NULL
        LIMIT 1
        `,
        [eventId, trimmedName]
      );
      
      if (existingRes.rows.length > 0) {
        // Update existing anonymous RSVP
        await query(
          `
          UPDATE rsvp_responses
          SET response = $1, name = $2, updated_at = now()
          WHERE id = $3
          `,
          [response, trimmedName, existingRes.rows[0].id]
        );
      } else {
        // Create new anonymous RSVP (will use unique index to prevent duplicates)
        try {
          await query(
            `
            INSERT INTO rsvp_responses (event_id, email, name, response, updated_at)
            VALUES ($1, NULL, $2, $3, now())
            `,
            [eventId, trimmedName, response]
          );
        } catch (err: any) {
          // If unique constraint fails (duplicate name), update existing
          // Check if error is about unique constraint violation
          if (err?.message?.includes('unique') || err?.code === '23505') {
            const updateRes = await query(
              `
              UPDATE rsvp_responses
              SET response = $1, name = $2, updated_at = now()
              WHERE event_id = $3 
                AND LOWER(TRIM(name)) = LOWER($4)
                AND email IS NULL 
                AND user_id IS NULL
              `,
              [response, trimmedName, eventId, trimmedName]
            );
            if (updateRes.rowCount === 0) {
              throw err; // Re-throw if update also failed
            }
          } else {
            throw err; // Re-throw if it's a different error
          }
        }
      }
    } else {
      return NextResponse.json(
        { error: "Name or email required for RSVP" },
        { status: 400 }
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

    const remaining = Math.max(0, numberOfGuests - stats.yes - stats.maybe - stats.no);

    // Get individual RSVP responses
    const responsesRes = await query(
      `
      SELECT 
        name,
        email,
        response,
        created_at,
        updated_at
      FROM rsvp_responses
      WHERE event_id = $1
      ORDER BY created_at DESC
      `,
      [eventId]
    );

    const responses = responsesRes.rows.map((row) => ({
      name: row.name || null,
      email: row.email || null,
      response: String(row.response || ""),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
    }));

    return NextResponse.json({
      ok: true,
      stats,
      numberOfGuests,
      remaining,
      filled: stats.yes,
      responses,
    });
  } catch (err: any) {
    console.error("[rsvp] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch RSVP stats" },
      { status: 500 }
    );
  }
}
