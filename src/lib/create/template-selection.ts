import { getPublicTemplates } from "../public-template-catalog";
import { GENERAL_EVENT_DESIGNS } from "../general-event-designs";
import { FOOTBALL_GALLERY_DESIGNS } from "@/components/football-season-templates/footballGallery";
import { getFootballDesign } from "@/components/football-season-templates/footballDesigns";
import { getTemplateCategory, templateEditorHref } from "../template-categories";
import { customCategoryForGuess, type CreateGuess } from "./create-intent";

export type CreationTemplate = {
  id: string; title: string; imageUrl: string; href: string; category: string;
  description: string; style: string; family: "native" | "general" | "football" | "custom" | "signup" | "live-card";
};
/** Use the actual native catalogs, so recommendations never promise a fictional template. */
export function getCreationTemplates(guess: CreateGuess): CreationTemplate[] {
  if (["appointments", "medical-appointments", "workshops", "special-events"].includes(guess.category)) return [];
  if (guess.category === "signup-forms") return getPublicTemplates("signup-forms").map(template => ({ id: template.id, title: template.name, imageUrl: template.heroImage, description: template.description, style: template.style, category: "signup-forms", family: "signup", href: templateEditorHref("signup-forms", template.id) }));
  const category = customCategoryForGuess(guess);
  if (category === "general")
    return GENERAL_EVENT_DESIGNS.map(design => ({ id: design.id, title: design.name, imageUrl: design.artwork, description: design.description, style: design.style, category, family: "general", href: `/event/${category}/customize?templateId=${encodeURIComponent(design.id)}` }));
  if (category === "football") return FOOTBALL_GALLERY_DESIGNS.map(design => ({ id: design.id, title: design.name, imageUrl: getFootballDesign(design.id).hero, description: design.description, style: design.style, category, family: "football", href: `/event/football/customize?templateId=${encodeURIComponent(design.id)}` }));
  const catalog = getTemplateCategory(guess.category === "sports" && guess.sport !== "gymnastics" ? "sport-events" : category);
  if (!catalog) return [];
  return getPublicTemplates(catalog.slug)
    .filter(template => catalog.slug !== "sport-events" || !guess.sport || template.id.startsWith(`${guess.sport}--`))
    .map(template => ({ id: template.id, title: template.name, imageUrl: template.heroImage, description: template.description, style: template.style, category: catalog.slug, family: catalog.slug === "signup-forms" ? "signup" : "native", href: templateEditorHref(catalog.slug, template.id) }));
}
