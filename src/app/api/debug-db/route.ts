import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
  });
  try {
    const { rows } = await pool.query("select 1 as ok");
    await pool.end();
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    await pool.end().catch(() => {});
    return NextResponse.json({ ok: false, err: e?.message }, { status: 500 });
  }
}
