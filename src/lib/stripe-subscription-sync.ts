import Stripe from "stripe";
import { getStripeClient, StripePlanId } from "@/lib/stripe";
import { getPlanFromPrice } from "@/lib/stripe-plans";
import {
  getUserByEmail,
  getUserByStripeCustomerId,
  getUserByStripeSubscriptionId,
  updateUserStripeState,
} from "@/lib/db";

type PlanResolution = {
  plan: StripePlanId | null;
  price: Stripe.Price | null;
  priceId: string | null;
};

function debugLog(context: string | undefined, message: string, payload: any) {
  if (!context) return;
  console.log(`[stripe sync][${context}] ${message}`, payload);
}

export function normalizePlan(value: string | null | undefined): StripePlanId | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "monthly" || lower === "yearly") {
    return lower as StripePlanId;
  }
  return null;
}

export function resolvePlanFromSubscription(
  subscription: Stripe.Subscription,
  invoice: Stripe.Invoice | null = null,
  context?: string
): PlanResolution {
  const subscriptionItems = subscription.items?.data ?? [];
  const rankedItems = subscriptionItems.filter((item) => !item.deleted && (item.quantity ?? 0) > 0);
  const scanItems = rankedItems.length > 0 ? rankedItems : subscriptionItems;

  let resolvedPlan: StripePlanId | null = null;
  let resolvedPrice: Stripe.Price | null = null;
  let resolvedPriceId: string | null = null;

  const considerPrice = (candidate: Stripe.Price | string | null | undefined) => {
    if (!candidate || typeof candidate === "string") return;
    if (!resolvedPrice) {
      resolvedPrice = candidate;
      resolvedPriceId = candidate.id || resolvedPriceId;
    }
    if (!resolvedPlan) {
      const candidatePlan = getPlanFromPrice(candidate);
      if (candidatePlan) {
        resolvedPlan = candidatePlan;
        resolvedPrice = candidate;
        resolvedPriceId = candidate.id || resolvedPriceId;
        return;
      }
      const interval = candidate.recurring?.interval;
      if (interval === "year") {
        resolvedPlan = "yearly";
        resolvedPrice = candidate;
        resolvedPriceId = candidate.id || resolvedPriceId;
        return;
      }
      if (interval === "month") {
        resolvedPlan = "monthly";
        resolvedPrice = candidate;
        resolvedPriceId = candidate.id || resolvedPriceId;
        return;
      }
    }
  };

  for (const item of scanItems) {
    if (item.price && typeof item.price !== "string") {
      debugLog(context, "scan item price", {
        itemId: item.id,
        priceId: item.price.id,
        lookupKey: item.price.lookup_key,
        metadataPlan: item.price.metadata?.plan || null,
        interval: item.price.recurring?.interval || null,
        unitAmount: item.price.unit_amount,
      });
    }
    considerPrice(item.price);
    if (resolvedPlan) break;
  }

  if (!resolvedPlan) {
    for (const item of subscriptionItems) {
      if (item.price && typeof item.price !== "string") {
        debugLog(context, "fallback item price", {
          itemId: item.id,
          priceId: item.price.id,
          lookupKey: item.price.lookup_key,
          metadataPlan: item.price.metadata?.plan || null,
          interval: item.price.recurring?.interval || null,
          unitAmount: item.price.unit_amount,
        });
      }
      considerPrice(item.price);
      if (resolvedPlan) break;
    }
  }

  if (!resolvedPlan) {
    const invoiceLines = invoice?.lines?.data ?? [];
    for (const line of invoiceLines) {
      if (line.type && line.type !== "subscription") continue;
      const linePrice = extractInvoiceLinePrice(line);
      considerPrice(linePrice);
      if (resolvedPlan) break;
      const interval = line.plan?.interval;
      if (interval === "year") {
        resolvedPlan = "yearly";
        resolvedPriceId = linePrice?.id || resolvedPriceId;
        break;
      }
      if (interval === "month") {
        resolvedPlan = "monthly";
        resolvedPriceId = linePrice?.id || resolvedPriceId;
        break;
      }
    }
  }

  if (!resolvedPlan) {
    const interval = subscription.plan?.interval;
    if (interval === "year") {
      resolvedPlan = "yearly";
      resolvedPriceId = subscription.plan?.id || resolvedPriceId;
    } else if (interval === "month") {
      resolvedPlan = "monthly";
      resolvedPriceId = subscription.plan?.id || resolvedPriceId;
    }
  }

  if (!resolvedPlan) {
    const metadataPlan = normalizePlan(subscription.metadata?.plan || null);
    if (metadataPlan) {
      resolvedPlan = metadataPlan;
    }
  }

  return { plan: resolvedPlan, price: resolvedPrice, priceId: resolvedPriceId };
}

export async function syncSubscriptionState(
  subscription: Stripe.Subscription,
  options: {
    invoice?: Stripe.Invoice | null;
    context?: string;
    customerEmailHint?: string | null;
    planHint?: string | null;
  } = {}
): Promise<boolean> {
  const stripe = getStripeClient();
  const needsPriceExpansion = !subscription.items?.data?.some((item) => item.price && typeof item.price !== "string");
  const workingSubscription = needsPriceExpansion
    ? await stripe.subscriptions.retrieve(subscription.id, { expand: ["items.data.price"] })
    : subscription;

  const invoicePlan = normalizePlan(options.invoice?.metadata?.plan || null);
  const hintPlan = normalizePlan(options.planHint || null);
  const { plan, priceId } = resolvePlanFromSubscription(workingSubscription, options.invoice ?? null, options.context);
  const metadataPlan = normalizePlan(workingSubscription.metadata?.plan || null);

  debugLog(options.context, "sync subscription", {
    subscriptionId: workingSubscription.id,
    status: workingSubscription.status,
    resolvedPlan: plan,
    priceId,
    subscriptionMetadataPlan: metadataPlan,
    invoicePlan,
    planHint: hintPlan,
    invoiceId: options.invoice?.id || null,
  });

  const customerId =
    typeof workingSubscription.customer === "string"
      ? workingSubscription.customer
      : workingSubscription.customer?.id || null;
  let targetUser =
    (customerId ? await getUserByStripeCustomerId(customerId) : null) ||
    (workingSubscription.id ? await getUserByStripeSubscriptionId(workingSubscription.id) : null);

  if (!targetUser && options.customerEmailHint) {
    targetUser = await getUserByEmail(options.customerEmailHint);
  }

  if (!targetUser) {
    debugLog(options.context, "no target user", { subscriptionId: workingSubscription.id, customerId });
    return false;
  }

  const periodEnd = new Date(workingSubscription.current_period_end * 1000);
  // Preserve FF plan if already assigned to the user (admin/grant plan that never expires)
  const candidatePlan = plan || metadataPlan || invoicePlan || hintPlan || targetUser.subscription_plan || null;
  const nextPlan = targetUser.subscription_plan === "FF" ? "FF" : candidatePlan;

  debugLog(options.context, "sync target user", {
    email: targetUser.email,
    previousPlan: targetUser.subscription_plan,
    nextPlan,
  });

  await updateUserStripeState(
    { email: targetUser.email },
    {
      stripeCustomerId: customerId,
      stripeSubscriptionId: workingSubscription.id,
      stripeSubscriptionStatus: workingSubscription.status,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: periodEnd,
      stripeCancelAtPeriodEnd: workingSubscription.cancel_at_period_end || false,
      subscriptionPlan: nextPlan,
      subscriptionExpiresAt: nextPlan === "FF" ? null : periodEnd,
    }
  );

  return true;
}

export async function loadSubscriptionForSession(session: Stripe.Checkout.Session): Promise<Stripe.Subscription | null> {
  if (!session.subscription) return null;
  const stripe = getStripeClient();
  if (typeof session.subscription === "string") {
    return await stripe.subscriptions.retrieve(session.subscription, { expand: ["items.data.price"] });
  }
  if (session.subscription.items?.data?.some((item) => item.price && typeof item.price !== "string")) {
    return session.subscription as Stripe.Subscription;
  }
  return await stripe.subscriptions.retrieve(session.subscription.id, { expand: ["items.data.price"] });
}
function extractInvoiceLinePrice(line: Stripe.InvoiceLineItem): Stripe.Price | null {
  const maybePrice = (line as Stripe.InvoiceLineItem & { price?: Stripe.Price | string | null }).price;
  if (!maybePrice || typeof maybePrice === "string") return null;
  return maybePrice;
}
