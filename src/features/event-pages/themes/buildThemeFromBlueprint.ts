import type { EventPageBlueprint, EventTheme } from "../schemas/eventBlueprint.schema";
import { EVENT_THEME_DEFAULTS } from "./eventThemeTokens";

export function buildThemeFromBlueprint(blueprint: EventPageBlueprint): EventTheme {
  return {
    ...EVENT_THEME_DEFAULTS,
    ...blueprint.theme,
    colors: {
      ...EVENT_THEME_DEFAULTS.colors,
      ...(blueprint.theme?.colors || {}),
    },
  };
}
