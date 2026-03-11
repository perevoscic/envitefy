"use client";

import type { CSSProperties } from "react";
import { GymMeetTemplateId } from "./types";

export type ShowcaseThemeId = Extract<
  GymMeetTemplateId,
  | "cyber-athlete"
  | "paper-proto"
  | "sunset-arena"
  | "pop-art"
  | "swiss-grid"
  | "art-deco"
  | "concrete-gym"
  | "midnight-frost"
  | "eco-motion"
  | "holo-elite"
  | "glitch-sport"
  | "organic-flow"
  | "pixel-arena"
  | "architect-clean"
  | "noir-silhouette"
  | "vaporwave-grid"
  | "heavy-impact"
  | "blueprint-tech"
  | "toxic-kinetic"
  | "luxe-magazine"
>;

export type ShowcaseThemeConfig = {
  id: ShowcaseThemeId;
  name: string;
  pageClass: string;
  shellClass: string;
  headerClass: string;
  headerOverlayClass: string;
  titleClass: string;
  titleStyle?: CSSProperties;
  subtitleClass: string;
  metaClass: string;
  heroBadgeClass: string;
  navShellClass: string;
  navActiveClass: string;
  navIdleClass: string;
  panelClass: string;
  cardClass: string;
  summaryCardClass: string;
  sectionClass: string;
  sectionTitleClass?: string;
  sectionTitleStyle?: CSSProperties;
  sectionCardClass: string;
  sectionMutedClass: string;
  accentClass: string;
  ctaPrimaryClass: string;
  ctaSecondaryClass: string;
  headerAlign?: "left" | "center";
  heroDecor?:
    | "grid"
    | "paper"
    | "spotlight"
    | "burst"
    | "swiss"
    | "deco"
    | "concrete"
    | "frost"
    | "organic"
    | "holo"
    | "glitch"
    | "pixel"
    | "architect"
    | "noir"
    | "vaporwave"
    | "blueprint"
    | "toxic";
  cardRadiusMode?: "soft" | "sharp";
  navRadiusMode?: "pill" | "sharp";
};

export const SHOWCASE_THEME_ORDER: ShowcaseThemeId[] = [
  "cyber-athlete",
  "paper-proto",
  "sunset-arena",
  "pop-art",
  "swiss-grid",
  "art-deco",
  "concrete-gym",
  "midnight-frost",
  "eco-motion",
  "holo-elite",
  "glitch-sport",
  "organic-flow",
  "pixel-arena",
  "architect-clean",
  "noir-silhouette",
  "vaporwave-grid",
  "heavy-impact",
  "blueprint-tech",
  "toxic-kinetic",
  "luxe-magazine",
];

export const SHOWCASE_THEMES: Record<ShowcaseThemeId, ShowcaseThemeConfig> = {
  "cyber-athlete": {
    id: "cyber-athlete",
    name: "Cyber Athlete",
    pageClass:
      "min-h-screen bg-[radial-gradient(circle_at_top,#0e7490_0%,#020617_38%,#000000_100%)] text-cyan-50",
    shellClass:
      "overflow-hidden rounded-[30px] border border-cyan-400/20 bg-black/80 shadow-[0_32px_90px_rgba(6,182,212,0.16)] backdrop-blur",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(135deg,#020617_0%,#000000_40%,#083344_100%)] px-5 py-10 sm:px-8 sm:py-14",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_32%)]",
    titleClass:
      "max-w-5xl text-5xl font-black uppercase italic leading-[0.88] tracking-[-0.04em] text-cyan-100 sm:text-6xl lg:text-8xl [font-family:'Orbitron','Rajdhani',sans-serif]",
    titleStyle: { color: "#ecfeff" },
    subtitleClass: "text-cyan-100/80",
    metaClass: "text-cyan-100/80",
    heroBadgeClass:
      "inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100",
    navShellClass:
      "rounded-none border border-cyan-400/20 bg-black/88 px-2 py-2 shadow-[0_18px_40px_rgba(6,182,212,0.12)] backdrop-blur",
    navActiveClass:
      "rounded-none bg-cyan-400 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black",
    navIdleClass:
      "rounded-none border border-cyan-400/20 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/70 transition hover:border-cyan-300/40 hover:text-cyan-50",
    panelClass:
      "rounded-none border border-cyan-400/20 bg-black/70 px-5 py-5 shadow-[0_18px_50px_rgba(6,182,212,0.08)]",
    cardClass:
      "rounded-none border border-cyan-400/20 bg-cyan-400/5 px-4 py-4",
    summaryCardClass:
      "rounded-none border border-cyan-400/20 bg-cyan-400/5 px-4 py-4",
    sectionClass:
      "rounded-none border border-cyan-400/20 bg-black/72 px-5 py-5 shadow-[0_18px_44px_rgba(6,182,212,0.08)]",
    sectionTitleClass: "text-cyan-50",
    sectionTitleStyle: { color: "#ecfeff" },
    sectionCardClass:
      "rounded-none border border-cyan-400/20 bg-cyan-400/5 px-4 py-4",
    sectionMutedClass: "bg-cyan-400/15 text-cyan-100",
    accentClass: "text-cyan-300",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-cyan-300",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-50 transition hover:bg-cyan-400/10",
    headerAlign: "left",
    heroDecor: "grid",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "paper-proto": {
    id: "paper-proto",
    name: "Paper Proto",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#f5f5f4_0%,#fafaf9_52%,#e7e5e4_100%)] text-stone-900",
    shellClass:
      "overflow-hidden rounded-[22px] border-2 border-stone-900 bg-[#fffdf8] shadow-[10px_10px_0px_#1c1917]",
    headerClass:
      "relative overflow-hidden border-b-2 border-stone-900 bg-[linear-gradient(180deg,#fffdf8_0%,#f5f5f4_100%)] px-5 py-10 sm:px-8 sm:py-14",
    headerOverlayClass:
      "bg-[linear-gradient(rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.04)_1px,transparent_1px)] bg-[size:22px_22px]",
    titleClass:
      "max-w-5xl text-5xl font-black italic leading-[0.92] tracking-[-0.04em] text-stone-900 sm:text-6xl lg:text-7xl [font-family:'Playfair_Display',Georgia,serif]",
    subtitleClass: "text-stone-700",
    metaClass: "text-stone-700",
    heroBadgeClass:
      "inline-flex items-center rounded-none border-2 border-stone-900 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-stone-900",
    navShellClass:
      "rounded-none border-2 border-stone-900 bg-[#fffdf8] px-2 py-2 shadow-[6px_6px_0px_#1c1917]",
    navActiveClass:
      "rounded-none bg-stone-900 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-none border-2 border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-stone-700 transition hover:border-stone-900 hover:bg-stone-100",
    panelClass:
      "rounded-[12px] border-2 border-stone-900 bg-white px-5 py-5 shadow-[6px_6px_0px_#1c1917]",
    cardClass:
      "rounded-[12px] border-2 border-stone-900 bg-[#fffdf8] px-4 py-4 shadow-[4px_4px_0px_#44403c]",
    summaryCardClass:
      "rounded-[12px] border-2 border-stone-900 bg-white px-4 py-4 shadow-[4px_4px_0px_#1c1917]",
    sectionClass:
      "rounded-[12px] border-2 border-stone-900 bg-white px-5 py-5 shadow-[8px_8px_0px_#1c1917]",
    sectionCardClass:
      "rounded-[12px] border-2 border-stone-900 bg-[#fffdf8] px-4 py-4 shadow-[4px_4px_0px_#57534e]",
    sectionMutedClass: "bg-stone-900 text-white",
    accentClass: "text-stone-900",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border-2 border-stone-900 bg-stone-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-700",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border-2 border-stone-900 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-stone-900 transition hover:bg-stone-100",
    headerAlign: "left",
    heroDecor: "paper",
    cardRadiusMode: "soft",
    navRadiusMode: "sharp",
  },
  "sunset-arena": {
    id: "sunset-arena",
    name: "Sunset Arena",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fffbeb_48%,#fffdfa_100%)] text-stone-900",
    shellClass:
      "overflow-hidden rounded-[38px] border border-amber-100 bg-white/95 shadow-[0_30px_90px_rgba(180,83,9,0.14)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#1c1917_0%,#78350f_42%,#f59e0b_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.28),transparent_36%)]",
    titleClass:
      "max-w-5xl text-5xl font-black italic leading-[0.88] tracking-[-0.04em] text-white sm:text-6xl lg:text-8xl [font-family:'Cormorant_Garamond',Georgia,serif]",
    titleStyle: { color: "#fffbeb" },
    subtitleClass: "text-amber-100",
    metaClass: "text-amber-100/85",
    heroBadgeClass:
      "inline-flex items-center rounded-full border border-amber-200/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-50",
    navShellClass:
      "rounded-full border border-amber-100 bg-white/88 px-2 py-2 shadow-[0_16px_40px_rgba(180,83,9,0.12)] backdrop-blur",
    navActiveClass:
      "rounded-full bg-amber-500 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-stone-950",
    navIdleClass:
      "rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-stone-600 transition hover:bg-amber-50 hover:text-stone-900",
    panelClass:
      "rounded-[32px] border border-amber-100 bg-white px-5 py-5 shadow-[0_16px_46px_rgba(180,83,9,0.1)]",
    cardClass:
      "rounded-[28px] border border-amber-100 bg-amber-50/60 px-4 py-4",
    summaryCardClass:
      "rounded-[28px] border border-amber-100 bg-white/80 px-4 py-4 shadow-sm",
    sectionClass:
      "rounded-[32px] border border-amber-100 bg-white px-5 py-5 shadow-[0_16px_46px_rgba(180,83,9,0.1)]",
    sectionTitleClass: "text-amber-800",
    sectionTitleStyle: { color: "#b45309" },
    sectionCardClass:
      "rounded-[26px] border border-amber-100 bg-amber-50/60 px-4 py-4",
    sectionMutedClass: "bg-amber-100 text-amber-900",
    accentClass: "text-amber-700",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-50 transition hover:bg-stone-800",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-stone-700 transition hover:bg-amber-50",
    headerAlign: "center",
    heroDecor: "spotlight",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  },
  "pop-art": {
    id: "pop-art",
    name: "Pop Art",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#fde047_0%,#facc15_58%,#fff7ed_100%)] text-slate-950",
    shellClass:
      "overflow-hidden border-[6px] border-black bg-white shadow-[16px_16px_0px_#000000]",
    headerClass:
      "relative overflow-hidden bg-black px-5 py-10 sm:px-8 sm:py-14",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.34),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.2),transparent_24%),radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:auto,auto,14px_14px]",
    titleClass:
      "max-w-5xl text-5xl font-black uppercase italic leading-[0.86] tracking-[-0.05em] text-white sm:text-6xl lg:text-8xl [font-family:'Archivo_Black','Arial_Black',sans-serif]",
    titleStyle: { color: "#fff7ed" },
    subtitleClass: "text-yellow-300",
    metaClass: "text-white/85",
    heroBadgeClass:
      "inline-flex items-center border-[3px] border-black bg-yellow-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black",
    navShellClass:
      "border-[4px] border-black bg-white px-2 py-2 shadow-[10px_10px_0px_#000000]",
    navActiveClass:
      "bg-black px-4 py-3 text-[11px] font-black uppercase italic tracking-[0.18em] text-yellow-300",
    navIdleClass:
      "border-[3px] border-transparent px-4 py-3 text-[11px] font-black uppercase italic tracking-[0.18em] text-slate-900 transition hover:border-black hover:bg-yellow-100",
    panelClass:
      "border-[4px] border-black bg-white px-5 py-5 shadow-[10px_10px_0px_#000000]",
    cardClass:
      "border-[3px] border-black bg-[#fff9c4] px-4 py-4 shadow-[6px_6px_0px_#000000]",
    summaryCardClass:
      "border-[3px] border-black bg-white px-4 py-4 shadow-[6px_6px_0px_#000000]",
    sectionClass:
      "border-[4px] border-black bg-white px-5 py-5 shadow-[10px_10px_0px_#000000]",
    sectionTitleClass: "text-red-700",
    sectionTitleStyle: { color: "#c2410c" },
    sectionCardClass:
      "border-[3px] border-black bg-[#fef3c7] px-4 py-4 shadow-[6px_6px_0px_#000000]",
    sectionMutedClass: "bg-black text-yellow-300",
    accentClass: "text-red-600",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 border-[3px] border-black bg-red-500 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-red-400",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 border-[3px] border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-yellow-100",
    headerAlign: "left",
    heroDecor: "burst",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "swiss-grid": {
    id: "swiss-grid",
    name: "Swiss Grid",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_50%,#fef2f2_100%)] text-black",
    shellClass:
      "overflow-hidden border border-black bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]",
    headerClass:
      "relative overflow-hidden border-b-[10px] border-red-600 bg-white px-5 py-10 sm:px-8 sm:py-14",
    headerOverlayClass:
      "bg-[linear-gradient(90deg,rgba(220,38,38,0.1)_0,rgba(220,38,38,0.1)_20%,transparent_20%,transparent_100%),linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:100%_100%,28px_28px,28px_28px]",
    titleClass:
      "max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.07em] text-black sm:text-6xl lg:text-8xl [font-family:'Helvetica_Neue','Arial',sans-serif]",
    subtitleClass: "text-red-600",
    metaClass: "text-slate-700",
    heroBadgeClass:
      "inline-flex items-center bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white",
    navShellClass: "border border-black bg-white px-2 py-2",
    navActiveClass:
      "bg-red-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white",
    navIdleClass:
      "px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100 hover:text-black",
    panelClass: "border border-black bg-white px-5 py-5",
    cardClass: "border border-black bg-slate-50 px-4 py-4",
    summaryCardClass: "border border-black bg-white px-4 py-4",
    sectionClass: "border border-black bg-white px-5 py-5",
    sectionCardClass: "border border-black bg-slate-50 px-4 py-4",
    sectionMutedClass: "bg-red-600 text-white",
    accentClass: "text-red-600",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-slate-100",
    headerAlign: "left",
    heroDecor: "swiss",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "art-deco": {
    id: "art-deco",
    name: "Art Deco",
    pageClass:
      "min-h-screen bg-[radial-gradient(circle_at_top,#111827_0%,#050505_46%,#000000_100%)] text-[#f8e8b0]",
    shellClass:
      "overflow-hidden border border-[#d4af37]/30 bg-[#111111] shadow-[0_32px_90px_rgba(0,0,0,0.45)]",
    headerClass:
      "relative overflow-hidden border-b border-[#d4af37]/50 bg-[linear-gradient(145deg,#000000_0%,#111111_46%,#3f2f0d_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[linear-gradient(135deg,transparent_0,transparent_48%,rgba(212,175,55,0.18)_48%,rgba(212,175,55,0.18)_52%,transparent_52%,transparent_100%),radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_30%)]",
    titleClass:
      "max-w-5xl text-5xl font-medium uppercase leading-[0.9] tracking-[0.08em] text-[#d4af37] sm:text-6xl lg:text-8xl [font-family:'Cormorant_Garamond',Georgia,serif]",
    titleStyle: { color: "#f8e8b0" },
    subtitleClass: "text-white/85",
    metaClass: "text-[#f8e8b0]/85",
    heroBadgeClass:
      "inline-flex items-center border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#f8e8b0]",
    navShellClass:
      "border border-[#d4af37]/30 bg-black/70 px-2 py-2 backdrop-blur",
    navActiveClass:
      "bg-[#d4af37] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black",
    navIdleClass:
      "border border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#f8e8b0]/70 transition hover:border-[#d4af37]/40 hover:text-[#f8e8b0]",
    panelClass:
      "border border-[#d4af37]/24 bg-[#141414] px-5 py-5 shadow-[0_16px_42px_rgba(0,0,0,0.3)]",
    cardClass:
      "border border-[#d4af37]/24 bg-[#1b1b1b] px-4 py-4",
    summaryCardClass:
      "border border-[#d4af37]/24 bg-[#151515] px-4 py-4",
    sectionClass:
      "border border-[#d4af37]/24 bg-[#141414] px-5 py-5 shadow-[0_16px_42px_rgba(0,0,0,0.3)]",
    sectionTitleClass: "text-[#f8e8b0]",
    sectionTitleStyle: { color: "#f8e8b0" },
    sectionCardClass:
      "border border-[#d4af37]/24 bg-[#1b1b1b] px-4 py-4",
    sectionMutedClass: "bg-[#d4af37]/15 text-[#f8e8b0]",
    accentClass: "text-[#d4af37]",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 bg-[#d4af37] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-[#e2c86d]",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f8e8b0] transition hover:bg-[#d4af37]/16",
    headerAlign: "center",
    heroDecor: "deco",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "concrete-gym": {
    id: "concrete-gym",
    name: "Concrete Gym",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#d4d4d8_0%,#e4e4e7_55%,#f4f4f5_100%)] text-zinc-900",
    shellClass:
      "overflow-hidden border-l-[10px] border-zinc-900 bg-zinc-200 shadow-[0_24px_70px_rgba(39,39,42,0.18)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#3f3f46_0%,#52525b_42%,#18181b_100%)] px-5 py-10 sm:px-8 sm:py-14",
    headerOverlayClass:
      "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[size:28px_28px]",
    titleClass:
      "max-w-5xl text-5xl font-black uppercase italic leading-[0.88] tracking-[-0.05em] text-zinc-50 sm:text-6xl lg:text-8xl [font-family:'Kanit','Oswald',sans-serif]",
    titleStyle: { color: "#fafafa" },
    subtitleClass: "text-zinc-200",
    metaClass: "text-zinc-200/80",
    heroBadgeClass:
      "inline-flex items-center rounded-none bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900",
    navShellClass:
      "rounded-none bg-zinc-900 px-2 py-2 shadow-[0_14px_32px_rgba(24,24,27,0.18)]",
    navActiveClass:
      "rounded-none bg-zinc-100 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-900",
    navIdleClass:
      "rounded-none border-l-4 border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-100 hover:text-white",
    panelClass:
      "rounded-none border-l-[8px] border-zinc-900 bg-zinc-100 px-5 py-5 shadow-[0_12px_28px_rgba(63,63,70,0.1)]",
    cardClass:
      "rounded-none border-l-[6px] border-zinc-700 bg-zinc-200 px-4 py-4",
    summaryCardClass:
      "rounded-none border-l-[6px] border-zinc-700 bg-zinc-100 px-4 py-4",
    sectionClass:
      "rounded-none border-l-[8px] border-zinc-900 bg-zinc-100 px-5 py-5 shadow-[0_12px_28px_rgba(63,63,70,0.1)]",
    sectionTitleClass: "text-zinc-600",
    sectionTitleStyle: { color: "#52525b" },
    sectionCardClass:
      "rounded-none border-l-[6px] border-zinc-700 bg-zinc-200 px-4 py-4",
    sectionMutedClass: "bg-zinc-900 text-zinc-100",
    accentClass: "text-zinc-900",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-zinc-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-100 transition hover:bg-black",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-zinc-900 bg-zinc-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-900 transition hover:bg-zinc-200",
    headerAlign: "left",
    heroDecor: "concrete",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "midnight-frost": {
    id: "midnight-frost",
    name: "Midnight Frost",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#020617_0%,#111827_42%,#1e1b4b_100%)] text-indigo-50",
    shellClass:
      "overflow-hidden rounded-[34px] border border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(2,6,23,0.36)] backdrop-blur-xl",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#020617_0%,#1e1b4b_52%,#1d4ed8_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]",
    titleClass:
      "max-w-5xl text-5xl font-black leading-[0.88] tracking-[-0.05em] text-transparent sm:text-6xl lg:text-8xl [font-family:'League_Spartan','Montserrat',sans-serif] bg-[linear-gradient(180deg,#ffffff_0%,#c7d2fe_70%,#60a5fa_100%)] bg-clip-text",
    titleStyle: { color: "#eef2ff" },
    subtitleClass: "text-indigo-100/85",
    metaClass: "text-indigo-100/80",
    heroBadgeClass:
      "inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-50 backdrop-blur",
    navShellClass:
      "rounded-[24px] border border-white/10 bg-indigo-950/40 px-2 py-2 backdrop-blur-xl",
    navActiveClass:
      "rounded-full bg-white text-indigo-950 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em]",
    navIdleClass:
      "rounded-full border border-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-100/70 transition hover:border-white/20 hover:text-white",
    panelClass:
      "rounded-[28px] border border-white/10 bg-white/6 px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur-xl",
    cardClass:
      "rounded-[24px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur",
    summaryCardClass:
      "rounded-[24px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur",
    sectionClass:
      "rounded-[28px] border border-white/10 bg-white/6 px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.22)] backdrop-blur-xl",
    sectionTitleClass: "text-indigo-50",
    sectionTitleStyle: { color: "#eef2ff" },
    sectionCardClass:
      "rounded-[24px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur",
    sectionMutedClass: "bg-white/12 text-indigo-50",
    accentClass: "text-sky-200",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-950 transition hover:bg-sky-100",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-50 transition hover:bg-white/12",
    headerAlign: "center",
    heroDecor: "frost",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  },
  "eco-motion": {
    id: "eco-motion",
    name: "Eco Motion",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#ecfdf5_0%,#f0fdf4_55%,#fffbeb_100%)] text-emerald-950",
    shellClass:
      "overflow-hidden rounded-[40px] border border-emerald-100 bg-white/96 shadow-[0_28px_84px_rgba(16,185,129,0.12)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#064e3b_0%,#047857_44%,#6ee7b7_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,251,235,0.18),transparent_28%)]",
    titleClass:
      "max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.05em] text-emerald-50 sm:text-6xl lg:text-8xl [font-family:'Poppins','Montserrat',sans-serif]",
    subtitleClass: "text-emerald-100/90",
    metaClass: "text-emerald-100/85",
    heroBadgeClass:
      "inline-flex items-center rounded-full bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-50 backdrop-blur",
    navShellClass:
      "rounded-full border border-emerald-100 bg-white px-2 py-2 shadow-[0_16px_40px_rgba(16,185,129,0.1)]",
    navActiveClass:
      "rounded-full bg-emerald-900 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800 transition hover:bg-emerald-50",
    panelClass:
      "rounded-[34px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_14px_34px_rgba(16,185,129,0.08)]",
    cardClass:
      "rounded-[28px] border border-emerald-100 bg-emerald-50/70 px-4 py-4",
    summaryCardClass:
      "rounded-[28px] border border-emerald-100 bg-white px-4 py-4 shadow-sm",
    sectionClass:
      "rounded-[34px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_14px_34px_rgba(16,185,129,0.08)]",
    sectionCardClass:
      "rounded-[28px] border border-emerald-100 bg-emerald-50/70 px-4 py-4",
    sectionMutedClass: "bg-emerald-100 text-emerald-900",
    accentClass: "text-emerald-700",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full bg-emerald-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-900 transition hover:bg-emerald-50",
    headerAlign: "left",
    heroDecor: "organic",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  },
  "holo-elite": {
    id: "holo-elite",
    name: "Holo Elite",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_52%,#dbeafe_100%)] text-slate-900",
    shellClass:
      "overflow-hidden rounded-[34px] border border-blue-100 bg-white/96 shadow-[0_28px_84px_rgba(59,130,246,0.12)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#ffffff_0%,#dbeafe_40%,#bfdbfe_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.7),transparent_38%)]",
    titleClass:
      "max-w-5xl text-5xl font-black leading-[0.88] tracking-[-0.05em] text-slate-900 sm:text-6xl lg:text-8xl [font-family:'Exo_2','Montserrat',sans-serif]",
    subtitleClass: "text-blue-700",
    metaClass: "text-slate-600",
    heroBadgeClass:
      "inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 shadow-sm",
    navShellClass:
      "rounded-[24px] border border-blue-100 bg-white/92 px-2 py-2 shadow-[0_16px_40px_rgba(59,130,246,0.08)] backdrop-blur",
    navActiveClass:
      "rounded-full bg-blue-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-full border border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-100 hover:bg-blue-50",
    panelClass:
      "rounded-[30px] border border-blue-100 bg-white px-5 py-5 shadow-[0_16px_36px_rgba(59,130,246,0.08)]",
    cardClass:
      "rounded-[24px] border border-blue-100 bg-sky-50/60 px-4 py-4",
    summaryCardClass:
      "rounded-[24px] border border-blue-100 bg-white px-4 py-4 shadow-sm",
    sectionClass:
      "rounded-[30px] border border-blue-100 bg-white px-5 py-5 shadow-[0_16px_36px_rgba(59,130,246,0.08)]",
    sectionCardClass:
      "rounded-[24px] border border-blue-100 bg-sky-50/60 px-4 py-4",
    sectionMutedClass: "bg-blue-100 text-blue-900",
    accentClass: "text-blue-600",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-blue-50",
    headerAlign: "left",
    heroDecor: "holo",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  },
  "glitch-sport": {
    id: "glitch-sport",
    name: "Glitch Sport",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#020617_0%,#09090b_46%,#000000_100%)] text-cyan-100",
    shellClass:
      "overflow-hidden border border-red-500/35 bg-black/92 shadow-[0_30px_90px_rgba(239,68,68,0.18),0_0_0_1px_rgba(34,211,238,0.15)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#000000_0%,#111827_42%,#0f172a_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%)]",
    titleClass:
      "max-w-5xl text-5xl font-black uppercase italic leading-[0.82] tracking-[-0.08em] text-white sm:text-6xl lg:text-[5.8rem] [font-family:'Orbitron','Rajdhani',sans-serif]",
    titleStyle: { color: "#ffffff", textShadow: "3px 3px 0 #ef4444, -3px -3px 0 #22d3ee" },
    subtitleClass: "text-cyan-300/85",
    metaClass: "text-cyan-100/80",
    heroBadgeClass:
      "inline-flex items-center rounded-none bg-red-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white",
    navShellClass:
      "rounded-none border border-red-500/40 bg-black/92 px-2 py-2 shadow-[0_0_20px_rgba(239,68,68,0.18)] backdrop-blur",
    navActiveClass:
      "rounded-none bg-red-500 px-4 py-3 text-[11px] font-black uppercase italic tracking-[0.18em] text-white shadow-[4px_0_0_#22d3ee]",
    navIdleClass:
      "rounded-none border border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-400/60 transition hover:border-red-500/40 hover:text-cyan-100",
    panelClass:
      "rounded-none border border-red-500/28 bg-zinc-950/92 px-5 py-5 shadow-[8px_8px_0px_rgba(34,211,238,0.2)]",
    cardClass:
      "rounded-none border border-red-500/24 bg-cyan-400/5 px-4 py-4",
    summaryCardClass:
      "rounded-none border border-red-500/24 bg-zinc-900 px-4 py-4",
    sectionClass:
      "rounded-none border border-red-500/28 bg-zinc-950/92 px-5 py-5 shadow-[8px_8px_0px_rgba(34,211,238,0.18)]",
    sectionTitleClass: "text-white",
    sectionTitleStyle: { color: "#ffffff" },
    sectionCardClass:
      "rounded-none border border-red-500/24 bg-black/70 px-4 py-4",
    sectionMutedClass: "bg-red-500 text-white",
    accentClass: "text-cyan-300",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-cyan-300",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-red-500/35 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-50 transition hover:bg-red-500/10",
    headerAlign: "left",
    heroDecor: "glitch",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "organic-flow": {
    id: "organic-flow",
    name: "Organic Flow",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#ecfdf5_0%,#f0fdf4_56%,#fffbeb_100%)] text-emerald-950",
    shellClass:
      "overflow-hidden rounded-[38px] border border-emerald-100 bg-white/92 shadow-[0_28px_84px_rgba(16,185,129,0.12)] backdrop-blur",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#065f46_0%,#047857_42%,#10b981_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_34%)]",
    titleClass:
      "mx-auto max-w-5xl text-center text-5xl font-black italic leading-[0.84] tracking-[-0.05em] text-white sm:text-6xl lg:text-[5.5rem] [font-family:'Poppins','Avenir_Next',sans-serif]",
    titleStyle: { color: "#ffffff" },
    subtitleClass: "text-emerald-100/92",
    metaClass: "text-emerald-50/88",
    heroBadgeClass:
      "inline-flex items-center rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950",
    navShellClass:
      "rounded-full border border-emerald-200 bg-white/94 px-2 py-2 shadow-[0_18px_40px_rgba(16,185,129,0.12)] backdrop-blur",
    navActiveClass:
      "rounded-full bg-emerald-900 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800 transition hover:bg-emerald-50",
    panelClass:
      "rounded-[34px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_14px_36px_rgba(16,185,129,0.08)]",
    cardClass:
      "rounded-[30px] border border-emerald-100 bg-emerald-50/80 px-4 py-4",
    summaryCardClass:
      "rounded-[30px] border border-emerald-100 bg-white px-4 py-4 shadow-sm",
    sectionClass:
      "rounded-[34px] border border-emerald-100 bg-white px-5 py-5 shadow-[0_14px_36px_rgba(16,185,129,0.08)]",
    sectionTitleClass: "text-emerald-900",
    sectionTitleStyle: { color: "#064e3b" },
    sectionCardClass:
      "rounded-[30px] border border-emerald-100 bg-emerald-50/75 px-4 py-4",
    sectionMutedClass: "bg-emerald-100 text-emerald-900",
    accentClass: "text-emerald-700",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full bg-emerald-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-900 transition hover:bg-emerald-50",
    headerAlign: "center",
    heroDecor: "organic",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  },
  "pixel-arena": {
    id: "pixel-arena",
    name: "Pixel Arena",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#000000_0%,#03120a_54%,#000000_100%)] text-[#00ff41]",
    shellClass:
      "overflow-hidden border-[4px] border-[#00ff41] bg-black shadow-[12px_12px_0px_rgba(0,255,65,0.18)]",
    headerClass:
      "relative overflow-hidden border-b-[6px] border-[#00ff41] bg-black px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top,rgba(0,255,65,0.08),transparent_34%)]",
    titleClass:
      "mx-auto max-w-5xl text-center text-5xl font-black uppercase leading-[0.84] tracking-[-0.06em] text-[#00ff41] sm:text-6xl lg:text-[5.4rem] [font-family:'Press_Start_2P','Orbitron','Courier_New',monospace]",
    titleStyle: { color: "#00ff41" },
    subtitleClass: "text-[#00ff41]/80",
    metaClass: "text-[#86efac]",
    heroBadgeClass:
      "inline-flex items-center rounded-none border-2 border-[#00ff41] bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#00ff41]",
    navShellClass:
      "rounded-none border-[4px] border-[#00ff41] bg-black px-2 py-2",
    navActiveClass:
      "rounded-none bg-[#00ff41] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black",
    navIdleClass:
      "rounded-none border border-[#00ff41]/20 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#00ff41]/60 transition hover:border-[#00ff41]/55 hover:text-[#00ff41]",
    panelClass:
      "rounded-none border-[4px] border-[#00ff41] bg-black px-5 py-5 shadow-[10px_10px_0px_rgba(0,255,65,0.15)]",
    cardClass:
      "rounded-none border-[3px] border-[#00ff41] bg-black px-4 py-4",
    summaryCardClass:
      "rounded-none border-[3px] border-[#00ff41] bg-black px-4 py-4",
    sectionClass:
      "rounded-none border-[4px] border-[#00ff41] bg-black px-5 py-5 shadow-[10px_10px_0px_rgba(0,255,65,0.15)]",
    sectionTitleClass: "text-[#00ff41]",
    sectionTitleStyle: { color: "#00ff41" },
    sectionCardClass:
      "rounded-none border-[3px] border-[#00ff41] bg-black px-4 py-4",
    sectionMutedClass: "bg-[#00ff41] text-black",
    accentClass: "text-[#86efac]",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-[#00ff41] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#86efac]",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border-[2px] border-[#00ff41] bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#00ff41] transition hover:bg-[#00ff41]/10",
    headerAlign: "center",
    heroDecor: "pixel",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "architect-clean": {
    id: "architect-clean",
    name: "Structural HQ",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f5f5f5_58%,#ffffff_100%)] text-slate-800",
    shellClass:
      "overflow-hidden border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]",
    headerClass:
      "relative overflow-hidden border-b border-slate-200 bg-white px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,0.04),transparent_28%)]",
    titleClass:
      "max-w-5xl text-5xl font-light uppercase leading-[0.82] tracking-[-0.07em] text-slate-800 sm:text-6xl lg:text-[5.5rem] [font-family:'Barlow_Condensed','Helvetica_Neue',sans-serif]",
    titleStyle: { color: "#1e293b" },
    subtitleClass: "text-slate-500",
    metaClass: "text-slate-500",
    heroBadgeClass:
      "inline-flex items-center rounded-none bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white",
    navShellClass:
      "rounded-none border-y border-slate-300 bg-white px-2 py-2 shadow-none",
    navActiveClass:
      "rounded-none bg-black px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-none border border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800",
    panelClass:
      "rounded-none border border-slate-200 bg-white px-5 py-5 shadow-none",
    cardClass:
      "rounded-none border-t border-slate-200 bg-slate-50 px-4 py-4",
    summaryCardClass:
      "rounded-none border-t border-slate-200 bg-white px-4 py-4",
    sectionClass:
      "rounded-none border border-slate-200 bg-white px-5 py-5 shadow-none",
    sectionTitleClass: "text-slate-800",
    sectionTitleStyle: { color: "#1e293b" },
    sectionCardClass:
      "rounded-none border-t border-slate-200 bg-slate-50 px-4 py-4",
    sectionMutedClass: "bg-slate-900 text-white",
    accentClass: "text-slate-500",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-700",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-slate-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50",
    headerAlign: "left",
    heroDecor: "architect",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "noir-silhouette": {
    id: "noir-silhouette",
    name: "Noir Silhouette",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_44%,#ffffff_100%)] text-black",
    shellClass:
      "overflow-hidden border border-black bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]",
    headerClass:
      "relative overflow-hidden bg-black px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%)]",
    titleClass:
      "mx-auto max-w-5xl text-center text-6xl font-black uppercase leading-[0.78] tracking-[-0.08em] text-white sm:text-7xl lg:text-[6.2rem] [font-family:'League_Spartan','Arial_Black',sans-serif]",
    titleStyle: { color: "#ffffff" },
    subtitleClass: "text-white/72",
    metaClass: "text-white/76",
    heroBadgeClass:
      "inline-flex items-center rounded-none bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black",
    navShellClass:
      "rounded-none border-y border-black bg-black px-2 py-2",
    navActiveClass:
      "rounded-none bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black",
    navIdleClass:
      "rounded-none border border-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/70 transition hover:border-white/30 hover:text-white",
    panelClass:
      "rounded-none border-b-[6px] border-black bg-white px-5 py-5",
    cardClass:
      "rounded-none border border-black bg-black px-4 py-4 text-white",
    summaryCardClass:
      "rounded-none border border-black bg-white px-4 py-4",
    sectionClass:
      "rounded-none border-b-[6px] border-black bg-white px-5 py-5",
    sectionTitleClass: "text-black",
    sectionTitleStyle: { color: "#000000" },
    sectionCardClass:
      "rounded-none border border-black bg-white px-4 py-4",
    sectionMutedClass: "bg-black text-white",
    accentClass: "text-zinc-500",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-slate-100",
    headerAlign: "center",
    heroDecor: "noir",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "vaporwave-grid": {
    id: "vaporwave-grid",
    name: "Vector Vapor",
    pageClass:
      "min-h-screen bg-[radial-gradient(circle_at_top,#4c1d95_0%,#2d0a4e_34%,#140420_100%)] text-[#f5d0fe]",
    shellClass:
      "overflow-hidden border border-cyan-300/35 bg-[#18042d]/94 shadow-[0_28px_90px_rgba(34,211,238,0.18),0_0_0_1px_rgba(244,114,182,0.18)] backdrop-blur",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#2d0a4e_0%,#1a0633_46%,#520091_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_34%)]",
    titleClass:
      "max-w-5xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.05em] text-[#67e8f9] sm:text-6xl lg:text-8xl [font-family:'Orbitron','Rajdhani',sans-serif]",
    titleStyle: { color: "#67e8f9" },
    subtitleClass: "text-fuchsia-200/90",
    metaClass: "text-violet-100/82",
    heroBadgeClass:
      "inline-flex items-center rounded-none border border-cyan-300/45 bg-fuchsia-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100",
    navShellClass:
      "rounded-none border-2 border-cyan-300/55 bg-fuchsia-600/75 px-2 py-2 shadow-[0_16px_40px_rgba(244,114,182,0.22)]",
    navActiveClass:
      "rounded-none bg-cyan-300 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black",
    navIdleClass:
      "rounded-none border border-cyan-300/25 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/82 transition hover:border-cyan-200/60 hover:text-white",
    panelClass:
      "rounded-none border border-fuchsia-400/28 bg-[#22053d]/86 px-5 py-5 shadow-[0_16px_42px_rgba(168,85,247,0.18)]",
    cardClass:
      "rounded-none border border-cyan-300/25 bg-fuchsia-500/8 px-4 py-4",
    summaryCardClass:
      "rounded-none border border-cyan-300/25 bg-cyan-300/8 px-4 py-4",
    sectionClass:
      "rounded-none border border-fuchsia-400/28 bg-[#22053d]/88 px-5 py-5 shadow-[0_16px_42px_rgba(168,85,247,0.18)]",
    sectionTitleClass: "text-cyan-100",
    sectionTitleStyle: { color: "#cffafe" },
    sectionCardClass:
      "rounded-none border border-cyan-300/25 bg-[#2b0b4a] px-4 py-4",
    sectionMutedClass: "bg-cyan-300 text-black",
    accentClass: "text-fuchsia-300",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-cyan-300 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-cyan-200",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-cyan-300/45 bg-fuchsia-500/8 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-50 transition hover:bg-cyan-300/10",
    headerAlign: "center",
    heroDecor: "vaporwave",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "heavy-impact": {
    id: "heavy-impact",
    name: "Heavy Impact",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#fde047_0%,#facc15_52%,#fef08a_100%)] text-black",
    shellClass:
      "overflow-hidden border-[8px] border-black bg-white shadow-[20px_20px_0px_#000000]",
    headerClass:
      "relative overflow-hidden bg-black px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_50%)]",
    titleClass:
      "max-w-5xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.06em] text-yellow-300 sm:text-7xl lg:text-[5.5rem] [font-family:'Archivo_Black','Arial_Black',sans-serif]",
    titleStyle: { color: "#fde047" },
    subtitleClass: "text-white/82",
    metaClass: "text-white/78",
    heroBadgeClass:
      "inline-flex items-center rounded-none bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black",
    navShellClass:
      "rounded-none border-y-[6px] border-yellow-300 bg-black px-2 py-2",
    navActiveClass:
      "rounded-none bg-yellow-300 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black",
    navIdleClass:
      "rounded-none border border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:border-yellow-300 hover:text-yellow-200",
    panelClass:
      "rounded-none border-[4px] border-black bg-white px-5 py-5 shadow-[10px_10px_0px_#000000]",
    cardClass:
      "rounded-none border-[3px] border-black bg-yellow-100 px-4 py-4 shadow-[6px_6px_0px_#000000]",
    summaryCardClass:
      "rounded-none border-[3px] border-black bg-white px-4 py-4 shadow-[6px_6px_0px_#000000]",
    sectionClass:
      "rounded-none border-[4px] border-black bg-white px-5 py-5 shadow-[10px_10px_0px_#000000]",
    sectionTitleClass: "text-black",
    sectionTitleStyle: { color: "#000000" },
    sectionCardClass:
      "rounded-none border-[3px] border-black bg-yellow-50 px-4 py-4 shadow-[6px_6px_0px_#000000]",
    sectionMutedClass: "bg-black text-yellow-300",
    accentClass: "text-black",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border-[3px] border-black bg-yellow-300 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-yellow-200",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border-[3px] border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-yellow-50",
    headerAlign: "left",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "blueprint-tech": {
    id: "blueprint-tech",
    name: "Tech Blueprint",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#002447_0%,#003366_48%,#0a4a7a_100%)] text-white",
    shellClass:
      "overflow-hidden border border-white/35 bg-[#002a52]/92 shadow-[0_28px_84px_rgba(0,0,0,0.28)]",
    headerClass:
      "relative overflow-hidden border-b border-white/30 bg-[linear-gradient(145deg,#003366_0%,#0a4a7a_52%,#1e3a8a_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:18px_18px]",
    titleClass:
      "max-w-5xl text-5xl font-bold uppercase leading-[0.88] tracking-[0.02em] text-white sm:text-6xl lg:text-8xl [font-family:'IBM_Plex_Mono','Courier_New',monospace]",
    titleStyle: { color: "#ffffff" },
    subtitleClass: "text-blue-100/88",
    metaClass: "text-white/78",
    heroBadgeClass:
      "inline-flex items-center rounded-none border border-white/50 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white",
    navShellClass:
      "rounded-none border border-white/45 bg-[#003366] px-2 py-2",
    navActiveClass:
      "rounded-none bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#003366]",
    navIdleClass:
      "rounded-none border border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/65 transition hover:border-white/35 hover:text-white",
    panelClass:
      "rounded-none border border-dashed border-white/45 bg-white/5 px-5 py-5",
    cardClass:
      "rounded-none border border-dashed border-white/38 bg-white/5 px-4 py-4",
    summaryCardClass:
      "rounded-none border border-dashed border-white/45 bg-white/6 px-4 py-4",
    sectionClass:
      "rounded-none border border-dashed border-white/45 bg-white/5 px-5 py-5",
    sectionTitleClass: "text-white",
    sectionTitleStyle: { color: "#ffffff" },
    sectionCardClass:
      "rounded-none border border-dashed border-white/38 bg-[#0b3b64] px-4 py-4",
    sectionMutedClass: "bg-white text-[#003366]",
    accentClass: "text-blue-100",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#003366] transition hover:bg-blue-50",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-white/50 bg-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10",
    headerAlign: "center",
    heroDecor: "blueprint",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "toxic-kinetic": {
    id: "toxic-kinetic",
    name: "Toxic Kinetic",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#000000_0%,#09090b_54%,#111827_100%)] text-lime-300",
    shellClass:
      "overflow-hidden border border-lime-400/35 bg-zinc-950 shadow-[0_28px_84px_rgba(132,204,22,0.14)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#000000_0%,#111827_50%,#14532d_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.16),transparent_30%)]",
    titleClass:
      "max-w-5xl text-5xl font-black uppercase italic leading-[0.84] tracking-[-0.06em] text-lime-400 sm:text-6xl lg:text-8xl [font-family:'Kanit','Oswald',sans-serif] [-skew-x-6]",
    titleStyle: { color: "#a3e635" },
    subtitleClass: "text-lime-200/78",
    metaClass: "text-lime-100/70",
    heroBadgeClass:
      "inline-flex items-center rounded-none border border-lime-400/40 bg-lime-400/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-lime-200",
    navShellClass:
      "rounded-none border-y-2 border-lime-400/65 bg-black px-2 py-2",
    navActiveClass:
      "rounded-none bg-lime-400 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black [-skew-x-6]",
    navIdleClass:
      "rounded-none border border-transparent px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-lime-200/62 transition hover:border-lime-400/35 hover:text-lime-100",
    panelClass:
      "rounded-none border border-lime-400/28 bg-zinc-950 px-5 py-5 shadow-[0_16px_42px_rgba(10,10,10,0.3)]",
    cardClass:
      "rounded-none border border-lime-400/25 bg-zinc-900 px-4 py-4",
    summaryCardClass:
      "rounded-none border border-lime-400/25 bg-black px-4 py-4",
    sectionClass:
      "rounded-none border border-lime-400/28 bg-zinc-950 px-5 py-5 shadow-[0_16px_42px_rgba(10,10,10,0.3)]",
    sectionTitleClass: "text-lime-300",
    sectionTitleStyle: { color: "#bef264" },
    sectionCardClass:
      "rounded-none border border-lime-400/24 bg-zinc-900 px-4 py-4",
    sectionMutedClass: "bg-lime-400 text-black",
    accentClass: "text-lime-300",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-lime-400 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-lime-300",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-lime-400/45 bg-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-lime-200 transition hover:bg-lime-400/10",
    headerAlign: "left",
    heroDecor: "toxic",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
  "luxe-magazine": {
    id: "luxe-magazine",
    name: "Luxe Editorial",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fafaf9_56%,#f5f5f4_100%)] text-black",
    shellClass:
      "overflow-hidden border-b border-black bg-white shadow-[0_18px_46px_rgba(0,0,0,0.06)]",
    headerClass:
      "relative overflow-hidden bg-white px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass: "bg-transparent",
    titleClass:
      "max-w-5xl text-5xl font-light leading-[0.92] tracking-[-0.04em] text-black sm:text-6xl lg:text-8xl [font-family:'Cormorant_Garamond',Georgia,serif]",
    titleStyle: { color: "#000000" },
    subtitleClass: "text-zinc-500",
    metaClass: "text-zinc-600",
    heroBadgeClass:
      "inline-flex items-center rounded-none border-b border-black px-0 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-black",
    navShellClass:
      "rounded-none border-y border-black bg-white px-2 py-2",
    navActiveClass:
      "rounded-none bg-black px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-none border border-transparent px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 transition hover:border-black hover:text-black",
    panelClass:
      "rounded-none border-b border-black bg-white px-5 py-5",
    cardClass:
      "rounded-none border-b border-black bg-white px-4 py-4",
    summaryCardClass:
      "rounded-none border-b border-black bg-white px-4 py-4",
    sectionClass:
      "rounded-none border-b border-black bg-white px-5 py-5",
    sectionTitleClass: "text-black",
    sectionTitleStyle: { color: "#000000" },
    sectionCardClass:
      "rounded-none border-b border-black bg-white px-4 py-4",
    sectionMutedClass: "bg-black text-white",
    accentClass: "text-zinc-500",
    ctaPrimaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800",
    ctaSecondaryClass:
      "inline-flex items-center justify-center gap-2 rounded-none border border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-zinc-50",
    headerAlign: "left",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  },
};
