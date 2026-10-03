BEGIN;
CREATE TABLE IF NOT EXISTS event_collaborators (
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_collaborators_user ON event_collaborators(user_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS event_collaborator_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  email_status text NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_collaborator_invites_event ON event_collaborator_invites(event_id);
CREATE TABLE IF NOT EXISTS event_edit_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_collaborator_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_edit_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.event_collaborators, public.event_collaborator_invites, public.event_edit_activity FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.event_collaborators, public.event_collaborator_invites, public.event_edit_activity FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.event_collaborators, public.event_collaborator_invites, public.event_edit_activity FROM authenticated;
  END IF;
END $$;
COMMIT;
