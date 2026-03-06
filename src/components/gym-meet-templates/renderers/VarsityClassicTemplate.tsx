/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function VarsityClassicTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#fdfbf5_0%,#f7efe2_48%,#efe4d3_100%)] text-stone-900",
        shellClass:
          "overflow-hidden rounded-none border-4 border-red-950 bg-[#fffdf8] shadow-[12px_12px_0_0_rgba(127,29,29,0.18)]",
        titleClass:
          "max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl [font-family:Georgia,'Times_New_Roman',serif]",
        mutedClass: "text-stone-700",
        heroPanelClass:
          "bg-[linear-gradient(180deg,#fffaf0_0%,#f8efe1_100%)]",
        chipClass:
          "inline-flex items-center rounded-none border border-red-900/15 bg-red-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white",
        navShellClass:
          "rounded-none border-2 border-red-900/15 bg-[#fffdf8]/94 px-2 py-2 shadow-[6px_6px_0_0_rgba(127,29,29,0.08)] backdrop-blur",
        navActiveClass:
          "rounded-none bg-red-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-none border border-red-900/15 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-900 transition hover:bg-red-50",
        navFadeClass: "rgba(255,253,248,0.94)",
        summaryCardClass:
          "rounded-none border-2 border-red-900/15 bg-white px-4 py-4 shadow-[6px_6px_0_0_rgba(127,29,29,0.08)]",
        sectionClass:
          "rounded-none border-2 border-red-900/15 bg-white px-5 py-5 shadow-[8px_8px_0_0_rgba(127,29,29,0.08)]",
        sectionMutedClass: "bg-red-50 text-red-900",
        primaryButtonClass:
          "rounded-none bg-red-900 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-800",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-none border border-red-900/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-900 transition hover:bg-red-50",
      }}
    />
  );
}
