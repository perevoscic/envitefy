-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name varchar(255),
  last_name varchar(255),
  password_hash text NOT NULL,
  created_at timestamptz(6) DEFAULT now()
);

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


