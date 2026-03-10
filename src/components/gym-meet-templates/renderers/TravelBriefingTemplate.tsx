/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import DashboardGymMeetTemplate from "./DashboardGymMeetTemplate";

export default function TravelBriefingTemplate(props: any) {
  return (
    <DashboardGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#f0fdf4_0%,#f8fafc_36%,#dbeafe_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-[28px] border border-emerald-100 bg-white/94 shadow-[0_28px_78px_rgba(16,185,129,0.1)]",
        titleClass:
          "max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl [font-family:'Franklin_Gothic_Medium','Arial_Narrow',sans-serif]",
        mutedClass: "text-slate-600",
        heroPanelClass: "bg-[linear-gradient(145deg,#f0fdf4_0%,#eff6ff_50%,#dbeafe_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-900",
        navShellClass:
          "rounded-[24px] border border-emerald-100 bg-white/92 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-full bg-emerald-700 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white sm:text-[11px]",
        navIdleClass:
          "rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 transition hover:bg-emerald-100 sm:text-[11px]",
        navFadeClass: "rgba(255,255,255,0.92)",
        navRailClass:
          "no-scrollbar flex gap-2 overflow-x-auto px-1 py-1 md:grid md:overflow-visible",
        summaryCardClass:
          "rounded-[20px] border border-emerald-100 bg-white px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[26px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_14px_32px_rgba(16,185,129,0.08)]",
        sectionMutedClass: "bg-emerald-100 text-emerald-900",
        primaryButtonClass:
          "rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-600",
        secondaryButtonClass:
          "inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-900 transition hover:bg-emerald-50",
        sidebarCardClass:
          "rounded-[24px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_12px_28px_rgba(16,185,129,0.08)]",
        stickyRailClass: "lg:sticky lg:top-4",
      }}
    />
  );
}
