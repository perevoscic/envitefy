// @ts-nocheck
import type { CSSProperties } from "react";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  getGymMeetTemplateMeta,
} from "@/components/gym-meet-templates/registry";
import {
  SHOWCASE_THEMES,
  type ShowcaseThemeConfig,
} from "@/components/gym-meet-templates/showcaseThemes";
import { getGymMeetTitleTypography } from "@/components/gym-meet-templates/titleTypography";
import type { GymMeetTitleTypographySpec } from "@/components/gym-meet-templates/titleTypography";
import type { GymMeetTemplateId } from "@/components/gym-meet-templates/types";

export type FootballSeasonTemplateTheme = {
  id: GymMeetTemplateId;
  name: string;
  pageClass: string;
  shellClass: string;
  headerClass: string;
  headerOverlayClass: string;
  titleClass: string;
  titleStyle?: CSSProperties;
  textClass: string;
  mutedClass: string;
  accentClass: string;
  heroBadgeClass: string;
  navShellClass: string;
  navActiveClass: string;
  navIdleClass: string;
  sectionClass: string;
  sectionCardClass: string;
  summaryCardClass: string;
  sectionMutedClass: string;
  sectionTitleClass: string;
  sectionTitleStyle?: CSSProperties;
  titleTypography: GymMeetTitleTypographySpec;
  isDark: boolean;
};

const extractTextClass = (className: string, fallback = "text-slate-900") => {
  const match = String(className || "").match(
    /(?:^|\s)(text-\[[^\]]+\]|text-[a-z-]+(?:-\d{2,3})?|text-white|text-black)(?=\s|$)/
  );
  return match?.[1] || fallback;
};

const isDarkTextClass = (className: string) =>
  /text-(white|amber-50|cyan-50|indigo-50|emerald-50|sky-50|slate-50|stone-50|neutral-50|zinc-50|gray-50)/.test(
    className
  ) ||
  (/^text-\[#([0-9a-f]{6})\]$/i.test(className) &&
    (() => {
      const hex = className.match(/^text-\[#([0-9a-f]{6})\]$/i)?.[1];
      if (!hex) return false;
      const n = parseInt(hex, 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      const [rr, gg, bb] = [r, g, b].map((value) => {
        const channel = value / 255;
        return channel <= 0.03928
          ? channel / 12.92
          : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      const luminance = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
      return luminance < 0.58;
    })());

const FALLBACK_SHOWCASE_THEME: ShowcaseThemeConfig = {
  id: "launchpad-editorial",
  name: "Launchpad Editorial",
  pageClass:
    "min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f3f5fb_0%,#edf1f8_42%,#f6f8fc_100%)] text-[#1f2438] selection:bg-[#d9e7ff] selection:text-[#13213f]",
  shellClass:
    "overflow-hidden rounded-[2.8rem] border border-white/80 bg-[linear-gradient(160deg,#fff_0%,#f8f7ff_55%,#eef6ff_100%)] shadow-[0_34px_90px_rgba(118,130,162,0.18)]",
  headerClass:
    "relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8f7ff_55%,#eef6ff_100%)] px-5 py-12 sm:px-8 sm:py-16",
  headerOverlayClass:
    "bg-[radial-gradient(circle_at_top_left,rgba(124,140,247,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,167,200,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(150,213,255,0.12),transparent_24%)]",
  titleClass:
    "max-w-5xl text-5xl font-[800] leading-[0.9] tracking-[-0.06em] text-[#1f2438] sm:text-6xl lg:text-8xl [font-family:'Playfair_Display',Georgia,serif]",
  titleStyle: { color: "#171b46", textShadow: "none" },
  subtitleClass: "text-[#61708a]",
  metaClass: "text-[#61708a]",
  heroBadgeClass:
    "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#73809e] shadow-[0_14px_30px_rgba(113,126,161,0.08)]",
  navShellClass:
    "rounded-full border border-white/70 bg-white/72 px-2 py-2 shadow-[0_16px_50px_rgba(113,126,161,0.09)] backdrop-blur-xl",
  navActiveClass:
    "rounded-full bg-[linear-gradient(135deg,#6378f2,#f19cc0)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_20px_50px_rgba(105,120,220,0.24)]",
  navIdleClass:
    "rounded-full px-4 py-3 text-[11px] font-medium text-[#627089] transition hover:bg-white/80 hover:text-[#1f2438]",
  panelClass:
    "rounded-[2.4rem] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_16px_34px_rgba(112,124,160,0.08)]",
  cardClass:
    "rounded-[1.6rem] border border-white/80 bg-white/82 px-4 py-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]",
  summaryCardClass:
    "rounded-[1.6rem] border border-white/80 bg-white/82 px-4 py-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]",
  sectionClass:
    "rounded-[2.4rem] border border-white/80 bg-white px-5 py-5 shadow-[0_16px_34px_rgba(112,124,160,0.08)]",
  sectionTitleClass: "text-[#1f2438]",
  sectionTitleStyle: { color: "#1f2438", textShadow: "none" },
  sectionCardClass:
    "rounded-[1.35rem] border border-white/80 bg-[#f8f8fe] px-4 py-4 shadow-[0_16px_34px_rgba(112,124,160,0.08)]",
  sectionMutedClass: "bg-[linear-gradient(135deg,#eef1ff,#fff1f7)] text-[#6670a8]",
  accentClass: "text-[#7d87d7]",
  ctaPrimaryClass:
    "inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#6378f2,#f19cc0)] px-4 py-3 text-xs font-semibold text-white shadow-[0_20px_50px_rgba(105,120,220,0.24)] transition hover:-translate-y-0.5",
  ctaSecondaryClass:
    "inline-flex items-center justify-center gap-2 rounded-full border border-[#dbe1f0] bg-white/80 px-4 py-3 text-xs font-semibold text-[#1f2438] shadow-[0_14px_30px_rgba(113,126,161,0.08)] transition hover:-translate-y-0.5",
  headerAlign: "left",
  heroDecor: "gymnastics",
  cardRadiusMode: "soft",
  navRadiusMode: "pill",
};

const normalizeBaseTheme = (theme: ShowcaseThemeConfig | undefined | null) => {
  const sourceTheme = theme || FALLBACK_SHOWCASE_THEME;
  const textClass = extractTextClass(sourceTheme.pageClass);
  const isDark = isDarkTextClass(textClass);
  const stripTitleFontFamilyClasses = (className: string) =>
    String(className || "")
      .split(/\s+/)
      .filter(Boolean)
      .filter(
        (token) =>
          !/\[font-family:[^\]]+\]/.test(token) &&
          !/(?:^|:)font-(?:sans|serif|mono)(?:$|:)/.test(token)
      )
      .join(" ");

  return {
    id: sourceTheme.id,
    name: sourceTheme.name,
    pageClass: sourceTheme.pageClass,
    shellClass: sourceTheme.shellClass,
    headerClass: sourceTheme.headerClass,
    headerOverlayClass:
      sourceTheme.headerOverlayClass ||
      "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%)]",
    titleClass:
      stripTitleFontFamilyClasses(sourceTheme.previewTitleClassName) ||
      "font-black tracking-tight",
    titleStyle: sourceTheme.titleStyle,
    textClass,
    mutedClass: sourceTheme.subtitleClass || sourceTheme.metaClass || textClass,
    accentClass:
      sourceTheme.sectionTitleClass || sourceTheme.previewAccentClassName || textClass,
    heroBadgeClass:
      sourceTheme.heroBadgeClass ||
      "inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
    navShellClass: sourceTheme.navShellClass,
    navActiveClass: sourceTheme.navActiveClass,
    navIdleClass: sourceTheme.navIdleClass,
    sectionClass: sourceTheme.sectionClass,
    sectionCardClass: sourceTheme.sectionCardClass,
    summaryCardClass:
      sourceTheme.summaryCardClass || sourceTheme.sectionCardClass,
    sectionMutedClass:
      sourceTheme.sectionMutedClass ||
      "bg-white/10 text-white/80",
    sectionTitleClass:
      sourceTheme.sectionTitleClass ||
      sourceTheme.previewAccentClassName ||
      textClass,
    sectionTitleStyle: sourceTheme.sectionTitleStyle,
    isDark,
  } satisfies FootballSeasonTemplateTheme;
};

const LEGACY_TEMPLATE_THEMES: Record<string, ShowcaseThemeConfig> = {
  "elite-athlete": {
    id: "elite-athlete",
    name: "Elite Athlete",
    pageClass:
      "min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#020617_42%,#020617_100%)] text-white",
    shellClass:
      "overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_28px_80px_rgba(2,6,23,0.55)] backdrop-blur",
    headerClass:
      "relative overflow-hidden bg-slate-950 px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_32%)]",
    titleClass:
      "max-w-4xl text-5xl font-sans font-black leading-[0.92] tracking-tight text-blue-700 sm:text-6xl lg:text-7xl",
    titleStyle: { color: "#f8fafc" },
    subtitleClass: "text-slate-200",
    metaClass: "text-slate-200",
    heroBadgeClass:
      "inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
    navShellClass:
      "rounded-[24px] border border-white/10 bg-slate-950/88 px-2 py-2 shadow-[0_16px_40px_rgba(2,6,23,0.32)] backdrop-blur",
    navActiveClass:
      "rounded-full bg-blue-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-full border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/25 hover:text-white",
    panelClass: "",
    cardClass: "",
    summaryCardClass:
      "rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur",
    sectionClass:
      "rounded-[28px] border border-white/10 bg-slate-900/80 px-5 py-5 shadow-[0_10px_28px_rgba(2,6,23,0.28)]",
    sectionTitleClass: "text-slate-50",
    sectionTitleStyle: { color: "#f8fafc" },
    sectionCardClass:
      "rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur",
    sectionMutedClass: "bg-blue-500/15 text-blue-100",
    accentClass: "text-blue-300",
    ctaPrimaryClass: "",
    ctaSecondaryClass: "",
    heroDecor: "grid",
    cardRadiusMode: "sharp",
    navRadiusMode: "pill",
  } as ShowcaseThemeConfig,
  "bento-box": {
    id: "bento-box",
    name: "The Bento Box",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_38%,#ffffff_100%)] text-slate-900",
    shellClass:
      "overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.12)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(145deg,#ffffff_0%,#eef2ff_55%,#e0e7ff_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_42%)]",
    titleClass:
      "max-w-4xl text-4xl font-sans font-light uppercase leading-[0.96] tracking-widest text-slate-900 sm:text-5xl lg:text-6xl",
    subtitleClass: "text-slate-600",
    metaClass: "text-slate-600",
    heroBadgeClass:
      "inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm",
    navShellClass:
      "rounded-[28px] border border-slate-200 bg-white/92 px-2 py-2 shadow-sm backdrop-blur",
    navActiveClass:
      "rounded-full bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:bg-slate-200 hover:text-slate-900",
    panelClass: "",
    cardClass: "",
    summaryCardClass:
      "rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm",
    sectionClass:
      "rounded-[32px] border border-slate-200 bg-white px-5 py-5 shadow-sm",
    sectionTitleClass: "text-slate-900",
    sectionCardClass:
      "rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm",
    sectionMutedClass: "bg-indigo-50 text-indigo-700",
    accentClass: "text-indigo-600",
    ctaPrimaryClass: "",
    ctaSecondaryClass: "",
    heroDecor: "grid",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  } as ShowcaseThemeConfig,
  "parent-command": {
    id: "parent-command",
    name: "Parent Command",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_42%,#e0f2fe_100%)] text-slate-900",
    shellClass:
      "overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-[0_22px_60px_rgba(37,99,235,0.12)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(180deg,#dbeafe_0%,#eff6ff_35%,#ffffff_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(191,219,254,0.24),transparent_36%)]",
    titleClass:
      "max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl [font-family:system-ui,sans-serif]",
    subtitleClass: "text-slate-700",
    metaClass: "text-slate-700",
    heroBadgeClass:
      "inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700",
    navShellClass:
      "rounded-[24px] border border-blue-100 bg-white/94 px-2 py-2 shadow-[0_8px_24px_rgba(59,130,246,0.08)] backdrop-blur",
    navActiveClass:
      "rounded-2xl bg-blue-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 transition hover:bg-blue-100",
    panelClass: "",
    cardClass: "",
    summaryCardClass:
      "rounded-[24px] border-b-4 border-blue-200 bg-white px-4 py-4 shadow-sm",
    sectionClass:
      "rounded-[26px] border border-blue-100 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(59,130,246,0.08)]",
    sectionTitleClass: "text-blue-700",
    sectionCardClass:
      "rounded-[20px] border border-blue-100 bg-blue-50 px-4 py-4",
    sectionMutedClass: "bg-blue-50 text-blue-700",
    accentClass: "text-blue-700",
    ctaPrimaryClass: "",
    ctaSecondaryClass: "",
    heroDecor: "grid",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  } as ShowcaseThemeConfig,
  "varsity-classic": {
    id: "varsity-classic",
    name: "Varsity Classic",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#fdfbf5_0%,#f7efe2_48%,#efe4d3_100%)] text-stone-900",
    shellClass:
      "overflow-hidden rounded-none border-4 border-red-950 bg-[#fffdf8] shadow-[12px_12px_0_0_rgba(127,29,29,0.18)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(180deg,#fffaf0_0%,#f8efe1_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(255,248,220,0.22),transparent_36%)]",
    titleClass:
      "max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl [font-family:Georgia,'Times_New_Roman',serif]",
    subtitleClass: "text-stone-700",
    metaClass: "text-stone-700",
    heroBadgeClass:
      "inline-flex items-center rounded-none border border-red-900/15 bg-red-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white",
    navShellClass:
      "rounded-none border-2 border-red-900/15 bg-[#fffdf8]/94 px-2 py-2 shadow-[6px_6px_0_0_rgba(127,29,29,0.08)] backdrop-blur",
    navActiveClass:
      "rounded-none bg-red-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-none border border-red-900/15 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-900 transition hover:bg-red-50",
    panelClass: "",
    cardClass: "",
    summaryCardClass:
      "rounded-none border-2 border-red-900/15 bg-white px-4 py-4 shadow-[6px_6px_0_0_rgba(127,29,29,0.08)]",
    sectionClass:
      "rounded-none border-2 border-red-900/15 bg-white px-5 py-5 shadow-[8px_8px_0_0_rgba(127,29,29,0.08)]",
    sectionTitleClass: "text-red-900",
    sectionCardClass:
      "rounded-none border-2 border-red-900/15 bg-[#fffdf8] px-4 py-4 shadow-[4px_4px_0_0_rgba(87,83,78,0.25)]",
    sectionMutedClass: "bg-red-50 text-red-900",
    accentClass: "text-red-900",
    ctaPrimaryClass: "",
    ctaSecondaryClass: "",
    heroDecor: "paper",
    cardRadiusMode: "soft",
    navRadiusMode: "sharp",
  } as ShowcaseThemeConfig,
  "weekend-journey": {
    id: "weekend-journey",
    name: "Weekend Journey",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%,#ecfdf5_100%)] text-slate-900",
    shellClass:
      "overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(16,185,129,0.08)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(160deg,#ffffff_0%,#f0fdf4_55%,#d1fae5_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(167,243,208,0.24),transparent_34%)]",
    titleClass:
      "max-w-4xl text-4xl font-black leading-[0.96] tracking-tight sm:text-5xl lg:text-6xl [font-family:'Avenir_Next','Segoe_UI',sans-serif]",
    subtitleClass: "text-slate-600",
    metaClass: "text-slate-600",
    heroBadgeClass:
      "inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700",
    navShellClass:
      "rounded-[24px] border border-emerald-100 bg-white/94 px-2 py-2 shadow-sm backdrop-blur",
    navActiveClass:
      "rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 transition hover:bg-emerald-100",
    panelClass: "",
    cardClass: "",
    summaryCardClass:
      "rounded-[22px] border-l-4 border-emerald-500 bg-white px-4 py-4 shadow-sm",
    sectionClass:
      "rounded-[24px] border border-emerald-100 bg-white px-5 py-5 shadow-sm",
    sectionTitleClass: "text-emerald-700",
    sectionCardClass:
      "rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-4",
    sectionMutedClass: "bg-emerald-50 text-emerald-700",
    accentClass: "text-emerald-700",
    ctaPrimaryClass: "",
    ctaSecondaryClass: "",
    heroDecor: "organic",
    cardRadiusMode: "soft",
    navRadiusMode: "pill",
  } as ShowcaseThemeConfig,
  "scouting-report": {
    id: "scouting-report",
    name: "Scouting Report",
    pageClass:
      "min-h-screen bg-[linear-gradient(180deg,#e5e7eb_0%,#f8fafc_46%,#ffffff_100%)] text-slate-900",
    shellClass:
      "overflow-hidden rounded-none border border-slate-400 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.12)]",
    headerClass:
      "relative overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-5 py-12 sm:px-8 sm:py-16",
    headerOverlayClass:
      "bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:22px_22px]",
    titleClass:
      "max-w-4xl text-4xl font-mono font-bold uppercase leading-[1] tracking-widest text-slate-900 sm:text-5xl lg:text-6xl",
    subtitleClass: "text-slate-600",
    metaClass: "text-slate-600",
    heroBadgeClass:
      "inline-flex items-center rounded-none border border-slate-400 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700",
    navShellClass:
      "rounded-none border border-slate-300 bg-white/94 px-2 py-2 shadow-sm backdrop-blur",
    navActiveClass:
      "rounded-none border border-slate-900 bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white",
    navIdleClass:
      "rounded-none border border-slate-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-500 hover:text-slate-900",
    panelClass: "",
    cardClass: "",
    summaryCardClass:
      "rounded-none border border-slate-300 bg-slate-50 px-4 py-4",
    sectionClass:
      "rounded-none border border-slate-300 bg-white px-5 py-5",
    sectionTitleClass: "text-slate-900",
    sectionCardClass:
      "rounded-none border border-slate-300 bg-slate-50 px-4 py-4",
    sectionMutedClass: "bg-slate-100 text-slate-700",
    accentClass: "text-slate-700",
    ctaPrimaryClass: "",
    ctaSecondaryClass: "",
    heroDecor: "grid",
    cardRadiusMode: "sharp",
    navRadiusMode: "sharp",
  } as ShowcaseThemeConfig,
};

const GROUP_FALLBACKS: Record<string, GymMeetTemplateId> = {
  current: "launchpad-editorial",
  showcase: "launchpad-editorial",
  bold: "elite-athlete",
  classic: "varsity-classic",
  editorial: "luxe-magazine",
  dashboard: "vault-grid",
};

export const resolveFootballSeasonTemplateChrome = (
  templateId: GymMeetTemplateId
): FootballSeasonTemplateTheme => {
  const meta = getGymMeetTemplateMeta(templateId);
  const fallbackId = GROUP_FALLBACKS[meta.group] || DEFAULT_GYM_MEET_TEMPLATE_ID;
  const baseTheme =
    (SHOWCASE_THEMES as Record<string, ShowcaseThemeConfig>)[templateId] ||
    LEGACY_TEMPLATE_THEMES[templateId] ||
    (SHOWCASE_THEMES as Record<string, ShowcaseThemeConfig>)[fallbackId] ||
    LEGACY_TEMPLATE_THEMES[fallbackId] ||
    FALLBACK_SHOWCASE_THEME;

  const normalizedBase = normalizeBaseTheme(baseTheme || FALLBACK_SHOWCASE_THEME);
  const titleTypography = resolveFootballSeasonTemplateTypography(templateId);

  return {
    ...normalizedBase,
    titleClass: normalizedBase.titleClass,
    titleStyle: normalizedBase.titleStyle,
    titleTypography,
  };
};

export const resolveFootballSeasonTemplateTypography = (
  templateId: GymMeetTemplateId
): GymMeetTitleTypographySpec => getGymMeetTitleTypography(templateId);
