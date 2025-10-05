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
  productId?: string;
};

export const STRIPE_PLAN_CONFIG: Record<StripePlanId, StripePlanConfig> = {
  monthly: {
    id: "monthly",
    lookupKey: "snap-my-date-monthly",
    unitAmount: 99,
    currency: "usd",
    interval: "month",
    name: "Snap My Date Monthly",
    description: "Monthly subscription for Snap My Date",
    productId: "prod_T93CX7Yaqefp2B",
  },
  yearly: {
    id: "yearly",
    lookupKey: "snap-my-date-yearly",
    unitAmount: 999,
    currency: "usd",
    interval: "year",
    name: "Snap My Date Yearly",
    description: "Yearly subscription for Snap My Date",
    productId: "prod_T93Df9XcDp26Nm",
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
  const amount =
    typeof price.unit_amount === "number"
      ? price.unit_amount
      : price.unit_amount_decimal
      ? Number(price.unit_amount_decimal)
      : null;
  const interval = price.recurring?.interval;
  if (amount && interval) {
    for (const [plan, config] of Object.entries(STRIPE_PLAN_CONFIG)) {
      if (config.interval === interval && config.unitAmount === amount) return plan as StripePlanId;
    }
  }
  return null;
}

function priceMatchesConfig(price: Stripe.Price, config: StripePlanConfig): boolean {
  const amount =
    typeof price.unit_amount === "number"
      ? price.unit_amount
      : price.unit_amount_decimal
      ? Number(price.unit_amount_decimal)
      : null;
  if (amount !== config.unitAmount) return false;
  if (price.currency.toLowerCase() !== config.currency.toLowerCase()) return false;
  if (price.recurring?.interval !== config.interval) return false;
  const intervalCount = price.recurring?.interval_count ?? 1;
  if (intervalCount !== (config.intervalCount ?? 1)) return false;
  if (config.productId) {
    const productId = typeof price.product === "string" ? price.product : price.product?.id;
    if (productId && productId !== config.productId) return false;
  }
  return true;
}

export async function ensureStripePriceForPlan(stripe: Stripe, plan: StripePlanId): Promise<Stripe.Price> {
  const config = getPlanConfig(plan);
  const listed = await stripe.prices.list({
    lookup_keys: [config.lookupKey],
    limit: 10,
    expand: ["data.product"],
  });

  const matching = listed.data.find((price) => priceMatchesConfig(price, config));
  if (matching) {
    if (!matching.active) {
      try {
        const reactivated = await stripe.prices.update(matching.id, { active: true });
        return reactivated;
      } catch {
        // Continue to fallback path when Stripe rejects reactivation.
      }
    } else {
      return matching;
    }
  }

  const createParams: Stripe.PriceCreateParams = {
    currency: config.currency,
    unit_amount: config.unitAmount,
    recurring: { interval: config.interval, interval_count: config.intervalCount ?? 1 },
    lookup_key: config.lookupKey,
    metadata: { plan },
  };
  if (listed.data.length > 0) {
    createParams.transfer_lookup_key = true;
  }
  if (config.productId) {
    createParams.product = config.productId;
  } else {
    createParams.product_data = {
      name: config.name,
      metadata: { plan },
    };
  }

  const created = await stripe.prices.create(createParams);

  for (const price of listed.data) {
    if (price.id === created.id) continue;
    try {
      await stripe.prices.update(price.id, { active: false });
    } catch {
      // Best-effort cleanup; continue even if Stripe rejects (e.g., already inactive)
    }
  }

  return created;
}

export function getGiftUnitAmount(period: "months" | "years"): number {
  return period === "years" ? STRIPE_PLAN_CONFIG.yearly.unitAmount : STRIPE_PLAN_CONFIG.monthly.unitAmount;
}
