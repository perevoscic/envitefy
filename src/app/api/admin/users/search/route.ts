import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  ADMIN_USER_METRICS_CTE_SQL,
  ADMIN_USER_METRICS_SELECT_SQL,
} from "@/lib/admin-user-metrics-sql";
import { authOptions } from "@/lib/auth";
import { getIsAdminByEmail, query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        if (obj?.created_at && obj.id) {
          createdAfterClause = " and (created_at, id) < ($4::timestamptz, $5::uuid) ";
          values.push(obj.created_at, obj.id);
        }
      } catch {}
    }

    const sql = `
      ${ADMIN_USER_METRICS_CTE_SQL}
      select ${ADMIN_USER_METRICS_SELECT_SQL}
      from admin_users_with_metrics
      where (
        lower(email) like $1
        or lower(first_name) like $2
        or lower(last_name) like $3
      )
      ${createdAfterClause}
      order by created_at desc nulls last, id desc
      limit ${limit + 1}
    `;

    const res = await query(sql, values);
    const rows = res.rows || [];
    let nextCursor: string | null = null;
    let items = rows;
    if (rows.length > limit) {
      const last = rows[limit - 1];
      items = rows.slice(0, limit);
      if (last?.created_at && last?.id) {
        nextCursor = Buffer.from(
          JSON.stringify({ created_at: last.created_at, id: last.id }),
        ).toString("base64");
      }
    }

    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (err: any) {
    try {
      console.error("[admin users search] GET error", err);
    } catch {}
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 },
    );
  }
}
