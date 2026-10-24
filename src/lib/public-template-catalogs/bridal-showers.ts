import { getActiveThemedEventDesigns } from "../event-page-themed-designs";
import { BRIDAL_PRESETS, themedEventPublicTemplate } from "../public-template-shared";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return getActiveThemedEventDesigns("bridal-showers").length
        ? getActiveThemedEventDesigns("bridal-showers").map(themedEventPublicTemplate)
        : [...BRIDAL_PRESETS];
}
