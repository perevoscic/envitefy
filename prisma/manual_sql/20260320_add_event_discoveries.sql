CREATE TABLE IF NOT EXISTS event_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES event_history(id) ON DELETE CASCADE,
  workflow text NOT NULL,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  document jsonb,
  canonical_parse jsonb,
  enrichment jsonb,
  pipeline jsonb NOT NULL DEFAULT '{}'::jsonb,
  debug jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_discoveries_workflow_updated
  ON event_discoveries(workflow, updated_at DESC);
