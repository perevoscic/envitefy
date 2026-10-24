import { SPORT_EVENT_PRESETS } from "../sport-event-presets";
import { getActiveThemedEventDesigns } from "../event-page-themed-designs";
import { styleNames, themedEventPublicTemplate, legacySportPublicTemplate } from "../public-template-shared";
import type { PublicTemplate } from "../public-template-shared";

export function getTemplates(): PublicTemplate[] {
      return SPORT_EVENT_PRESETS.filter((sport) => sport.key !== "football").flatMap((sport) => {
        const themed = getActiveThemedEventDesigns(sport.key);
        return themed.length ? themed.map(themedEventPublicTemplate)
          : Object.entries(styleNames).map(([style, label]) => legacySportPublicTemplate(sport, style, label));
      });
}
