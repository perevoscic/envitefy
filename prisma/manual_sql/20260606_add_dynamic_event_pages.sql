CREATE TABLE IF NOT EXISTS dynamic_event_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  page_blueprint_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  theme_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_copy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_generation_version text,
  source_conversation_id text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now(),
  published_at timestamptz(6)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dynamic_event_pages_slug_unique
  ON dynamic_event_pages (lower(slug))
  WHERE slug IS NOT NULL AND slug <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_dynamic_event_pages_event_id_unique
  ON dynamic_event_pages (event_id);

CREATE TABLE IF NOT EXISTS dynamic_event_page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_page_id uuid NOT NULL REFERENCES dynamic_event_pages(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  page_blueprint_json jsonb NOT NULL,
  theme_json jsonb NOT NULL,
  generated_copy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text,
  created_at timestamptz(6) DEFAULT now(),
  UNIQUE (event_page_id, version_number)
);
