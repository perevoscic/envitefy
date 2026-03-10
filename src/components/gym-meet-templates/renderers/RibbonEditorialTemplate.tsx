/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import EditorialGymMeetTemplate from "./EditorialGymMeetTemplate";

export default function RibbonEditorialTemplate(props: any) {
  return (
    <EditorialGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[linear-gradient(180deg,#fffaf5_0%,#fff1f2_38%,#f8fafc_100%)] text-stone-900",
        shellClass:
          "overflow-hidden rounded-[34px] border border-rose-100 bg-white/96 shadow-[0_28px_80px_rgba(148,163,184,0.16)]",
        titleClass:
          "max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.04em] sm:text-6xl lg:text-7xl [font-family:Georgia,'Times_New_Roman',serif]",
        mutedClass: "text-stone-600",
        heroPanelClass: "bg-[linear-gradient(145deg,#fff7ed_0%,#fdf2f8_55%,#f8fafc_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-700 shadow-sm",
        navShellClass:
          "rounded-[24px] border border-rose-100 bg-white/92 px-2 py-2 shadow-sm backdrop-blur",
        navActiveClass:
          "rounded-full bg-fuchsia-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
        navIdleClass:
          "rounded-full bg-rose-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100",
        navFadeClass: "rgba(255,255,255,0.92)",
        summaryCardClass:
          "rounded-[28px] border border-rose-100 bg-white px-4 py-4 shadow-sm",
        sectionClass:
          "rounded-[32px] border border-rose-100 bg-white/96 px-6 py-6 shadow-[0_16px_36px_rgba(244,114,182,0.08)]",
        sectionMutedClass: "bg-fuchsia-50 text-fuchsia-800",
        primaryButtonClass:
          "rounded-full bg-fuchsia-700 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-fuchsia-600",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-50",
        ledeClass: "text-stone-700",
        dividerClass: "border-t border-rose-100 pt-4",
      }}
    />
  );
}
