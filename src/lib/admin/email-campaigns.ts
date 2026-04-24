export interface CampaignAudienceFilter {
  minScans?: number | null;
  maxScans?: number | null;
  lastActiveAfter?: string | null;
  lastActiveBefore?: string | null;
  testEmail?: string | null;
}

interface StoredAudienceFilterOptions {
  rawHtml?: boolean;
}

export function isIndividualCampaignAudience(
  audienceFilter?: CampaignAudienceFilter | null,
): boolean {
  return Boolean(audienceFilter?.testEmail?.trim());
}

export function buildStoredCampaignAudienceFilter(
  audienceFilter: CampaignAudienceFilter | null | undefined,
  recipientCount: number,
  options: StoredAudienceFilterOptions = {},
) {
  const stored: Record<string, string | number | boolean> = {
    audienceMode: isIndividualCampaignAudience(audienceFilter)
      ? "individual"
      : "broadcast",
    recipientCount,
  };

  if (typeof audienceFilter?.minScans === "number") {
    stored.minScans = audienceFilter.minScans;
  }
  if (typeof audienceFilter?.maxScans === "number") {
    stored.maxScans = audienceFilter.maxScans;
  }
  if (audienceFilter?.lastActiveAfter) {
    stored.lastActiveAfter = audienceFilter.lastActiveAfter;
  }
  if (audienceFilter?.lastActiveBefore) {
    stored.lastActiveBefore = audienceFilter.lastActiveBefore;
  }
  if (options.rawHtml) {
    stored.rawHtml = true;
  }

  return stored;
}
