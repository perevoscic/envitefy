export const EVENT_PAGE_MODES = [
  "simple_social_event",
  "formal_event",
  "wedding_weekend",
  "shower_or_registry_event",
  "schedule_heavy_event",
  "sports_team_event",
  "gymnastics_meet",
  "school_or_class_event",
  "business_or_open_house",
  "custom_event",
] as const;

export const EVENT_AUDIENCE_MODES = [
  "guests",
  "parents",
  "athletes",
  "coaches",
  "family",
  "students",
  "staff",
  "customers",
  "community",
  "team",
] as const;

export const EVENT_SECTION_TYPES = [
  "hero",
  "quick_details",
  "schedule_timeline",
  "location",
  "rsvp",
  "registry",
  "travel",
  "people",
  "checklist",
  "faq",
  "announcement",
  "forms",
  "gallery",
  "links",
  "team_notes",
] as const;

export const EVENT_ACTION_TYPES = [
  "save_to_calendar",
  "get_directions",
  "rsvp",
  "share_page",
  "open_registry",
  "view_schedule",
  "contact_host",
  "open_form",
] as const;

export const EVENT_PAGE_STATUSES = ["draft", "preview", "published", "archived"] as const;

export type EventPageMode = (typeof EVENT_PAGE_MODES)[number];
export type EventAudienceMode = (typeof EVENT_AUDIENCE_MODES)[number];
export type EventSectionType = (typeof EVENT_SECTION_TYPES)[number];
export type EventActionType = (typeof EVENT_ACTION_TYPES)[number];
export type EventPageStatus = (typeof EVENT_PAGE_STATUSES)[number];

export type EventTheme = {
  mood: string;
  formality: "casual" | "semi_formal" | "formal";
  visualDensity: "low" | "medium" | "high";
  palette: string;
  typography: "clean" | "rounded" | "editorial" | "classic";
  heroStyle: "centered" | "editorial" | "dashboard" | "poster";
  sectionRhythm: "compact" | "balanced" | "spacious";
  backgroundTreatment: "solid" | "soft_gradient" | "subtle_pattern";
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
  };
};

export type EventAction = {
  id: string;
  type: EventActionType;
  label: string;
  href?: string | null;
  target?: "_self" | "_blank";
  priority: "primary" | "secondary" | "tertiary";
};

export type EventScheduleBlock = {
  id: string;
  title: string;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  locationText?: string | null;
  notes?: string | null;
  group?: string | null;
};

export type EventSection = {
  id: string;
  type: EventSectionType;
  title?: string | null;
  eyebrow?: string | null;
  body?: string | null;
  items?: Array<Record<string, string | boolean | number | null>>;
  schedule?: EventScheduleBlock[];
  actions?: EventAction[];
  media?: Array<{ id: string; url: string; alt?: string | null }>;
  metadata?: Record<string, string | boolean | number | null>;
};

export type EventPageBlueprint = {
  schemaVersion: "event_page_blueprint_v1";
  eventType: string;
  eventTone: string;
  audience: EventAudienceMode[];
  pageGoal: string;
  mode: EventPageMode;
  layoutStyle: string;
  scheduleComplexity: "none" | "simple" | "schedule_heavy";
  theme: EventTheme;
  sections: EventSection[];
  actions: EventAction[];
  generatedCopy?: Record<string, string>;
};

export type EventPageVersion = {
  id: string;
  eventPageId: string;
  versionNumber: number;
  pageBlueprint: EventPageBlueprint;
  theme: EventTheme;
  generatedCopy: Record<string, string>;
  createdBy?: string | null;
  createdAt: string;
};

export type BlueprintValidationResult =
  | { ok: true; blueprint: EventPageBlueprint; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const DEFAULT_THEME: EventTheme = {
  mood: "intentional",
  formality: "semi_formal",
  visualDensity: "medium",
  palette: "envitefy_balanced",
  typography: "clean",
  heroStyle: "dashboard",
  sectionRhythm: "balanced",
  backgroundTreatment: "soft_gradient",
  colors: {
    primary: "#5B4DCC",
    secondary: "#F3B3C8",
    background: "#F8F6FF",
    surface: "#FFFFFF",
    text: "#1F2233",
    mutedText: "#606579",
  },
};

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanString(value: unknown, fallback = "", maxLength = 240): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function cleanColor(value: unknown, fallback: string): string {
  const text = cleanString(value, "", 16);
  return HEX_COLOR_RE.test(text) ? text.toUpperCase() : fallback;
}

function cleanId(value: unknown, fallback: string): string {
  const text = cleanString(value, "", 80)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return text || fallback;
}

function normalizeTheme(value: unknown): EventTheme {
  const theme = isRecord(value) ? value : {};
  const colors = isRecord(theme.colors) ? theme.colors : {};
  return {
    mood: cleanString(theme.mood, DEFAULT_THEME.mood, 80),
    formality: pickEnum(theme.formality, ["casual", "semi_formal", "formal"], "semi_formal"),
    visualDensity: pickEnum(theme.visualDensity ?? theme.density, ["low", "medium", "high"], "medium"),
    palette: cleanString(theme.palette, DEFAULT_THEME.palette, 80),
    typography: pickEnum(theme.typography, ["clean", "rounded", "editorial", "classic"], "clean"),
    heroStyle: pickEnum(theme.heroStyle, ["centered", "editorial", "dashboard", "poster"], "dashboard"),
    sectionRhythm: pickEnum(theme.sectionRhythm, ["compact", "balanced", "spacious"], "balanced"),
    backgroundTreatment: pickEnum(
      theme.backgroundTreatment,
      ["solid", "soft_gradient", "subtle_pattern"],
      "soft_gradient",
    ),
    colors: {
      primary: cleanColor(colors.primary, DEFAULT_THEME.colors.primary),
      secondary: cleanColor(colors.secondary, DEFAULT_THEME.colors.secondary),
      background: cleanColor(colors.background, DEFAULT_THEME.colors.background),
      surface: cleanColor(colors.surface, DEFAULT_THEME.colors.surface),
      text: cleanColor(colors.text, DEFAULT_THEME.colors.text),
      mutedText: cleanColor(colors.mutedText, DEFAULT_THEME.colors.mutedText),
    },
  };
}

function normalizeAction(value: unknown, index: number): EventAction | null {
  if (!isRecord(value)) return null;
  const type = pickEnum(value.type, EVENT_ACTION_TYPES, "share_page");
  const label = cleanString(value.label, "", 80);
  if (!label) return null;
  const target = pickEnum(value.target, ["_self", "_blank"], "_self");
  return {
    id: cleanId(value.id, `${type}-${index}`),
    type,
    label,
    href: cleanString(value.href, "", 500) || null,
    target,
    priority: pickEnum(value.priority, ["primary", "secondary", "tertiary"], "secondary"),
  };
}

function normalizeScheduleBlock(value: unknown, index: number): EventScheduleBlock | null {
  if (!isRecord(value)) return null;
  const title = cleanString(value.title || value.label || value.name, "", 140);
  if (!title) return null;
  return {
    id: cleanId(value.id, `schedule-${index}`),
    title,
    startAt: cleanString(value.startAt || value.start || value.startISO, "", 100) || null,
    endAt: cleanString(value.endAt || value.end || value.endISO, "", 100) || null,
    timezone: cleanString(value.timezone || value.tz, "", 80) || null,
    locationText: cleanString(value.locationText || value.location || value.venue, "", 180) || null,
    notes: cleanString(value.notes || value.description, "", 260) || null,
    group: cleanString(value.group, "", 120) || null,
  };
}

function normalizeItems(value: unknown): Array<Record<string, string | boolean | number | null>> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) {
        const label = cleanString(item, "", 180);
        return label ? { label } : null;
      }
      const out: Record<string, string | boolean | number | null> = {};
      for (const [key, inner] of Object.entries(item)) {
        if (!/^[a-zA-Z0-9_-]{1,40}$/.test(key)) continue;
        if (typeof inner === "string") out[key] = cleanString(inner, "", 300);
        else if (typeof inner === "boolean" || typeof inner === "number" || inner === null) {
          out[key] = inner;
        }
      }
      return Object.keys(out).length ? out : null;
    })
    .filter((item): item is Record<string, string | boolean | number | null> => Boolean(item))
    .slice(0, 30);
}

function normalizeSection(value: unknown, index: number): EventSection | null {
  if (!isRecord(value)) return null;
  const typeRaw = cleanString(value.type, "", 80);
  if (!EVENT_SECTION_TYPES.includes(typeRaw as EventSectionType)) return null;
  const type = typeRaw as EventSectionType;
  const schedule = Array.isArray(value.schedule)
    ? value.schedule.map(normalizeScheduleBlock).filter((item): item is EventScheduleBlock => Boolean(item))
    : [];
  const actions = Array.isArray(value.actions)
    ? value.actions.map(normalizeAction).filter((item): item is EventAction => Boolean(item))
    : [];
  const media = Array.isArray(value.media)
    ? value.media
        .map((item, mediaIndex) => {
          if (!isRecord(item)) return null;
          const url = cleanString(item.url, "", 500);
          if (!url || url.startsWith("data:")) return null;
          return {
            id: cleanId(item.id, `media-${mediaIndex}`),
            url,
            alt: cleanString(item.alt, "", 160) || null,
          };
        })
        .filter((item): item is { id: string; url: string; alt: string | null } => Boolean(item))
        .slice(0, 12)
    : [];
  return {
    id: cleanId(value.id, `${type}-${index}`),
    type,
    title: cleanString(value.title, "", 160) || null,
    eyebrow: cleanString(value.eyebrow, "", 80) || null,
    body: cleanString(value.body || value.description, "", 900) || null,
    items: normalizeItems(value.items),
    schedule,
    actions,
    media,
    metadata: normalizeItems([value.metadata])[0] || {},
  };
}

export function validateEventPageBlueprint(value: unknown): BlueprintValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Blueprint must be an object."], warnings };

  const sections = Array.isArray(value.sections)
    ? value.sections.map(normalizeSection).filter((item): item is EventSection => Boolean(item))
    : [];
  if (!sections.some((section) => section.type === "hero")) {
    warnings.push("A hero section was added because the blueprint did not include one.");
    sections.unshift({
      id: "hero",
      type: "hero",
      title: cleanString(value.eventType, "Event", 120),
      body: cleanString(value.pageGoal, "A shared Envitefy event page.", 400),
      items: [],
      schedule: [],
      actions: [],
      media: [],
      metadata: {},
    });
  }
  if (!sections.length) errors.push("Blueprint must include at least one supported section.");

  const audience = Array.isArray(value.audience)
    ? value.audience
        .map((item) => pickEnum(item, EVENT_AUDIENCE_MODES, null as never))
        .filter((item): item is EventAudienceMode => EVENT_AUDIENCE_MODES.includes(item))
    : [];

  const actions = Array.isArray(value.actions)
    ? value.actions.map(normalizeAction).filter((item): item is EventAction => Boolean(item))
    : [];

  const blueprint: EventPageBlueprint = {
    schemaVersion: "event_page_blueprint_v1",
    eventType: cleanString(value.eventType, "custom_event", 100),
    eventTone: cleanString(value.eventTone, "intentional", 100),
    audience: audience.length ? audience.slice(0, 8) : ["guests"],
    pageGoal: cleanString(value.pageGoal, "Share event details and next steps.", 300),
    mode: pickEnum(value.mode || value.pageMode, EVENT_PAGE_MODES, "custom_event"),
    layoutStyle: cleanString(value.layoutStyle, "dynamic_event_hub", 80),
    scheduleComplexity: pickEnum(value.scheduleComplexity, ["none", "simple", "schedule_heavy"], "simple"),
    theme: normalizeTheme(value.theme),
    sections: sections.slice(0, 18),
    actions: actions.slice(0, 8),
    generatedCopy: isRecord(value.generatedCopy)
      ? Object.fromEntries(
          Object.entries(value.generatedCopy)
            .map(([key, inner]) => [key, cleanString(inner, "", 500)])
            .filter(([, inner]) => Boolean(inner)),
        )
      : {},
  };

  return errors.length ? { ok: false, errors, warnings } : { ok: true, blueprint, warnings };
}

export function assertEventPageBlueprint(value: unknown): EventPageBlueprint {
  const result = validateEventPageBlueprint(value);
  if (!result.ok) throw new Error(result.errors.join(" "));
  return result.blueprint;
}
