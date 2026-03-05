-- Bootstrap RSVP table and hot-path indexes.
-- Run this migration once before deploying code paths that assume rsvp_responses exists.

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  email text,
  name text,
  first_name text,
  last_name text,
  phone text,
  message text,
  response varchar(16) NOT NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS message text;

-- One-time cleanup before unique indexes for anonymous name-only RSVPs.
DELETE FROM rsvp_responses
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY event_id, lower(name)
        ORDER BY updated_at DESC, created_at DESC, id DESC
      ) AS rn
    FROM rsvp_responses
    WHERE email IS NULL
      AND user_id IS NULL
      AND name IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_user
  ON rsvp_responses(event_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_email
  ON rsvp_responses(event_id, email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsvp_responses_event_name
  ON rsvp_responses(event_id, lower(name))
  WHERE email IS NULL AND user_id IS NULL AND name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event_id
  ON rsvp_responses(event_id);

CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event_updated_at
  ON rsvp_responses(event_id, updated_at DESC);

-- Ensure dashboard/history and provider token lookups stay indexed.
CREATE INDEX IF NOT EXISTS idx_event_history_user_created_id
  ON event_history(user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider_user_id
  ON oauth_tokens(provider, user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider_email
  ON oauth_tokens(provider, email);
