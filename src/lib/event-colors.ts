export type EventCategory =
  | "Birthdays"
  | "Sports"
  | "Meetings"
  | "Education"
  | "Concerts"
  | "Family"
  | "Healthcare"
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
const COLOR_MAP: Record<EventCategory, EventColor> = {
  Birthdays: {
    key: "pink",
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-700 dark:text-pink-200",
    border: "border-pink-300/60 dark:border-pink-700/60",
    dot: "bg-pink-500 dark:bg-pink-400",
    tint: "bg-pink-50 dark:bg-pink-900/20",
    tile: "#FCE8F3",
  },
  Sports: {
    key: "green",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-200",
    border: "border-green-300/60 dark:border-green-700/60",
    dot: "bg-green-500 dark:bg-green-400",
    tint: "bg-green-50 dark:bg-green-900/20",
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
    key: "amber",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300/60 dark:border-amber-700/60",
    dot: "bg-amber-500 dark:bg-amber-400",
    tint: "bg-amber-50 dark:bg-amber-900/20",
  },
  Concerts: {
    key: "violet",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-200",
    border: "border-violet-300/60 dark:border-violet-700/60",
    dot: "bg-violet-500 dark:bg-violet-400",
    tint: "bg-violet-50 dark:bg-violet-900/20",
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
  const key = (input || "").toLowerCase();
  if (/birthday|bday|cake|party/.test(key)) return COLOR_MAP.Birthdays;
  if (/vet|doctor|dent(ist)?|clinic|health/.test(key)) return COLOR_MAP.Healthcare;
  if (/meet|manager|standup|sync|call/.test(key)) return COLOR_MAP.Meetings;
  if (/class|course|school|lesson|study/.test(key)) return COLOR_MAP.Education;
  if (/concert|show|live|gig|karaoke/.test(key)) return COLOR_MAP.Concerts;
  if (/soccer|game|match|home|away|stadium|vs/.test(key))
    return COLOR_MAP.Sports;
  if (/family|kids|parent|mom|dad/.test(key)) return COLOR_MAP.Family;
  const normalized = (input[0].toUpperCase() + input.slice(1)) as EventCategory;
  return (COLOR_MAP as any)[normalized] || COLOR_MAP.Other;
}

export function getColorByCategory(category?: string | null): EventColor {
  return getEventColor(category || "");
}


