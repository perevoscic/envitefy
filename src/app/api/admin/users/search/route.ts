import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIsAdminByEmail } from "@/lib/db";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPool(): Pool {
  // Reuse the same pooling logic as db.ts without importing internals
  // Minimal safe pool for this isolated route
  const g = global as any;
  if (!g.__pgPool_admin_search) {
    const { Pool } = require("pg");
    const databaseUrl = process.env.DATABASE_URL as string;
    if (!databaseUrl) throw new Error("DATABASE_URL is not set");
    const disableVerify = (process.env.PGSSL_DISABLE_VERIFY || "").toLowerCase();
    const caBase64 = process.env.PGSSL_CA_BASE64 as string | undefined;
    let ssl: any | undefined;
    if (disableVerify === "1" || disableVerify === "true") {
      ssl = { rejectUnauthorized: false };
    } else if (caBase64 && caBase64.trim().length > 0) {
      try {
        const ca = Buffer.from(caBase64, "base64").toString("utf8");
        ssl = { rejectUnauthorized: true, ca };
      } catch {}
    }
    let connectionStringToUse: string = databaseUrl;
    if (ssl) {
      try {
        const u = new URL(databaseUrl);
        u.searchParams.delete("sslmode");
        u.searchParams.delete("ssl");
        connectionStringToUse = u.toString();
      } catch {}
    }
    const config: any = { connectionString: connectionStringToUse, max: 5 };
    if (ssl) config.ssl = ssl;
    g.__pgPool_admin_search = new Pool(config);
  }
  return g.__pgPool_admin_search as Pool;
}

export async function GET(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email: string | undefined = (session?.user?.email as string | undefined) || undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isAdmin = await getIsAdminByEmail(email);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const cursor = searchParams.get("cursor");

    if (!q) {
      // Do not return anything until admin searches
      return NextResponse.json({ ok: true, items: [], nextCursor: null });
    }

    // We will search by email or first/last name using ILIKE prefix/contains
    // Cursor is the last created_at+id tuple encoded as base64 JSON
    let createdAfterClause = "";
    const values: any[] = [];
    const ilike = `%${q.replace(/%/g, "").replace(/_/g, "")}%`;
    values.push(ilike, ilike, ilike);

    if (cursor) {
      try {
        const obj = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
        if (obj && obj.created_at && obj.id) {
          createdAfterClause = " and (created_at, id) < ($4::timestamptz, $5::uuid) ";
          values.push(obj.created_at, obj.id);
        }
      } catch {}
    }

    const sql = `
      select id, email, first_name, last_name, subscription_plan, ever_paid,
             credits, created_at, scans_total, shares_sent,
             scans_birthdays, scans_weddings, scans_sport_events,
             scans_appointments, scans_doctor_appointments, scans_play_days,
             scans_general_events, scans_car_pool
      from users
      where (
        lower(email) like $1
        or lower(first_name) like $2
        or lower(last_name) like $3
      )
      ${createdAfterClause}
      order by created_at desc nulls last, id desc
      limit ${limit + 1}
    `;

    const pool = getPool();
    const res = await pool.query(sql, values);
    const rows = res.rows || [];
    let nextCursor: string | null = null;
    let items = rows;
    if (rows.length > limit) {
      const last = rows[limit - 1];
      items = rows.slice(0, limit);
      if (last?.created_at && last?.id) {
        nextCursor = Buffer.from(JSON.stringify({ created_at: last.created_at, id: last.id })).toString("base64");
      }
    }

    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (err: any) {
    try { console.error("[admin users search] GET error", err); } catch {}
    return NextResponse.json({ error: String(err?.message || err || "unknown error") }, { status: 500 });
  }
}


