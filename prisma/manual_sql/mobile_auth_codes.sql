-- Apply before enabling IOS_AUTH_ENABLED=1. No Apple credentials are stored here.
CREATE TABLE IF NOT EXISTS mobile_auth_codes (
  code_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge text NOT NULL,
  session_token text,
  session_expires timestamptz NOT NULL,
  return_to text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS mobile_auth_codes_user_created_idx ON mobile_auth_codes(user_id, created_at);
CREATE INDEX IF NOT EXISTS mobile_auth_codes_expiry_idx ON mobile_auth_codes(expires_at);
ALTER TABLE mobile_auth_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON mobile_auth_codes FROM PUBLIC;
CREATE TABLE IF NOT EXISTS mobile_auth_rate_limits (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL,
  PRIMARY KEY (user_id, window_start)
);
ALTER TABLE mobile_auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON mobile_auth_rate_limits FROM PUBLIC;
-- Schedule this cleanup hourly with the application's database maintenance:
-- DELETE FROM mobile_auth_codes WHERE created_at < now() - interval '1 hour';
-- DELETE FROM mobile_auth_rate_limits WHERE window_start < now() - interval '1 hour';
