import { query } from "../db.ts";

let schemaReady: Promise<void> | null = null;

/**
 * Lazily adds email_campaigns columns/indexes introduced after the initial table
 * migration so local/dev DBs work without manually running manual_sql files.
 */
export async function ensureEmailCampaignsSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        ALTER TABLE email_campaigns
          ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_email_campaigns_status_scheduled_at
          ON email_campaigns (status, scheduled_at)
          WHERE scheduled_at IS NOT NULL;
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}
