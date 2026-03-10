/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import EditorialGymMeetTemplate from "./EditorialGymMeetTemplate";

export default function MedalPosterTemplate(props: any) {
  return (
    <EditorialGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#fef3c7_0%,#ffedd5_40%,#fff7ed_100%)] text-stone-900",
        shellClass:
          "overflow-hidden rounded-[24px] border-2 border-stone-900 bg-[#fff9ef] shadow-[0_26px_70px_rgba(146,64,14,0.16)]",
        titleClass:
          "max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.04em] sm:text-6xl lg:text-7xl [font-family:'Arial_Black','Helvetica_Neue',sans-serif]",
        mutedClass: "text-stone-700",
        heroPanelClass: "bg-[linear-gradient(145deg,#fef3c7_0%,#fed7aa_55%,#fecaca_100%)]",
        chipClass:
          "inline-flex items-center rounded-none border border-stone-900 bg-stone-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white",
        navShellClass:
          "rounded-none border-2 border-stone-900 bg-[#fff9ef] px-2 py-2 shadow-[8px_8px_0_0_rgba(146,64,14,0.1)]",
        navActiveClass:
          "rounded-none bg-stone-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100",
        navIdleClass:
          "rounded-none border border-stone-900 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-stone-900 transition hover:bg-amber-50",
        navFadeClass: "rgba(255,249,239,0.98)",
        summaryCardClass:
          "rounded-none border-2 border-stone-900 bg-white px-4 py-4 shadow-[6px_6px_0_0_rgba(146,64,14,0.08)]",
        sectionClass:
          "rounded-none border-2 border-stone-900 bg-[#fffdf8] px-6 py-6 shadow-[10px_10px_0_0_rgba(146,64,14,0.08)]",
        sectionMutedClass: "bg-amber-100 text-stone-900",
        primaryButtonClass:
          "rounded-none bg-stone-900 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-amber-100 transition hover:bg-stone-800",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-none border border-stone-900 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-stone-900 transition hover:bg-amber-50",
        ledeClass: "text-stone-800",
        dividerClass: "border-t-2 border-stone-900 pt-4",
      }}
    />
  );
}
