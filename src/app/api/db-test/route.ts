import { NextResponse } from "next/server";
import { Client } from "pg";
import { describeDatabaseError } from "@/lib/database-errors";

// Force Node runtime for socket + TLS
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL!;
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }, // or keep PGSSL_DISABLE_VERIFY=true
  });

  try {
    const start = Date.now();
    await client.connect();
    const r = await client.query("select now() as now");
    await client.end();
    return NextResponse.json({ ok: true, ms: Date.now() - start, now: r.rows[0].now });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: describeDatabaseError(e) }, { status: 500 });
  }
}
