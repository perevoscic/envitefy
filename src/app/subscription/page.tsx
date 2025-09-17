"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GiftSnapModal from "@/components/GiftSnapModal";
import RedeemPromoModal from "@/components/RedeemPromoModal";
import AuthModal from "@/components/auth/AuthModal";
import Logo from "@/assets/logo.png";

export default function SubscriptionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<
    "free" | "monthly" | "yearly"
  >("monthly");
  const [currentPlan, setCurrentPlan] = useState<
    "free" | "monthly" | "yearly" | null
  >(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(
    null
  );
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<
    string | null
  >(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [banner, setBanner] = useState<
    { type: "success" | "error" | "info"; message: string } | null
  >(null);
  const [bannerVisible, setBannerVisible] = useState<boolean>(true);
  const [pricing, setPricing] = useState<{ monthly: number; yearly: number }>(
    { monthly: 299, yearly: 2999 }
  );

  useEffect(() => {
    const plan = params?.get?.("plan") ?? null;
    if (!plan) return;
    const normalized = ["free", "monthly", "yearly"].includes(plan)
      ? plan
      : null;
    if (normalized) setSelectedPlan(normalized as any);
  }, [params]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [planRes, profileRes] = await Promise.all([
          fetch("/api/user/subscription", { cache: "no-store" }),
          fetch("/api/user/profile", { cache: "no-store" }),
        ]);
        const planJson = await planRes.json().catch(() => ({}));
        const profileJson = await profileRes.json().catch(() => ({}));
        if (ignore) return;
        setIsAuthed(planRes.ok);
        const plan = planJson?.plan;
        if (planRes.ok) {
          if (plan === "free" || plan === "monthly" || plan === "yearly") {
            setCurrentPlan(plan);
            setSelectedPlan(plan);
          } else {
            setCurrentPlan("free");
            setSelectedPlan("free");
          }
          setSubscriptionStatus(planJson?.stripeSubscriptionStatus || null);
          setStripeCustomerId(planJson?.stripeCustomerId || null);
          setCancelAtPeriodEnd(Boolean(planJson?.cancelAtPeriodEnd));
          setCurrentPeriodEnd(planJson?.currentPeriodEnd || null);
          setSubscriptionExpiresAt(planJson?.subscriptionExpiresAt || null);
          if (planJson?.pricing) {
            setPricing({
              monthly: Number(planJson.pricing.monthly) || 299,
              yearly: Number(planJson.pricing.yearly) || 2999,
            });
          }
        } else {
          // Unauthenticated: do not mark FREE as current; default to Monthly selection
          setCurrentPlan(null);
          setSelectedPlan("monthly");
          setSubscriptionStatus(null);
          setStripeCustomerId(null);
          setCancelAtPeriodEnd(false);
          setCurrentPeriodEnd(null);
          setSubscriptionExpiresAt(null);
        }
        if (typeof profileJson?.credits === "number")
          setCredits(profileJson.credits);
      } catch {}
    }
    load();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    const status = params?.get?.("checkout") ?? null;
    const sessionId = params?.get?.("session_id") ?? null;
    if (!status) return;
    let type: "success" | "error" | "info" | null = null;
    let message: string | null = null;
    if (status === "success") {
      type = "success";
      message = "Subscription confirmed. Thank you for supporting Snap My Date!";
    } else if (status === "gift-success") {
      type = "success";
      message = "Gift purchase complete! We'll email the gift code shortly.";
    } else if (status === "gift-cancel") {
      type = "info";
      message = "Gift checkout was canceled.";
    } else if (status === "cancel") {
      type = "info";
      message = "Checkout canceled.";
    } else if (status === "portal-return") {
      type = "info";
      message = "Returned from billing portal.";
    }
    if (type && message) {
      setBanner({ type, message });
      setBannerVisible(true);
    }
    let cancelled = false;

    const cleanup = () => {
      if (cancelled || typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("order");
      url.searchParams.delete("session_id");
      router.replace(url.pathname + (url.search ? url.search : ""));
    };

    const run = async () => {
      if (status === "success" && sessionId) {
        try {
          const res = await fetch("/api/billing/stripe/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          if (res.ok) {
            setReloadKey((key) => key + 1);
          }
        } catch {}
      }
    };

    run().finally(() => {
      cleanup();
    });

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  const monthlyPrice = useMemo(() => (pricing.monthly / 100).toFixed(2), [pricing.monthly]);
  const yearlyPrice = useMemo(() => (pricing.yearly / 100).toFixed(2), [pricing.yearly]);

  const parseDateValue = useCallback((value: string | Date | null | undefined) => {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const isoish = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
      const date = new Date(isoish);
      if (!Number.isNaN(date.getTime())) return date;
      const fallback = new Date(trimmed);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    return null;
  }, []);

  const formattedRenewalDate = useMemo(() => {
    const reference = parseDateValue(currentPeriodEnd) || parseDateValue(subscriptionExpiresAt);
    if (!reference) return null;
    return reference.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [currentPeriodEnd, subscriptionExpiresAt, parseDateValue]);

  const hasActivePaidPlan = currentPlan === "monthly" || currentPlan === "yearly";
  const buttonDisabled = loading || (isAuthed && selectedPlan === currentPlan);
  const buttonLabel = useMemo(() => {
    if (!isAuthed) return "Subscribe";
    if (loading) return selectedPlan === "free" ? "Updating..." : "Redirecting...";
    if (selectedPlan === "free") {
      if (!hasActivePaidPlan) return currentPlan === "free" ? "Current plan" : "Select Free";
      return cancelAtPeriodEnd ? "Cancellation scheduled" : "Downgrade to Free";
    }
    if (currentPlan === selectedPlan) return "Current plan";
    if (hasActivePaidPlan && currentPlan && currentPlan !== selectedPlan) return "Switch Plan";
    return "Subscribe";
  }, [isAuthed, loading, selectedPlan, hasActivePaidPlan, cancelAtPeriodEnd, currentPlan]);

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-muted-foreground mt-4 mb-6 text-center">
        Thank you for supporting
      </h1>
      <Link
        href="/"
        className="mx-auto flex items-center gap-4 mb-6 justify-center"
      >
        <Image src={Logo} alt="Snap My Date" width={64} height={64} />
        <span className="text-4xl sm:text-5xl md:text-6xl text-foreground">
          <span className="font-pacifico">Snap</span>
          <span> </span>
          <span className="font-montserrat font-semibold">My Date</span>
        </span>
      </Link>
      <h4 className="text-l text-muted-foreground mb-6 text-center">
        Your contribution helps keep the lights on and new features coming.
      </h4>

      {banner && bannerVisible && (
        <div className="fixed right-6 top-6 z-50 flex max-w-sm flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-800 shadow-xl shadow-slate-400/20 backdrop-blur transition-all duration-300">
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                banner.type === "success"
                  ? "bg-emerald-500"
                  : banner.type === "error"
                  ? "bg-rose-500"
                  : "bg-slate-400"
              }`}
            />
            <p className="flex-1 leading-relaxed">{banner.message}</p>
            <button
              type="button"
              onClick={() => setBannerVisible(false)}
              className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`relative rounded-xl bg-surface p-5 pt-7 flex flex-col transition outline-none focus:outline-none focus-visible:outline-none ${
            selectedPlan === "free" ? "shadow-xl" : "shadow-md"
          } ${
            currentPlan && currentPlan !== "free"
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer"
          }`}
          role="button"
          aria-disabled={!!currentPlan && currentPlan !== "free"}
          tabIndex={currentPlan && currentPlan !== "free" ? -1 : 0}
          onClick={() => {
            if (currentPlan && currentPlan !== "free") return;
            setSelectedPlan("free");
          }}
          onKeyDown={(e) => {
            if (currentPlan && currentPlan !== "free") return;
            if (e.key === "Enter" || e.key === " ") setSelectedPlan("free");
          }}
          style={
            selectedPlan === "free"
              ? {
                  background:
                    "linear-gradient(135deg, rgba(156,163,175,0.18), rgba(156,163,175,0.08) 60%)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
                }
              : undefined
          }
        >
          {selectedPlan === "free" && (
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[#9CA3AF]" />
          )}
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full text-white shadow-sm z-10"
            style={{ backgroundColor: "#9CA3AF" }}
          >
            Starter
          </span>
          <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-center sm:justify-center sm:text-center sm:gap-1">
            <div className="text-left sm:text-center">
              <h2 className="text-base font-medium">Trial</h2>
              {!hasActivePaidPlan && (
                <div className="text-xs text-muted-foreground">
                  {typeof credits === "number"
                    ? `${credits} credits left`
                    : "3 trial credits"}
                </div>
              )}
            </div>
            <div className="text-right sm:text-center sm:mt-1">
              <div className="text-3xl font-semibold">FREE</div>
              <div className="text-xs text-muted-foreground">
                no credit card required
              </div>
            </div>
          </div>
          {isAuthed && currentPlan === "free" && (
            <div className="mt-3 text-center text-[11px] text-muted-foreground">
              Current plan
            </div>
          )}
        </div>
        <div
          className={`relative rounded-xl bg-surface p-5 pt-7 flex flex-col cursor-pointer transition outline-none focus:outline-none focus-visible:outline-none ${
            selectedPlan === "monthly" ? "shadow-xl" : "shadow-md"
          }`}
          style={{
            background:
              selectedPlan === "monthly"
                ? "linear-gradient(135deg, rgba(14,165,233,0.20), rgba(14,165,233,0.10) 60%)"
                : undefined,
          }}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedPlan("monthly")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSelectedPlan("monthly");
          }}
        >
          {selectedPlan === "monthly" && (
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-sky-500" />
          )}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full bg-sky-500 text-white shadow-sm">
            Most Popular
          </span>
          <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-center sm:justify-center sm:text-center sm:gap-1">
            <div className="text-left sm:text-center">
              <h2 className="text-base font-medium">Monthly</h2>
              <div className="text-xs text-muted-foreground">
                Great for getting started
              </div>
            </div>
            <div className="text-right sm:text-center sm:mt-1">
              <div className="text-3xl font-semibold">${monthlyPrice}</div>
              <div className="text-xs text-muted-foreground">per month</div>
            </div>
          </div>
          {isAuthed && currentPlan === "monthly" && (
            <div className="mt-3 text-center text-[11px] text-muted-foreground">
              Current plan
            </div>
          )}
        </div>

        <div
          className={`relative rounded-xl bg-surface p-5 pt-7 flex flex-col cursor-pointer transition outline-none focus:outline-none focus-visible:outline-none ${
            selectedPlan === "yearly" ? "shadow-xl" : "shadow-md"
          }`}
          style={{
            background:
              selectedPlan === "yearly"
                ? "linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.10) 60%)"
                : undefined,
          }}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedPlan("yearly")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSelectedPlan("yearly");
          }}
        >
          {selectedPlan === "yearly" && (
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-emerald-500" />
          )}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500 text-white shadow-sm">
            Best Value
          </span>
          <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-center sm:justify-center sm:text-center sm:gap-1">
            <div className="text-left sm:text-center">
              <h2 className="text-base font-medium">Yearly</h2>
              <div className="text-xs text-muted-foreground">One payment</div>
            </div>
            <div className="text-right sm:text-center sm:mt-1">
              <div className="text-3xl font-semibold">${yearlyPrice}</div>
              <div className="text-xs text-muted-foreground">2 FREE Months</div>
            </div>
          </div>
          {isAuthed && currentPlan === "yearly" && (
            <div className="mt-3 text-center text-[11px] text-muted-foreground">
              Current plan
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className="px-6 py-2 rounded-2xl bg-[#A259FF] text-white shadow-lg hover:shadow-xl active:shadow-md transition-shadow select-none"
          onClick={async () => {
          if (!isAuthed) {
            setAuthMode("signup");
            setAuthOpen(true);
            return;
          }
          if (loading) return;
          if (selectedPlan === "free") {
            if (!hasActivePaidPlan) return;
            try {
              setLoading(true);
              const res = await fetch("/api/user/subscription", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "free" }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(json?.error || "Failed to update subscription");
              }
              const newCancelState = Boolean(json?.cancelAtPeriodEnd);
              setCancelAtPeriodEnd(newCancelState);
              if (json?.plan) setCurrentPlan(json.plan);
              setBanner({
                type: "info",
                message: newCancelState
                  ? "We'll cancel your subscription at the end of the current period."
                  : "Subscription canceled.",
              });
              router.refresh();
            } catch (err: any) {
              setBanner({
                type: "error",
                message: err?.message || "Failed to update subscription",
              });
            } finally {
              setLoading(false);
            }
            return;
          }
          if (isAuthed && selectedPlan === currentPlan) return;
          try {
            setLoading(true);
            const res = await fetch("/api/billing/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: selectedPlan }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.url) {
              throw new Error(json?.error || "Failed to start checkout");
            }
            if (typeof window !== "undefined") {
              window.location.href = json.url as string;
            }
          } catch (err: any) {
            setLoading(false);
            setBanner({
              type: "error",
              message: err?.message || "Failed to start checkout",
            });
          }
        }}
        disabled={buttonDisabled}
      >
        {buttonLabel}
      </button>
        {isAuthed && stripeCustomerId && (
          <button
            type="button"
            className="px-6 py-2 rounded-2xl border border-border bg-surface text-foreground hover:bg-surface/80 transition select-none disabled:opacity-60"
            onClick={async () => {
              if (portalLoading) return;
              try {
                setPortalLoading(true);
                const res = await fetch("/api/billing/stripe/portal", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok || !json?.url) {
                  throw new Error(json?.error || "Billing portal unavailable");
                }
                if (typeof window !== "undefined") {
                  window.location.href = json.url as string;
                }
              } catch (err: any) {
                setBanner({
                  type: "error",
                  message: err?.message || "Failed to open billing portal",
                });
                setPortalLoading(false);
              }
            }}
            disabled={portalLoading}
          >
            {portalLoading ? "Opening..." : "Manage Billing"}
          </button>
        )}
      </div>
      {hasActivePaidPlan && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {cancelAtPeriodEnd
            ? formattedRenewalDate
              ? `Scheduled to end on ${formattedRenewalDate}.`
              : "Cancellation scheduled at the end of the current period."
            : formattedRenewalDate
            ? `Subscription renews automatically on ${formattedRenewalDate}.`
            : "Subscription renews automatically."}
        </div>
      )}
      {subscriptionStatus && (
        <div className="mt-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
          Status: {subscriptionStatus.replace(/_/g, " ")}
        </div>
      )}
      <div className="mt-12 text-center text-muted-foreground">
        <Link  href="/snap">or continue to Snap you first Date</Link>
      </div>
      <div className="mt-12 max-w-xl mx-auto w-full">
        <div className="rounded-xl bg-surface p-5 shadow-md">
          <div className="flex items-center justify-center flex-wrap gap-3">
            <div className="text-xl font-semibold text-foreground text-center">
              Promo Code
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full px-4 py-2 rounded-lg bg-sky-500 text-white shadow hover:shadow-md active:shadow-sm transition"
              onClick={() => setRedeemOpen(true)}
            >
              Redeem a Snap
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 rounded-lg bg-emerald-500 text-white shadow hover:shadow-md active:shadow-sm transition"
              onClick={() => setGiftOpen(true)}
            >
              Gift a Snap
            </button>
          </div>
        </div>
      </div>
      <GiftSnapModal open={giftOpen} onClose={() => setGiftOpen(false)} />
      <RedeemPromoModal
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
      />
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </main>
  );
}
