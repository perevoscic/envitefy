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

-- Theme overrides for per-user holiday previews
CREATE TABLE IF NOT EXISTS theme_overrides (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_key varchar(64) NOT NULL,
  variant varchar(16) NOT NULL DEFAULT 'light',
  expires_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

ALTER TABLE theme_overrides ADD COLUMN IF NOT EXISTS theme_key varchar(64);
ALTER TABLE theme_overrides ADD COLUMN IF NOT EXISTS variant varchar(16);
ALTER TABLE theme_overrides ADD COLUMN IF NOT EXISTS expires_at timestamptz(6);
ALTER TABLE theme_overrides ADD COLUMN IF NOT EXISTS created_at timestamptz(6);
ALTER TABLE theme_overrides ADD COLUMN IF NOT EXISTS updated_at timestamptz(6);
ALTER TABLE theme_overrides ALTER COLUMN updated_at SET DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_theme_overrides_expires_at ON theme_overrides(expires_at);
-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz(6) NOT NULL,
  used_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now()
);

-- Ensure id default exists even if table pre-existed without it
ALTER TABLE password_resets ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
-- Event history (stores normalized event payloads for quick retrieval/share)
CREATE TABLE IF NOT EXISTS event_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz(6) DEFAULT now()
);

-- Ensure id default and primary key exist if table pre-existed without them
ALTER TABLE event_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'event_history'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE event_history ADD PRIMARY KEY (id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_history_user_id_created_at
  ON event_history(user_id, created_at DESC);

-- Event shares (owner shares an event_history row with another user)
CREATE TABLE IF NOT EXISTS event_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  recipient_user_id uuid NOT NULL REFERENCES users(id),
  status varchar(16) NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  invite_code text UNIQUE,
  created_at timestamptz(6) DEFAULT now(),
  accepted_at timestamptz(6),
  revoked_at timestamptz(6)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_shares_event_recipient
  ON event_shares(event_id, recipient_user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_shares_recipient_status
  ON event_shares(recipient_user_id, status);

CREATE INDEX IF NOT EXISTS idx_event_shares_owner_event
  ON event_shares(owner_user_id, event_id);

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
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  stripe_charge_id text,
  stripe_refund_id text,
  revoked_at timestamptz(6),
  metadata jsonb,
  created_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_created_at ON promo_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_codes_recipient_email ON promo_codes(recipient_email);
CREATE INDEX IF NOT EXISTS idx_promo_codes_redeemed_at ON promo_codes(redeemed_at);

-- Add user subscription expiration to support gifted months
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status varchar(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamptz(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_cancel_at_period_end boolean;
ALTER TABLE users ALTER COLUMN stripe_cancel_at_period_end SET DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Admin flag and lightweight usage metrics
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean;
ALTER TABLE users ALTER COLUMN is_admin SET DEFAULT false;

-- Aggregate counters per user to power the admin dashboard quickly
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_total integer;
ALTER TABLE users ALTER COLUMN scans_total SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_birthdays integer;
ALTER TABLE users ALTER COLUMN scans_birthdays SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_weddings integer;
ALTER TABLE users ALTER COLUMN scans_weddings SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shares_sent integer;
ALTER TABLE users ALTER COLUMN shares_sent SET DEFAULT 0;
-- Additional per-category counters used in the app UI
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_sport_events integer;
ALTER TABLE users ALTER COLUMN scans_sport_events SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_appointments integer;
ALTER TABLE users ALTER COLUMN scans_appointments SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_doctor_appointments integer;
ALTER TABLE users ALTER COLUMN scans_doctor_appointments SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_play_days integer;
ALTER TABLE users ALTER COLUMN scans_play_days SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_general_events integer;
ALTER TABLE users ALTER COLUMN scans_general_events SET DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_car_pool integer;
ALTER TABLE users ALTER COLUMN scans_car_pool SET DEFAULT 0;

-- Ensure promo_codes has new Stripe linkage columns when upgrading
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS stripe_charge_id text;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS stripe_refund_id text;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS revoked_at timestamptz(6);
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS metadata jsonb;
CREATE INDEX IF NOT EXISTS idx_promo_codes_stripe_payment_intent ON promo_codes(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_stripe_checkout ON promo_codes(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_revoked_at ON promo_codes(revoked_at);

-- Gift orders are created before payment and fulfilled after Stripe webhook confirmation
CREATE TABLE IF NOT EXISTS gift_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  purchaser_email text,
  purchaser_name text,
  recipient_name text,
  recipient_email text,
  message text,
  quantity integer NOT NULL,
  period varchar(16) NOT NULL,
  amount_cents integer NOT NULL,
  currency varchar(10) NOT NULL DEFAULT 'USD',
  status varchar(32) NOT NULL DEFAULT 'pending', -- pending | paid | fulfilled | failed | refunded
  promo_code_id uuid REFERENCES promo_codes(id),
  metadata jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_orders_status ON gift_orders(status);
CREATE INDEX IF NOT EXISTS idx_gift_orders_payment_intent ON gift_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_gift_orders_checkout_session ON gift_orders(stripe_checkout_session_id);

-- Store processed Stripe webhook events for idempotency/debugging
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at ON stripe_webhook_events(created_at DESC);




