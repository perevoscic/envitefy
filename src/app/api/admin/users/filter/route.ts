import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIsAdminByEmail } from "@/lib/db";
import { Pool } from "pg";

const g = global as any;

function getPool(): Pool {
  if (!g.__pgPool_admin_filter) {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL not configured");
    }

    let sslConfig: any = false;
    const disableVerify = process.env.PGSSL_DISABLE_VERIFY === "true";
    const ca64 = process.env.PGSSL_CA_BASE64;

    if (disableVerify) {
      sslConfig = { rejectUnauthorized: false };
    } else if (ca64) {
      const ca = Buffer.from(ca64, "base64").toString("utf8");
      sslConfig = { ca, rejectUnauthorized: true };
    }

    const url = new URL(DATABASE_URL);
    url.searchParams.delete("sslmode");

    g.__pgPool_admin_filter = new Pool({
      connectionString: url.toString(),
      ssl: sslConfig,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return g.__pgPool_admin_filter as Pool;
}

export async function GET(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const email: string | undefined = (session?.user?.email as string | undefined) || undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isAdmin = await getIsAdminByEmail(email);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") as "all" | "paid" | "ff" | "scans" | "shares" | null;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const cursor = searchParams.get("cursor");

    if (!view) {
      return NextResponse.json({ ok: true, items: [], nextCursor: null });
    }

    // Cursor is the last created_at+id tuple or scans_total/shares_sent for sorted views
    let whereClause = "";
    let orderClause = "order by created_at desc nulls last, id desc";
    const values: any[] = [];
    let createdAfterClause = "";

    // Build the WHERE clause based on view
    switch (view) {
      case "all":
        whereClause = "1=1";
        break;
      case "paid":
        whereClause = "subscription_plan in ('monthly', 'yearly')";
        break;
      case "ff":
        whereClause = "subscription_plan = 'FF'";
        break;
      case "scans":
        orderClause = "order by scans_total desc nulls last, id desc";
        whereClause = "1=1";
        break;
      case "shares":
        orderClause = "order by shares_sent desc nulls last, id desc";
        whereClause = "1=1";
        break;
      default:
        whereClause = "1=1";
    }

    // Handle cursor pagination
    if (cursor) {
      try {
        const obj = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
        
        if (view === "scans" && obj.scans_total !== undefined && obj.id) {
          createdAfterClause = " and (scans_total, id) < ($1, $2::uuid) ";
          values.push(obj.scans_total, obj.id);
        } else if (view === "shares" && obj.shares_sent !== undefined && obj.id) {
          createdAfterClause = " and (shares_sent, id) < ($1, $2::uuid) ";
          values.push(obj.shares_sent, obj.id);
        } else if (obj.created_at && obj.id) {
          createdAfterClause = " and (created_at, id) < ($1::timestamptz, $2::uuid) ";
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
      where ${whereClause}
      ${createdAfterClause}
      ${orderClause}
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
      
      if (view === "scans" && last?.scans_total !== undefined && last?.id) {
        nextCursor = Buffer.from(JSON.stringify({ scans_total: last.scans_total, id: last.id })).toString("base64");
      } else if (view === "shares" && last?.shares_sent !== undefined && last?.id) {
        nextCursor = Buffer.from(JSON.stringify({ shares_sent: last.shares_sent, id: last.id })).toString("base64");
      } else if (last?.created_at && last?.id) {
        nextCursor = Buffer.from(JSON.stringify({ created_at: last.created_at, id: last.id })).toString("base64");
      }
    }

    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (err: any) {
    try { console.error("[admin users filter] GET error", err); } catch {}
    return NextResponse.json({ error: String(err?.message || err || "unknown error") }, { status: 500 });
  }
}

