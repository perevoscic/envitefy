import Stripe from "stripe";

const API_VERSION: Stripe.LatestApiVersion = "2025-08-27.basil";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !secret.trim()) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secret, { apiVersion: API_VERSION });
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

export function getPublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key || !key.trim()) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured");
  }
  return key;
}

export function getAppBaseUrl(fallback?: string): string {
  const normalizedFallback = fallback?.trim().replace(/\/$/, "") || null;

  if (normalizedFallback) {
    const lower = normalizedFallback.toLowerCase();
    const isLocalHost =
      lower.includes("localhost") ||
      lower.startsWith("http://127.") ||
      lower.startsWith("https://127.") ||
      lower.startsWith("http://10.") ||
      lower.startsWith("http://192.168.");

    if (isLocalHost || process.env.NODE_ENV !== "production") {
      return normalizedFallback;
    }
  }

  const candidates = [process.env.APP_URL, process.env.PUBLIC_BASE_URL, process.env.NEXTAUTH_URL, normalizedFallback, "http://localhost:3000"];
  for (const candidate of candidates) {
    if (!candidate || !candidate.trim()) continue;
    const normalized = candidate.trim().replace(/\/$/, "");
    if (normalized.length > 0) return normalized;
  }
  return "http://localhost:3000";
}

export type StripePlanId = "monthly" | "yearly";
