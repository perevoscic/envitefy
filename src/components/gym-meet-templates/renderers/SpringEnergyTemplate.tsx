/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function SpringEnergyTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#ecfeff_0%,#fff7ed_42%,#ffe4e6_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-[34px] border border-white/60 bg-white/92 shadow-[0_28px_70px_rgba(14,116,144,0.12)] backdrop-blur",
        titleClass:
          "max-w-4xl text-4xl font-black leading-[0.94] tracking-tight sm:text-5xl lg:text-6xl [font-family:'Trebuchet_MS','Gill_Sans',sans-serif]",
        mutedClass: "text-slate-600",
        heroPanelClass: "bg-[linear-gradient(145deg,#ecfeff_0%,#dcfce7_46%,#fff1f2_100%)]",
        chipClass:
          "inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700 shadow-sm",
        navShellClass:
          "rounded-[28px] border border-sky-100 bg-white/92 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-full bg-sky-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-full bg-sky-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-sky-700 transition hover:bg-sky-100",
        navFadeClass: "rgba(255,255,255,0.92)",
        summaryCardClass:
          "rounded-[26px] border border-sky-100 bg-white px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[32px] border border-white/80 bg-white/94 px-5 py-5 shadow-[0_16px_36px_rgba(56,189,248,0.1)]",
        sectionMutedClass: "bg-emerald-50 text-emerald-700",
        primaryButtonClass:
          "rounded-full bg-sky-600 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-sky-500",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-700 transition hover:bg-sky-50",
      }}
    />
  );
}
