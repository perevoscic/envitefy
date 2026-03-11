/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function PodiumLightsTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[radial-gradient(circle_at_top,#f59e0b_0%,#0f172a_26%,#020617_100%)] text-white",
        shellClass:
          "overflow-hidden rounded-[30px] border border-amber-200/10 bg-slate-950/92 shadow-[0_34px_94px_rgba(15,23,42,0.58)] backdrop-blur",
        titleClass:
          "max-w-4xl text-5xl font-sans font-black leading-[0.92] tracking-tight text-amber-600 sm:text-6xl lg:text-7xl",
        titleStyle: { color: "#fffbeb" },
        mutedClass: "text-slate-200",
        heroPanelClass: "bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_58%,#a16207_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100",
        navShellClass:
          "rounded-[24px] border border-amber-200/10 bg-slate-950/86 px-2 py-2 shadow-[0_16px_36px_rgba(2,6,23,0.34)] backdrop-blur",
        navActiveClass:
          "rounded-full bg-amber-400 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950",
        navIdleClass:
          "rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-200 transition hover:border-amber-200/35 hover:text-white",
        navFadeClass: "rgba(2,6,23,0.9)",
        summaryCardClass:
          "rounded-[24px] border border-amber-100/10 bg-white/5 px-4 py-4 backdrop-blur",
        sectionClass:
          "rounded-[28px] border border-amber-100/10 bg-slate-900/84 px-5 py-5 shadow-[0_16px_34px_rgba(2,6,23,0.28)]",
        sectionTitleClass: "text-amber-50",
        sectionTitleStyle: { color: "#fffbeb" },
        sectionMutedClass: "bg-amber-400/15 text-amber-100",
        primaryButtonClass:
          "rounded-full bg-amber-400 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-300",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-amber-100/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10",
      }}
    />
  );
}
