-- Additive only. Existing accounts remain Standard unless an Envitefy admin explicitly restricts them.
-- Signup attribution, interests and old product_scopes are deliberately not migrated into grants.
CREATE TABLE IF NOT EXISTS creation_account_access (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  policy text NOT NULL DEFAULT 'standard' CHECK (policy IN ('standard', 'restricted')),
  categories text[] NOT NULL DEFAULT '{}',
  products text[] NOT NULL DEFAULT '{}',
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS creation_access_requests (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('category', 'product')),
  capability text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS creation_access_requests_pending
  ON creation_access_requests (user_id, kind, capability) WHERE status = 'pending';
ALTER TABLE creation_account_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE creation_access_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE creation_account_access, creation_access_requests FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE creation_account_access, creation_access_requests FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE creation_account_access, creation_access_requests FROM authenticated;
  END IF;
END $$;

-- Discovery authorization stamps are authoritative server records, never client grants.
DO $$ BEGIN
  IF to_regclass('public.event_discoveries') IS NOT NULL THEN
    ALTER TABLE event_discoveries ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE event_discoveries FROM PUBLIC;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON TABLE event_discoveries FROM anon; END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON TABLE event_discoveries FROM authenticated; END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS livecard_artwork_jobs (
  id text PRIMARY KEY, owner_id text NOT NULL, revision text NOT NULL,
  state text NOT NULL, stage text NOT NULL, mode text NOT NULL,
  attempt integer NOT NULL DEFAULT 1, form jsonb NOT NULL, design jsonb,
  error text, error_code text, event_id uuid, actor_id text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, revision)
);
ALTER TABLE livecard_artwork_jobs ADD COLUMN IF NOT EXISTS event_id uuid;
ALTER TABLE livecard_artwork_jobs ADD COLUMN IF NOT EXISTS actor_id text;
-- actor_id is nullable for historical jobs; workers use the historical owner_id for those rows.
