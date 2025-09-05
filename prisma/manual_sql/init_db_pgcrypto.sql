-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name varchar(255),
  last_name varchar(255),
  preferred_provider varchar(32),
  password_hash text NOT NULL,
  created_at timestamptz(6) DEFAULT now()
);

-- Ensure column exists if table pre-existed without it
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_provider varchar(32);

-- Ensure id default exists even if table pre-existed without it
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- OAuth tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid REFERENCES users(id),
  provider text NOT NULL,
  refresh_token text NOT NULL,
  updated_at timestamptz(6) DEFAULT now(),
  created_at timestamptz(6) DEFAULT now(),
  UNIQUE (email, provider)
);

-- Ensure id default exists even if table pre-existed without it
ALTER TABLE oauth_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz(6) NOT NULL,
  used_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

-- Event history (stores normalized event payloads for quick retrieval/share)
CREATE TABLE IF NOT EXISTS event_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_history_user_id_created_at
  ON event_history(user_id, created_at DESC);