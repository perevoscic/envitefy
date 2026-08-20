import {
  getSportActivityProfile,
  normalizeSportActivityKey,
  SPORT_ACTIVITY_PROFILES,
} from "@/lib/sports-discovery/profiles";

export type SportPreferenceInferenceSource = "url" | "signup" | "history";

export type SportPreferences = {
  primarySport: string | null;
  enabledSports: string[];
  setupCompleted: boolean;
};

export type SportPreferenceSuggestion = {
  sport: string;
  source: Exclude<SportPreferenceInferenceSource, "url">;
};

export const EMPTY_SPORT_PREFERENCES: SportPreferences = {
  primarySport: null,
  enabledSports: [],
  setupCompleted: false,
};

export const SPORT_PREFERENCE_OPTIONS = SPORT_ACTIVITY_PROFILES.map(({ key, label }) => ({
  key,
  label,
}));

export function normalizeSportPreferences(value: unknown): SportPreferences {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const requestedEnabled = Array.isArray(record.enabledSports) ? record.enabledSports : [];
  const enabledSports: string[] = [];
  const seen = new Set<string>();

  for (const candidate of requestedEnabled) {
    const sport = normalizeSportActivityKey(candidate);
    if (!sport || seen.has(sport)) continue;
    seen.add(sport);
    enabledSports.push(sport);
  }

  const requestedPrimary = normalizeSportActivityKey(record.primarySport);
  const primarySport =
    requestedPrimary && seen.has(requestedPrimary) ? requestedPrimary : enabledSports[0] || null;

  return {
    primarySport,
    enabledSports,
    setupCompleted: record.setupCompleted === true && Boolean(primarySport),
  };
}

export function isSportsCreationEnabled(visibleTemplateKeys: readonly string[]): boolean {
  return visibleTemplateKeys.includes("gymnastics") || visibleTemplateKeys.includes("sport_events");
}

export function syncSportsVisibilityKeys(
  visibleTemplateKeys: readonly string[],
  preferences: SportPreferences,
  sportsEnabled: boolean,
): string[] {
  const withoutSports = visibleTemplateKeys.filter(
    (key) => key !== "gymnastics" && key !== "sport_events",
  );
  if (!sportsEnabled) return withoutSports;

  const next = [...withoutSports];
  if (preferences.enabledSports.includes("gymnastics")) next.push("gymnastics");
  if (preferences.enabledSports.some((sport) => sport !== "gymnastics")) {
    next.push("sport_events");
  }
  if (!preferences.setupCompleted && !next.includes("sport_events")) {
    next.push("sport_events");
  }
  return next;
}

export function buildSportCreationHref(sport: unknown): string {
  const normalized = normalizeSportActivityKey(sport);
  if (normalized === "gymnastics") return "/event/gymnastics";
  return normalized
    ? `/event/sport-events?sport=${encodeURIComponent(normalized)}`
    : "/event/sport-events";
}

export function getSportCreationLabel(sport: unknown): string {
  return getSportActivityProfile(sport)?.label || "Sports";
}

function isTruthy(value: unknown): boolean {
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
}

export function isOwnedSportInferenceRecord(data: unknown): boolean {
  if (!data || typeof data !== "object") return true;
  const record = data as Record<string, unknown>;
  const sourceContext =
    record.sourceContext && typeof record.sourceContext === "object"
      ? (record.sourceContext as Record<string, unknown>)
      : {};
  const sourceIntent = String(sourceContext.detectedSourceIntent || "").toLowerCase();
  if (sourceIntent === "received_invite") return false;
  const ownership = String(record.ownership || "").toLowerCase();
  if (ownership === "invited" || ownership === "imported") return false;
  if (isTruthy(record.invitedFromScan) || isTruthy(record.shared)) return false;
  return true;
}

function candidateValues(data: Record<string, unknown>, title: string): unknown[] {
  const event =
    data.event && typeof data.event === "object" ? (data.event as Record<string, unknown>) : {};
  const extra =
    data.extra && typeof data.extra === "object" ? (data.extra as Record<string, unknown>) : {};
  const customFields =
    data.customFields && typeof data.customFields === "object"
      ? (data.customFields as Record<string, unknown>)
      : {};
  return [
    data.activityProfile,
    data.sport,
    extra.sport,
    customFields.sport,
    event.activityProfile,
    event.sport,
    data.templateId,
    data.category,
    data.createdVia,
    title,
  ];
}

function normalizeExplicitEventSport(value: unknown): string | null {
  const direct = normalizeSportActivityKey(value);
  if (direct) return direct;

  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) return null;
  for (const profile of SPORT_ACTIVITY_PROFILES) {
    const tokens = [profile.key, profile.label, ...profile.aliases]
      .map((token) => token.toLowerCase())
      .filter((token) => token.length >= 4);
    if (tokens.some((token) => text.includes(token))) return profile.key;
  }
  return null;
}

export function inferSportFromEventData(data: unknown, title = ""): string | null {
  if (!isOwnedSportInferenceRecord(data)) return null;
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  for (const value of candidateValues(record, title)) {
    const sport = normalizeExplicitEventSport(value);
    if (sport) return sport;
  }
  return null;
}

export function inferSportFromRecentEvents(
  rows: Array<{ title?: string | null; data?: unknown; created_at?: string | null }>,
): string | null {
  const scores = new Map<string, { count: number; latest: number }>();
  for (const row of rows) {
    const sport = inferSportFromEventData(row.data, String(row.title || ""));
    if (!sport) continue;
    const timestamp = Date.parse(String(row.created_at || ""));
    const current = scores.get(sport) || { count: 0, latest: 0 };
    current.count += 1;
    current.latest = Math.max(current.latest, Number.isFinite(timestamp) ? timestamp : 0);
    scores.set(sport, current);
  }
  return (
    Array.from(scores.entries()).sort(
      (a, b) => b[1].count - a[1].count || b[1].latest - a[1].latest,
    )[0]?.[0] || null
  );
}
