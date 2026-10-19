/** Creation permissions are independent of signup attribution and menu preferences. */
export const CREATION_PRODUCTS = ["snap", "live_card", "event_page", "signup_form"] as const;
export type CreationProduct = (typeof CREATION_PRODUCTS)[number];
export const CREATION_PRODUCT_LABELS: Record<CreationProduct, string> = {
  snap: "Snap a Flyer", live_card: "Live Card", event_page: "Event Page", signup_form: "Sign-up Form",
};
export const CREATION_CATEGORY_LABELS = {
  general: "General Events", birthdays: "Birthdays", weddings: "Weddings", anniversaries: "Anniversaries",
  "baby-showers": "Baby Showers", "bridal-showers": "Bridal Showers", "gender-reveal": "Gender Reveal",
  gymnastics: "Gymnastics", football: "Football", "sport-events": "Other Sports",
  soccer: "Soccer", cheerleading: "Cheerleading", "dance-ballet": "Dance / Ballet",
} as const;
export type CreationCategory = keyof typeof CREATION_CATEGORY_LABELS;
export const CREATION_CATEGORIES = Object.keys(CREATION_CATEGORY_LABELS) as CreationCategory[];
export type CreationAccess = { policy: "standard" | "restricted"; allowedCategories: CreationCategory[]; allowedProducts: CreationProduct[] };

export function normalizeCreationProduct(value: unknown): CreationProduct | null {
  return typeof value === "string" && (CREATION_PRODUCTS as readonly string[]).includes(value) ? value as CreationProduct : null;
}
export function normalizeCreationCategory(value: unknown): CreationCategory | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[\s_/]+/g, "-");
  if (Object.hasOwn(CREATION_CATEGORY_LABELS, key)) return key as CreationCategory;
  const aliases: Record<string, CreationCategory> = {
    birthday: "birthdays", wedding: "weddings", anniversary: "anniversaries", "baby-shower": "baby-showers",
    "bridal-shower": "bridal-showers", "football-season": "football", "football-practice": "football",
    "sport-football-season": "football", "sport-football-practice": "football", "gymnastics-schedule": "gymnastics",
    "sport-gymnastics": "gymnastics", "sport-gymnastics-schedule": "gymnastics", "sport-soccer": "soccer",
    "sport-cheerleading": "cheerleading", "cheerleading-season": "cheerleading", "sport-dance-ballet": "dance-ballet",
    "dance-ballet-season": "dance-ballet", dance: "dance-ballet", ballet: "dance-ballet", cheer: "cheerleading",
    sports: "sport-events", "sport-event": "sport-events", "sport-events": "sport-events", "general-event": "general",
    "general-events": "general", "gender-reveals": "gender-reveal",
  };
  return aliases[key] || null;
}
export function resolveCreationAccess(row?: { policy?: unknown; categories?: unknown; products?: unknown } | null): CreationAccess {
  const restricted = row?.policy === "restricted";
  return {
    policy: restricted ? "restricted" : "standard",
    allowedCategories: restricted ? [...new Set((Array.isArray(row?.categories) ? row.categories : []).map(normalizeCreationCategory).filter((key): key is CreationCategory => Boolean(key)))] : [...CREATION_CATEGORIES],
    allowedProducts: restricted ? [...new Set((Array.isArray(row?.products) ? row.products : []).map(normalizeCreationProduct).filter((key): key is CreationProduct => Boolean(key)))] : [...CREATION_PRODUCTS],
  };
}
export function creationAllowed(access: CreationAccess, product: CreationProduct, category?: unknown): boolean {
  const key = category == null ? null : normalizeCreationCategory(category);
  return access.allowedProducts.includes(product) && (category == null || Boolean(key && access.allowedCategories.includes(key)));
}
export function templateKeyCreationCategory(key: string): CreationCategory | null {
  return normalizeCreationCategory(key);
}
export function filterCreationTemplateKeys<T extends string>(keys: readonly T[], access: CreationAccess): T[] {
  return access.allowedProducts.includes("event_page") ? keys.filter((key) => {
    if (key === "sport_events") return access.allowedCategories.some((category) => ["sport-events", "soccer", "cheerleading", "dance-ballet"].includes(category));
    const category = templateKeyCreationCategory(key);
    return Boolean(category && access.allowedCategories.includes(category));
  }) : [];
}
const record = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
/** Imported card facts retain their category when the card editor uses General event. */
export function liveCardCreationCategories(value: unknown): CreationCategory[] {
  const form = record(value);
  const categories = [...new Set([form.creationCategory, form.eventType].map(normalizeCreationCategory).filter((key): key is CreationCategory => Boolean(key)))];
  const specific = categories.filter((key) => key !== "general" && key !== "sport-events");
  return specific.length ? specific : categories.length ? categories : ["general"];
}
/** Derive authorization from structural metadata as well as the legacy category string. */
export function eventCreationRequirement(value: unknown): { product: CreationProduct; categories: CreationCategory[] } {
  const data = record(value);
  const custom = record(data.customEventPage);
  const editor = record(data.templateEditor);
  const discovery = record(data.discoverySource);
  const source = record(data.sourceContext);
  const received = source.detectedSourceIntent === "received_invite" || data.ownership === "invited" || data.ownership === "imported" || data.invitedFromScan === true;
  // Guest/received flags are presentation data and cannot grant new creation permission.
  const product: CreationProduct = data.signupForm || editor.category === "signup-forms" ? "signup_form"
    : data.createdVia === "livecard-builder" || data.studioCard ? "live_card"
      : custom.version === 1 || editor.category || data.manualEditor || discovery.workflow || data.pipelineSummary?.workflow || data.createdVia === "custom-event-page" ? "event_page"
        : received || data.attachment || /scan|ocr|upload/.test(String(data.createdVia || "")) ? "snap" : "event_page";
  if (product === "signup_form" || product === "snap") return { product, categories: [] };
  const cardForm = record(record(data.liveCardBuilder).form);
  if (product === "live_card") return { product, categories: liveCardCreationCategories({ ...cardForm, creationCategory: data.creationCategory || cardForm.creationCategory, eventType: cardForm.eventType || data.category }) };
  const candidates = [data.creationCategory, cardForm.creationCategory, cardForm.eventType, custom.category, editor.category, discovery.workflow === "sports" ? discovery.activityProfile || discovery.input?.activityProfile || data.activityProfile || "sport-events" : discovery.workflow, data.category, data.templateId];
  const categories = [...new Set(candidates.map(normalizeCreationCategory).filter((key): key is CreationCategory => Boolean(key)))];
  if (data.occasion === "bridal-shower") return { product, categories: ["bridal-showers"] };
  const specific = categories.filter((key) => key !== "general" && key !== "sport-events");
  return { product, categories: specific.length ? specific : categories.length ? categories : ["general"] };
}
/** A requested capability is selected on approval; other personalization remains intact. */
export function approvedCreationPreferences(value: unknown, kind: string, capability: string): Record<string, any> {
  const metadata = { ...record(value) };
  if (kind === "product") {
    if (capability === "signup_form") metadata.quickAccess = [...new Set([...(Array.isArray(metadata.quickAccess) ? metadata.quickAccess : ["snap", "upload", "smart_signup"]), "smart_signup"])];
    return metadata;
  }
  const category = normalizeCreationCategory(capability);
  if (!category) return metadata;
  const templateKeys: Partial<Record<CreationCategory, string>> = { general: "general", birthdays: "birthdays", weddings: "weddings", anniversaries: "anniversaries", "baby-showers": "baby_showers", "bridal-showers": "bridal_showers", "gender-reveal": "gender_reveal", gymnastics: "gymnastics", football: "football_season", "sport-events": "sport_events", soccer: "sport_events", cheerleading: "sport_events", "dance-ballet": "sport_events" };
  metadata.visibleTemplateKeys = [...new Set([...(Array.isArray(metadata.visibleTemplateKeys) ? metadata.visibleTemplateKeys : []), templateKeys[category]])].filter(Boolean);
  if (["gymnastics", "football", "soccer", "cheerleading", "dance-ballet"].includes(category)) {
    const preferences = record(metadata.sportPreferences);
    const sport = category === "dance-ballet" ? "dance" : category;
    const enabledSports = [...new Set([...(Array.isArray(preferences.enabledSports) ? preferences.enabledSports : []), sport])];
    metadata.sportPreferences = { ...preferences, enabledSports, primarySport: preferences.primarySport || sport, setupCompleted: true };
  }
  return metadata;
}
