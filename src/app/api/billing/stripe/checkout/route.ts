import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, updateUserStripeState } from "@/lib/db";
import { getAppBaseUrl, getStripeClient, StripePlanId } from "@/lib/stripe";
import { ensureStripePriceForPlan, getPlanConfig } from "@/lib/stripe-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = ["iad1", "cle1", "sfo1"];

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { plan?: string | null };
    const plan = (body?.plan || "monthly") as StripePlanId;
    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json({ error: "Unsupported plan" }, { status: 400 });
    }

    const user = await getUserByEmail(session.user.email as string);
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (
      user.stripe_subscription_id &&
      user.stripe_subscription_status &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(user.stripe_subscription_status as Stripe.Subscription.Status) &&
      !user.stripe_cancel_at_period_end
    ) {
      return NextResponse.json({
        error: "You already have an active subscription. Manage it from the billing portal.",
        subscriptionId: user.stripe_subscription_id,
      }, { status: 409 });
    }

    const stripe = getStripeClient();
    let customerId = user.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: [user.first_name, user.last_name].filter(Boolean).join(" ") || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await updateUserStripeState({ email: user.email }, { stripeCustomerId: customerId });
    }

    const price = await ensureStripePriceForPlan(stripe, plan);
    const baseUrl = getAppBaseUrl(req.nextUrl?.origin);
    const successUrl = `${baseUrl}/subscription?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/subscription?checkout=cancel`;

    const planConfig = getPlanConfig(plan);

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        type: "subscription",
        plan,
        userId: user.id,
        userEmail: user.email,
      },
      subscription_data: {
        metadata: {
          type: "subscription",
          plan,
          userId: user.id,
          userEmail: user.email,
        },
        description: planConfig.description,
      },
    });

    return NextResponse.json({
      ok: true,
      sessionId: checkout.id,
      url: checkout.url,
    });
  } catch (err: any) {
    console.error("[billing/stripe/checkout] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create checkout session" }, { status: 500 });
  }
}
