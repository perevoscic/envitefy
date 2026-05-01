CREATE TABLE IF NOT EXISTS event_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  design jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_assets_event_updated
  ON event_assets(event_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_assets_user_event
  ON event_assets(user_id, event_id);

CREATE TABLE IF NOT EXISTS conversation_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  event_id uuid REFERENCES event_history(id) ON DELETE CASCADE,
  thread_type text NOT NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_threads_event_type
  ON conversation_threads(user_id, event_id, thread_type, updated_at DESC);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread_created
  ON conversation_messages(thread_id, created_at ASC);

CREATE TABLE IF NOT EXISTS creation_sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'needs_event_details',
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creation_sessions_user_updated
  ON creation_sessions(user_id, updated_at DESC);
