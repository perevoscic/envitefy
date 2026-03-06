/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function BentoBoxTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_38%,#ffffff_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.12)]",
        titleClass:
          "max-w-4xl text-4xl font-black leading-[0.96] tracking-tight sm:text-5xl lg:text-6xl [font-family:'Trebuchet_MS','Avenir_Next',sans-serif]",
        mutedClass: "text-slate-600",
        heroPanelClass:
          "bg-[linear-gradient(145deg,#ffffff_0%,#eef2ff_55%,#e0e7ff_100%)]",
        chipClass:
          "inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm",
        navShellClass:
          "rounded-[28px] border border-slate-200 bg-white/92 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-full bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:bg-slate-200 hover:text-slate-900",
        navFadeClass: "rgba(255,255,255,0.92)",
        summaryCardClass:
          "rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[32px] border border-slate-200 bg-white px-5 py-5 shadow-sm",
        sectionMutedClass: "bg-indigo-50 text-indigo-700",
        primaryButtonClass:
          "rounded-full bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-700",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50",
      }}
    />
  );
}
