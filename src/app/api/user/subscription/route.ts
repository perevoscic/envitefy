import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, updateUserStripeState } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";
import { getPlanConfig } from "@/lib/stripe-plans";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const user = await getUserByEmail(session.user.email as string);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const plan =
    user.subscription_plan === "monthly" ||
    user.subscription_plan === "yearly" ||
    user.subscription_plan === "FF"
      ? (user.subscription_plan as "monthly" | "yearly" | "FF")
      : user.subscription_plan === "free"
      ? "free"
      : null;
  // Prefer stored current period end; if missing but we have a Stripe subscription, retrieve it as a fallback
  let currentPeriodEnd: string | Date | null = user.stripe_current_period_end || user.subscription_expires_at || null;
  if (!currentPeriodEnd && user.stripe_subscription_id) {
    try {
      const stripe = getStripeClient();
      const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
      const cpe = (sub as any)?.current_period_end;
      if (typeof cpe === "number" && cpe > 0) {
        currentPeriodEnd = new Date(cpe * 1000).toISOString();
      }
    } catch {}
  }
  return NextResponse.json({
    plan,
    stripeCustomerId: user.stripe_customer_id || null,
    stripeSubscriptionId: user.stripe_subscription_id || null,
    stripeSubscriptionStatus: user.stripe_subscription_status || null,
    stripePriceId: user.stripe_price_id || null,
    currentPeriodEnd,
    subscriptionExpiresAt: user.subscription_expires_at || null,
    cancelAtPeriodEnd: Boolean(user.stripe_cancel_at_period_end),
    pricing: {
      monthly: getPlanConfig("monthly").unitAmount,
      yearly: getPlanConfig("yearly").unitAmount,
    },
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    plan?: string | null;
    cancelAtPeriodEnd?: boolean;
  };
  const requestedPlan = (body?.plan ?? null) as string | null;
  if (requestedPlan === "monthly" || requestedPlan === "yearly") {
    return NextResponse.json({
      error: "Use Stripe checkout to upgrade to a paid plan",
    }, { status: 400 });
  }

  const user = await getUserByEmail(session.user.email as string);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const cancelAtPeriodEnd = body?.cancelAtPeriodEnd !== false;
  const stripe = getStripeClient();

  let subscription = null as Stripe.Subscription | null;
  if (user.stripe_subscription_id) {
    try {
      if (cancelAtPeriodEnd) {
        subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } else {
        subscription = await stripe.subscriptions.cancel(user.stripe_subscription_id);
      }
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Failed to update subscription" }, { status: 500 });
    }
  }

  const planAfterUpdate = (() => {
    if (cancelAtPeriodEnd && subscription && subscription.status !== "canceled") {
      return user.subscription_plan === "monthly" || user.subscription_plan === "yearly"
        ? (user.subscription_plan as "monthly" | "yearly")
        : null;
    }
    return requestedPlan === "free" ? "free" : null;
  })();

  const currentPeriodEnd = subscription
    ? new Date(((subscription as any)?.current_period_end ?? 0) * 1000)
    : cancelAtPeriodEnd
    ? user.stripe_current_period_end || user.subscription_expires_at || null
    : null;

  await updateUserStripeState(
    { email: user.email },
    {
      stripeSubscriptionId: cancelAtPeriodEnd
        ? subscription
          ? subscription.id
          : user.stripe_subscription_id ?? null
        : null,
      stripeSubscriptionStatus: subscription?.status ?? (cancelAtPeriodEnd ? user.stripe_subscription_status ?? null : null),
      stripePriceId: subscription?.items?.data?.[0]?.price?.id ?? (cancelAtPeriodEnd ? user.stripe_price_id ?? null : null),
      stripeCurrentPeriodEnd: currentPeriodEnd,
      stripeCancelAtPeriodEnd: subscription ? subscription.cancel_at_period_end ?? false : cancelAtPeriodEnd,
      subscriptionPlan: planAfterUpdate,
      subscriptionExpiresAt: currentPeriodEnd,
    }
  );

  return NextResponse.json({
    ok: true,
    plan: planAfterUpdate,
    cancelAtPeriodEnd: cancelAtPeriodEnd,
  });
}
