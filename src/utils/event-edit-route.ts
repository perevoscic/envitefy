import { buildEventPath } from "./event-url";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveConciergeEditHref(eventData: unknown): string | null {
  const record = asRecord(eventData);
  if (!record) return null;

  const createdVia = cleanString(record.createdVia).toLowerCase();
  const conciergeDraft = asRecord(record.conciergeDraft);
  const threadId =
    cleanString(conciergeDraft?.creationSessionId) || cleanString(record.creationSessionId);
  const isConciergeCreatedEvent = /concierge|chat/.test(createdVia) || Boolean(conciergeDraft);

  if (!isConciergeCreatedEvent || !threadId) return null;
  return "/concierge-v2";
}

function normalizedOutputValues(...values: unknown[]): string[] {
  const outputs: string[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) outputs.push(...normalizedOutputValues(item));
      continue;
    }
    const cleaned = cleanString(value)
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    if (cleaned) outputs.push(cleaned);
  }
  return outputs;
}

function hasEditableStudioArtwork(eventData: unknown): boolean {
  const record = asRecord(eventData);
  if (!record) return false;

  const studioCard = asRecord(record.studioCard);
  const publicEvent = asRecord(record.publicEvent);
  const conciergeDraft = asRecord(record.conciergeDraft);
  const createdVia = cleanString(record.createdVia).toLowerCase();
  const outputValues = normalizedOutputValues(
    record.primaryOutput,
    record.productType,
    record.publicRenderer,
    record.requestedOutputs,
    record.outputs,
    publicEvent?.primaryOutput,
    publicEvent?.renderer,
    conciergeDraft?.primaryOutput,
    conciergeDraft?.requestedOutputs,
    conciergeDraft?.outputs,
  );
  const hasStudioImage =
    Boolean(cleanString(studioCard?.imageUrl)) ||
    Boolean(cleanString(record.coverImageUrl)) ||
    Boolean(cleanString(record.thumbnail)) ||
    Boolean(cleanString(record.customHeroImage)) ||
    Boolean(cleanString(record.heroImage));
  const isGeneratedArtworkEvent =
    /studio|concierge|chat/.test(createdVia) ||
    Boolean(studioCard) ||
    outputValues.some((output) =>
      /live_card|digital_flyer|printable_flyer|invitation|instagram_story/.test(output),
    );

  return hasStudioImage && isGeneratedArtworkEvent;
}

function isScannedOrUploadedEvent(eventData: unknown): boolean {
  const record = asRecord(eventData);
  if (!record) return false;
  const createdVia = cleanString(record.createdVia).toLowerCase();
  return (
    /(ocr|scan|upload)/.test(createdVia) ||
    Boolean(record.attachment) ||
    Boolean(record.ocrSkin) ||
    Boolean(record.sourceContext && asRecord(record.sourceContext)?.type === "upload")
  );
}

export function resolveArtworkEditHref(eventId: string, eventData: unknown): string | null {
  if (!hasEditableStudioArtwork(eventData)) return null;
  return `/studio?editEvent=${encodeURIComponent(eventId)}`;
}

/**
 * Builds the edit link URL. For weddings, uses the event page URL format;
 * for other event types, goes directly to customize.
 */
export const buildEditLink = (eventId: string, eventData: any, eventTitle: string): string => {
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
    const directWorkspaceHref =
      resolveConciergeEditHref(eventData) ||
      (isScannedOrUploadedEvent(eventData)
        ? `/events/${encodeURIComponent(eventId)}/manage`
        : null);

    if (directWorkspaceHref) return directWorkspaceHref;

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

export const resolveEditHref = (eventId: string, eventData: any, eventTitle: string): string => {
  try {
    const createdVia = String((eventData as any)?.createdVia || "")
      .toLowerCase()
      .trim();
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
    const conciergeEditHref = resolveConciergeEditHref(eventData);

    if (conciergeEditHref) return conciergeEditHref;

    if (isScannedOrUploadedEvent(eventData)) {
      return `/events/${encodeURIComponent(eventId)}/manage`;
    }

    const genericManageCategories = new Set([
      "general",
      "general_event",
      "doctor_appointment",
      "appointments",
      "appointment",
      "workshop",
      "workshops",
      "workshop_class",
      "special_event",
      "special_events",
      "special-events",
    ]);
    const genericManageTemplateIds = new Set([
      "general",
      "appointments",
      "workshops",
      "special-events",
    ]);

    if (
      genericManageCategories.has(normalizedCategory) ||
      (templateId && genericManageTemplateIds.has(templateId))
    ) {
      return `/events/${encodeURIComponent(eventId)}/manage`;
    }

    // Discovery-generated gymnastics events: edit on the event page with a right sidebar (same URL + ?edit=).
    if (createdVia === "meet-discovery" || Boolean((eventData as any)?.discoverySource?.input)) {
      return buildEventPath(eventId, eventTitle, { edit: eventId });
    }

    // Birthdays
    if (normalizedCategory.includes("birthday") || /birthday|b[-\s]?day/.test(title)) {
      if (templateId && variationId) {
        return `/event/birthdays/customize?templateId=${encodeURIComponent(
          templateId,
        )}&variationId=${encodeURIComponent(variationId)}&edit=${encodeURIComponent(eventId)}`;
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
      const params = new URLSearchParams();
      if (templateId) params.set("templateId", templateId);
      if (variationId) params.set("variationId", variationId);
      params.set("edit", eventId);
      const qs = params.toString();
      return `/event/baby-showers/customize${qs ? `?${qs}` : ""}`;
    }

    // Gender Reveal
    if (
      normalizedCategory.includes("gender reveal") ||
      normalizedCategory === "gender reveal" ||
      title.includes("gender reveal")
    ) {
      const params = new URLSearchParams();
      if (templateId) params.set("templateId", templateId);
      params.set("edit", eventId);
      const qs = params.toString();
      return `/event/gender-reveal/customize${qs ? `?${qs}` : ""}`;
    }

    // Weddings
    if (normalizedCategory.includes("wedding") || title.includes("wedding")) {
      if (templateId && variationId) {
        return `/event/weddings/customize?templateId=${encodeURIComponent(
          templateId,
        )}&variationId=${encodeURIComponent(variationId)}&edit=${encodeURIComponent(eventId)}`;
      }
      return `/event/weddings?edit=${encodeURIComponent(eventId)}`;
    }

    // Sports & activity templates
    const templateSlugById: Record<string, string> = {
      soccer: "soccer",
      "sport-event": "sport-events",
      "cheerleading-season": "cheerleading",
      "dance-ballet-season": "dance-ballet",
      "gymnastics-schedule": "gymnastics",
    };
    const templateSlugByCategory: Record<string, string> = {
      sport_soccer: "soccer",
      sport_event: "sport-events",
      sport_cheerleading: "cheerleading",
      sport_dance_ballet: "dance-ballet",
      sport_gymnastics_schedule: "gymnastics",
    };

    const sportSlug =
      (templateId && templateSlugById[templateId]) ||
      templateSlugByCategory[normalizedCategory as keyof typeof templateSlugByCategory];

    const isFootballEvent =
      templateId === "football-season" ||
      templateId === "football-practice" ||
      normalizedCategory === "sport_football_season" ||
      normalizedCategory === "sport_football_practice" ||
      normalizedCategory.includes("football");

    if (isFootballEvent) {
      return `/event/football/customize?edit=${encodeURIComponent(eventId)}`;
    }

    if (sportSlug) {
      return `/event/${sportSlug}/customize?edit=${encodeURIComponent(eventId)}`;
    }

    // Fallback to the owner manage workspace instead of self-redirecting through /event/:id?edit=:id.
    return `/events/${encodeURIComponent(eventId)}/manage`;
  } catch {
    return `/events/${encodeURIComponent(eventId)}/manage`;
  }
};
