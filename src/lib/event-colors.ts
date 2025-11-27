
export type EventCategory =
  | "Birthdays"
  | "Weddings"
  | "Baby Showers"
  | "Sports"
  | "Meetings"
  | "Education"
  | "Concerts"
  | "Family"
  | "Healthcare"
  | "Appointments"
  | "General Events"
  | "Other";

export type EventColor = {
  key: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  tint: string; // light header tint backgrounds
  tile?: string; // solid tile pastel hex
};

// Palette inspired by the mockup (soft pastels with readable dark text)
const COLOR_MAP: Record<string, EventColor> = {
  Birthdays: {
    key: "emerald", // Changed to Green per screenshot
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-200",
    border: "border-emerald-300/60 dark:border-emerald-700/60",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    tint: "bg-emerald-50 dark:bg-emerald-900/20",
    tile: "#D1FAE5",
  },
  Weddings: {
    key: "blue", // Blue per screenshot
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-200",
    border: "border-blue-300/60 dark:border-blue-700/60",
    dot: "bg-blue-500 dark:bg-blue-400",
    tint: "bg-blue-50 dark:bg-blue-900/20",
    tile: "#DBEAFE",
  },
  "Baby Showers": {
    key: "pink", // Pink per screenshot
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-200",
    border: "border-pink-300/60 dark:border-pink-700/60",
    dot: "bg-pink-500 dark:bg-pink-400",
    tint: "bg-pink-50 dark:bg-pink-900/20",
    tile: "#FCE7F3",
  },
  Appointments: {
    key: "amber", // Orange/Amber per screenshot
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300/60 dark:border-amber-700/60",
    dot: "bg-amber-500 dark:bg-amber-400",
    tint: "bg-amber-50 dark:bg-amber-900/20",
    tile: "#FEF3C7",
  },
  "General Events": {
    key: "orange", // Orange per screenshot
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-800 dark:text-orange-200",
    border: "border-orange-300/60 dark:border-orange-700/60",
    dot: "bg-orange-500 dark:bg-orange-400",
    tint: "bg-orange-50 dark:bg-orange-900/20",
    tile: "#FFEDD5",
  },
  Sports: {
    key: "cyan",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-700 dark:text-cyan-200",
    border: "border-cyan-300/60 dark:border-cyan-700/60",
    dot: "bg-cyan-500 dark:bg-cyan-400",
    tint: "bg-cyan-50 dark:bg-cyan-900/20",
  },
  Meetings: {
    key: "sky",
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-200",
    border: "border-sky-300/60 dark:border-sky-700/60",
    dot: "bg-sky-500 dark:bg-sky-400",
    tint: "bg-sky-50 dark:bg-sky-900/20",
  },
  Education: {
    key: "violet",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-800 dark:text-violet-200",
    border: "border-violet-300/60 dark:border-violet-700/60",
    dot: "bg-violet-500 dark:bg-violet-400",
    tint: "bg-violet-50 dark:bg-violet-900/20",
  },
  Concerts: {
    key: "fuchsia",
    bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    text: "text-fuchsia-700 dark:text-fuchsia-200",
    border: "border-fuchsia-300/60 dark:border-fuchsia-700/60",
    dot: "bg-fuchsia-500 dark:bg-fuchsia-400",
    tint: "bg-fuchsia-50 dark:bg-fuchsia-900/20",
  },
  Family: {
    key: "rose",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-200",
    border: "border-rose-300/60 dark:border-rose-700/60",
    dot: "bg-rose-500 dark:bg-rose-400",
    tint: "bg-rose-50 dark:bg-rose-900/20",
  },
  Healthcare: {
    key: "lime",
    bg: "bg-lime-100 dark:bg-lime-900/30",
    text: "text-lime-700 dark:text-lime-200",
    border: "border-lime-300/60 dark:border-lime-700/60",
    dot: "bg-lime-500 dark:bg-lime-400",
    tint: "bg-lime-50 dark:bg-lime-900/20",
  },
  Other: {
    key: "neutral",
    bg: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-700 dark:text-neutral-200",
    border: "border-neutral-300/60 dark:border-neutral-600/60",
    dot: "bg-neutral-500 dark:bg-neutral-400",
    tint: "bg-neutral-50 dark:bg-neutral-800/40",
  },
};

export function getEventColor(input?: string | null): EventColor {
  if (!input) return COLOR_MAP.Other;
  // Direct match first
  if (COLOR_MAP[input]) return COLOR_MAP[input];
  
  const key = input.toLowerCase();
  if (/birthday|bday|cake|party/.test(key)) return COLOR_MAP.Birthdays;
  if (/wedding|marriage|bride|groom/.test(key)) return COLOR_MAP.Weddings;
  if (/baby|shower|gender|reveal/.test(key)) return COLOR_MAP["Baby Showers"];
  if (/vet|doctor|dent(ist)?|clinic|health|dr/.test(key)) return COLOR_MAP.Healthcare;
  if (/appoint/.test(key)) return COLOR_MAP.Appointments;
  if (/meet|manager|standup|sync|call/.test(key)) return COLOR_MAP.Meetings;
  if (/class|course|school|lesson|study/.test(key)) return COLOR_MAP.Education;
  if (/concert|show|live|gig|karaoke/.test(key)) return COLOR_MAP.Concerts;
  if (/soccer|game|match|home|away|stadium|vs|sport/.test(key)) return COLOR_MAP.Sports;
  if (/family|kids|parent|mom|dad/.test(key)) return COLOR_MAP.Family;
  
  return COLOR_MAP["General Events"] || COLOR_MAP.Other;
}

export function getColorByCategory(category?: string | null): EventColor {
  return getEventColor(category || "");
}

// Category icon mapping - matches icons from TEMPLATE_LINKS in navigation-config.tsx
export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase();
  // Life Milestones & Celebrations
  if (lower.includes("birthday")) return "🎂";
  if (lower.includes("wedding")) return "💍";
  if (lower.includes("baby") || lower.includes("gender")) return "🍼";
  // Appointments & General Events
  if (
    lower.includes("doctor") ||
    lower.includes("dental") ||
    lower.includes("medical") ||
    lower.includes("dr")
  )
    return "🩺";
  if (lower.includes("appointment")) return "📅";
  if (lower.includes("general")) return "📅";
  if (lower.includes("special")) return "✨";
  if (lower.includes("workshop") || lower.includes("class")) return "🧠";
  // Sports Season '25-'26
  if (lower.includes("football") && !lower.includes("soccer")) return "🏈";
  if (lower.includes("gymnastics")) return "🤸";
  if (lower.includes("cheerleading")) return "📣";
  if (lower.includes("dance") || lower.includes("ballet")) return "🩰";
  if (lower.includes("soccer") || (lower.includes("football") && lower.includes("soccer"))) return "⚽";
  if (lower.includes("sport") || lower.includes("game")) return "🏅";
  // Other categories
  if (lower.includes("meeting")) return "💼";
  if (lower.includes("vacation") || lower.includes("travel")) return "✈️";
  if (lower.includes("concert") || lower.includes("music")) return "🎵";
  if (lower.includes("movie") || lower.includes("film")) return "🎬";
  if (
    lower.includes("dinner") ||
    lower.includes("lunch") ||
    lower.includes("food")
  )
    return "🍽️";
  if (lower.includes("graduation")) return "🎓";
  if (lower.includes("conference")) return "🎤";
  if (lower.includes("holiday")) return "🎄";
  if (lower.includes("anniversary")) return "💐";
  if (lower.includes("party")) return "🎉";
  if (lower.includes("car")) return "🚗";
  if (
    lower.includes("running") || 
    lower.includes("run") ||
    lower.includes("jog")
  )
    return "🏃";
  return "📌"; // Default icon
}
