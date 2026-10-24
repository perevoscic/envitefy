import type { TemplateCategory } from "./template-categories";
import { getDeliveredThemedEventDesign } from "./event-page-themed-designs";
import { SPORT_EVENT_PRESETS } from "./sport-event-presets";
import { BRIDAL_PRESETS, getSportEventPresetLabel, styleNames, legacySportPublicTemplate, themedEventPublicTemplate, type PublicTemplate } from "./public-template-shared";
export { BRIDAL_PRESETS, matchesPublicTemplateSearch, themedEventPublicTemplate } from "./public-template-shared";
export type { PublicTemplate } from "./public-template-shared";

import { getTemplates as templates0 } from "./public-template-catalogs/weddings";
import { getTemplates as templates1 } from "./public-template-catalogs/birthdays";
import { getTemplates as templates2 } from "./public-template-catalogs/anniversaries";
import { getTemplates as templates3 } from "./public-template-catalogs/baby-showers";
import { getTemplates as templates4 } from "./public-template-catalogs/bridal-showers";
import { getTemplates as templates5 } from "./public-template-catalogs/gender-reveal";
import { getTemplates as templates6 } from "./public-template-catalogs/gymnastics";
import { getTemplates as templates7 } from "./public-template-catalogs/sport-events";
import { getTemplates as templates8 } from "./public-template-catalogs/signup-forms";
/** Synchronous server/editor API. Discovery clients import category loaders instead. */
export function getPublicTemplates(category: TemplateCategory): PublicTemplate[] {
  switch (category) {
    case "weddings": return templates0();
    case "birthdays": return templates1();
    case "anniversaries": return templates2();
    case "baby-showers": return templates3();
    case "bridal-showers": return templates4();
    case "gender-reveal": return templates5();
    case "gymnastics": return templates6();
    case "sport-events": return templates7();
    case "signup-forms": return templates8();
  }
}

export function getPublicTemplate(category: TemplateCategory, id: string) {
  const themed = getDeliveredThemedEventDesign(id);
  if (themed && ((category === "bridal-showers" && themed.collection === "bridal-showers") ||
    (category === "sport-events" && getSportEventPresetLabel(themed.collection)))) return themedEventPublicTemplate(themed);
  // Older saved drafts and published pages keep their original address after replacement.
  if (category === "bridal-showers") return BRIDAL_PRESETS.find((template) => template.id === id) || getPublicTemplates(category).find((template) => template.id === id);
  if (category === "sport-events") {
    const [sportId, style] = id.split("--");
    const sport = SPORT_EVENT_PRESETS.find((item) => item.key === sportId);
    if (sport && Object.hasOwn(styleNames, style)) return legacySportPublicTemplate(sport, style, styleNames[style as keyof typeof styleNames]);
  }
  return getPublicTemplates(category).find((template) => template.id === id);
}
