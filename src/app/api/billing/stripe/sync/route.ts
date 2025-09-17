import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import {
  loadSubscriptionForSession,
  syncSubscriptionState,
} from "@/lib/stripe-subscription-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = ["iad1", "cle1", "sfo1"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: string | null;
    };
    const sessionId = body?.sessionId || body?.session_id || null;
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        "subscription",
        "subscription.items.data.price",
        "invoice",
      ],
    });

    let invoice: Stripe.Invoice | null = null;
    if (checkoutSession.invoice) {
      if (typeof checkoutSession.invoice === "string") {
        invoice = await stripe.invoices.retrieve(checkoutSession.invoice);
      } else {
        invoice = checkoutSession.invoice;
      }
    }

    const subscription = await loadSubscriptionForSession(checkoutSession);
    if (!subscription) {
      return NextResponse.json({
        ok: false,
        error: "Subscription not available on session",
      }, { status: 202 });
    }

    const planHint =
      (checkoutSession.metadata?.plan as string | undefined) ||
      (checkoutSession.metadata?.Plan as string | undefined) ||
      (typeof subscription.metadata?.plan === "string" ? subscription.metadata.plan : null);

    const updated = await syncSubscriptionState(subscription, {
      invoice,
      context: "api:billing/stripe/sync",
      customerEmailHint: session.user.email as string,
      planHint,
    });

    return NextResponse.json({ ok: true, updated });
  } catch (err: any) {
    console.error("[billing/stripe/sync] error", err);
    return NextResponse.json(
      { error: err?.message || "Failed to sync subscription" },
      { status: 500 }
    );
  }
}
