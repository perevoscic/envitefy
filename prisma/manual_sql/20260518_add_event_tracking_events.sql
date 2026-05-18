CREATE TABLE IF NOT EXISTS event_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event_history(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  target_url text,
  target_domain text,
  target_label text,
  source_surface text,
  viewer_user_id uuid REFERENCES users(id),
  visitor_id_hash text,
  path text,
  referrer text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_tracking_events_event_name_time
  ON event_tracking_events(event_id, event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_tracking_events_occurred_at
  ON event_tracking_events(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_tracking_events_target_domain
  ON event_tracking_events(target_domain);
