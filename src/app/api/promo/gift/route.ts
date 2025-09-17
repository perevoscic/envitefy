import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import {
  createGiftOrder,
  getUserIdByEmail,
  updateGiftOrderStripeRefs,
} from "@/lib/db";
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe";
import { getGiftUnitAmount } from "@/lib/stripe-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MONTHLY_PRICE_CENTS = getGiftUnitAmount("months");
const YEARLY_PRICE_CENTS = getGiftUnitAmount("years");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json().catch(() => ({}))) as any;

    const quantityRaw = Math.floor(Number(body?.quantity || 0));
    const periodRaw = String(body?.period || "months").toLowerCase();
    const quantity = Math.max(1, quantityRaw);
    const period = periodRaw === "years" ? "years" : "months";
    const recipientName = (body?.recipientName || "").toString().trim() || null;
    const recipientEmail = (body?.recipientEmail || "").toString().trim() || null;
    const message = (body?.message || "").toString().trim() || null;
    const senderFirstName = (body?.senderFirstName || "").toString().trim();
    const senderLastName = (body?.senderLastName || "").toString().trim();
    const senderEmailRaw = (body?.senderEmail || "").toString().trim();

    if (recipientEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) {
      return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 });
    }

    const isAuthed = Boolean(session?.user?.email);
    let purchaserEmail = session?.user?.email || null;
    let purchaserName = (session?.user?.name || "").trim();

    if (!isAuthed) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(senderEmailRaw)) {
        return NextResponse.json({ error: "Valid sender email required" }, { status: 400 });
      }
      if (!senderFirstName || !senderLastName) {
        return NextResponse.json({ error: "Sender first and last name required" }, { status: 400 });
      }
      purchaserEmail = senderEmailRaw;
      purchaserName = `${senderFirstName} ${senderLastName}`.trim();
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const unitAmount = period === "years" ? YEARLY_PRICE_CENTS : MONTHLY_PRICE_CENTS;
    const amountCents = unitAmount * quantity;
    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl(req.nextUrl?.origin);

    const purchaserUserId =
      purchaserEmail && purchaserEmail.length > 0 ? await getUserIdByEmail(purchaserEmail) : null;

    const orderMetadata = {
      createdBy: session?.user?.email || null,
      createdByEmail: session?.user?.email || purchaserEmail || null,
      createdByUserId: purchaserUserId,
      senderFirstName: senderFirstName || null,
      senderLastName: senderLastName || null,
    };

    const order = await createGiftOrder({
      purchaserEmail,
      purchaserName,
      recipientName,
      recipientEmail,
      message,
      quantity,
      period,
      amountCents,
      currency: "USD",
      metadata: orderMetadata,
    });

    const metadata: Record<string, string> = {
      type: "gift",
      orderId: order.id,
      quantity: String(quantity),
      period,
    };
    if (recipientEmail) metadata.recipientEmail = recipientEmail;
    if (purchaserEmail) metadata.purchaserEmail = purchaserEmail;

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: purchaserEmail || undefined,
      success_url: `${baseUrl}/subscription?checkout=gift-success&order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription?checkout=gift-cancel&order=${order.id}`,
      client_reference_id: order.id,
      metadata,
      payment_intent_data: {
        metadata,
        description: `Snap My Date gift (${quantity} ${period})`,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: `Snap My Date Gift (${period === "years" ? "Year" : "Month"})`,
              metadata: {
                type: "gift",
                period,
              },
            },
          },
          quantity,
        },
      ],
    });

    await updateGiftOrderStripeRefs({
      orderId: order.id,
      stripeCheckoutSessionId: checkout.id,
      stripeCustomerId: typeof checkout.customer === "string" ? checkout.customer : null,
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      sessionId: checkout.id,
      checkoutUrl: checkout.url,
      amountCents,
      currency: "USD",
    });
  } catch (err: any) {
    console.error("[promo/gift] error", err);
    return NextResponse.json({ error: err?.message || "Failed to start gift checkout" }, { status: 500 });
  }
}
