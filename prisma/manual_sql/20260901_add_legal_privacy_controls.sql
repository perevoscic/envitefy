ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_version text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_acknowledged_at timestamptz(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_acceptance_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_out_at timestamptz(6);

CREATE INDEX IF NOT EXISTS idx_users_marketing_eligible
  ON users(created_at DESC)
  WHERE marketing_opt_out_at IS NULL;

DO $$
BEGIN
  IF to_regclass('public.scan_attempts') IS NOT NULL THEN
    ALTER TABLE scan_attempts
      ADD COLUMN IF NOT EXISTS expires_at timestamptz(6) DEFAULT (now() + interval '30 days');

    UPDATE scan_attempts
    SET expires_at = created_at + interval '30 days'
    WHERE expires_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_scan_attempts_expires_at
      ON scan_attempts(expires_at)
      WHERE expires_at IS NOT NULL;
  END IF;
END
$$;
