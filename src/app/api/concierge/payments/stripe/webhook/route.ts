import { NextResponse } from "next/server";
import { assertConciergeV2Enabled } from "@/config/concierge-v2-flags";
import { reconcileConciergeV2StripeCheckout } from "@/lib/concierge-v2/operations";
import { verifyStripeWebhookSignature } from "@/lib/concierge-v2/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: any, maxLength = 1000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

export async function POST(req: Request) {
  try {
    assertConciergeV2Enabled();
    const payloadText = await req.text();
    const secret = cleanString(process.env.STRIPE_WEBHOOK_SECRET, 500);
    if (!secret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Stripe webhook secret is not configured." }, { status: 503 });
    }
    if (
      secret &&
      !verifyStripeWebhookSignature({
        payload: payloadText,
        signatureHeader: req.headers.get("stripe-signature"),
        secret,
      })
    ) {
      return NextResponse.json({ ok: false, error: "Invalid Stripe webhook signature." }, { status: 400 });
    }
    const payload = JSON.parse(payloadText);
    const result = await reconcileConciergeV2StripeCheckout({ payload });
    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: String(error?.message || "Unable to process Stripe webhook.") },
      { status: /disabled/i.test(String(error?.message || "")) ? 404 : 500 },
    );
  }
}
