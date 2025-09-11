"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GiftSnapModal from "@/components/GiftSnapModal";
import RedeemPromoModal from "@/components/RedeemPromoModal";
import Logo from "@/assets/logo.png";

export default function SubscriptionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<
    "free" | "monthly" | "yearly"
  >("free");
  const [currentPlan, setCurrentPlan] = useState<
    "free" | "monthly" | "yearly" | null
  >(null);
  const [scanCredits, setScanCredits] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);

  useEffect(() => {
    const plan = params?.get?.("plan") ?? null;
    if (!plan) return;
    const normalized = ["free", "monthly", "yearly"].includes(plan)
      ? plan
      : null;
    if (!normalized) return;
    // Save and redirect home after applying preselected plan
    fetch("/api/user/subscription", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: normalized }),
      credentials: "include",
    })
      .then(() => router.replace("/"))
      .catch(() => {});
  }, [params, router]);

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
        const plan = planJson?.plan;
        if (plan === "free" || plan === "monthly" || plan === "yearly") {
          setCurrentPlan(plan);
          setSelectedPlan(plan);
        } else {
          setCurrentPlan("free");
          setSelectedPlan("free");
        }
        if (typeof profileJson?.credits === "number") {
          setScanCredits(profileJson.credits);
        }
      } catch {}
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

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
              <div className="text-xs text-muted-foreground">
                {typeof scanCredits === "number"
                  ? `${scanCredits} credits left`
                  : "3 trial credits"}
              </div>
            </div>
            <div className="text-right sm:text-center sm:mt-1">
              <div className="text-3xl font-semibold">FREE</div>
              <div className="text-xs text-muted-foreground">
                no credit card required
              </div>
            </div>
          </div>
          {currentPlan === "free" && (
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
              <div className="text-3xl font-semibold">$2.99</div>
              <div className="text-xs text-muted-foreground">per month</div>
            </div>
          </div>
          {currentPlan === "monthly" && (
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
              <div className="text-3xl font-semibold">$29.99</div>
              <div className="text-xs text-muted-foreground">2 FREE Months</div>
            </div>
          </div>
          {currentPlan === "yearly" && (
            <div className="mt-3 text-center text-[11px] text-muted-foreground">
              Current plan
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          className="px-6 py-2 rounded-2xl bg-[#A259FF] text-white shadow-lg hover:shadow-xl active:shadow-md transition-shadow select-none"
          onClick={async () => {
            if (currentPlan && selectedPlan === currentPlan) return;
            await fetch("/api/user/subscription", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: selectedPlan }),
              credentials: "include",
            });
            router.replace("/");
          }}
          disabled={!!currentPlan && selectedPlan === currentPlan}
        >
          {currentPlan && selectedPlan === currentPlan
            ? "Current plan"
            : selectedPlan === "free"
            ? "Select Free"
            : "Upgrade"}
        </button>
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
    </main>
  );
}
