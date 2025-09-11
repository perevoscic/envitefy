import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGiftPromoCode } from "@/lib/db";
import { sendGiftEmail } from "@/lib/email";

// Pricing: $2.99/month or $29.99/year
const PRICE_PER_MONTH_CENTS = 299;
const PRICE_PER_YEAR_CENTS = 2999;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email || null;
    const body = (await req.json().catch(() => ({}))) as any;

    const quantityRaw = Math.floor(Number(body?.quantity || 0));
    const periodRaw = String(body?.period || "months").toLowerCase();
    const quantity = Math.max(1, quantityRaw);
    const period = periodRaw === "years" ? "years" : "months";
    const recipientName = (body?.recipientName || "").toString().trim() || null;
    const recipientEmail = (body?.recipientEmail || "").toString().trim() || null;
    const message = (body?.message || "").toString().trim() || null;

    const amountCents = period === "years"
      ? quantity * PRICE_PER_YEAR_CENTS
      : quantity * PRICE_PER_MONTH_CENTS;

    if (recipientEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) {
      return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 });
    }

    const promo = await createGiftPromoCode({
      amountCents,
      currency: (body?.currency || "USD").toUpperCase(),
      createdByEmail: email,
      recipientName,
      recipientEmail,
      message,
      quantity,
      period,
      expiresAt: null,
    });

    // Delivery email (best-effort; don't fail the creation if email fails)
    if (recipientEmail) {
      try {
        await sendGiftEmail({
          toEmail: recipientEmail,
          recipientName,
          fromEmail: email,
          giftCode: promo.code,
          quantity,
          period,
          message,
        });
      } catch (e) {
        // ignore email send failure for now
      }
    }

    return NextResponse.json({ ok: true, promo });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create gift code" }, { status: 500 });
  }
}


