import { FOOTBALL_GALLERY_DESIGNS } from "@/components/football-season-templates/footballGallery";
import { getFootballDesign } from "@/components/football-season-templates/footballDesigns";
import type { CreationTemplate } from "./creation-template";
export function getFootballCreationTemplates(): CreationTemplate[] {
  return FOOTBALL_GALLERY_DESIGNS.map(design => ({ id: design.id, title: design.name, imageUrl: getFootballDesign(design.id).hero, description: design.description, style: design.style, category: "football", family: "football", href: `/event/football/customize?templateId=${encodeURIComponent(design.id)}` }));
}
