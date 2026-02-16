export type UserPersona =
  | "parents_moms"
  | "organizers"
  | "couples"
  | "sports_staff"
  | "educators"
  | "church_community"
  | "business_teams"
  | "general";

export type DashboardLayout = "default" | "sports_focused";

export type TemplateKey =
  | "birthdays"
  | "weddings"
  | "baby_showers"
  | "gender_reveal"
  | "appointments"
  | "football_season"
  | "gymnastics"
  | "cheerleading"
  | "dance_ballet"
  | "soccer"
  | "sport_events"
  | "workshops"
  | "general"
  | "special_events";

export type QuickAccessKey = "snap" | "upload" | "smart_signup";

export type VisibilityState = {
  persona: UserPersona | null;
  personas: UserPersona[];
  visibleTemplateKeys: TemplateKey[];
  quickAccess: QuickAccessKey[];
  dashboardLayout: DashboardLayout;
};

export type TemplateDef = {
  key: TemplateKey;
  label: string;
  href: string;
  icon?: string;
  section:
    | "milestones"
    | "sports"
    | "appointments_general";
};

export const TEMPLATE_DEFINITIONS: TemplateDef[] = [
  {
    key: "birthdays",
    label: "Birthdays",
    href: "/event/birthdays/customize",
    icon: "🎂",
    section: "milestones",
  },
  {
    key: "weddings",
    label: "Weddings",
    href: "/event/weddings/customize",
    icon: "💍",
    section: "milestones",
  },
  {
    key: "baby_showers",
    label: "Baby Showers",
    href: "/event/baby-showers/customize",
    icon: "🍼",
    section: "milestones",
  },
  {
    key: "gender_reveal",
    label: "Gender Reveal",
    href: "/event/gender-reveal/customize",
    icon: "🎈",
    section: "milestones",
  },
  {
    key: "appointments",
    label: "Doctor Appointments",
    href: "/event/appointments/customize",
    icon: "🩺",
    section: "appointments_general",
  },
  {
    key: "football_season",
    label: "Football Season",
    href: "/event/football-season/customize",
    icon: "🏈",
    section: "sports",
  },
  {
    key: "gymnastics",
    label: "Gymnastics Schedule",
    href: "/event/gymnastics/customize",
    icon: "🤸",
    section: "sports",
  },
  {
    key: "cheerleading",
    label: "Cheerleading",
    href: "/event/cheerleading/customize",
    icon: "📣",
    section: "sports",
  },
  {
    key: "dance_ballet",
    label: "Dance / Ballet",
    href: "/event/dance-ballet/customize",
    icon: "🩰",
    section: "sports",
  },
  {
    key: "soccer",
    label: "Soccer",
    href: "/event/soccer/customize",
    icon: "⚽",
    section: "sports",
  },
  {
    key: "sport_events",
    label: "Sport Events",
    href: "/event/sport-events/customize",
    icon: "🏅",
    section: "sports",
  },
  {
    key: "workshops",
    label: "Workshops / Classes",
    href: "/event/workshops/customize",
    icon: "🧠",
    section: "appointments_general",
  },
  {
    key: "general",
    label: "General Events",
    href: "/event/general/customize",
    icon: "📅",
    section: "appointments_general",
  },
  {
    key: "special_events",
    label: "Special Events",
    href: "/event/special-events/customize",
    icon: "✨",
    section: "appointments_general",
  },
];

export const TEMPLATE_KEYS = TEMPLATE_DEFINITIONS.map((t) => t.key);

const ALL_TEMPLATE_KEYS_SET = new Set<TemplateKey>(TEMPLATE_KEYS);

export const QUICK_ACCESS_DEFAULT: QuickAccessKey[] = [
  "snap",
  "upload",
  "smart_signup",
];

export const PERSONA_PRESETS: Record<UserPersona, TemplateKey[]> = {
  parents_moms: [
    "birthdays",
    "baby_showers",
    "gender_reveal",
    "appointments",
    "general",
    "special_events",
    "sport_events",
    "soccer",
  ],
  organizers: [
    "general",
    "special_events",
    "workshops",
    "appointments",
    "sport_events",
    "birthdays",
    "weddings",
    "baby_showers",
  ],
  couples: [
    "weddings",
    "birthdays",
    "general",
    "special_events",
    "appointments",
  ],
  sports_staff: [
    "football_season",
    "gymnastics",
    "cheerleading",
    "dance_ballet",
    "soccer",
    "sport_events",
    "workshops",
    "general",
    "appointments",
  ],
  educators: [
    "workshops",
    "general",
    "special_events",
    "sport_events",
    "appointments",
  ],
  church_community: [
    "general",
    "special_events",
    "workshops",
    "appointments",
    "birthdays",
    "baby_showers",
  ],
  business_teams: [
    "general",
    "special_events",
    "workshops",
    "appointments",
  ],
  general: [...TEMPLATE_KEYS],
};

const SPORTS_KEYS: TemplateKey[] = [
  "football_season",
  "gymnastics",
  "cheerleading",
  "dance_ballet",
  "soccer",
  "sport_events",
];

export function getTemplateDefByKey(key: TemplateKey): TemplateDef | null {
  return TEMPLATE_DEFINITIONS.find((d) => d.key === key) || null;
}

export function normalizeTemplateKeys(keys: unknown): TemplateKey[] {
  if (!Array.isArray(keys)) return [];
  const out: TemplateKey[] = [];
  const seen = new Set<string>();
  for (const raw of keys) {
    const key = String(raw || "").trim() as TemplateKey;
    if (!ALL_TEMPLATE_KEYS_SET.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function normalizePersona(value: unknown): UserPersona | null {
  const v = String(value || "").trim() as UserPersona;
  if (v in PERSONA_PRESETS) return v;
  return null;
}

export function normalizePersonas(values: unknown): UserPersona[] {
  if (!Array.isArray(values)) return [];
  const out: UserPersona[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const persona = normalizePersona(value);
    if (!persona) continue;
    if (seen.has(persona)) continue;
    seen.add(persona);
    out.push(persona);
  }
  return out;
}

export function mergeTemplateKeysForPersonas(personas: UserPersona[]): TemplateKey[] {
  if (!personas.length) return [...PERSONA_PRESETS.general];
  const merged = new Set<TemplateKey>();
  for (const persona of personas) {
    for (const key of PERSONA_PRESETS[persona] || []) {
      merged.add(key);
    }
  }
  return Array.from(merged);
}

export function resolveDashboardLayout(persona: UserPersona | null): DashboardLayout {
  if (persona === "sports_staff") return "sports_focused";
  return "default";
}

export function resolveVisibility(input: {
  persona?: unknown;
  personas?: unknown;
  visibleTemplateKeys?: unknown;
}): VisibilityState {
  const normalizedPersonas = normalizePersonas(input.personas);
  const persona =
    normalizePersona(input.persona) || normalizedPersonas[0] || null;
  const personas =
    normalizedPersonas.length > 0
      ? normalizedPersonas
      : persona
      ? [persona]
      : [];
  const normalizedKeys = normalizeTemplateKeys(input.visibleTemplateKeys);
  const preset = mergeTemplateKeysForPersonas(personas);
  const visibleTemplateKeys =
    normalizedKeys.length > 0 ? normalizedKeys : [...preset];

  return {
    persona,
    personas,
    visibleTemplateKeys,
    quickAccess: [...QUICK_ACCESS_DEFAULT],
    dashboardLayout: resolveDashboardLayout(persona),
  };
}

export function isTemplateVisible(
  key: TemplateKey,
  visibleTemplateKeys: TemplateKey[]
): boolean {
  return visibleTemplateKeys.includes(key);
}

export function filterTemplateDefinitions(
  visibleTemplateKeys: TemplateKey[]
): TemplateDef[] {
  const allowed = new Set(visibleTemplateKeys);
  return TEMPLATE_DEFINITIONS.filter((d) => allowed.has(d.key));
}

export function getSportsKeys(): TemplateKey[] {
  return [...SPORTS_KEYS];
}

export function isSportsKey(key: TemplateKey): boolean {
  return SPORTS_KEYS.includes(key);
}

export function mapEventCategoryKeyToTemplateKey(
  eventCategoryKey: string
): TemplateKey | null {
  const key = String(eventCategoryKey || "").toLowerCase();
  const map: Record<string, TemplateKey> = {
    birthdays: "birthdays",
    weddings: "weddings",
    baby_showers: "baby_showers",
    gender_reveal: "gender_reveal",
    appointments: "appointments",
    sport_events: "sport_events",
    general: "general",
    special_events: "special_events",
  };
  return map[key] || null;
}

export function inferTemplateKeyFromEventData(input: {
  category?: string | null;
  title?: string | null;
}): TemplateKey | null {
  const cat = String(input.category || "").toLowerCase();
  const title = String(input.title || "").toLowerCase();
  const text = `${cat} ${title}`;

  if (text.includes("birthday")) return "birthdays";
  if (text.includes("wedding")) return "weddings";
  if (text.includes("baby shower")) return "baby_showers";
  if (text.includes("gender reveal")) return "gender_reveal";
  if (text.includes("doctor") || text.includes("appointment")) return "appointments";
  if (text.includes("football")) return "football_season";
  if (text.includes("gymnastics")) return "gymnastics";
  if (text.includes("cheer")) return "cheerleading";
  if (text.includes("dance") || text.includes("ballet")) return "dance_ballet";
  if (text.includes("soccer")) return "soccer";
  if (text.includes("sport")) return "sport_events";
  if (text.includes("workshop") || text.includes("class")) return "workshops";
  if (text.includes("special")) return "special_events";
  if (text.includes("general")) return "general";
  return null;
}
