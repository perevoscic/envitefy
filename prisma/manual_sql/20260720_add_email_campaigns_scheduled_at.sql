-- Add schedule support for admin email campaigns.
-- Status values in use: draft, queued, sending, sent, failed, cancelled.

COMMENT ON COLUMN email_campaigns.status IS
  'draft | queued | sending | sent | failed | cancelled';

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

COMMENT ON COLUMN email_campaigns.scheduled_at IS
  'When status=queued, send after this timestamp via process-due.';

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status_scheduled_at
  ON email_campaigns (status, scheduled_at)
  WHERE scheduled_at IS NOT NULL;
