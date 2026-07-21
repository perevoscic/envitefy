import { query } from "../db.ts";
import { sendBulkEmail } from "../resend.ts";
import {
  buildIndividualCampaignRecipients,
  buildStoredCampaignAudienceFilter,
  isFullHtmlDocument,
  isIndividualCampaignAudience,
  parseIndividualCampaignEmails,
  parseStoredCampaignAudienceFilter,
  type CampaignAudienceFilter,
  type CampaignEmailRecipient,
  type CampaignRecipientNameRow,
  type CampaignStatus,
  type StoredCampaignAudienceFilter,
} from "./email-campaigns.ts";

export type CampaignRow = {
  id: string;
  subject: string;
  body_html: string;
  from_email: string | null;
  audience_filter: StoredCampaignAudienceFilter | Record<string, unknown> | null;
  recipient_count: number;
  status: string;
  scheduled_at: Date | string | null;
};

export class CampaignSendError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function cleanString(value: unknown, maxLength = 5000): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function resolveCampaignRecipients(
  audienceFilter: CampaignAudienceFilter | null | undefined,
): Promise<CampaignEmailRecipient[]> {
  if (audienceFilter?.testEmail) {
    const emails = parseIndividualCampaignEmails(audienceFilter.testEmail);
    if (emails.length === 0) {
      throw new CampaignSendError(400, "No valid email addresses provided");
    }

    const usersResult = await query<CampaignRecipientNameRow>(
      `
      SELECT email, first_name, last_name
      FROM users
      WHERE lower(email) = ANY($1::text[])
    `,
      [emails.map((email) => email.toLowerCase())],
    );

    return buildIndividualCampaignRecipients(emails, usersResult.rows);
  }

  const whereConditions: string[] = ["email IS NOT NULL"];
  const queryParams: Array<string | number> = [];
  let paramIndex = 1;

  if (typeof audienceFilter?.minScans === "number" && audienceFilter.minScans > 0) {
    whereConditions.push(`scans_total >= $${paramIndex}`);
    queryParams.push(audienceFilter.minScans);
    paramIndex += 1;
  }
  if (typeof audienceFilter?.maxScans === "number" && audienceFilter.maxScans > 0) {
    whereConditions.push(`scans_total <= $${paramIndex}`);
    queryParams.push(audienceFilter.maxScans);
    paramIndex += 1;
  }
  if (audienceFilter?.lastActiveAfter) {
    whereConditions.push(`last_active_at >= $${paramIndex}`);
    queryParams.push(audienceFilter.lastActiveAfter);
    paramIndex += 1;
  }
  if (audienceFilter?.lastActiveBefore) {
    whereConditions.push(`last_active_at <= $${paramIndex}`);
    queryParams.push(audienceFilter.lastActiveBefore);
    paramIndex += 1;
  }

  const recipientsResult = await query<{
    email: string;
    first_name: string | null;
    last_name: string | null;
  }>(
    `
    SELECT id, email, first_name, last_name
    FROM users
    WHERE ${whereConditions.join(" AND ")}
    ORDER BY created_at DESC
  `,
    queryParams,
  );

  const recipients = recipientsResult.rows.map((row) => ({
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
  }));

  if (recipients.length === 0) {
    throw new CampaignSendError(400, "No recipients match the selected audience");
  }

  return recipients;
}

async function markCampaignFailed(campaignId: string, message: string): Promise<void> {
  await query(
    `
    UPDATE email_campaigns
    SET
      status = 'failed',
      error_message = $1,
      sent_at = now()
    WHERE id = $2
  `,
    [message.slice(0, 2000), campaignId],
  );
}

export async function executeCampaignSend(params: {
  campaignId: string;
  subject: string;
  bodyHtml: string;
  fromEmail?: string | null;
  audienceFilter: CampaignAudienceFilter;
  buttonText?: string | null;
  buttonUrl?: string | null;
  rawHtml?: boolean;
  logPrefix?: string;
}): Promise<{
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
  isTest: boolean;
}> {
  const logPrefix = params.logPrefix || "[campaigns]";
  const recipients = await resolveCampaignRecipients(params.audienceFilter);
  const isTest = isIndividualCampaignAudience(params.audienceFilter);
  const rawHtml = params.rawHtml === true || isFullHtmlDocument(params.bodyHtml);

  await query(
    `
    UPDATE email_campaigns
    SET
      subject = $1,
      body_html = $2,
      from_email = $3,
      audience_filter = $4::jsonb,
      recipient_count = $5,
      status = 'sending',
      error_message = NULL,
      scheduled_at = NULL
    WHERE id = $6
  `,
    [
      params.subject,
      params.bodyHtml,
      params.fromEmail || null,
      JSON.stringify(
        buildStoredCampaignAudienceFilter(params.audienceFilter, recipients.length, {
          rawHtml,
          buttonText: params.buttonText,
          buttonUrl: params.buttonUrl,
          persistTestEmail: isTest,
        }),
      ),
      recipients.length,
      params.campaignId,
    ],
  );

  console.log(
    `${logPrefix} ${isTest ? `Sending to ${recipients.length} individual recipient(s)` : `Sending campaign ${params.campaignId} to ${recipients.length} recipient(s)`}...`,
  );

  try {
    const result = await sendBulkEmail({
      subject: params.subject,
      body: params.bodyHtml,
      fromEmail: params.fromEmail || undefined,
      recipients,
      buttonText: params.buttonText || undefined,
      buttonUrl: params.buttonUrl || undefined,
      rawHtml,
    });

    const finalStatus: CampaignStatus =
      result.failed === 0 ? "sent" : result.sent === 0 ? "failed" : "sent";

    await query(
      `
      UPDATE email_campaigns
      SET
        status = $1,
        sent_count = $2,
        failed_count = $3,
        error_message = $4,
        sent_at = now()
      WHERE id = $5
    `,
      [
        finalStatus,
        result.sent,
        result.failed,
        result.errors.length > 0 ? JSON.stringify(result.errors.slice(0, 10)) : null,
        params.campaignId,
      ],
    );

    console.log(
      `${logPrefix} Campaign ${params.campaignId} completed: ${result.sent} sent, ${result.failed} failed`,
    );

    return {
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      isTest,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send campaign";
    await markCampaignFailed(params.campaignId, message);
    throw error;
  }
}

export async function createSendingCampaign(params: {
  adminUserId: string;
  subject: string;
  bodyHtml: string;
  fromEmail?: string | null;
  audienceFilter: CampaignAudienceFilter;
  buttonText?: string | null;
  buttonUrl?: string | null;
  rawHtml?: boolean;
}): Promise<{ campaignId: string; recipients: CampaignEmailRecipient[]; isTest: boolean }> {
  const recipients = await resolveCampaignRecipients(params.audienceFilter);
  const isTest = isIndividualCampaignAudience(params.audienceFilter);
  const rawHtml = params.rawHtml === true || isFullHtmlDocument(params.bodyHtml);

  const campaignResult = await query<{ id: string }>(
    `
    INSERT INTO email_campaigns (
      created_by_user_id,
      subject,
      body_html,
      from_email,
      audience_filter,
      recipient_count,
      status
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'sending')
    RETURNING id
  `,
    [
      params.adminUserId,
      params.subject,
      params.bodyHtml,
      params.fromEmail || null,
      JSON.stringify(
        buildStoredCampaignAudienceFilter(params.audienceFilter, recipients.length, {
          rawHtml,
          buttonText: params.buttonText,
          buttonUrl: params.buttonUrl,
          persistTestEmail: isTest,
        }),
      ),
      recipients.length,
    ],
  );

  return {
    campaignId: campaignResult.rows[0].id,
    recipients,
    isTest,
  };
}

/**
 * Send immediately: reuse an editable campaign id when provided, otherwise insert a new row.
 */
export async function sendCampaignNow(params: {
  adminUserId: string;
  campaignId?: string | null;
  subject: string;
  bodyHtml: string;
  fromEmail?: string | null;
  audienceFilter: CampaignAudienceFilter;
  buttonText?: string | null;
  buttonUrl?: string | null;
  rawHtml?: boolean;
  logPrefix?: string;
}): Promise<{
  campaignId: string;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
  isTest: boolean;
}> {
  const subject = cleanString(params.subject, 500);
  const bodyHtml = typeof params.bodyHtml === "string" ? params.bodyHtml.trim() : "";
  if (!subject || !bodyHtml) {
    throw new CampaignSendError(400, "Subject and body are required");
  }

  let campaignId = params.campaignId || null;
  if (campaignId) {
    const existing = await getEditableCampaign(campaignId);
    if (!existing) throw new CampaignSendError(404, "Campaign not found");
    if (!["draft", "queued", "cancelled"].includes(existing.status)) {
      throw new CampaignSendError(400, "Only draft, queued, or cancelled campaigns can be sent");
    }
  } else {
    const created = await createSendingCampaign({
      adminUserId: params.adminUserId,
      subject,
      bodyHtml,
      fromEmail: params.fromEmail,
      audienceFilter: params.audienceFilter,
      buttonText: params.buttonText,
      buttonUrl: params.buttonUrl,
      rawHtml: params.rawHtml,
    });
    campaignId = created.campaignId;
  }

  const result = await executeCampaignSend({
    campaignId,
    subject,
    bodyHtml,
    fromEmail: params.fromEmail,
    audienceFilter: params.audienceFilter,
    buttonText: params.buttonText,
    buttonUrl: params.buttonUrl,
    rawHtml: params.rawHtml,
    logPrefix: params.logPrefix,
  });
  return { campaignId, ...result };
}

export async function upsertCampaignDraft(params: {
  adminUserId: string;
  campaignId?: string | null;
  subject: string;
  bodyHtml: string;
  fromEmail?: string | null;
  audienceFilter: CampaignAudienceFilter;
  buttonText?: string | null;
  buttonUrl?: string | null;
  rawHtml?: boolean;
  recipientCount?: number;
}): Promise<{ id: string; status: "draft" }> {
  const subject = cleanString(params.subject, 500);
  const bodyHtml = typeof params.bodyHtml === "string" ? params.bodyHtml.trim() : "";
  if (!subject || !bodyHtml) {
    throw new CampaignSendError(400, "Subject and body are required");
  }

  const rawHtml = params.rawHtml === true || isFullHtmlDocument(bodyHtml);
  const storedFilter = buildStoredCampaignAudienceFilter(
    params.audienceFilter,
    params.recipientCount ?? 0,
    {
      rawHtml,
      buttonText: params.buttonText,
      buttonUrl: params.buttonUrl,
      persistTestEmail: true,
    },
  );

  if (params.campaignId) {
    const updated = await query<{ id: string }>(
      `
      UPDATE email_campaigns
      SET
        subject = $1,
        body_html = $2,
        from_email = $3,
        audience_filter = $4::jsonb,
        recipient_count = $5,
        status = 'draft',
        scheduled_at = NULL,
        error_message = NULL
      WHERE id = $6
        AND status IN ('draft', 'queued', 'cancelled')
      RETURNING id
    `,
      [
        subject,
        bodyHtml,
        params.fromEmail || null,
        JSON.stringify(storedFilter),
        params.recipientCount ?? 0,
        params.campaignId,
      ],
    );
    if (!updated.rows[0]) {
      throw new CampaignSendError(404, "Draft campaign not found or not editable");
    }
    return { id: updated.rows[0].id, status: "draft" };
  }

  const inserted = await query<{ id: string }>(
    `
    INSERT INTO email_campaigns (
      created_by_user_id,
      subject,
      body_html,
      from_email,
      audience_filter,
      recipient_count,
      status
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'draft')
    RETURNING id
  `,
    [
      params.adminUserId,
      subject,
      bodyHtml,
      params.fromEmail || null,
      JSON.stringify(storedFilter),
      params.recipientCount ?? 0,
    ],
  );

  return { id: inserted.rows[0].id, status: "draft" };
}

export async function scheduleCampaign(params: {
  campaignId: string;
  scheduledAt: Date;
  subject?: string;
  bodyHtml?: string;
  fromEmail?: string | null;
  audienceFilter?: CampaignAudienceFilter;
  buttonText?: string | null;
  buttonUrl?: string | null;
  rawHtml?: boolean;
}): Promise<{ id: string; scheduledAt: string }> {
  if (!(params.scheduledAt instanceof Date) || Number.isNaN(params.scheduledAt.getTime())) {
    throw new CampaignSendError(400, "A valid scheduledAt datetime is required");
  }
  if (params.scheduledAt.getTime() <= Date.now()) {
    throw new CampaignSendError(400, "scheduledAt must be in the future");
  }

  const existing = await query<CampaignRow>(
    `
    SELECT id, subject, body_html, from_email, audience_filter, recipient_count, status, scheduled_at
    FROM email_campaigns
    WHERE id = $1
    LIMIT 1
  `,
    [params.campaignId],
  );
  const row = existing.rows[0];
  if (!row) throw new CampaignSendError(404, "Campaign not found");
  if (!["draft", "queued", "cancelled"].includes(row.status)) {
    throw new CampaignSendError(400, "Only draft, queued, or cancelled campaigns can be scheduled");
  }

  const subject = cleanString(params.subject ?? row.subject, 500) || row.subject;
  const bodyHtml =
    typeof params.bodyHtml === "string" && params.bodyHtml.trim()
      ? params.bodyHtml.trim()
      : row.body_html;
  const parsedStored = parseStoredCampaignAudienceFilter(row.audience_filter);
  const audienceFilter = params.audienceFilter || parsedStored.audienceFilter;
  const buttonText =
    params.buttonText !== undefined ? params.buttonText : parsedStored.buttonText;
  const buttonUrl = params.buttonUrl !== undefined ? params.buttonUrl : parsedStored.buttonUrl;
  const rawHtml =
    params.rawHtml === true || parsedStored.rawHtml || isFullHtmlDocument(bodyHtml);

  const updated = await query<{ id: string; scheduled_at: Date }>(
    `
    UPDATE email_campaigns
    SET
      subject = $1,
      body_html = $2,
      from_email = $3,
      audience_filter = $4::jsonb,
      status = 'queued',
      scheduled_at = $5,
      error_message = NULL
    WHERE id = $6
    RETURNING id, scheduled_at
  `,
    [
      subject,
      bodyHtml,
      params.fromEmail !== undefined ? params.fromEmail || null : row.from_email,
      JSON.stringify(
        buildStoredCampaignAudienceFilter(audienceFilter, row.recipient_count || 0, {
          rawHtml,
          buttonText,
          buttonUrl,
          persistTestEmail: true,
        }),
      ),
      params.scheduledAt.toISOString(),
      params.campaignId,
    ],
  );

  return {
    id: updated.rows[0].id,
    scheduledAt: new Date(updated.rows[0].scheduled_at).toISOString(),
  };
}

export async function cancelCampaign(campaignId: string): Promise<{ id: string; status: "cancelled" }> {
  const updated = await query<{ id: string }>(
    `
    UPDATE email_campaigns
    SET
      status = 'cancelled',
      scheduled_at = NULL
    WHERE id = $1
      AND status IN ('draft', 'queued')
    RETURNING id
  `,
    [campaignId],
  );
  if (!updated.rows[0]) {
    throw new CampaignSendError(404, "Campaign not found or cannot be cancelled");
  }
  return { id: updated.rows[0].id, status: "cancelled" };
}

export async function getEditableCampaign(campaignId: string): Promise<CampaignRow | null> {
  const result = await query<CampaignRow>(
    `
    SELECT id, subject, body_html, from_email, audience_filter, recipient_count, status, scheduled_at
    FROM email_campaigns
    WHERE id = $1
    LIMIT 1
  `,
    [campaignId],
  );
  return result.rows[0] || null;
}

/**
 * Claim and send due queued campaigns.
 * Claims with UPDATE ... RETURNING to avoid double-send races.
 */
export async function processDueCampaigns(params: {
  limit?: number;
  now?: Date;
  logPrefix?: string;
} = {}): Promise<{
  processed: number;
  sent: number;
  failed: number;
  campaignIds: string[];
  errors: Array<{ campaignId: string; error: string }>;
}> {
  const limit = Math.min(Math.max(params.limit ?? 5, 1), 25);
  const now = params.now || new Date();
  const logPrefix = params.logPrefix || "[campaigns]";

  const claimed = await query<CampaignRow>(
    `
    UPDATE email_campaigns
    SET status = 'sending', error_message = NULL
    WHERE id IN (
      SELECT id
      FROM email_campaigns
      WHERE status = 'queued'
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= $1
      ORDER BY scheduled_at ASC
      LIMIT $2
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, subject, body_html, from_email, audience_filter, recipient_count, status, scheduled_at
  `,
    [now.toISOString(), limit],
  );

  let sent = 0;
  let failed = 0;
  const campaignIds: string[] = [];
  const errors: Array<{ campaignId: string; error: string }> = [];

  for (const row of claimed.rows) {
    campaignIds.push(row.id);
    const parsed = parseStoredCampaignAudienceFilter(row.audience_filter);
    try {
      const result = await executeCampaignSend({
        campaignId: row.id,
        subject: row.subject,
        bodyHtml: row.body_html,
        fromEmail: row.from_email,
        audienceFilter: parsed.audienceFilter,
        buttonText: parsed.buttonText,
        buttonUrl: parsed.buttonUrl,
        rawHtml: parsed.rawHtml,
        logPrefix,
      });
      sent += result.sent;
      failed += result.failed;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Failed to send campaign";
      errors.push({ campaignId: row.id, error: message });
      console.error(`${logPrefix} process-due failed for ${row.id}:`, message);
    }
  }

  return {
    processed: claimed.rows.length,
    sent,
    failed,
    campaignIds,
    errors,
  };
}
