-- Private, revocable calendar subscriptions. Setup creates this table lazily too.
CREATE TABLE IF NOT EXISTS apple_calendar_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_fetched_at timestamptz
);
