/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import BaseGymMeetTemplate from "./BaseGymMeetTemplate";

export default function AuroraLiftTemplate(props: any) {
  return (
    <BaseGymMeetTemplate
      {...props}
      variant={{
        pageClass:
          "min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#0f766e_34%,#082f49_100%)] text-white",
        shellClass:
          "overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/78 shadow-[0_30px_88px_rgba(8,47,73,0.56)] backdrop-blur-xl",
        titleClass:
          "max-w-4xl text-5xl font-black leading-[0.92] tracking-tight text-emerald-50 sm:text-6xl lg:text-7xl [font-family:'Arial_Black','Gill_Sans',sans-serif]",
        titleStyle: { color: "#ecfdf5" },
        mutedClass: "text-teal-50",
        heroPanelClass: "bg-[linear-gradient(145deg,#082f49_0%,#0f766e_55%,#34d399_100%)]",
        chipClass:
          "inline-flex items-center rounded-full border border-emerald-200/20 bg-emerald-300/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-50",
        navShellClass:
          "rounded-[24px] border border-white/10 bg-slate-950/70 px-2 py-2 shadow-[0_14px_36px_rgba(8,47,73,0.3)] backdrop-blur",
        navActiveClass:
          "rounded-full bg-emerald-300 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950",
        navIdleClass:
          "rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-50 transition hover:border-emerald-200/30 hover:text-white",
        navFadeClass: "rgba(8,47,73,0.9)",
        summaryCardClass:
          "rounded-[24px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur",
        sectionClass:
          "rounded-[30px] border border-white/10 bg-slate-900/68 px-5 py-5 shadow-[0_16px_38px_rgba(8,47,73,0.28)] backdrop-blur",
        sectionTitleClass: "text-emerald-50",
        sectionTitleStyle: { color: "#ecfdf5" },
        sectionMutedClass: "bg-emerald-300/15 text-emerald-50",
        primaryButtonClass:
          "rounded-full bg-emerald-300 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-emerald-200",
        secondaryButtonClass:
          "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/12",
      }}
    />
  );
}
