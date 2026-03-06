/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function WeekendJourneyTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%,#ecfdf5_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(16,185,129,0.08)]",
        titleClass:
          "max-w-4xl text-4xl font-black leading-[0.96] tracking-tight sm:text-5xl lg:text-6xl [font-family:'Avenir_Next','Segoe_UI',sans-serif]",
        mutedClass: "text-slate-600",
        heroPanelClass:
          "bg-[linear-gradient(160deg,#ffffff_0%,#f0fdf4_55%,#d1fae5_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700",
        navShellClass:
          "rounded-[24px] border border-emerald-100 bg-white/94 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 transition hover:bg-emerald-100",
        navFadeClass: "rgba(255,255,255,0.94)",
        summaryCardClass:
          "rounded-[22px] border-l-4 border-emerald-500 bg-white px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[24px] border border-emerald-100 bg-white px-5 py-5 shadow-sm",
        sectionMutedClass: "bg-emerald-50 text-emerald-700",
        primaryButtonClass:
          "rounded-xl bg-emerald-600 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-500",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-50",
        timeline: true,
      }}
    />
  );
}
