-- Host-authored messages only. Editing an event never inserts or sends a message.
-- Apply as the backend table owner (postgres in Supabase SQL Editor).
BEGIN;

CREATE TABLE IF NOT EXISTS public.event_messages (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.event_history(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS event_messages_event_created ON public.event_messages(event_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.event_message_deliveries (
  message_id uuid NOT NULL REFERENCES public.event_messages(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, email)
);

-- Private server-only data. No anon/authenticated policies are needed: the app
-- authorizes owners in its API and connects with the backend database role.
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_message_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.event_messages, public.event_message_deliveries FROM PUBLIC;

-- These client roles exist in Supabase, but may not exist in local Postgres.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.event_messages, public.event_message_deliveries FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.event_messages, public.event_message_deliveries FROM authenticated;
  END IF;
END $$;

COMMIT;
