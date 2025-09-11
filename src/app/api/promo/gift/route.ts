import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGiftPromoCode } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email || null;
    const body = (await req.json().catch(() => ({}))) as {
      amountCents?: number;
      currency?: string;
      recipientName?: string;
      recipientEmail?: string;
      message?: string;
    };

    const amountCents = Math.max(0, Math.floor(body?.amountCents || 0));
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const promo = await createGiftPromoCode({
      amountCents,
      currency: (body?.currency || "USD").toUpperCase(),
      createdByEmail: email,
      recipientName: body?.recipientName || null,
      recipientEmail: body?.recipientEmail || null,
      message: body?.message || null,
      expiresAt: null,
    });

    // TODO: attach payment intent and delivery email as a follow-up
    return NextResponse.json({ ok: true, promo });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create gift code" }, { status: 500 });
  }
}


