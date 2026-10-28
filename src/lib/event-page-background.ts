import { getGymMeetTemplateMeta, isGymMeetTemplateId } from "../components/gym-meet-templates/registry.ts";
import { extractSolidColor, normalizeColor } from "./theme-color-format.ts";
import { themeColorPalette } from "./theme-color.ts";

export function resolveEventPageBackgroundColor(input?: unknown): string {
  if (!input || typeof input !== "object") return themeColorPalette.background;
  const data = input as Record<string, unknown>;
  const editor = data.templateEditor && typeof data.templateEditor === "object" ? data.templateEditor as Record<string, unknown> : null;
  const discovery = data.discovery && typeof data.discovery === "object" ? data.discovery as Record<string, unknown> : null;
  const gymDesign = [data.pageTemplateId, discovery?.pageTemplateId, editor?.templateId].find(isGymMeetTemplateId);
  if (gymDesign || /gymnastics/.test(String(data.category || data.templateId || ""))) {
    return getGymMeetTemplateMeta(gymDesign).background;
  }
  const theme = typeof data.theme === "object" && data.theme ? (data.theme as Record<string, unknown>) : null;
  const themeColors =
    theme && typeof theme.colors === "object" && theme.colors
      ? (theme.colors as Record<string, unknown>)
      : null;
  const event = typeof data.event === "object" && data.event ? (data.event as Record<string, unknown>) : null;
  const eventTheme =
    event && typeof event.theme === "object" && event.theme
      ? (event.theme as Record<string, unknown>)
      : null;
  const eventThemeColors =
    eventTheme && typeof eventTheme.colors === "object" && eventTheme.colors
      ? (eventTheme.colors as Record<string, unknown>)
      : null;
  const flyerColors =
    typeof data.flyerColors === "object" && data.flyerColors
      ? (data.flyerColors as Record<string, unknown>)
      : null;
  const ocrSkin =
    typeof data.ocrSkin === "object" && data.ocrSkin
      ? (data.ocrSkin as Record<string, unknown>)
      : null;
  const ocrSkinPalette =
    ocrSkin && typeof ocrSkin.palette === "object" && ocrSkin.palette
      ? (ocrSkin.palette as Record<string, unknown>)
      : null;

  const candidateColors = [
    data.pageBackgroundColor,
    themeColors?.background,
    theme?.background,
    theme?.backgroundColor,
    eventThemeColors?.background,
    eventTheme?.background,
    eventTheme?.backgroundColor,
    event?.pageBackgroundColor,
    event?.backgroundColor,
    event?.background,
    ocrSkinPalette?.background,
    flyerColors?.background,
    data.backgroundColor,
    data.background,
  ];

  for (const candidate of candidateColors) {
    const normalized = normalizeColor(
      typeof candidate === "string"
        ? extractSolidColor(candidate)
        : null,
    );
    if (normalized) return normalized;
  }

  return themeColorPalette.background;
}

