-- Concierge V2 provider-backed follow-up tables.
-- Safe to run after 20260604_add_concierge_v2_foundation.sql.

CREATE TABLE IF NOT EXISTS membership_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz(6) NOT NULL,
  accepted_at timestamptz(6),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_invitations_membership
  ON membership_invitations(membership_id, status);

CREATE INDEX IF NOT EXISTS idx_membership_invitations_email
  ON membership_invitations(invited_email, status);
