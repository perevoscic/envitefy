CREATE TABLE IF NOT EXISTS private_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  purpose text NOT NULL,
  ip_hash text,
  user_agent text,
  occurred_at timestamptz(6) NOT NULL DEFAULT now(),
  expires_at timestamptz(6) NOT NULL DEFAULT (now() + interval '1 year')
);

CREATE INDEX IF NOT EXISTS idx_private_data_access_logs_resource
  ON private_data_access_logs(resource_type, resource_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_data_access_logs_expires_at
  ON private_data_access_logs(expires_at);
