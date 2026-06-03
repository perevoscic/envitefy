export interface CampaignAudienceFilter {
  minScans?: number | null;
  maxScans?: number | null;
  lastActiveAfter?: string | null;
  lastActiveBefore?: string | null;
  testEmail?: string | null;
}

export interface CampaignEmailRecipient {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface CampaignRecipientNameRow {
  [column: string]: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface StoredAudienceFilterOptions {
  rawHtml?: boolean;
}

function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

function cleanNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isIndividualCampaignAudience(
  audienceFilter?: CampaignAudienceFilter | null,
): boolean {
  return Boolean(audienceFilter?.testEmail?.trim());
}

export function parseIndividualCampaignEmails(
  value: string | null | undefined,
): string[] {
  const emails = new Map<string, string>();

  for (const rawEmail of (value ?? "").split(/[\s,;]+/)) {
    const email = rawEmail.trim();
    if (!email.includes("@")) continue;
    const key = normalizeEmailKey(email);
    if (!emails.has(key)) emails.set(key, email);
  }

  return [...emails.values()];
}

export function buildIndividualCampaignRecipients(
  emails: string[],
  userRows: CampaignRecipientNameRow[] = [],
): CampaignEmailRecipient[] {
  const usersByEmail = new Map<string, CampaignRecipientNameRow>();

  for (const row of userRows) {
    if (!row.email) continue;
    usersByEmail.set(normalizeEmailKey(row.email), row);
  }

  return emails.map((email) => {
    const user = usersByEmail.get(normalizeEmailKey(email));

    return {
      email,
      firstName: cleanNullableString(user?.first_name),
      lastName: cleanNullableString(user?.last_name),
    };
  });
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
