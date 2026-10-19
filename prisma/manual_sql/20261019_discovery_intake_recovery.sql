-- Additive recovery/cancellation metadata. No event or source data is deleted.
CREATE TABLE IF NOT EXISTS event_discovery_controls (
  event_id text PRIMARY KEY,
  owner_id text NOT NULL,
  client_key text,
  cancel_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, client_key)
);
ALTER TABLE event_discovery_controls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE event_discovery_controls FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE event_discovery_controls FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE event_discovery_controls FROM authenticated; END IF;
END $$;

-- Historical parser-stage names were never an explicit host publication.
UPDATE event_history
SET data = coalesce(data, '{}'::jsonb) || '{"status":"draft","draftStatus":"draft"}'::jsonb
WHERE (
  data->>'createdVia' IN (
    'meet-discovery', 'meet-discovery-v2', 'football-discovery',
    'football-discovery-v2', 'sports-discovery-v1'
  ) OR data#>>'{discoverySource,workflow}' IN ('gymnastics', 'football', 'sports')
)
AND (
  lower(trim(coalesce(data->>'status', ''))) IN (
    'processing', 'review_ready', 'ingested', 'needs_review',
    'failed_extract', 'failed_parse', 'failed_enrich', 'failed_compose'
  ) OR lower(trim(coalesce(data->>'draftStatus', ''))) IN (
    'processing', 'review_ready', 'ingested', 'needs_review',
    'failed_extract', 'failed_parse', 'failed_enrich', 'failed_compose'
  )
)
AND lower(trim(coalesce(data->>'status', ''))) <> 'published'
AND lower(trim(coalesce(data->>'draftStatus', ''))) <> 'published';
