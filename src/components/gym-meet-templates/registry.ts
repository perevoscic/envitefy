/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { GymMeetPageTemplateMeta, GymMeetTemplateId } from "./types";

export const DEFAULT_GYM_MEET_TEMPLATE_ID: GymMeetTemplateId = "elite-athlete";

export const GYM_MEET_TEMPLATE_LIBRARY: GymMeetPageTemplateMeta[] = [
  {
    id: "elite-athlete",
    name: "Elite Athlete",
    style: "Pro Sports / High Contrast",
    description: "Scoreboard energy, sharp type, and a high-contrast hero.",
    thumbnailMode: "rendered-card",
    previewTitle: "Redbird Arena Meet",
    previewKicker: "Competition Timing",
    previewClassName:
      "bg-[linear-gradient(140deg,#020617_0%,#0f172a_45%,#2563eb_100%)] text-white",
    previewAccentClassName: "text-blue-300",
  },
  {
    id: "bento-box",
    name: "The Bento Box",
    style: "Modern Modular",
    description: "Rounded cards, airy spacing, and dashboard-style blocks.",
    thumbnailMode: "rendered-card",
    previewTitle: "Session Dashboard",
    previewKicker: "Travel + Roster",
    previewClassName:
      "bg-[linear-gradient(160deg,#f8fafc_0%,#eef2ff_50%,#ffffff_100%)] text-slate-900",
    previewAccentClassName: "text-indigo-600",
  },
  {
    id: "parent-command",
    name: "Parent Command",
    style: "Utility / Accessible",
    description: "Clear hierarchy for busy families, timings, and logistics.",
    thumbnailMode: "rendered-card",
    previewTitle: "Meet Command Center",
    previewKicker: "Arrival + RSVP",
    previewClassName:
      "bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_65%,#dbeafe_100%)] text-slate-900",
    previewAccentClassName: "text-blue-700",
  },
  {
    id: "varsity-classic",
    name: "Varsity Classic",
    style: "Collegiate / Heritage",
    description:
      "Poster-inspired framing, serif accents, and school-spirit gravitas.",
    thumbnailMode: "rendered-card",
    previewTitle: "Championship Weekend",
    previewKicker: "Hosted by State Gymnastics",
    previewClassName:
      "bg-[linear-gradient(180deg,#fdfbf5_0%,#f5efe4_100%)] text-stone-900",
    previewAccentClassName: "text-red-900",
  },
  {
    id: "weekend-journey",
    name: "Weekend Journey",
    style: "Timeline / Chrono",
    description: "Chronological layout focused on movement through the weekend.",
    thumbnailMode: "rendered-card",
    previewTitle: "Travel Weekend",
    previewKicker: "Itinerary + Rotation",
    previewClassName:
      "bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_55%,#ecfdf5_100%)] text-slate-900",
    previewAccentClassName: "text-emerald-700",
  },
  {
    id: "scouting-report",
    name: "Scouting Report",
    style: "Data / Technical",
    description: "Monospace report styling for coaches, schedules, and operations.",
    thumbnailMode: "rendered-card",
    previewTitle: "Meet Operations Sheet",
    previewKicker: "Roster + Assignments",
    previewClassName:
      "bg-[linear-gradient(180deg,#e5e7eb_0%,#f8fafc_100%)] text-slate-900",
    previewAccentClassName: "text-slate-600",
  },
];

export const isGymMeetTemplateId = (
  value: unknown
): value is GymMeetTemplateId =>
  typeof value === "string" &&
  GYM_MEET_TEMPLATE_LIBRARY.some((template) => template.id === value);

export const getGymMeetTemplateMeta = (value: unknown): GymMeetPageTemplateMeta =>
  GYM_MEET_TEMPLATE_LIBRARY.find((template) => template.id === value) ||
  GYM_MEET_TEMPLATE_LIBRARY[0];

const normalizeHex = (value: unknown): string => {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^#[0-9a-f]{6}$/i.test(text) ? text : "";
};

const luminance = (value: string) => {
  if (!value) return 0.5;
  const normalized = value.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const channel = (n: number) => {
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const trimmed = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const resolveGymMeetTemplateId = (data: any): GymMeetTemplateId => {
  const explicit = data?.pageTemplateId;
  if (isGymMeetTemplateId(explicit)) return explicit;

  const themeId = trimmed(data?.themeId || data?.theme?.id || data?.theme?.themeId);
  const fontId = trimmed(data?.fontId);
  const titleFont = trimmed(data?.designTokens?.titleFont);
  const backgroundColor = normalizeHex(data?.designTokens?.bg);
  const surfaceColor = normalizeHex(data?.designTokens?.surface);
  const primaryColor = normalizeHex(data?.designTokens?.primary);
  const lightBackground =
    (backgroundColor && luminance(backgroundColor) > 0.82) ||
    (surfaceColor && luminance(surfaceColor) > 0.82);
  const darkBackground =
    (backgroundColor && luminance(backgroundColor) < 0.26) ||
    /night|dark|electric|impact|edge|cosmic|turbo|elite|spark|flash|neon|galaxy|aqua/.test(
      themeId
    );

  if (
    /playfair|cormorant|serif/.test(fontId) ||
    /playfair|cormorant|serif/.test(titleFont) ||
    /classic|regal|gold|heritage/.test(themeId)
  ) {
    return "varsity-classic";
  }

  if (
    /orbitron|syncopate|chakra|rajdhani|mono|technical|report|scout/.test(fontId) ||
    /mono|sfmono|menlo|technical/.test(titleFont) ||
    /report|technical|data/.test(themeId)
  ) {
    return "scouting-report";
  }

  if (
    /weekend|journey|travel|timeline/.test(themeId) ||
    (Array.isArray(data?.advancedSections?.practice?.blocks) &&
      data.advancedSections.practice.blocks.length > 2 &&
      Boolean(data?.advancedSections?.logistics))
  ) {
    return "weekend-journey";
  }

  if (
    /parent|command|utility|accessible/.test(themeId) ||
    (lightBackground &&
      (backgroundColor === "#eff6ff" ||
        backgroundColor === "#dbeafe" ||
        primaryColor === "#2563eb" ||
        primaryColor === "#1d4ed8"))
  ) {
    return "parent-command";
  }

  if (
    /bento|mint|lavender|aerial|glitter/.test(themeId) ||
    lightBackground
  ) {
    return "bento-box";
  }

  if (darkBackground) return "elite-athlete";

  return DEFAULT_GYM_MEET_TEMPLATE_ID;
};
