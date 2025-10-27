"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { createEmailTemplate, escapeHtml } from "@/lib/email-template";

type Plan = "freemium" | "free" | "monthly" | "yearly" | "FF";
interface Scenario {
  oldPlan: Exclude<Plan, "FF">; // old plan can't be FF in these previews
  newPlan: Exclude<Plan, "free">; // new plan is one of paid or FF
  oldPlanLabel: string;
  newPlanLabel: string;
}

export default function SubscriptionChangePreviewPage() {
  const { data: session, status } = useSession();
  const [viewType, setViewType] = useState<
    | "upgradeMonthly"
    | "upgradeYearly"
    | "planSwitch"
    | "planSwitchDown"
    | "lifetime"
  >("upgradeMonthly");

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }
  if (status !== "authenticated") {
    return (
      <div className="p-6">
        <p className="mb-3">You must sign in to view this page.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  const isAdmin = (session?.user as any)?.isAdmin;
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="mb-3">Forbidden: Admins only.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  // Generate sample email based on view type
  const userName = "Taylor";
  const scenarios: Record<
    | "upgradeMonthly"
    | "upgradeYearly"
    | "planSwitch"
    | "planSwitchDown"
    | "lifetime",
    Scenario
  > = {
    upgradeMonthly: {
      oldPlan: "freemium",
      newPlan: "monthly",
      oldPlanLabel: "Freemium",
      newPlanLabel: "Monthly Plan",
    },
    upgradeYearly: {
      oldPlan: "freemium",
      newPlan: "yearly",
      oldPlanLabel: "Freemium",
      newPlanLabel: "Yearly Plan",
    },
    planSwitch: {
      oldPlan: "monthly",
      newPlan: "yearly",
      oldPlanLabel: "Monthly Plan",
      newPlanLabel: "Yearly Plan",
    },
    planSwitchDown: {
      oldPlan: "yearly",
      newPlan: "monthly",
      oldPlanLabel: "Yearly Plan",
      newPlanLabel: "Monthly Plan",
    },
    lifetime: {
      oldPlan: "monthly",
      newPlan: "FF",
      oldPlanLabel: "Monthly Plan",
      newPlanLabel: "Lifetime Access",
    },
  };

  const scenario = scenarios[viewType];
  const isUpgrade =
    scenario.oldPlan === "free" ||
    scenario.oldPlan === "freemium" ||
    scenario.newPlan === "FF";
  const isPlanSwitch =
    (scenario.oldPlan === "monthly" && scenario.newPlan === "yearly") ||
    (scenario.oldPlan === "yearly" && scenario.newPlan === "monthly");

  const subject = isUpgrade
    ? `Welcome to ${scenario.newPlanLabel} - Envitefy`
    : `Your Envitefy plan has been updated`;

  const preheader = isUpgrade
    ? `You've upgraded from ${scenario.oldPlanLabel} to ${scenario.newPlanLabel}.`
    : `Your plan has been updated from ${scenario.oldPlanLabel} to ${scenario.newPlanLabel}.`;

  const greeting = `Hi ${escapeHtml(userName)}`;

  const body =
    isUpgrade && scenario.newPlan === "FF"
      ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; font-weight: 600; color: #2E2C2D;">
        🎊 Welcome to Envitefy Family and Friends Club!
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 8px; background: linear-gradient(to right, #f59e0b, #f97316); color: white; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
          ⭐ Lifetime Access
        </span>
      </div>
      <p style="margin: 20px 0 16px 0; font-size: 16px; line-height: 1.6;">
        You've been granted exclusive lifetime access to Envitefy! This special membership gives you unlimited scans, unlimited storage, and all premium features—forever.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        Start snapping and saving all your important dates with no limits!
      </p>
    `
      : isUpgrade
      ? `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        🎉 Great news! Your Envitefy subscription has been upgraded.
      </p>
      <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #065F46;">Subscription Upgraded</p>
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #047857;">
          <span style="text-decoration: line-through; opacity: 0.6;">${escapeHtml(
            scenario.oldPlanLabel
          )}</span> 
          <span style="font-weight: 700; margin: 0 8px;">→</span> 
          <strong>${escapeHtml(scenario.newPlanLabel)}</strong>
        </p>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        You now have unlimited access to all premium features. Start snapping and saving all your important dates!
      </p>
    `
      : `
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">${greeting},</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        Your Envitefy plan has been updated.
      </p>
      <div style="background: #F9FAFB; border-left: 4px solid #2DD4BF; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #737373;">Plan Updated</p>
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #4E4E50;">
          <span style="text-decoration: line-through; opacity: 0.6;">${escapeHtml(
            scenario.oldPlanLabel
          )}</span> 
          <span style="font-weight: 700; margin: 0 8px;">→</span> 
          <strong>${escapeHtml(scenario.newPlanLabel)}</strong>
        </p>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
        ${
          isPlanSwitch
            ? "Your billing cycle has been updated. You'll continue to enjoy unlimited access to all premium features."
            : "Your plan has been successfully updated."
        }
      </p>
    `;

  const html = createEmailTemplate({
    preheader,
    title: isUpgrade ? "Subscription Upgraded!" : "Subscription Updated",
    body,
    buttonText: "View My Subscription",
    buttonUrl: "https://envitefy.com/subscription",
  });

  return (
    <div
      className="min-h-[100dvh] landing-dark-gradient bg-background text-foreground transition-colors"
      suppressHydrationWarning
    >
      <div
        className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
        suppressHydrationWarning
      >
        {/* Header */}
        <div className="flex flex-col gap-2 pt-8" suppressHydrationWarning>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/emails"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1
              className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
              suppressHydrationWarning
            >
              💳 Subscription Change Email
            </h1>
          </div>
          <p
            className="text-sm text-muted-foreground ml-9"
            suppressHydrationWarning
          >
            Sent when user upgrades from trial, switches between monthly/yearly,
            or receives lifetime access
          </p>
        </div>

        {/* View Type Selector */}
        <section suppressHydrationWarning>
          <div className="bg-surface rounded-xl ring-1 ring-border/60 overflow-hidden shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Preview Type
            </h2>
            <div className="flex flex-wrap gap-2" suppressHydrationWarning>
              <button
                onClick={() => setViewType("upgradeMonthly")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewType === "upgradeMonthly"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-surface-alt text-foreground hover:bg-surface-alt/80"
                }`}
              >
                ✨ Upgrade (Trial → Monthly)
              </button>
              <button
                onClick={() => setViewType("upgradeYearly")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewType === "upgradeYearly"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-surface-alt text-foreground hover:bg-surface-alt/80"
                }`}
              >
                ✨ Upgrade (Trial → Yearly)
              </button>
              <button
                onClick={() => setViewType("planSwitch")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewType === "planSwitch"
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "bg-surface-alt text-foreground hover:bg-surface-alt/80"
                }`}
              >
                🔄 Plan Switch (Monthly ↔ Yearly)
              </button>
              <button
                onClick={() => setViewType("planSwitchDown")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewType === "planSwitchDown"
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "bg-surface-alt text-foreground hover:bg-surface-alt/80"
                }`}
              >
                🔁 Plan Switch (Yearly → Monthly)
              </button>
              <button
                onClick={() => setViewType("lifetime")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewType === "lifetime"
                    ? "bg-amber-500 text-white shadow-lg"
                    : "bg-surface-alt text-foreground hover:bg-surface-alt/80"
                }`}
              >
                ⭐ Lifetime (Admin Grant)
              </button>
            </div>
          </div>
        </section>

        {/* Email Preview */}
        <section suppressHydrationWarning>
          <div className="bg-surface rounded-xl ring-1 ring-border/60 overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-border bg-surface/80">
              <h2 className="text-lg font-semibold text-foreground">
                Email Preview
              </h2>
            </div>
            <div className="p-6">
              <iframe
                srcDoc={html}
                className="w-full border border-border rounded-lg"
                style={{ height: "700px" }}
                title="Email Preview"
                suppressHydrationWarning
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
