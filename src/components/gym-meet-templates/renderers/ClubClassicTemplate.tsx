/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function ClubClassicTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fff1f2_48%,#eff6ff_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-[24px] border-2 border-slate-900/8 bg-[#fffdf8] shadow-[0_24px_64px_rgba(15,23,42,0.12)]",
        titleClass:
          "max-w-4xl text-4xl font-sans font-black italic leading-[0.95] tracking-tight text-orange-900 sm:text-5xl lg:text-6xl",
        mutedClass: "text-slate-600",
        heroPanelClass: "bg-[linear-gradient(180deg,#fffaf2_0%,#fef2f2_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-red-900/10 bg-red-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white",
        navShellClass:
          "rounded-[20px] border border-slate-900/8 bg-white/94 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-full bg-red-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-full border border-slate-900/8 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-red-50 hover:text-red-900",
        navFadeClass: "rgba(255,255,255,0.94)",
        summaryCardClass:
          "rounded-[20px] border border-slate-900/8 bg-white px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[24px] border border-slate-900/8 bg-white px-5 py-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)]",
        sectionMutedClass: "bg-red-50 text-red-900",
        primaryButtonClass:
          "rounded-full bg-red-900 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-800",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-slate-900/8 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-red-50 hover:text-red-900",
      }}
    />
  );
}
