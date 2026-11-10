import { readSourceBranding } from "./imported-event-theme";

export const SOURCE_INSPIRED_EVENT_PAGE_INSTRUCTION = `SOURCE-INSPIRED EVENT PAGE: Treat an uploaded PDF, image, or pasted public URL as factual evidence and as bounded visual inspiration. Preserve exact event facts and the source's information emphasis. Translate reliable visual signals—tonal mode, palette family, typographic category, density, hero emphasis, image prominence, shapes, and useful status/timeline/action patterns—into an original Envitefy composition. A strong dark, bold, compact, or information-led source must not be replaced with an unrelated pale, pastel, spacious, or invitation-led design. Use the closest supported Envitefy layout, bundled font category, accessible color tokens, and responsive components; maintain at least 4.5:1 text contrast and do not rely on color alone. Never copy or return the source HTML, DOM, CSS, scripts, global navigation, header/footer, logo, branded wordmark, proprietary font, exact page composition, or unlicensed artwork. Do not invent milestones, registration states, countdowns, actions, or facts merely because the source uses those component patterns. If reliable visual evidence is absent, fall back to the event category and supplied facts.`;

/** Keep source identity as sanitized design evidence, never executable markup. */
export function sourceInspiredEventPagePrompt(branding?: unknown): string {
  const source = readSourceBranding(branding);
  return [
    SOURCE_INSPIRED_EVENT_PAGE_INSTRUCTION,
    source
      ? `SANITIZED SOURCE VISUAL PROFILE: ${JSON.stringify({
          origin: source.origin,
          colors: source.colors,
          fontCategoryHint: source.font || null,
          tonalMode: source.tone || null,
        })}`
      : "SANITIZED SOURCE VISUAL PROFILE: No palette metadata is available. Use visible source pages when supplied; otherwise use the category fallback.",
  ].join("\n");
}
