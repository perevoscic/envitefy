/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function EliteAthleteTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#020617_42%,#020617_100%)] text-white",
        shellClass:
          "overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_28px_80px_rgba(2,6,23,0.55)] backdrop-blur",
        titleClass:
          "max-w-4xl text-5xl font-black uppercase italic leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl [font-family:Impact,Haettenschweiler,'Arial_Narrow_Bold',sans-serif]",
        mutedClass: "text-slate-200",
        heroPanelClass: "bg-slate-950",
        chipClass:
          "inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
        navShellClass:
          "rounded-[24px] border border-white/10 bg-slate-950/88 px-2 py-2 shadow-[0_16px_40px_rgba(2,6,23,0.32)] backdrop-blur",
        navActiveClass:
          "rounded-full bg-blue-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/25 hover:text-white",
        navFadeClass: "rgba(2,6,23,0.9)",
        summaryCardClass:
          "rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur",
        sectionClass:
          "rounded-[28px] border border-white/10 bg-slate-900/80 px-5 py-5 shadow-[0_10px_28px_rgba(2,6,23,0.28)]",
        sectionMutedClass: "bg-blue-500/15 text-blue-100",
        primaryButtonClass:
          "rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-500",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10",
      }}
    />
  );
}
