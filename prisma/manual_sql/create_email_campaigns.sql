-- Email campaigns table for admin bulk/marketing emails
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Campaign details
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  from_email TEXT, -- optional override, defaults to SES_FROM_EMAIL_NO_REPLY
  
  -- Audience targeting
  audience_filter JSONB NOT NULL DEFAULT '{}', 
  -- Example: { "plans": ["free", "monthly"], "minScans": 5, "maxScans": null, "lastActiveAfter": "2025-01-01" }
  
  -- Stats
  recipient_count INT DEFAULT 0, -- total users matched by filter
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft', -- draft, queued, sending, sent, failed, cancelled
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing campaigns by creator
CREATE INDEX IF NOT EXISTS idx_email_campaigns_creator ON email_campaigns(created_by_user_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();

