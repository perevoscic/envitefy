/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import DashboardGymMeetTemplate from "./DashboardGymMeetTemplate";

export default function VaultGridTemplate(props: any) {
  return (
    <DashboardGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#e0e7ff_0%,#f8fafc_34%,#dbeafe_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-[30px] border border-indigo-100 bg-white/94 shadow-[0_28px_78px_rgba(99,102,241,0.12)]",
        titleClass:
          "max-w-4xl text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl [font-family:'Arial_Black','Avenir_Next',sans-serif]",
        mutedClass: "text-slate-600",
        heroPanelClass: "bg-[linear-gradient(145deg,#eef2ff_0%,#ffffff_42%,#dbeafe_100%)]",
        chipClass:
          "inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm",
        navShellClass:
          "rounded-[24px] border border-indigo-100 bg-white/92 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-full bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-full bg-indigo-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700 transition hover:bg-indigo-100",
        navFadeClass: "rgba(255,255,255,0.92)",
        summaryCardClass:
          "rounded-[22px] border border-indigo-100 bg-slate-50 px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[28px] border border-indigo-100 bg-white px-5 py-5 shadow-[0_14px_32px_rgba(99,102,241,0.08)]",
        sectionMutedClass: "bg-indigo-100 text-indigo-800",
        primaryButtonClass:
          "rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-700",
        secondaryButtonClass:
          "inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50",
        sidebarCardClass:
          "rounded-[26px] border border-indigo-100 bg-white px-5 py-5 shadow-[0_12px_28px_rgba(99,102,241,0.08)]",
        stickyRailClass: "lg:sticky lg:top-4",
      }}
    />
  );
}
