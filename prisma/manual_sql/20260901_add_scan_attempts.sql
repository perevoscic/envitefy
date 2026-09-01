CREATE TABLE IF NOT EXISTS scan_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_attempt_id varchar(120) NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES event_history(id) ON DELETE SET NULL,
  status varchar(24) NOT NULL DEFAULT 'processed',
  title varchar(300),
  category varchar(160),
  source_type varchar(32),
  file_name varchar(512),
  file_size bigint,
  mime_type varchar(160),
  ocr_source varchar(80),
  ocr_text text,
  fields_guess jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_bytes bytea,
  preview_mime_type varchar(80),
  error_message text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  expires_at timestamptz(6) NOT NULL DEFAULT (now() + interval '30 days'),
  completed_at timestamptz(6),
  saved_at timestamptz(6),
  updated_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_attempts_user_attempt_unique
  ON scan_attempts(user_id, scan_attempt_id);

CREATE INDEX IF NOT EXISTS idx_scan_attempts_user_created_at
  ON scan_attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scan_attempts_status_created_at
  ON scan_attempts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scan_attempts_event_id
  ON scan_attempts(event_id)
  WHERE event_id IS NOT NULL;

ALTER TABLE scan_attempts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz(6) DEFAULT (now() + interval '30 days');

UPDATE scan_attempts
SET expires_at = created_at + interval '30 days'
WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scan_attempts_expires_at
  ON scan_attempts(expires_at)
  WHERE expires_at IS NOT NULL;
