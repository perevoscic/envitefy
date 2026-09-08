import type { SignupIntent } from "./signup-intent";

export const TEMPLATE_CATEGORIES = [
  { slug: "weddings", name: "Weddings", intent: "weddings", historyCategory: "Weddings", editor: "/event/weddings/customize" },
  { slug: "birthdays", name: "Birthdays", intent: "birthdays", historyCategory: "Birthdays", editor: "/event/birthdays/customize" },
  { slug: "anniversaries", name: "Anniversaries", intent: "anniversaries", historyCategory: "Anniversaries", editor: "/event/anniversaries/customize" },
  { slug: "baby-showers", name: "Baby showers", intent: "baby_showers", historyCategory: "Baby Showers", editor: "/event/baby-showers/customize" },
  { slug: "bridal-showers", name: "Bridal showers", intent: "bridal_showers", historyCategory: "Bridal Showers", editor: "/event/baby-showers/customize" },
  { slug: "gender-reveal", name: "Gender reveals", intent: "gender_reveal", historyCategory: "Gender Reveal", editor: "/event/gender-reveal/customize" },
  { slug: "gymnastics", name: "Gymnastics", intent: "gymnastics", historyCategory: "Gymnastics", editor: "/event/gymnastics/customize" },
  { slug: "sport-events", name: "Sports", intent: "sport_events", historyCategory: "sport_event", editor: "/event/sport-events/customize" },
  { slug: "signup-forms", name: "Signup forms", intent: "signup_forms", historyCategory: "Smart sign-up", editor: "/templates/signup" },
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]["slug"];
export function getTemplateCategory(slug: string) {
  return TEMPLATE_CATEGORIES.find((category) => category.slug === (["sports", "football"].includes(slug) ? "sport-events" : slug));
}
export function templateCategoryForPath(path: string) {
  return getTemplateCategory(path.split("/").filter(Boolean)[0] || "");
}
export function templateEditorHref(category: TemplateCategory, templateId: string) {
  return `/${category}/templates/${encodeURIComponent(templateId)}/customize`;
}
export function templateSignupIntent(category: TemplateCategory): SignupIntent {
  return getTemplateCategory(category)!.intent;
}
export function isPublicTemplatePath(path: string) {
  const parts = path.replace(/\/+$/, "").split("/").filter(Boolean);
  return Boolean(getTemplateCategory(parts[0]) && parts[1] === "templates" &&
    (parts.length === 2 || (parts.length === 4 && parts[3] === "customize")));
}
