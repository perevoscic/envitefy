import { NextRequest, NextResponse } from "next/server";
import { getPromoCodeByCode, markPromoCodeRedeemed, extendUserSubscriptionByMonths } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const email = session.user.email;
    const body = (await req.json().catch(() => ({}))) as { code?: string };
    const raw = (body?.code || "").toString().trim().toUpperCase();
    if (!raw) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const existing = await getPromoCodeByCode(raw);
    if (!existing) return NextResponse.json({ error: "Code not found" }, { status: 404 });
    if (existing.redeemed_at) return NextResponse.json({ error: "Code already redeemed" }, { status: 400 });
    if (existing.expires_at && new Date(existing.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    // Determine gifted months from metadata; fallback to amount mapping
    let giftedMonths = 0;
    if (existing.period === "months" && typeof existing.quantity === "number") giftedMonths = existing.quantity;
    else if (existing.period === "years" && typeof existing.quantity === "number") giftedMonths = existing.quantity * 12;
    else if (existing.amount_cents && existing.amount_cents > 0) {
      // Fallback: convert by monthly price
      giftedMonths = Math.floor(existing.amount_cents / 299);
    }
    giftedMonths = Math.max(0, Math.floor(giftedMonths));

    if (giftedMonths <= 0) {
      return NextResponse.json({ error: "Invalid gift value" }, { status: 400 });
    }

    await extendUserSubscriptionByMonths(email, giftedMonths);
    await markPromoCodeRedeemed(existing.id, email);
    return NextResponse.json({ ok: true, months: giftedMonths });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to redeem" }, { status: 500 });
  }
}


