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
    group: "current",
    layoutFamily: "standard",
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
    group: "current",
    layoutFamily: "standard",
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
    group: "current",
    layoutFamily: "standard",
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
    group: "current",
    layoutFamily: "standard",
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
    group: "current",
    layoutFamily: "standard",
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
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Meet Operations Sheet",
    previewKicker: "Roster + Assignments",
    previewClassName:
      "bg-[linear-gradient(180deg,#e5e7eb_0%,#f8fafc_100%)] text-slate-900",
    previewAccentClassName: "text-slate-600",
  },
  {
    id: "cyber-athlete",
    name: "Cyber Athlete",
    style: "Showcase / Futuristic Arena",
    description: "Blacklight contrast, neon grid energy, and a sharp competition-night hero.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Cyber Meet",
    previewKicker: "Arena Pulse",
    previewClassName:
      "bg-[linear-gradient(145deg,#020617_0%,#000000_45%,#06b6d4_100%)] text-cyan-100",
    previewAccentClassName: "text-cyan-300",
  },
  {
    id: "paper-proto",
    name: "Paper Proto",
    style: "Showcase / Draft Board",
    description: "Blueprint sketchbook framing with ink borders, offset shadows, and editorial notes.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Paper Draft",
    previewKicker: "Coach Notes",
    previewClassName:
      "bg-[linear-gradient(180deg,#fafaf9_0%,#f5f5f4_60%,#e7e5e4_100%)] text-stone-900",
    previewAccentClassName: "text-stone-700",
  },
  {
    id: "sunset-arena",
    name: "Sunset Arena",
    style: "Showcase / Premium Warm Glow",
    description: "Gold-hour gradients, luxe curves, and a polished spotlight presentation.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Sunset Session",
    previewKicker: "Golden Hour",
    previewClassName:
      "bg-[linear-gradient(145deg,#1c1917_0%,#92400e_45%,#fbbf24_100%)] text-amber-50",
    previewAccentClassName: "text-amber-200",
  },
  {
    id: "pop-art",
    name: "Pop Art",
    style: "Showcase / Graphic Impact",
    description: "Poster-book contrast, comic-block framing, and loud meet-day emphasis.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Pop Sport",
    previewKicker: "Bold Blocks",
    previewClassName:
      "bg-[linear-gradient(135deg,#fde047_0%,#facc15_55%,#0f172a_100%)] text-slate-950",
    previewAccentClassName: "text-red-600",
  },
  {
    id: "swiss-grid",
    name: "Swiss Grid",
    style: "Showcase / Editorial Grid",
    description: "Rational red-and-white information design with rigid alignment and crisp hierarchy.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Swiss Grid",
    previewKicker: "System Layout",
    previewClassName:
      "bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_55%,#fee2e2_100%)] text-black",
    previewAccentClassName: "text-red-600",
  },
  {
    id: "art-deco",
    name: "Art Deco",
    style: "Showcase / Evening Poster",
    description: "Black-and-gold geometry with theatrical framing and championship-night polish.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Deco Games",
    previewKicker: "Gold Panel",
    previewClassName:
      "bg-[linear-gradient(145deg,#0a0a0a_0%,#1f1f1f_40%,#d4af37_100%)] text-[#f5deb3]",
    previewAccentClassName: "text-[#d4af37]",
  },
  {
    id: "concrete-gym",
    name: "Concrete Gym",
    style: "Showcase / Industrial",
    description: "Raw zinc texture, heavy bars, and stripped-back training-floor attitude.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Concrete Gym",
    previewKicker: "Raw Ops",
    previewClassName:
      "bg-[linear-gradient(180deg,#a1a1aa_0%,#d4d4d8_55%,#f4f4f5_100%)] text-zinc-900",
    previewAccentClassName: "text-zinc-700",
  },
  {
    id: "midnight-frost",
    name: "Midnight Frost",
    style: "Showcase / Frosted Night",
    description: "Deep indigo glass, frosted panels, and luminous cold-weather contrast.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Night Frost",
    previewKicker: "Glass Glow",
    previewClassName:
      "bg-[linear-gradient(145deg,#020617_0%,#1e1b4b_50%,#60a5fa_100%)] text-indigo-50",
    previewAccentClassName: "text-sky-200",
  },
  {
    id: "eco-motion",
    name: "Eco Motion",
    style: "Showcase / Organic Athletic",
    description: "Soft emerald motion, rounded shells, and a calmer club-forward presentation.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Eco Motion",
    previewKicker: "Club Flow",
    previewClassName:
      "bg-[linear-gradient(180deg,#ecfdf5_0%,#d1fae5_50%,#fefce8_100%)] text-emerald-950",
    previewAccentClassName: "text-emerald-700",
  },
  {
    id: "holo-elite",
    name: "Holo Elite",
    style: "Showcase / Bright Tech Premium",
    description: "White-blue polish with holographic accents and high-end competition packaging.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Holo Elite",
    previewKicker: "Tech Shine",
    previewClassName:
      "bg-[linear-gradient(145deg,#ffffff_0%,#dbeafe_50%,#bfdbfe_100%)] text-slate-900",
    previewAccentClassName: "text-blue-600",
  },
  {
    id: "chalk-strike",
    name: "Chalk Strike",
    style: "Bold / Arena Neon",
    description: "Mat-black drama, punchy accent color, and compressed meet-night energy.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Friday Night Session",
    previewKicker: "Vault Rotation",
    previewClassName:
      "bg-[linear-gradient(135deg,#030712_0%,#111827_45%,#ec4899_100%)] text-white",
    previewAccentClassName: "text-pink-300",
  },
  {
    id: "podium-lights",
    name: "Podium Lights",
    style: "Premium / Spotlight",
    description: "Navy-and-gold presentation with polished spotlight panels and podium polish.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Podium Preview",
    previewKicker: "Awards Session",
    previewClassName:
      "bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_55%,#f59e0b_100%)] text-white",
    previewAccentClassName: "text-amber-200",
  },
  {
    id: "judges-sheet",
    name: "Judge's Sheet",
    style: "Technical / Paper Trail",
    description: "Clipboards, paper stock, and precise score-sheet hierarchy for detailed meet ops.",
    group: "classic",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Session Notes",
    previewKicker: "Check-In Sheet",
    previewClassName:
      "bg-[linear-gradient(180deg,#f8f5ef_0%,#ede7dc_100%)] text-stone-900",
    previewAccentClassName: "text-rose-800",
  },
  {
    id: "spring-energy",
    name: "Spring Energy",
    style: "Youth Club / Bright",
    description: "Fresh coral, cobalt, and mint tones with upbeat spacing and lighter rhythm.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Club Showcase",
    previewKicker: "Weekend Ready",
    previewClassName:
      "bg-[linear-gradient(145deg,#ecfeff_0%,#fef3c7_52%,#ffe4e6_100%)] text-slate-900",
    previewAccentClassName: "text-sky-700",
  },
  {
    id: "club-classic",
    name: "Club Classic",
    style: "Booster Club / Structured",
    description: "Navy, crimson, and cream with familiar program-book confidence.",
    group: "classic",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Team Weekend",
    previewKicker: "Hosted Meet",
    previewClassName:
      "bg-[linear-gradient(180deg,#fff7ed_0%,#fef2f2_60%,#e0f2fe_100%)] text-slate-900",
    previewAccentClassName: "text-red-800",
  },
  {
    id: "aurora-lift",
    name: "Aurora Lift",
    style: "Modern / Luminous",
    description: "Icy gradients, glassy surfaces, and sleek athletic motion without going generic.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Night Before Meet",
    previewKicker: "Travel + Timing",
    previewClassName:
      "bg-[linear-gradient(145deg,#082f49_0%,#155e75_45%,#34d399_100%)] text-white",
    previewAccentClassName: "text-emerald-200",
  },
  {
    id: "ribbon-editorial",
    name: "Ribbon Editorial",
    style: "Editorial / Magazine",
    description: "Oversized headlines, airy copy flow, and feature-story pacing across the page.",
    group: "editorial",
    layoutFamily: "editorial",
    thumbnailMode: "rendered-card",
    previewTitle: "Feature Spread",
    previewKicker: "Meet Weekend",
    previewClassName:
      "bg-[linear-gradient(180deg,#fffaf5_0%,#fdf2f8_100%)] text-stone-900",
    previewAccentClassName: "text-fuchsia-700",
  },
  {
    id: "medal-poster",
    name: "Medal Poster",
    style: "Editorial / Poster Stack",
    description: "Big type, stacked schedule moments, and poster-board emphasis on the essentials.",
    group: "editorial",
    layoutFamily: "editorial",
    thumbnailMode: "rendered-card",
    previewTitle: "Championship Poster",
    previewKicker: "Session One",
    previewClassName:
      "bg-[linear-gradient(135deg,#fef3c7_0%,#fed7aa_48%,#fecaca_100%)] text-stone-900",
    previewAccentClassName: "text-amber-800",
  },
  {
    id: "vault-grid",
    name: "Vault Grid",
    style: "Dashboard / Dense",
    description: "Asymmetrical information blocks for teams that want the whole meet at a glance.",
    group: "dashboard",
    layoutFamily: "dashboard",
    thumbnailMode: "rendered-card",
    previewTitle: "Operations Grid",
    previewKicker: "Roster + Logistics",
    previewClassName:
      "bg-[linear-gradient(145deg,#e0e7ff_0%,#f8fafc_45%,#dbeafe_100%)] text-slate-900",
    previewAccentClassName: "text-indigo-700",
  },
  {
    id: "travel-briefing",
    name: "Travel Briefing",
    style: "Dashboard / Logistics",
    description: "A trip-first command layout with a strong sidebar for timing, contacts, and RSVP.",
    group: "dashboard",
    layoutFamily: "dashboard",
    thumbnailMode: "rendered-card",
    previewTitle: "Travel Briefing",
    previewKicker: "Parent Packet",
    previewClassName:
      "bg-[linear-gradient(145deg,#ecfccb_0%,#f8fafc_55%,#dbeafe_100%)] text-slate-900",
    previewAccentClassName: "text-lime-700",
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
