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
-- Ensure subscription_plan column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan varchar(32);
-- Track if a user has ever been on a paid plan
ALTER TABLE users ADD COLUMN IF NOT EXISTS ever_paid boolean;
ALTER TABLE users ALTER COLUMN ever_paid SET DEFAULT false;
-- Add credits column to store purchased/earned credits
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits integer;
-- Remove legacy scans_remaining column if present
ALTER TABLE users DROP COLUMN IF EXISTS scans_remaining;

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

-- Promo codes (gift codes for subscriptions or credits)
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount_cents integer NOT NULL,
  currency varchar(10) NOT NULL DEFAULT 'USD',
  created_by_email text,
  recipient_name text,
  recipient_email text,
  message text,
  -- Optional metadata about the gift units
  quantity integer,
  period varchar(16), -- 'months' | 'years'
  expires_at timestamptz(6),
  redeemed_at timestamptz(6),
  redeemed_by_email text,
  created_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_created_at ON promo_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_codes_recipient_email ON promo_codes(recipient_email);
CREATE INDEX IF NOT EXISTS idx_promo_codes_redeemed_at ON promo_codes(redeemed_at);

-- Add user subscription expiration to support gifted months
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz(6);