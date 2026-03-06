/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function ScoutingReportTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#e5e7eb_0%,#f8fafc_46%,#ffffff_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-none border border-slate-400 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)]",
        titleClass:
          "max-w-4xl text-4xl font-black uppercase leading-[1] tracking-tight sm:text-5xl lg:text-6xl [font-family:ui-monospace,SFMono-Regular,Menlo,monospace]",
        mutedClass: "text-slate-600",
        heroPanelClass:
          "bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]",
        chipClass:
          "inline-flex items-center rounded-none border border-slate-400 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700",
        navShellClass:
          "rounded-none border border-slate-300 bg-white/94 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-none border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-none border border-slate-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-500 hover:text-slate-900",
        navFadeClass: "rgba(255,255,255,0.94)",
        summaryCardClass:
          "rounded-none border border-slate-300 bg-slate-50 px-4 py-4",
        sectionClass:
          "rounded-none border border-slate-300 bg-white px-5 py-5",
        sectionMutedClass: "bg-slate-100 text-slate-700",
        primaryButtonClass:
          "rounded-none border border-slate-900 bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-700",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-none border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-500 hover:text-slate-900",
      }}
    />
  );
}
