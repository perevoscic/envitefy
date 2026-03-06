/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function ParentCommandTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_42%,#e0f2fe_100%)] text-slate-900",
        shellClass:
          "overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-[0_22px_60px_rgba(37,99,235,0.12)]",
        titleClass:
          "max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl [font-family:system-ui,sans-serif]",
        mutedClass: "text-slate-700",
        heroPanelClass:
          "bg-[linear-gradient(180deg,#dbeafe_0%,#eff6ff_35%,#ffffff_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700",
        navShellClass:
          "rounded-[24px] border border-blue-100 bg-white/94 px-2 py-2 shadow-[0_8px_24px_rgba(59,130,246,0.08)] backdrop-blur",
        navActiveClass:
          "rounded-2xl bg-blue-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 transition hover:bg-blue-100",
        navFadeClass: "rgba(255,255,255,0.94)",
        summaryCardClass:
          "rounded-[24px] border-b-4 border-blue-200 bg-white px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[26px] border border-blue-100 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(59,130,246,0.08)]",
        sectionMutedClass: "bg-blue-50 text-blue-700",
        primaryButtonClass:
          "rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-blue-600",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700 transition hover:bg-blue-50",
      }}
    />
  );
}
