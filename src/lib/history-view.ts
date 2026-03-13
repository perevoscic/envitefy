export const HISTORY_VIEWS = ["summary", "sidebar", "calendar", "full"] as const;
export const HISTORY_TIME_FILTERS = ["all", "upcoming", "past"] as const;

export type HistoryView = (typeof HISTORY_VIEWS)[number];
export type CacheableHistoryView = Exclude<HistoryView, "full">;
export type HistoryTimeFilter = (typeof HISTORY_TIME_FILTERS)[number];

export function normalizeHistoryView(value: string | null | undefined): HistoryView {
  const normalized = String(value || "summary").trim().toLowerCase();
  if (
    normalized === "summary" ||
    normalized === "sidebar" ||
    normalized === "calendar" ||
    normalized === "full"
  ) {
    return normalized;
  }
  return "summary";
}

export function isCacheableHistoryView(view: HistoryView): view is CacheableHistoryView {
  return view !== "full";
}

export function normalizeHistoryTimeFilter(
  value: string | null | undefined
): HistoryTimeFilter {
  const normalized = String(value || "all").trim().toLowerCase();
  if (
    normalized === "all" ||
    normalized === "upcoming" ||
    normalized === "past"
  ) {
    return normalized;
  }
  return "all";
}

function omitDataUrlBranch(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const next: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  delete next.dataUrl;
  return next;
}

export function redactHistoryHeavyFields(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;

  const next: Record<string, any> = { ...(data as Record<string, any>) };

  delete next.ocrText;

  if (next.attachment && typeof next.attachment === "object") {
    next.attachment = omitDataUrlBranch(next.attachment);
  }

  if (next.discoverySource && typeof next.discoverySource === "object") {
    next.discoverySource = { ...next.discoverySource };
    if (
      next.discoverySource.input &&
      typeof next.discoverySource.input === "object"
    ) {
      next.discoverySource.input = omitDataUrlBranch(next.discoverySource.input);
    }
    if (
      next.discoverySource.extractionMeta &&
      typeof next.discoverySource.extractionMeta === "object"
    ) {
      next.discoverySource.extractionMeta = {
        ...next.discoverySource.extractionMeta,
      };
      delete next.discoverySource.extractionMeta.gymLayoutImageDataUrl;
      delete next.discoverySource.extractionMeta.schedulePageImages;
    }
  }

  if (
    next.advancedSections &&
    typeof next.advancedSections === "object" &&
    next.advancedSections.logistics &&
    typeof next.advancedSections.logistics === "object"
  ) {
    next.advancedSections = { ...next.advancedSections };
    next.advancedSections.logistics = { ...next.advancedSections.logistics };
    if (
      typeof next.advancedSections.logistics.gymLayoutImage === "string" &&
      next.advancedSections.logistics.gymLayoutImage.startsWith("data:")
    ) {
      delete next.advancedSections.logistics.gymLayoutImage;
    }
  }

  return next;
}
