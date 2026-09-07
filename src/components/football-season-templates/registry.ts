/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { GymMeetPageTemplateMeta, GymMeetTemplateId } from "./types";

export const DEFAULT_GYM_MEET_TEMPLATE_ID: GymMeetTemplateId =
  "launchpad-editorial";
export const DEFAULT_NEW_GYM_MEET_TEMPLATE_ID: GymMeetTemplateId =
  "launchpad-editorial";

export const GYM_MEET_TEMPLATE_LIBRARY: GymMeetPageTemplateMeta[] = [
  {
    id: "launchpad-editorial",
    name: "Launchpad Editorial",
    style: "Editorial / Light Launch",
    description: "Landing-page energy with airy panels, soft gradients, and clear hierarchy.",
    group: "current",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Summit Invitational",
    previewKicker: "Editorial Launchpad",
    previewClassName:
      "bg-[linear-gradient(135deg,#ffffff_0%,#f8f7ff_55%,#eef6ff_100%)] text-[#1f2438]",
    previewAccentClassName: "text-[#61708a]",
    titleTypographyId: "playfair",
    previewTitleClassName: "[font-family:'Playfair_Display',Georgia,serif]",
  },
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
    titleTypographyId: "anton",
    previewTitleClassName: "font-sans font-black text-blue-700",
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
    titleTypographyId: "league-spartan",
    previewTitleClassName: "font-sans font-light uppercase tracking-widest",
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
    titleTypographyId: "montserrat",
    previewTitleClassName: "tracking-tight",
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
    titleTypographyId: "cormorant",
    previewTitleClassName: "[font-family:Georgia,'Times_New_Roman',serif]",
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
    titleTypographyId: "barlow-condensed",
    previewTitleClassName:
      "[font-family:'Avenir_Next','Segoe_UI',sans-serif]",
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
    titleTypographyId: "space-mono",
    previewTitleClassName: "font-mono font-bold uppercase tracking-widest",
  },
  {
    id: "cyber-athlete",
    name: "Cyber Athlete",
    style: "Showcase / Futuristic Arena",
    description:
      "Blacklight contrast, neon grid energy, and a sharp competition-night hero.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Cyber Meet",
    previewKicker: "Arena Pulse",
    previewClassName:
      "bg-[linear-gradient(145deg,#020617_0%,#000000_45%,#06b6d4_100%)] text-cyan-100",
    previewAccentClassName: "text-cyan-300",
    titleTypographyId: "orbitron",
    previewTitleClassName:
      "font-sans font-black text-fuchsia-500 [text-shadow:0_0_18px_rgba(217,70,239,0.55)]",
  },
  {
    id: "paper-proto",
    name: "Paper Proto",
    style: "Showcase / Draft Board",
    description:
      "Blueprint sketchbook framing with ink borders, offset shadows, and editorial notes.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Paper Draft",
    previewKicker: "Coach Notes",
    previewClassName:
      "bg-[linear-gradient(180deg,#fafaf9_0%,#f5f5f4_60%,#e7e5e4_100%)] text-stone-900",
    previewAccentClassName: "text-stone-700",
    titleTypographyId: "playfair",
    previewTitleClassName:
      "italic [font-family:'Playfair_Display',Georgia,serif]",
  },
  {
    id: "sunset-arena",
    name: "Sunset Arena",
    style: "Showcase / Premium Warm Glow",
    description:
      "Gold-hour gradients, luxe curves, and a polished spotlight presentation.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Sunset Session",
    previewKicker: "Golden Hour",
    previewClassName:
      "bg-[linear-gradient(145deg,#1c1917_0%,#92400e_45%,#fbbf24_100%)] text-amber-50",
    previewAccentClassName: "text-amber-200",
    titleTypographyId: "cormorant",
    previewTitleClassName: "[font-family:Georgia,'Times_New_Roman',serif]",
  },
  {
    id: "pop-art",
    name: "Pop Art",
    style: "Showcase / Graphic Impact",
    description:
      "Poster-book contrast, comic-block framing, and loud meet-day emphasis.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Pop Sport",
    previewKicker: "Bold Blocks",
    previewClassName:
      "bg-[linear-gradient(135deg,#fde047_0%,#facc15_55%,#0f172a_100%)] text-slate-950",
    previewAccentClassName: "text-red-600",
    titleTypographyId: "bungee",
    previewTitleClassName:
      "font-mono font-black text-[#ffcc00] [text-shadow:4px_4px_0px_#000000]",
  },
  {
    id: "swiss-grid",
    name: "Swiss Grid",
    style: "Showcase / Editorial Grid",
    description:
      "Rational red-and-white information design with rigid alignment and crisp hierarchy.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Swiss Grid",
    previewKicker: "System Layout",
    previewClassName:
      "bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_55%,#fee2e2_100%)] text-black",
    previewAccentClassName: "text-red-600",
    titleTypographyId: "league-spartan",
    previewTitleClassName: "font-sans font-black text-red-600",
  },
  {
    id: "art-deco",
    name: "Art Deco",
    style: "Showcase / Evening Poster",
    description:
      "Black-and-gold geometry with theatrical framing and championship-night polish.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Deco Games",
    previewKicker: "Gold Panel",
    previewClassName:
      "bg-[linear-gradient(145deg,#0a0a0a_0%,#1f1f1f_40%,#d4af37_100%)] text-[#f5deb3]",
    previewAccentClassName: "text-[#d4af37]",
    titleTypographyId: "cormorant",
    previewTitleClassName: "[font-family:Georgia,'Times_New_Roman',serif]",
  },
  {
    id: "concrete-gym",
    name: "Concrete Gym",
    style: "Showcase / Industrial",
    description:
      "Raw zinc texture, heavy bars, and stripped-back training-floor attitude.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Concrete Gym",
    previewKicker: "Raw Ops",
    previewClassName:
      "bg-[linear-gradient(145deg,#18181b_0%,#52525b_45%,#a1a1aa_100%)] text-white",
    previewAccentClassName: "text-zinc-700",
    titleTypographyId: "ibm-plex-mono",
    previewTitleClassName: "font-mono font-black italic text-zinc-100",
  },
  {
    id: "midnight-frost",
    name: "Midnight Frost",
    style: "Showcase / Frosted Night",
    description:
      "Deep indigo glass, frosted panels, and luminous cold-weather contrast.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Night Frost",
    previewKicker: "Glass Glow",
    previewClassName:
      "bg-[linear-gradient(145deg,#020617_0%,#1e1b4b_50%,#60a5fa_100%)] text-indigo-50",
    previewAccentClassName: "text-sky-200",
    titleTypographyId: "sora",
    previewTitleClassName: "font-sans font-black",
  },
  {
    id: "eco-motion",
    name: "Eco Motion",
    style: "Showcase / Organic Athletic",
    description:
      "Soft emerald motion, rounded shells, and a calmer club-forward presentation.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Eco Motion",
    previewKicker: "Club Flow",
    previewClassName:
      "bg-[linear-gradient(180deg,#ecfdf5_0%,#d1fae5_50%,#fefce8_100%)] text-emerald-950",
    previewAccentClassName: "text-emerald-700",
    titleTypographyId: "manrope",
    previewTitleClassName:
      "[font-family:'Avenir_Next','Gill_Sans',sans-serif]",
  },
  {
    id: "holo-elite",
    name: "Holo Elite",
    style: "Showcase / Bright Tech Premium",
    description:
      "White-blue polish with holographic accents and high-end competition packaging.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Holo Elite",
    previewKicker: "Tech Shine",
    previewClassName:
      "bg-[linear-gradient(145deg,#ffffff_0%,#dbeafe_50%,#bfdbfe_100%)] text-slate-900",
    previewAccentClassName: "text-blue-600",
    titleTypographyId: "exo2",
    previewTitleClassName: "font-sans font-black text-white drop-shadow-2xl",
  },
  {
    id: "glitch-sport",
    name: "Glitch Sport",
    style: "Showcase / Glitch Arena",
    description:
      "Black, red, and cyan collision with scanline energy and a sharp competition-night edge.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Glitch Sport",
    previewKicker: "Scanline Pulse",
    previewClassName:
      "bg-[linear-gradient(145deg,#000000_0%,#111827_42%,#06b6d4_100%)] text-white",
    previewAccentClassName: "text-red-400",
    titleTypographyId: "ibm-plex-mono",
    previewTitleClassName: "font-mono font-black italic uppercase",
  },
  {
    id: "organic-flow",
    name: "Organic Flow",
    style: "Showcase / Organic Premium",
    description:
      "Soft emerald shells, rounded navigation, and a calmer club-first presentation.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Organic Flow",
    previewKicker: "Club Rhythm",
    previewClassName:
      "bg-[linear-gradient(160deg,#ecfdf5_0%,#d1fae5_52%,#065f46_100%)] text-emerald-950",
    previewAccentClassName: "text-white",
    titleTypographyId: "manrope",
    previewTitleClassName: "font-sans font-black italic text-white",
  },
  {
    id: "pixel-arena",
    name: "Pixel Arena",
    style: "Showcase / Arcade Scoreboard",
    description:
      "CRT green, rigid borders, and retro-sport contrast built for loud meet-day information.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Pixel Arena",
    previewKicker: "Arcade Grid",
    previewClassName:
      "bg-[linear-gradient(145deg,#000000_0%,#03120a_56%,#00ff41_100%)] text-[#00ff41]",
    previewAccentClassName: "text-white",
    titleTypographyId: "press-start-2p",
    previewTitleClassName:
      "font-mono font-black uppercase text-[#00ff41] [text-shadow:4px_4px_0px_#14532d]",
  },
  {
    id: "architect-clean",
    name: "Structural HQ",
    style: "Showcase / Structural Minimal",
    description:
      "White space, blueprint grid discipline, and stripped-back editorial utility.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Structural HQ",
    previewKicker: "Clean Grid",
    previewClassName:
      "bg-[linear-gradient(180deg,#ffffff_0%,#f5f5f5_56%,#e2e8f0_100%)] text-slate-800",
    previewAccentClassName: "text-slate-500",
    titleTypographyId: "manrope",
    previewTitleClassName: "font-sans font-light tracking-tight text-slate-800",
  },
  {
    id: "noir-silhouette",
    name: "Noir Silhouette",
    style: "Showcase / Monochrome Poster",
    description:
      "Stark black-and-white framing with oversized typography and gallery-poster confidence.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Noir Silhouette",
    previewKicker: "Monochrome Impact",
    previewClassName:
      "bg-[linear-gradient(145deg,#000000_0%,#1f2937_44%,#ffffff_100%)] text-white",
    previewAccentClassName: "text-zinc-400",
    titleTypographyId: "anton",
    previewTitleClassName: "font-black tracking-tighter text-white",
  },
  {
    id: "vaporwave-grid",
    name: "Vector Vapor",
    style: "Showcase / Neon Vapor",
    description:
      "Purple-pink retro-future grid styling with cyan highlights and arcade-night contrast.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Vector Vapor",
    previewKicker: "Neon Grid",
    previewClassName:
      "bg-[linear-gradient(145deg,#2d0a4e_0%,#1a0633_45%,#00f2ff_100%)] text-[#00f2ff]",
    previewAccentClassName: "text-pink-400",
    titleTypographyId: "audiowide",
    previewTitleClassName:
      "font-mono font-black text-pink-400 [text-shadow:4px_4px_0px_#ff00ff]",
  },
  {
    id: "heavy-impact",
    name: "Heavy Impact",
    style: "Showcase / Poster Impact",
    description:
      "Black-and-yellow fight-poster energy with oversized typography and blocky framing.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Heavy Impact",
    previewKicker: "Poster Energy",
    previewClassName:
      "bg-[linear-gradient(145deg,#000000_0%,#111111_55%,#facc15_100%)] text-yellow-300",
    previewAccentClassName: "text-white",
    titleTypographyId: "anton",
    previewTitleClassName: "font-black text-yellow-400",
  },
  {
    id: "blueprint-tech",
    name: "Tech Blueprint",
    style: "Showcase / Technical Blueprint",
    description:
      "Cobalt blueprint surfaces, mono typography, and engineered scoreboard structure.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Tech Blueprint",
    previewKicker: "Blueprint Grid",
    previewClassName:
      "bg-[linear-gradient(145deg,#003366_0%,#0a4a7a_55%,#1e90ff_100%)] text-white",
    previewAccentClassName: "text-blue-100",
    titleTypographyId: "ibm-plex-mono",
    previewTitleClassName: "font-mono font-light uppercase text-white border-b-2",
  },
  {
    id: "toxic-kinetic",
    name: "Toxic Kinetic",
    style: "Showcase / Acid Arena",
    description:
      "Black-and-lime aggressive framing with slashed motion and kinetic meet-night contrast.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Toxic Kinetic",
    previewKicker: "Acid Motion",
    previewClassName:
      "bg-[linear-gradient(145deg,#000000_0%,#18181b_50%,#84cc16_100%)] text-lime-400",
    previewAccentClassName: "text-lime-300",
    titleTypographyId: "kanit",
    previewTitleClassName:
      "font-sans font-black italic uppercase text-lime-400 [-skew-x-6]",
  },
  {
    id: "luxe-magazine",
    name: "Luxe Editorial",
    style: "Showcase / Editorial Luxe",
    description:
      "Minimal black-and-white editorial presentation with thin serif headlines and magazine pacing.",
    group: "showcase",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Luxe Editorial",
    previewKicker: "Feature Layout",
    previewClassName:
      "bg-[linear-gradient(180deg,#ffffff_0%,#fafaf9_100%)] text-black",
    previewAccentClassName: "text-zinc-500",
    titleTypographyId: "cormorant",
    previewTitleClassName: "font-serif font-thin tracking-[1em] text-black",
  },
  {
    id: "chalk-strike",
    name: "Chalk Strike",
    style: "Bold / Arena Neon",
    description:
      "Mat-black drama, punchy accent color, and compressed meet-night energy.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Friday Night Session",
    previewKicker: "Vault Rotation",
    previewClassName:
      "bg-[linear-gradient(135deg,#030712_0%,#111827_45%,#ec4899_100%)] text-white",
    previewAccentClassName: "text-pink-300",
    titleTypographyId: "space-mono",
    previewTitleClassName: "font-black uppercase tracking-tighter",
  },
  {
    id: "podium-lights",
    name: "Podium Lights",
    style: "Premium / Spotlight",
    description:
      "Navy-and-gold presentation with polished spotlight panels and podium polish.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Podium Preview",
    previewKicker: "Awards Session",
    previewClassName:
      "bg-[linear-gradient(145deg,#0f172a_0%,#1e293b_55%,#f59e0b_100%)] text-white",
    previewAccentClassName: "text-amber-200",
    titleTypographyId: "oswald",
    previewTitleClassName: "font-sans font-black text-amber-600",
  },
  {
    id: "judges-sheet",
    name: "Judge's Sheet",
    style: "Technical / Paper Trail",
    description:
      "Clipboards, paper stock, and precise score-sheet hierarchy for detailed meet ops.",
    group: "classic",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Session Notes",
    previewKicker: "Check-In Sheet",
    previewClassName:
      "bg-[linear-gradient(180deg,#f8f5ef_0%,#ede7dc_100%)] text-stone-900",
    previewAccentClassName: "text-rose-800",
    titleTypographyId: "space-mono",
    previewTitleClassName: "font-mono font-bold uppercase tracking-widest",
  },
  {
    id: "spring-energy",
    name: "Spring Energy",
    style: "Youth Club / Bright",
    description:
      "Fresh coral, cobalt, and mint tones with upbeat spacing and lighter rhythm.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Club Showcase",
    previewKicker: "Weekend Ready",
    previewClassName:
      "bg-[linear-gradient(145deg,#ecfeff_0%,#fef3c7_52%,#ffe4e6_100%)] text-slate-900",
    previewAccentClassName: "text-sky-700",
    titleTypographyId: "poppins",
    previewTitleClassName:
      "[font-family:'Trebuchet_MS','Avenir_Next',sans-serif]",
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
    titleTypographyId: "barlow-condensed",
    previewTitleClassName: "font-sans font-black italic text-orange-900",
  },
  {
    id: "aurora-lift",
    name: "Aurora Lift",
    style: "Modern / Luminous",
    description:
      "Icy gradients, glassy surfaces, and sleek athletic motion without going generic.",
    group: "bold",
    layoutFamily: "standard",
    thumbnailMode: "rendered-card",
    previewTitle: "Night Before Meet",
    previewKicker: "Travel + Timing",
    previewClassName:
      "bg-[linear-gradient(145deg,#082f49_0%,#155e75_45%,#34d399_100%)] text-white",
    previewAccentClassName: "text-emerald-200",
    titleTypographyId: "exo2",
    previewTitleClassName: "font-sans font-black text-cyan-400",
  },
  {
    id: "ribbon-editorial",
    name: "Ribbon Editorial",
    style: "Editorial / Magazine",
    description:
      "Oversized headlines, airy copy flow, and feature-story pacing across the page.",
    group: "editorial",
    layoutFamily: "editorial",
    thumbnailMode: "rendered-card",
    previewTitle: "Feature Spread",
    previewKicker: "Meet Weekend",
    previewClassName:
      "bg-[linear-gradient(180deg,#fffaf5_0%,#fdf2f8_100%)] text-stone-900",
    previewAccentClassName: "text-fuchsia-700",
    titleTypographyId: "cormorant",
    previewTitleClassName: "font-serif font-light lowercase tracking-[-0.05em]",
  },
  {
    id: "medal-poster",
    name: "Medal Poster",
    style: "Editorial / Poster Stack",
    description:
      "Big type, stacked schedule moments, and poster-board emphasis on the essentials.",
    group: "editorial",
    layoutFamily: "editorial",
    thumbnailMode: "rendered-card",
    previewTitle: "Championship Poster",
    previewKicker: "Session One",
    previewClassName:
      "bg-[linear-gradient(145deg,#111827_0%,#7c2d12_52%,#ef4444_100%)] text-white",
    previewAccentClassName: "text-amber-800",
    titleTypographyId: "kanit",
    previewTitleClassName:
      "font-black italic tracking-[-0.1em] text-[#fff4d6] drop-shadow-[0_2px_10px_rgba(17,24,39,0.24)]",
  },
  {
    id: "vault-grid",
    name: "Vault Grid",
    style: "Dashboard / Dense",
    description:
      "Asymmetrical information blocks for teams that want the whole meet at a glance.",
    group: "dashboard",
    layoutFamily: "dashboard",
    thumbnailMode: "rendered-card",
    previewTitle: "Operations Grid",
    previewKicker: "Roster + Logistics",
    previewClassName:
      "bg-[linear-gradient(145deg,#e0e7ff_0%,#f8fafc_45%,#dbeafe_100%)] text-slate-900",
    previewAccentClassName: "text-indigo-700",
    titleTypographyId: "league-spartan",
    previewTitleClassName:
      "[font-family:'Arial_Black','Avenir_Next',sans-serif]",
  },
  {
    id: "travel-briefing",
    name: "Travel Briefing",
    style: "Dashboard / Logistics",
    description:
      "A trip-first command layout with a strong sidebar for timing, contacts, and RSVP.",
    group: "dashboard",
    layoutFamily: "dashboard",
    thumbnailMode: "rendered-card",
    previewTitle: "Travel Briefing",
    previewKicker: "Parent Packet",
    previewClassName:
      "bg-[linear-gradient(145deg,#ecfccb_0%,#f8fafc_55%,#dbeafe_100%)] text-slate-900",
    previewAccentClassName: "text-lime-700",
    titleTypographyId: "barlow-condensed",
    previewTitleClassName:
      "uppercase [font-family:'Franklin_Gothic_Medium','Arial_Narrow',sans-serif]",
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
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const trimmed = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const resolveGymMeetTemplateId = (data: any): GymMeetTemplateId => {
  const explicit = data?.pageTemplateId;
  if (explicit === "session-companion" || explicit === "meet-app-shell") {
    return DEFAULT_GYM_MEET_TEMPLATE_ID;
  }
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

  if (/bento|mint|lavender|aerial|glitter/.test(themeId)) {
    return "bento-box";
  }

  if (lightBackground) return DEFAULT_GYM_MEET_TEMPLATE_ID;

  if (darkBackground) return "elite-athlete";

  return DEFAULT_GYM_MEET_TEMPLATE_ID;
};
