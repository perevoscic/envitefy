import { getFootballDesign } from "@/components/football-season-templates/footballDesigns";
import { getGymMeetTemplateMeta, resolveGymMeetTemplateId } from "@/components/gym-meet-templates/registry";
import { getBabyShowerDesign, resolveBabyShowerHero } from "./baby-shower-designs";
import { getGeneralEventDesign } from "./general-event-designs";
import { getDeliveredThemedEventDesign } from "./event-page-themed-designs";
import { getPublicTemplate, getPublicTemplates } from "./public-template-catalog";
import { getSignupDesign } from "./signup-designs";
import type { TemplateCategory } from "./template-categories";

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const normalize = (value: unknown) => text(value).toLowerCase().replace(/[\s_]+/g, "-");

const categoryAliases: Record<string, string> = {
  birthday: "birthdays", anniversary: "anniversaries", wedding: "weddings",
  "baby-shower": "baby-showers", "bridal-shower": "bridal-showers",
  "gender-reveals": "gender-reveal",
  "sport-gymnastics": "gymnastics", "sport-gymnastics-schedule": "gymnastics",
  "gymnastics-schedule": "gymnastics",
  "football-season": "football", "sport-football-season": "football",
  sports: "sport-events", "sport-event": "sport-events",
  "general-events": "general", "general-event": "general",
  "sport-soccer": "soccer", "sport-cheerleading": "cheerleading",
  "sport-dance-ballet": "dance-ballet", workshop: "workshops", appointment: "appointments",
  "smart-sign-up": "signup-forms", "signup-form": "signup-forms", "sign-up-form": "signup-forms",
};

export function eventArtworkCategory(data: Record<string, unknown>): string {
  const editor = record(data.templateEditor);
  const category = normalize(editor.category || data.category || data.eventType || data.templateId);
  return categoryAliases[category] || category;
}

// These are the same fallback photographs used by the native category templates.
const nativeArtwork: Record<string, string> = {
  general: "/templates/hero-images/general-events-hero.jpeg",
  "sport-events": "/templates/hero-images/general-sport-hero.jpeg",
  soccer: "/templates/hero-images/soccer-hero.jpeg",
  cheerleading: "/templates/hero-images/cheerleading-hero.jpeg",
  "dance-ballet": "/templates/hero-images/balet-dance-hero.jpeg",
  workshops: "/templates/hero-images/workshop-classes-hero.jpeg",
  appointments: "/templates/hero-images/dr-appinments-hero.jpeg",
};
const catalogs = new Map<TemplateCategory, Map<string, string>>();
function catalogArtwork(category: TemplateCategory, ids: string[]): string | null {
  let catalog = catalogs.get(category);
  if (!catalog) {
    catalog = new Map(getPublicTemplates(category).map((design) => [design.id, design.heroImage]));
    catalogs.set(category, catalog);
  }
  for (const id of ids) {
    const artwork = catalog.get(id) || getPublicTemplate(category, id)?.heroImage;
    if (artwork) return artwork;
  }
  return null;
}

/** Resolve the selected design through the catalogs used by the guest renderers. */
export function resolveEventTemplateArtwork(data: Record<string, unknown>): string | null {
  const category = eventArtworkCategory(data);
  const theme = record(data.theme);
  const editor = record(data.templateEditor);
  const ids = [editor.templateId, data.pageTemplateId, data.variationId, theme.themeId,
    theme.id, data.themeId, data.bodyDesignId, data.templateId].map(text).filter(Boolean);
  if (["general", "bridal-showers", "sport-events"].includes(category)) {
    for (const id of ids) {
      const themed = getDeliveredThemedEventDesign(id);
      if (themed) return themed.artwork;
    }
  }
  switch (category) {
    case "gymnastics":
      return getGymMeetTemplateMeta(resolveGymMeetTemplateId({ pageTemplateId: text(data.pageTemplateId) || text(editor.templateId) })).artwork;
    case "football":
      return getFootballDesign(text(data.pageTemplateId) || text(editor.templateId)).hero;
    case "birthdays":
    case "anniversaries":
      return catalogArtwork(category, [text(data.variationId), ...ids]);
    case "weddings":
      return catalogArtwork(category, [text(theme.themeId), text(data.variationId), ...ids, "garden-wedding"]);
    case "baby-showers":
      return resolveBabyShowerHero(null, getBabyShowerDesign(text(data.templateId) || ids[0]));
    case "bridal-showers":
      return catalogArtwork(category, ids) || "/templates/hero-images/baby-shower-hero.jpeg";
    case "gender-reveal":
      return catalogArtwork(category, [text(data.templateId), ...ids]) || getPublicTemplates(category)[0]?.heroImage || null;
    case "general":
      for (const id of ids) {
        const design = getGeneralEventDesign(id);
        if (design) return design.artwork;
      }
      return nativeArtwork.general;
    case "sport-events":
      return catalogArtwork(category, ids) || nativeArtwork[category];
    case "signup-forms": {
      const form = record(data.signupForm);
      const appearance = record(form.appearance);
      if (appearance.customTheme) return null;
      return getSignupDesign(text(appearance.designId))?.artwork ||
        catalogArtwork(category, [...ids, `editorial--${text(appearance.themeId)}`]);
    }
    default:
      return nativeArtwork[category] || null;
  }
}
