/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function JudgesSheetTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#f5f1e8_0%,#ece4d6_48%,#dfd2bf_100%)] text-stone-900",
        shellClass:
          "overflow-hidden rounded-[22px] border-2 border-stone-400/30 bg-[#fbf8f2] shadow-[0_20px_60px_rgba(120,113,108,0.18)]",
        titleClass:
          "max-w-4xl text-4xl font-mono font-bold uppercase leading-[0.94] tracking-widest text-stone-900 sm:text-5xl lg:text-6xl",
        mutedClass: "text-stone-600",
        heroPanelClass: "bg-[linear-gradient(180deg,#fbf8f2_0%,#efe7da_100%)]",
        chipClass:
          "inline-flex items-center rounded-md border border-stone-400/25 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-700",
        navShellClass:
          "rounded-xl border border-stone-400/20 bg-[#f8f3ea]/96 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-lg bg-rose-800 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-lg border border-stone-400/20 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100",
        navFadeClass: "rgba(248,243,234,0.96)",
        summaryCardClass:
          "rounded-xl border border-stone-400/20 bg-white px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-2xl border border-stone-400/20 bg-[#fffdf8] px-5 py-5 shadow-[0_12px_24px_rgba(120,113,108,0.08)]",
        sectionMutedClass: "bg-rose-50 text-rose-900",
        primaryButtonClass:
          "rounded-lg bg-rose-800 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-rose-700",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-lg border border-stone-400/20 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-stone-700 transition hover:bg-stone-100",
      }}
    />
  );
}
