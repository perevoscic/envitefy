import { buildEventPath } from "./event-url";

/**
 * Builds the edit link URL. For weddings, uses the event page URL format;
 * for other event types, goes directly to customize.
 */
export const buildEditLink = (
  eventId: string,
  eventData: any,
  eventTitle: string
): string => {
  try {
    const normalizedCategory = String(eventData?.category || "")
      .toLowerCase()
      .trim();
    const title = String(eventTitle || "").toLowerCase();
    const templateId =
      typeof (eventData as any)?.templateId === "string"
        ? ((eventData as any).templateId as string)
        : null;
    const variationId =
      typeof (eventData as any)?.variationId === "string"
        ? ((eventData as any).variationId as string)
        : null;

    // Weddings - use event page URL format
    // Check category (case-insensitive) or if templateId is "wedding" or title contains "wedding"
    const isWedding =
      normalizedCategory.includes("wedding") ||
      title.includes("wedding") ||
      templateId === "wedding";

    if (isWedding) {
      return buildEventPath(eventId, eventTitle, {
        edit: eventId,
        templateId: templateId || undefined,
        variationId: variationId || undefined,
      });
    }

    // For other event types, use resolveEditHref
    return resolveEditHref(eventId, eventData, eventTitle);
  } catch {
    return resolveEditHref(eventId, eventData, eventTitle);
  }
};

export const resolveEditHref = (
  eventId: string,
  eventData: any,
  eventTitle: string
): string => {
  try {
    const normalizedCategory = String(eventData?.category || "")
      .toLowerCase()
      .trim();
    const title = String(eventTitle || "").toLowerCase();
    const templateId =
      typeof (eventData as any)?.templateId === "string"
        ? ((eventData as any).templateId as string)
        : null;
    const variationId =
      typeof (eventData as any)?.variationId === "string"
        ? ((eventData as any).variationId as string)
        : null;

    // Birthdays
    if (
      normalizedCategory.includes("birthday") ||
      /birthday|b[-\s]?day/.test(title)
    ) {
      if (templateId && variationId) {
        return `/event/birthdays/customize?templateId=${encodeURIComponent(
          templateId
        )}&variationId=${encodeURIComponent(
          variationId
        )}&edit=${encodeURIComponent(eventId)}`;
      }
      return `/event/birthdays?edit=${encodeURIComponent(eventId)}`;
    }

    // Baby/Bridal showers
    if (
      normalizedCategory.includes("baby") ||
      normalizedCategory.includes("shower") ||
      title.includes("baby shower") ||
      (title.includes("baby") && title.includes("shower")) ||
      title.includes("bridal shower")
    ) {
      if (templateId && variationId) {
        return `/event/baby-showers/customize?templateId=${encodeURIComponent(
          templateId
        )}&variationId=${encodeURIComponent(
          variationId
        )}&edit=${encodeURIComponent(eventId)}`;
      }
      return `/event/baby-showers?edit=${encodeURIComponent(eventId)}`;
    }

    // Weddings
    if (normalizedCategory.includes("wedding") || title.includes("wedding")) {
      if (templateId && variationId) {
        return `/event/weddings/customize?templateId=${encodeURIComponent(
          templateId
        )}&variationId=${encodeURIComponent(
          variationId
        )}&edit=${encodeURIComponent(eventId)}`;
      }
      return `/event/weddings?edit=${encodeURIComponent(eventId)}`;
    }

    // Sports & activity templates
    const templateSlugById: Record<string, string> = {
      "football-season": "football-season",
      "football-practice": "football-practice",
      soccer: "soccer",
      "sport-event": "sport-events",
      "cheerleading-season": "cheerleading",
      "dance-ballet-season": "dance-ballet",
      "gymnastics-schedule": "gymnastics",
    };
    const templateSlugByCategory: Record<string, string> = {
      sport_football_season: "football-season",
      sport_football_practice: "football-practice",
      sport_soccer: "soccer",
      sport_event: "sport-events",
      sport_cheerleading: "cheerleading",
      sport_dance_ballet: "dance-ballet",
      sport_gymnastics_schedule: "gymnastics",
    };

    const sportSlug =
      (templateId && templateSlugById[templateId]) ||
      templateSlugByCategory[
        normalizedCategory as keyof typeof templateSlugByCategory
      ];

    if (sportSlug) {
      return `/event/${sportSlug}/customize?edit=${encodeURIComponent(eventId)}`;
    }

    // Fallback to event page with edit flag
    return `/event/${encodeURIComponent(eventId)}?edit=${encodeURIComponent(
      eventId
    )}`;
  } catch {
    return `/event/${encodeURIComponent(eventId)}?edit=${encodeURIComponent(
      eventId
    )}`;
  }
};
