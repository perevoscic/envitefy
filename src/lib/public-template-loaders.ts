import type { TemplateCategory } from "./template-categories";
import type { PublicTemplate } from "./public-template-shared";

const catalogs = new Map<TemplateCategory, Promise<PublicTemplate[]>>();

/** Only the selected category downloads its catalog. Failed imports remain retryable. */
export function loadPublicTemplates(category: TemplateCategory): Promise<PublicTemplate[]> {
  const cached = catalogs.get(category);
  if (cached) return cached;
  let pending: Promise<PublicTemplate[]>;
  switch (category) {
    case "weddings": pending = import("./public-template-catalogs/weddings").then(({ getTemplates }) => getTemplates()); break;
    case "birthdays": pending = import("./public-template-catalogs/birthdays").then(({ getTemplates }) => getTemplates()); break;
    case "anniversaries": pending = import("./public-template-catalogs/anniversaries").then(({ getTemplates }) => getTemplates()); break;
    case "baby-showers": pending = import("./public-template-catalogs/baby-showers").then(({ getTemplates }) => getTemplates()); break;
    case "bridal-showers": pending = import("./public-template-catalogs/bridal-showers").then(({ getTemplates }) => getTemplates()); break;
    case "gender-reveal": pending = import("./public-template-catalogs/gender-reveal").then(({ getTemplates }) => getTemplates()); break;
    case "gymnastics": pending = import("./public-template-catalogs/gymnastics").then(({ getTemplates }) => getTemplates()); break;
    case "sport-events": pending = import("./public-template-catalogs/sport-events").then(({ getTemplates }) => getTemplates()); break;
    case "signup-forms": pending = import("./public-template-catalogs/signup-forms").then(({ getTemplates }) => getTemplates()); break;
  }
  catalogs.set(category, pending);
  void pending.catch(() => { if (catalogs.get(category) === pending) catalogs.delete(category); });
  return pending;
}
