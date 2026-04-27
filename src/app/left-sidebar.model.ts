export type CalendarProviderKey = "google" | "microsoft" | "apple";

export type SidebarPage =
  | "root"
  | "createEvent"
  | "createEventOther"
  | "myEvents"
  | "invitedEvents"
  | "eventContext";

export type EventSidebarMode = "owner" | "guest";

export type EventListPage = "myEvents" | "invitedEvents";

export type CompactNavItemId =
  | "home"
  | "studio"
  | "snap"
  | "create"
  | "myEvents"
  | "invitedEvents";

export type CompactNavItem = {
  id: CompactNavItemId;
  icon: any;
  label: string;
  href?: string;
  onClick: () => void;
  badge?: number;
};

export type HistoryRow = {
  id: string;
  title: string;
  created_at?: string;
  data?: unknown;
};

export type InlineStyle = Record<string, string | number>;

export type GroupedEventItem = {
  row: HistoryRow;
  href: string;
  openMode: "dashboard" | "preview";
  showQuickActions: boolean;
  title: string;
  dateLabel: string;
  dateMs: number;
  shareStatus: "accepted" | "pending" | null;
  tintClass: string;
  hoverTintClass: string;
  activeTintClass: string;
  activeCardClass: string;
  style?: InlineStyle;
};

export type GroupedEventSection = {
  category: string;
  items: GroupedEventItem[];
};

export type GroupedEventLists = Record<
  EventListPage,
  {
    upcoming: GroupedEventSection[];
    past: GroupedEventSection[];
  }
>;

export const CALENDAR_DEFAULT_STORAGE_KEY =
  "envitefy:event-actions:calendar-default:v1";
export const MY_EVENTS_PAST_EXPANDED_STORAGE_KEY =
  "sidebar:my-events:past-expanded";
export const INVITED_EVENTS_PAST_EXPANDED_STORAGE_KEY =
  "sidebar:invited-events:past-expanded";
export const CREATE_ACTIVE_STORAGE_KEY = "sidebar:create-event:last-selection";

export const SIDEBAR_CARD_CLASS =
  "rounded-[24px]";
export const SIDEBAR_ITEM_CARD_CLASS =
  "nav-chrome-motion rounded-full";
export const SIDEBAR_BADGE_CLASS =
  "inline-flex min-w-[20px] items-center justify-center rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-[#7269dd] shadow-[0_8px_18px_rgba(126,111,233,0.14)]";
export const SIDEBAR_WIDTH_REM = "20rem";
export const SUBPAGE_STICKY_HEADER_CLASS =
  "sticky top-0 z-20 -mx-5 bg-[linear-gradient(180deg,rgba(245,243,255,0.98),rgba(245,243,255,0.82))] px-5 pb-4 pt-2 backdrop-blur-xl";
export const SIDEBAR_DIVIDER_CLASS = "h-px w-full bg-transparent";
export const SIDEBAR_MENU_ROW_CLASS =
  "flex w-full items-center gap-3 px-3 py-3 text-left text-[0.92rem] font-semibold uppercase tracking-[0.12em]";
export const SIDEBAR_BACK_ROW_CLASS =
  "flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-3 text-left text-sm shadow-[0_16px_34px_rgba(120,105,214,0.14)]";
export const SIDEBAR_ICON_CHIP_CLASS =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full";
export const SIDEBAR_ICON_CHIP_ACCENT_CLASS =
  "";
export const SIDEBAR_PANEL_CLASS =
  "nav-chrome-sidebar-scroll-region absolute inset-0 overflow-y-auto no-scrollbar px-5 pb-36 touch-pan-y lg:pb-40";
export const SIDEBAR_EVENT_PANEL_CLASS =
  "absolute inset-0 overflow-hidden nav-chrome-sidebar-surface";
export const SIDEBAR_FOOTER_TRIGGER_CLASS =
  "nav-chrome-motion w-full inline-flex items-center justify-between gap-3 rounded-[18px] border border-[#ece8ff] bg-white px-3 py-3 shadow-[0_16px_32px_rgba(123,112,206,0.12)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[rgba(110,94,181,0.18)]";

export const CATEGORY_DEFAULT_COLOR_MAP: Record<string, string> = {
  Birthdays: "pink",
  Weddings: "purple",
  "Baby Showers": "fuchsia",
  "DR Appointments": "red",
  Appointments: "amber",
  "Sport Events": "indigo",
  "General Events": "orange",
  "Car Pool": "cyan",
  "Play Days": "lime",
  "Doctor Appointments": "rose",
  Meetings: "sky",
  Education: "teal",
  Concerts: "blue",
  Family: "emerald",
  Healthcare: "green",
  Gymnastics: "violet",
  "Football Season": "green",
  Cheerleading: "amber",
  "Dance / Ballet": "slate",
  "Workshop / Class": "teal",
  "Gender Reveal": "fuchsia",
  "General Event": "orange",
  Soccer: "cyan",
};

export const CATEGORY_FALLBACK_COLORS = [
  "stone",
  "gray",
  "zinc",
  "neutral",
  "slate",
  "yellow",
  "lime",
  "cyan",
  "sky",
  "teal",
  "emerald",
  "blue",
  "indigo",
  "violet",
  "purple",
  "pink",
  "fuchsia",
  "red",
  "orange",
  "amber",
];

export const CREATE_SECTION_COLORS = [
  "border border-[rgba(110,94,181,0.14)] bg-[rgba(244,239,255,0.92)] text-[#5c4ab0]",
  "border border-[rgba(108,136,214,0.16)] bg-[rgba(237,243,255,0.92)] text-[#4d67b7]",
  "border border-[rgba(148,111,212,0.16)] bg-[rgba(244,238,255,0.92)] text-[#7a59bf]",
  "border border-[rgba(83,149,198,0.16)] bg-[rgba(236,246,255,0.92)] text-[#4f75b5]",
];

const SIDEBAR_PRIMARY_ACTIVE_ACCENT = {
  buttonClass: "nav-chrome-sidebar-row-active",
  buttonStyle: {
    background: "#ffffff",
    borderColor: "rgba(232, 228, 255, 0.9)",
    boxShadow: "0 16px 34px rgba(120, 105, 214, 0.16)",
  } as InlineStyle,
  chipClass: "text-[#6b5fd6]",
  chevronClass: "text-[#b4acef]",
};

const SIDEBAR_FOOTBALL_ACTIVE_ACCENT = {
  buttonClass: "nav-chrome-sidebar-row-active",
  buttonStyle: {
    background: "#ffffff",
    borderColor: "rgba(232, 228, 255, 0.9)",
    boxShadow: "0 16px 34px rgba(120, 105, 214, 0.16)",
  } as InlineStyle,
  chipClass: "text-[#6b5fd6]",
  chevronClass: "text-[#b4acef]",
};

const CATEGORY_LABEL_OVERRIDES: Record<string, string> = {
  sport_football_season: "Football Season",
  "sport football season": "Football Season",
  "football season": "Football Season",
  sport_gymnastics_schedule: "Gymnastics",
  sport_gymnastics: "Gymnastics",
  "gymnastics schedule": "Gymnastics",
  sport_cheerleading: "Cheerleading",
  "sport cheerleading": "Cheerleading",
  sport_dance_ballet: "Dance / Ballet",
  "sport dance ballet": "Dance / Ballet",
  sport_soccer: "Soccer",
  "sport soccer": "Soccer",
  sport_event: "Sport Event",
  "sport events": "Sport Events",
  general_event: "General Event",
  workshop_class: "Workshop / Class",
  gender_reveal: "Gender Reveal",
  dr_appointment: "Doctor Appointments",
  doctor_appointment: "Doctor Appointments",
  special_event: "Special Events",
};

function titleCase(phrase: string) {
  return phrase
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function createSidebarIconLookup(icons: Record<string, any>) {
  return {
    "Snap Event": icons.Camera,
    "Upload Event": icons.Upload,
    "Smart sign-up forms": icons.FileEdit,
    "Sign up": icons.FileEdit,
    Birthdays: icons.Cake,
    Weddings: icons.Heart,
    "Baby Showers": icons.Baby,
    "Gender Reveal": icons.PartyPopper,
    "Football Season": icons.SidebarFootballMenuIcon,
    "Sport Football Season": icons.SidebarFootballMenuIcon,
    "General Event": icons.CalendarDays,
    "Gymnastics Schedule": icons.SidebarGymnasticsMenuIcon,
    Gymnastics: icons.SidebarGymnasticsMenuIcon,
    Cheerleading: icons.WandSparkles,
    "Dance / Ballet": icons.Footprints,
    Soccer: icons.Trophy,
    "Sport Events": icons.Trophy,
    "Doctor Appointments": icons.Stethoscope,
    "Workshops / Classes": icons.GraduationCap,
    "Workshop / Class": icons.GraduationCap,
    "General Events": icons.CalendarDays,
    "Special Events": icons.Music,
  };
}

export function normalizeCalendarProvider(
  value: unknown
): CalendarProviderKey | null {
  if (typeof value !== "string") return null;
  const provider = value.trim().toLowerCase();
  if (
    provider === "google" ||
    provider === "microsoft" ||
    provider === "apple"
  ) {
    return provider;
  }
  return null;
}

export function getCreateMenuActiveAccent(label: string) {
  if (label === "Football Season") {
    return SIDEBAR_FOOTBALL_ACTIVE_ACCENT;
  }
  return SIDEBAR_PRIMARY_ACTIVE_ACCENT;
}

export function getSidebarPrimaryActiveAccent() {
  return SIDEBAR_PRIMARY_ACTIVE_ACCENT;
}

export function normalizeCategoryLabel(
  raw: string | null | undefined
): string | null {
  const source = String(raw || "").trim();
  if (!source) return null;
  const deslugged = source.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const lowered = deslugged.toLowerCase();

  const override = CATEGORY_LABEL_OVERRIDES[lowered];
  if (override) return override;
  if (/^wedding(s)?$/.test(lowered)) return "Weddings";
  if (/^birthday(s)?$/.test(lowered) || /birthday\s*party/.test(lowered)) {
    return "Birthdays";
  }
  if (
    /^baby\s*shower(s)?$/.test(lowered) ||
    /\bbaby[-\s]?shower(s)?\b/.test(lowered)
  ) {
    return "Baby Showers";
  }
  if (/gender\s*reveal/.test(lowered)) return "Gender Reveal";
  if (
    /^(doctor|dr|medical|dental)\s*appointment(s)?$/.test(lowered) ||
    /\b(doctor|dr|medical|dental)\b.*\bappointment(s)?\b/.test(lowered)
  ) {
    return "Doctor Appointments";
  }
  if (/^appointment(s)?$/.test(lowered)) return "Appointments";
  if (/gymnastic(s)?/.test(lowered)) return "Gymnastics";
  if (/football\s+season/.test(lowered)) return "Football Season";
  if (/cheerleading|cheer leader|cheer\b/.test(lowered)) {
    return "Cheerleading";
  }
  if (/dance|ballet/.test(lowered)) return "Dance / Ballet";
  if (/soccer/.test(lowered)) return "Soccer";
  if (
    /^sport(s)?\s*event(s)?$/.test(lowered) ||
    /\b(sport|game|tournament|match)\b/.test(lowered)
  ) {
    return "Sport Events";
  }
  if (/workshop|class/.test(lowered)) return "Workshop / Class";
  if (/^play\s*day(s)?$/.test(lowered) || /playdate(s)?/.test(lowered)) {
    return "Play Days";
  }
  if (/car\s*pool|carpool/.test(lowered)) return "Car Pool";
  if (/^general(\s*events?)?$/.test(lowered)) return "General Events";
  return titleCase(deslugged);
}

export function guessCategoryFromText(text: string): string | null {
  const source = String(text || "").toLowerCase();
  if (!source) return null;
  if (/birthday|b-day|turns\s+\d+|party for/.test(source)) {
    return "Birthdays";
  }
  if (/wedding|bridal|ceremony|reception/.test(source)) return "Weddings";
  if (/\b(baby[-\s]?shower|sprinkle)\b/.test(source)) {
    return "Baby Showers";
  }
  if (/doctor|dentist|appointment|check[- ]?up|clinic/.test(source)) {
    return "Doctor Appointments";
  }
  if (/game|match|vs\.|at\s+[A-Z]|tournament|championship|league/.test(source)) {
    return "Sport Events";
  }
  if (/playdate|play\s*day|kids?\s*play/.test(source)) return "Play Days";
  if (
    /(car\s*pool|carpool|ride\s*share|school\s*pickup|school\s*drop[- ]?off)/.test(
      source
    )
  ) {
    return "Car Pool";
  }
  if (/appointment|meeting|consult/.test(source)) return "Appointments";
  return null;
}

export function defaultCategoryColor(category: string): string {
  const trimmed = String(category || "").trim();
  if (!trimmed) return "gray";
  const preset = CATEGORY_DEFAULT_COLOR_MAP[trimmed];
  if (preset) return preset;
  const hash = trimmed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CATEGORY_FALLBACK_COLORS[hash % CATEGORY_FALLBACK_COLORS.length];
}

export function colorClasses(color: string) {
  switch (color) {
    case "lime":
      return {
        swatch: "bg-lime-500 border-lime-200",
        badge: "border-lime-200 bg-lime-50 text-lime-700",
        tint: "border-lime-100 bg-lime-50/80",
        hoverTint: "hover:border-lime-200 hover:bg-lime-100/80",
      };
    case "zinc":
      return {
        swatch: "bg-zinc-500 border-zinc-200",
        badge: "border-zinc-200 bg-zinc-50 text-zinc-700",
        tint: "border-zinc-100 bg-zinc-50/80",
        hoverTint: "hover:border-zinc-200 hover:bg-zinc-100/80",
      };
    case "neutral":
      return {
        swatch: "bg-neutral-500 border-neutral-200",
        badge: "border-neutral-200 bg-neutral-50 text-neutral-700",
        tint: "border-neutral-100 bg-neutral-50/80",
        hoverTint: "hover:border-neutral-200 hover:bg-neutral-100/80",
      };
    case "stone":
      return {
        swatch: "bg-stone-500 border-stone-200",
        badge: "border-stone-200 bg-stone-50 text-stone-700",
        tint: "border-stone-100 bg-stone-50/80",
        hoverTint: "hover:border-stone-200 hover:bg-stone-100/80",
      };
    case "gray":
      return {
        swatch: "bg-gray-500 border-gray-200",
        badge: "border-gray-200 bg-gray-50 text-gray-700",
        tint: "border-gray-100 bg-gray-50/80",
        hoverTint: "hover:border-gray-200 hover:bg-gray-100/80",
      };
    case "red":
      return {
        swatch: "bg-red-500 border-red-200",
        badge: "border-red-200 bg-red-50 text-red-700",
        tint: "border-red-100 bg-red-50/80",
        hoverTint: "hover:border-red-200 hover:bg-red-100/80",
      };
    case "pink":
      return {
        swatch: "bg-pink-500 border-pink-200",
        badge: "border-pink-200 bg-pink-50 text-pink-700",
        tint: "border-pink-100 bg-pink-50/80",
        hoverTint: "hover:border-pink-200 hover:bg-pink-100/80",
      };
    case "rose":
      return {
        swatch: "bg-rose-500 border-rose-200",
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        tint: "border-rose-100 bg-rose-50/80",
        hoverTint: "hover:border-rose-200 hover:bg-rose-100/80",
      };
    case "fuchsia":
      return {
        swatch: "bg-fuchsia-500 border-fuchsia-200",
        badge: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        tint: "border-fuchsia-100 bg-fuchsia-50/80",
        hoverTint: "hover:border-fuchsia-200 hover:bg-fuchsia-100/80",
      };
    case "violet":
      return {
        swatch: "bg-violet-500 border-violet-200",
        badge: "border-violet-200 bg-violet-50 text-violet-700",
        tint: "border-violet-100 bg-violet-50/80",
        hoverTint: "hover:border-violet-200 hover:bg-violet-100/80",
      };
    case "purple":
      return {
        swatch: "bg-purple-500 border-purple-200",
        badge: "border-purple-200 bg-purple-50 text-purple-700",
        tint: "border-purple-100 bg-purple-50/80",
        hoverTint: "hover:border-purple-200 hover:bg-purple-100/80",
      };
    case "indigo":
      return {
        swatch: "bg-indigo-500 border-indigo-200",
        badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
        tint: "border-indigo-100 bg-indigo-50/80",
        hoverTint: "hover:border-indigo-200 hover:bg-indigo-100/80",
      };
    case "blue":
      return {
        swatch: "bg-blue-500 border-blue-200",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        tint: "border-blue-100 bg-blue-50/80",
        hoverTint: "hover:border-blue-200 hover:bg-blue-100/80",
      };
    case "sky":
      return {
        swatch: "bg-sky-500 border-sky-200",
        badge: "border-sky-200 bg-sky-50 text-sky-700",
        tint: "border-sky-100 bg-sky-50/80",
        hoverTint: "hover:border-sky-200 hover:bg-sky-100/80",
      };
    case "cyan":
      return {
        swatch: "bg-cyan-500 border-cyan-200",
        badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
        tint: "border-cyan-100 bg-cyan-50/80",
        hoverTint: "hover:border-cyan-200 hover:bg-cyan-100/80",
      };
    case "teal":
      return {
        swatch: "bg-teal-500 border-teal-200",
        badge: "border-teal-200 bg-teal-50 text-teal-700",
        tint: "border-teal-100 bg-teal-50/80",
        hoverTint: "hover:border-teal-200 hover:bg-teal-100/80",
      };
    case "emerald":
      return {
        swatch: "bg-emerald-500 border-emerald-200",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        tint: "border-emerald-100 bg-emerald-50/80",
        hoverTint: "hover:border-emerald-200 hover:bg-emerald-100/80",
      };
    case "green":
      return {
        swatch: "bg-green-500 border-green-200",
        badge: "border-green-200 bg-green-50 text-green-700",
        tint: "border-green-100 bg-green-50/80",
        hoverTint: "hover:border-green-200 hover:bg-green-100/80",
      };
    case "yellow":
      return {
        swatch: "bg-yellow-500 border-yellow-200",
        badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
        tint: "border-yellow-100 bg-yellow-50/80",
        hoverTint: "hover:border-yellow-200 hover:bg-yellow-100/80",
      };
    case "amber":
      return {
        swatch: "bg-amber-500 border-amber-200",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        tint: "border-amber-100 bg-amber-50/80",
        hoverTint: "hover:border-amber-200 hover:bg-amber-100/80",
      };
    case "orange":
      return {
        swatch: "bg-orange-500 border-orange-200",
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        tint: "border-orange-100 bg-orange-50/80",
        hoverTint: "hover:border-orange-200 hover:bg-orange-100/80",
      };
    case "slate":
      return {
        swatch: "bg-slate-500 border-slate-200",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        tint: "border-slate-100 bg-slate-50/80",
        hoverTint: "hover:border-slate-200 hover:bg-slate-100/80",
      };
    default:
      return {
        swatch: "bg-slate-400 border-slate-200",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        tint: "border-slate-100 bg-slate-50/80",
        hoverTint: "hover:border-slate-200 hover:bg-slate-100/80",
      };
  }
}

export function activeEventCardClasses(color: string): string {
  switch (color) {
    case "purple":
    case "violet":
    case "fuchsia":
    case "indigo":
    case "pink":
      return "!bg-purple-100 !border-purple-200";
    case "blue":
    case "sky":
    case "cyan":
      return "!bg-blue-100 !border-blue-200";
    case "teal":
    case "emerald":
    case "green":
    case "lime":
      return "!bg-emerald-100 !border-emerald-200";
    case "yellow":
    case "amber":
    case "orange":
      return "!bg-amber-100 !border-amber-200";
    case "red":
    case "rose":
      return "!bg-rose-100 !border-rose-200";
    default:
      return "!bg-slate-100 !border-slate-200";
  }
}

export function isInvitedHistoryEvent(
  data: unknown,
  isInvitedEventLikeRecord: (record: Record<string, unknown>) => boolean
): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return Boolean(record.shared) || isInvitedEventLikeRecord(record);
}

export function countGroupedEventItems(sections: GroupedEventSection[]) {
  return sections.reduce((acc, section) => acc + section.items.length, 0);
}

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

function hexToRgba(hex: string, alpha: number) {
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatEventDate(raw: string) {
  if (!raw) return "No date";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function createGroupedBuckets() {
  return {
    upcoming: new Map<string, GroupedEventItem[]>(),
    past: new Map<string, GroupedEventItem[]>(),
  };
}

function sortGroupedSections(source: Map<string, GroupedEventItem[]>) {
  const priority = new Map<string, number>([
    ["drafts", 0],
    ["birthdays", 1],
    ["general events", 2],
    ["weddings", 3],
  ]);

  return Array.from(source.entries())
    .map(([category, items]) => ({
      category,
      items: [...items].sort((a, b) => {
        if (a.dateMs !== b.dateMs) return a.dateMs - b.dateMs;
        return a.title.localeCompare(b.title);
      }),
    }))
    .sort((a, b) => {
      const left = priority.get(a.category.toLowerCase());
      const right = priority.get(b.category.toLowerCase());
      if (typeof left === "number" && typeof right === "number") {
        return left - right;
      }
      if (typeof left === "number") return -1;
      if (typeof right === "number") return 1;
      return a.category.localeCompare(b.category);
    });
}

export function buildGroupedEventLists(args: {
  history: HistoryRow[];
  getEventStartIso: (data: unknown) => unknown;
  buildEventPath: (eventId: string, title: string) => string;
  isSportsPreviewFirstEvent: (data: unknown) => boolean;
  isInvitedEventLikeRecord: (record: Record<string, unknown>) => boolean;
}): GroupedEventLists {
  const bucketsByList: Record<EventListPage, ReturnType<typeof createGroupedBuckets>> =
    {
      myEvents: createGroupedBuckets(),
      invitedEvents: createGroupedBuckets(),
    };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfTodayMs = today.getTime();

  for (const row of args.history || []) {
    if (!row || typeof row !== "object") continue;
    const data = ((row as HistoryRow).data || {}) as Record<string, any>;
    const isInvited = isInvitedHistoryEvent(
      data,
      args.isInvitedEventLikeRecord
    );
    if (data?.signupForm && !isInvited) continue;

    const targetList: EventListPage = isInvited
      ? "invitedEvents"
      : "myEvents";
    const isDraft = String(data?.status || "").toLowerCase() === "draft";
    const normalizedCategoryRaw = normalizeCategoryLabel(
      (data?.category as string | null) ||
        guessCategoryFromText(
          `${row.title || ""} ${String(data?.description || "")}`
        )
    );
    const normalizedCategory =
      isInvited &&
      String(normalizedCategoryRaw || "")
        .trim()
        .toLowerCase() === "shared events"
        ? "Invited Events"
        : normalizedCategoryRaw;
    const category = isDraft
      ? "Drafts"
      : normalizedCategory || "General Events";

    const dateRaw =
      String(args.getEventStartIso(row?.data) || row?.created_at || "").trim();
    const parsedDateMs = dateRaw ? new Date(dateRaw).getTime() : Number.NaN;
    const dateMs = Number.isNaN(parsedDateMs)
      ? Number.POSITIVE_INFINITY
      : parsedDateMs;
    const dateLabel = formatEventDate(dateRaw);
    const href = args.buildEventPath(row.id, row.title);
    const openMode: GroupedEventItem["openMode"] =
      args.isSportsPreviewFirstEvent(data) ? "preview" : "dashboard";
    const rawShareStatus = String(data?.shareStatus || "").trim().toLowerCase();
    const shareStatus =
      rawShareStatus === "accepted"
        ? "accepted"
        : rawShareStatus === "pending"
          ? "pending"
          : null;
    const createdVia = String(
      data?.createdVia ||
        data?.source ||
        data?.ingestMethod ||
        data?.origin ||
        "",
    )
      .trim()
      .toLowerCase();
    const isSnappedOrUploaded =
      Boolean(data?.invitedFromScan) || /(snap|scan|ocr|upload)/.test(createdVia);

    const categoryColor = defaultCategoryColor(category);
    const palette = colorClasses(isInvited ? "slate" : categoryColor);
    const activePalette = colorClasses(categoryColor);
    const eventHex = String(data?.color || data?.event?.color || "").trim();
    const style =
      !isInvited && isHexColor(eventHex)
        ? {
            backgroundColor: hexToRgba(eventHex, 0.12),
            borderColor: hexToRgba(eventHex, 0.26),
          }
        : undefined;

    const entry: GroupedEventItem = {
      row,
      href,
      openMode,
      showQuickActions: isInvited || isSnappedOrUploaded,
      title: row.title || "Untitled event",
      dateLabel,
      dateMs,
      shareStatus,
      tintClass: palette.tint,
      hoverTintClass: palette.hoverTint,
      activeTintClass: activePalette.tint,
      activeCardClass: activeEventCardClasses(categoryColor),
      style,
    };

    const targetBuckets = bucketsByList[targetList];
    const targetGroup =
      Number.isFinite(dateMs) && dateMs < startOfTodayMs
        ? targetBuckets.past
        : targetBuckets.upcoming;
    const currentItems = targetGroup.get(category) || [];
    currentItems.push(entry);
    targetGroup.set(category, currentItems);
  }

  return {
    myEvents: {
      upcoming: sortGroupedSections(bucketsByList.myEvents.upcoming),
      past: sortGroupedSections(bucketsByList.myEvents.past),
    },
    invitedEvents: {
      upcoming: sortGroupedSections(bucketsByList.invitedEvents.upcoming),
      past: sortGroupedSections(bucketsByList.invitedEvents.past),
    },
  };
}
