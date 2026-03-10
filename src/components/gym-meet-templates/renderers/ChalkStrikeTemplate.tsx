/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function ChalkStrikeTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[radial-gradient(circle_at_top,#ec4899_0%,#111827_34%,#020617_100%)] text-white",
        shellClass:
          "overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90 shadow-[0_32px_90px_rgba(2,6,23,0.6)] backdrop-blur",
        titleClass:
          "max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.03em] text-pink-50 sm:text-6xl lg:text-7xl [font-family:'Oswald','Arial_Narrow',sans-serif]",
        titleStyle: { color: "#fdf2f8" },
        mutedClass: "text-slate-200",
        heroPanelClass: "bg-[linear-gradient(145deg,#020617_0%,#111827_55%,#831843_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-pink-400/30 bg-pink-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-pink-100",
        navShellClass:
          "rounded-[24px] border border-white/10 bg-slate-950/88 px-2 py-2 shadow-[0_18px_40px_rgba(2,6,23,0.36)] backdrop-blur",
        navActiveClass:
          "rounded-full bg-pink-500 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950",
        navIdleClass:
          "rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-200 transition hover:border-pink-300/40 hover:text-white",
        navFadeClass: "rgba(2,6,23,0.92)",
        summaryCardClass:
          "rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur",
        sectionClass:
          "rounded-[26px] border border-white/10 bg-slate-900/82 px-5 py-5 shadow-[0_16px_34px_rgba(2,6,23,0.28)]",
        sectionTitleClass: "text-pink-50",
        sectionTitleStyle: { color: "#fdf2f8" },
        sectionMutedClass: "bg-pink-500/15 text-pink-100",
        primaryButtonClass:
          "rounded-2xl bg-pink-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-pink-400",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10",
      }}
    />
  );
}
