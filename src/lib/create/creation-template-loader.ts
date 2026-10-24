import type { TemplateArtwork } from "@/components/events/template-artwork";
import { loadPublicTemplates } from "../public-template-loaders";
import { getTemplateCategory, templateEditorHref } from "../template-categories";
import { customCategoryForGuess, type CreateGuess } from "./create-intent";
import type { CreationTemplate } from "./creation-template";

export type CreationCatalog = {
  templates: CreationTemplate[];
  previews: Record<string, TemplateArtwork>;
  themes: Record<string, { subtype: string; label: string }>;
};
const pending = new Map<string, Promise<CreationCatalog>>();
const resolved = new Map<string, CreationCatalog>();
export const creationCatalogKey = (guess: CreateGuess) => [guess.category, guess.sport || "", guess.occasion || ""].join(":");
export const cachedCreationCatalog = (guess: CreateGuess) => resolved.get(creationCatalogKey(guess));

async function readCatalog(guess: CreateGuess): Promise<CreationCatalog> {
  const result: CreationCatalog = { templates: [], previews: {}, themes: {} };
  if (["appointments", "medical-appointments", "workshops", "special-events"].includes(guess.category)) return result;
  const category = customCategoryForGuess(guess);
  if (category === "general" && guess.category !== "signup-forms") {
    const { getGeneralCreationDesigns } = await import("./event-page-collections");
    const designs = getGeneralCreationDesigns(guess.category, guess.occasion);
    result.templates = designs.map(design => ({ id: design.id, title: design.name, imageUrl: design.artwork, description: design.description, style: design.style, category, family: "general", href: `/event/${category}/customize?templateId=${encodeURIComponent(design.id)}&collection=${encodeURIComponent(guess.category)}${guess.occasion ? `&occasion=${encodeURIComponent(guess.occasion)}` : ""}` }));
    for (const design of designs) {
      result.previews[design.id] = design;
      if ("subtype" in design && "label" in design) result.themes[design.id] = { subtype: String(design.subtype), label: design.label };
    }
    return result;
  }
  if (category === "football") {
    const { getFootballCreationTemplates } = await import("./football-creation-catalog");
    result.templates = getFootballCreationTemplates();
    return result;
  }
  const catalog = getTemplateCategory(guess.category === "signup-forms" ? "signup-forms" : guess.category === "sports" && guess.sport !== "gymnastics" ? "sport-events" : category);
  if (!catalog) return result;
  const templates = await loadPublicTemplates(catalog.slug);
  result.templates = templates.filter(template => catalog.slug !== "sport-events" || !guess.sport || template.id.startsWith(`${guess.sport}--`))
    .map(template => ({ id: template.id, title: template.name, imageUrl: template.heroImage, description: template.description, style: template.style, category: catalog.slug, family: catalog.slug === "signup-forms" ? "signup" : "native", href: templateEditorHref(catalog.slug, template.id) }));
  if (catalog.slug === "bridal-showers" || catalog.slug === "sport-events") {
    const { getThemedEventDesign } = await import("../event-page-themed-designs");
    for (const template of result.templates) {
      const design = getThemedEventDesign(template.id);
      if (design) {
        result.previews[design.id] = design;
        result.themes[design.id] = { subtype: design.subtype, label: design.label };
      }
    }
  }
  return result;
}

/** Public catalog metadata is shared; account grants and source data remain in the caller. */
export function loadCreationCatalog(guess: CreateGuess): Promise<CreationCatalog> {
  const key = creationCatalogKey(guess);
  const cached = pending.get(key);
  if (cached) return cached;
  const loading = readCatalog(guess).then(catalog => { resolved.set(key, catalog); return catalog; });
  pending.set(key, loading);
  void loading.catch(() => { if (pending.get(key) === loading) pending.delete(key); });
  return loading;
}
