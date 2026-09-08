import { weddingDesignCatalog } from "@/lib/wedding-designs";
import { BIRTHDAY_DESIGN_CATALOG, ANNIVERSARY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import babyTemplates from "@/data/baby-shower-templates.json";
import { genderRevealDesigns } from "@/lib/gender-reveal-designs";
import { GYM_MEET_TEMPLATE_LIBRARY } from "@/components/gym-meet-templates/registry";
import { SPORT_EVENT_PRESETS } from "@/lib/sport-event-presets";
import { SIGNUP_TEMPLATES } from "@/assets/signup-templates";
import { getFamilyTemplateDesign } from "@/lib/family-template-designs";
import type { TemplateCategory } from "./template-categories";

export const BRIDAL_PRESETS = [
  { id: "champagne-gold", name: "Champagne Gold", style: "Timeless luxury", description: "Warm ivory, champagne details, and an elegant celebration of the bride.", heroImage: "/images/landing/hero/garden-brunch-desktop.webp", themeId: "golden_hour", accent: "#6e5638", background: "#f4ede3" },
  { id: "botanical-sage", name: "Botanical Sage", style: "Garden", description: "A garden gathering with soft sage, brunch details, and thoughtful host notes.", heroImage: "/images/landing/hero/galleries/bridal-hero-2.webp", themeId: "sage_green", accent: "#344c3b", background: "#e9efe8" },
  { id: "rose-quartz", name: "Rose Quartz", style: "Romantic", description: "Blush stationery and romantic lettering for a toast to the bride.", heroImage: "/images/landing/hero/galleries/bridal-hero-3.webp", themeId: "blush_pink", accent: "#6f3842", background: "#f8e7e9" },
] as const;
export type PublicTemplate = { id: string; name: string; style: string; description: string; heroImage: string; color?: string; season?: string; audience?: string; milestone?: string | number | null; sport?: string };
const styleNames = { stadium: "Stadium", club: "Club", tournament: "Tournament" };
export function getPublicTemplates(category: TemplateCategory): PublicTemplate[] {
  switch (category) {
    case "weddings": return weddingDesignCatalog;
    case "birthdays": return BIRTHDAY_DESIGN_CATALOG;
    case "anniversaries": return ANNIVERSARY_DESIGN_CATALOG;
    case "baby-showers": return babyTemplates.map((template) => ({ id: template.templateId, name: template.name, description: template.description, style: template.style, heroImage: getFamilyTemplateDesign("baby-showers", template.templateId).heroImage }));
    case "bridal-showers": return [...BRIDAL_PRESETS];
    case "gender-reveal": return genderRevealDesigns.map((design) => ({ ...design, style: design.style }));
    case "gymnastics": return GYM_MEET_TEMPLATE_LIBRARY.map((design) => ({ ...design, heroImage: design.artwork || "" }));
    case "sport-events": return SPORT_EVENT_PRESETS.flatMap((sport) => Object.entries(styleNames).map(([style, label]) => ({ id: `${sport.key}--${style}`, name: `${sport.label} · ${label}`, style: label, sport: sport.label, description: sport.defaultDetails, heroImage: "/images/landing/hero/friday-night-lights-desktop.webp" })));
    case "signup-forms": return Object.entries(SIGNUP_TEMPLATES).flatMap(([group, designs]) => designs.map((design) => ({ id: design.path.replace("/templates/signup/", "").replace(/\.webp$/, "").replaceAll("/", "--"), name: design.name, description: `Make ${design.name.toLowerCase()} your own with signup sections, questions, and slots.`, style: group, heroImage: design.path }))).filter((template, index, templates) => templates.findIndex((candidate) => candidate.id === template.id) === index);
  }
}
export function getPublicTemplate(category: TemplateCategory, id: string) {
  return getPublicTemplates(category).find((template) => template.id === id);
}
