ALTER TABLE event_history ADD COLUMN IF NOT EXISTS public_slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_history_public_slug_unique
  ON event_history (lower(public_slug))
  WHERE public_slug IS NOT NULL AND public_slug <> '';

CREATE TABLE IF NOT EXISTS event_public_slug_aliases (
  alias text PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  created_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_public_slug_aliases_event_id
  ON event_public_slug_aliases(event_id);
