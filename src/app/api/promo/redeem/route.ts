import { NextRequest, NextResponse } from "next/server";
import { getPromoCodeByCode, markPromoCodeRedeemed } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { code?: string };
    const raw = (body?.code || "").toString().trim().toUpperCase();
    if (!raw) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const existing = await getPromoCodeByCode(raw);
    if (!existing) return NextResponse.json({ error: "Code not found" }, { status: 404 });
    if (existing.redeemed_at) return NextResponse.json({ error: "Code already redeemed" }, { status: 400 });
    if (existing.expires_at && new Date(existing.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    await markPromoCodeRedeemed(existing.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to redeem" }, { status: 500 });
  }
}


