const SPORTS_PREVIEW_FIRST_CATEGORIES = new Set([
  "sport_event",
  "sport_soccer",
  "sport_football_season",
  "sport_football_practice",
  "sport_cheerleading",
  "sport_dance_ballet",
  "sport_gymnastics",
  "sport_gymnastics_schedule",
  "gymnastics",
]);

const SPORTS_PREVIEW_FIRST_TEMPLATE_IDS = new Set([
  "sport-event",
  "soccer",
  "football-season",
  "football-practice",
  "cheerleading-season",
  "dance-ballet-season",
  "gymnastics",
  "gymnastics-schedule",
]);

export function isSportsPreviewFirstEvent(eventData: unknown): boolean {
  if (!eventData || typeof eventData !== "object") return false;

  const record = eventData as Record<string, unknown>;
  const category = String(record.category || "")
    .trim()
    .toLowerCase();
  const templateId = String(record.templateId || "")
    .trim()
    .toLowerCase();

  return (
    SPORTS_PREVIEW_FIRST_CATEGORIES.has(category) ||
    SPORTS_PREVIEW_FIRST_TEMPLATE_IDS.has(templateId)
  );
}
