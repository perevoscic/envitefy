import { NextRequest, NextResponse } from "next/server";
import { getCurrentDatabaseIdentity, getPromoCodeByCode, listRecentPromoCodes } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const limitParam = Number(searchParams.get("limit") || "5");
    const limit = Number.isFinite(limitParam) ? limitParam : 5;

    const identity = await getCurrentDatabaseIdentity();
    if (code) {
      const row = await getPromoCodeByCode(code);
      return NextResponse.json({ ok: true, identity, byCode: row });
    }
    const rows = await listRecentPromoCodes(limit);
    return NextResponse.json({ ok: true, identity, recent: rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}


