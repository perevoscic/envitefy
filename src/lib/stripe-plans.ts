import Stripe from "stripe";
import { StripePlanId } from "@/lib/stripe";

export type StripePlanConfig = {
  id: StripePlanId;
  lookupKey: string;
  unitAmount: number;
  currency: string;
  interval: "month" | "year";
  intervalCount?: number;
  name: string;
  description: string;
};

export const STRIPE_PLAN_CONFIG: Record<StripePlanId, StripePlanConfig> = {
  monthly: {
    id: "monthly",
    lookupKey: "snap-my-date-monthly",
    unitAmount: 299,
    currency: "usd",
    interval: "month",
    name: "Snap My Date Monthly",
    description: "Monthly subscription for Snap My Date",
  },
  yearly: {
    id: "yearly",
    lookupKey: "snap-my-date-yearly",
    unitAmount: 2999,
    currency: "usd",
    interval: "year",
    name: "Snap My Date Yearly",
    description: "Yearly subscription for Snap My Date",
  },
};

export function getPlanConfig(plan: StripePlanId): StripePlanConfig {
  return STRIPE_PLAN_CONFIG[plan];
}

export function getPlanIdFromLookupKey(lookupKey?: string | null): StripePlanId | null {
  if (!lookupKey) return null;
  const normalized = lookupKey.toLowerCase();
  for (const [plan, config] of Object.entries(STRIPE_PLAN_CONFIG)) {
    if (config.lookupKey.toLowerCase() === normalized) return plan as StripePlanId;
  }
  return null;
}

export function getPlanFromPrice(price?: Stripe.Price | null): StripePlanId | null {
  if (!price) return null;
  const lookup = getPlanIdFromLookupKey(price.lookup_key || null);
  if (lookup) return lookup;
  const metaPlan = getPlanIdFromLookupKey(price.metadata?.plan || price.nickname || null);
  if (metaPlan) return metaPlan;
  const amount = price.unit_amount ?? price.unit_amount_decimal ? Number(price.unit_amount_decimal) : null;
  const interval = price.recurring?.interval;
  if (amount && interval) {
    for (const [plan, config] of Object.entries(STRIPE_PLAN_CONFIG)) {
      if (config.interval === interval && config.unitAmount === amount) return plan as StripePlanId;
    }
  }
  return null;
}

export async function ensureStripePriceForPlan(stripe: Stripe, plan: StripePlanId): Promise<Stripe.Price> {
  const config = getPlanConfig(plan);
  const listed = await stripe.prices.list({
    lookup_keys: [config.lookupKey],
    active: true,
    limit: 1,
    expand: ["data.product"],
  });
  if (listed.data.length > 0) {
    return listed.data[0];
  }
  const created = await stripe.prices.create({
    currency: config.currency,
    unit_amount: config.unitAmount,
    recurring: { interval: config.interval, interval_count: config.intervalCount ?? 1 },
    lookup_key: config.lookupKey,
    product_data: {
      name: config.name,
      metadata: { plan },
    },
    metadata: { plan },
  });
  return created;
}

export function getGiftUnitAmount(period: "months" | "years"): number {
  return period === "years" ? STRIPE_PLAN_CONFIG.yearly.unitAmount : STRIPE_PLAN_CONFIG.monthly.unitAmount;
}
