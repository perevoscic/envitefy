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

export type CampaignStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export interface StoredCampaignAudienceFilter {
  audienceMode?: "individual" | "broadcast";
  recipientCount?: number;
  minScans?: number;
  maxScans?: number;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
  testEmail?: string;
  buttonText?: string;
  buttonUrl?: string;
  rawHtml?: boolean;
}

interface StoredAudienceFilterOptions {
  rawHtml?: boolean;
  buttonText?: string | null;
  buttonUrl?: string | null;
  /** Persist individual recipient emails so drafts/schedules can send later. */
  persistTestEmail?: boolean;
}

function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

function cleanNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanOptionalString(value: string | null | undefined, maxLength = 500): string | null {
  const cleaned = cleanNullableString(value);
  return cleaned ? cleaned.slice(0, maxLength) : null;
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
): StoredCampaignAudienceFilter {
  const stored: StoredCampaignAudienceFilter = {
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
  if (options.persistTestEmail) {
    const testEmail = cleanOptionalString(audienceFilter?.testEmail, 4000);
    if (testEmail) stored.testEmail = testEmail;
  }
  if (options.rawHtml) {
    stored.rawHtml = true;
  }
  const buttonText = cleanOptionalString(options.buttonText, 120);
  if (buttonText) stored.buttonText = buttonText;
  const buttonUrl = cleanOptionalString(options.buttonUrl, 500);
  if (buttonUrl) stored.buttonUrl = buttonUrl;

  return stored;
}

export function parseStoredCampaignAudienceFilter(
  value: unknown,
): {
  audienceFilter: CampaignAudienceFilter;
  buttonText: string;
  buttonUrl: string;
  rawHtml: boolean;
} {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const asNumber = (input: unknown): number | null =>
    typeof input === "number" && Number.isFinite(input) ? input : null;
  const asString = (input: unknown): string | null =>
    typeof input === "string" && input.trim() ? input.trim() : null;

  return {
    audienceFilter: {
      minScans: asNumber(record.minScans),
      maxScans: asNumber(record.maxScans),
      lastActiveAfter: asString(record.lastActiveAfter),
      lastActiveBefore: asString(record.lastActiveBefore),
      testEmail: asString(record.testEmail),
    },
    buttonText: asString(record.buttonText) || "",
    buttonUrl: asString(record.buttonUrl) || "",
    rawHtml: record.rawHtml === true,
  };
}

export function isFullHtmlDocument(value: string): boolean {
  const html = value.trim().toLowerCase();
  return (
    html.startsWith("<!doctype html") ||
    html.includes("<html") ||
    html.includes("<body")
  );
}
