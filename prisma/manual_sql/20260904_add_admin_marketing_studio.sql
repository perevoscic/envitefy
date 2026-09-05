-- Content Studio keeps conversations/jobs in Postgres and media in private storage.
ALTER TABLE conversation_threads
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_conversation_threads_marketing_updated
  ON conversation_threads(updated_at DESC) WHERE thread_type = 'admin_marketing';

CREATE TABLE IF NOT EXISTS admin_marketing_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  parent_version_id uuid REFERENCES admin_marketing_versions(id),
  created_by uuid NOT NULL REFERENCES users(id),
  client_request_id uuid NOT NULL,
  output text NOT NULL CHECK (output IN ('prompt', 'image', 'video')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN
    ('queued', 'developing', 'submitting', 'running', 'finalizing', 'ready', 'failed', 'submission_unknown')),
  input jsonb NOT NULL,
  result jsonb,
  provider jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  next_poll_at timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, client_request_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_marketing_versions_conversation
  ON admin_marketing_versions(conversation_id, created_at, id);
CREATE INDEX IF NOT EXISTS idx_admin_marketing_versions_due
  ON admin_marketing_versions(next_poll_at, lease_until)
  WHERE status IN ('queued', 'developing', 'submitting', 'running', 'finalizing');

CREATE TABLE IF NOT EXISTS admin_marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  version_id uuid REFERENCES admin_marketing_versions(id),
  name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  storage_kind text NOT NULL CHECK (storage_kind IN ('local', 'blob')),
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_marketing_assets_conversation
  ON admin_marketing_assets(conversation_id, created_at);
