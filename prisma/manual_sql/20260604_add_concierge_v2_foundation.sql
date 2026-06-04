-- Envitefy Concierge V2 additive foundation.
-- This migration intentionally keeps event_history as the existing public
-- event/product row while adding canonical planning records that can link to it.

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE,
  workspace_type text NOT NULL DEFAULT 'personal',
  default_mode text,
  timezone text,
  default_visibility text NOT NULL DEFAULT 'public',
  settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_mode text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS timezone text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS default_visibility text NOT NULL DEFAULT 'public';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_type
  ON workspaces(owner_user_id, workspace_type);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  invited_email text,
  role text NOT NULL DEFAULT 'guest',
  permissions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  invited_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  accepted_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_memberships_workspace_user
  ON memberships(workspace_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_workspace_role
  ON memberships(workspace_id, role);

CREATE INDEX IF NOT EXISTS idx_memberships_invited_email
  ON memberships(invited_email);

CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  primary_guardian_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  timezone text,
  notes text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_families_workspace
  ON families(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS family_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  relationship text,
  permissions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_guardians_family
  ON family_guardians(family_id);

CREATE INDEX IF NOT EXISTS idx_family_guardians_user
  ON family_guardians(user_id);

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  display_name text,
  birthdate date,
  grade text,
  school_name text,
  allergies text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  profile_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_participants_workspace
  ON participants(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_participants_family
  ON participants(family_id);

CREATE INDEX IF NOT EXISTS idx_participants_user
  ON participants(user_id);

CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  mode text NOT NULL DEFAULT 'social',
  status text NOT NULL DEFAULT 'draft',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programs_workspace_status
  ON programs(workspace_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_programs_owner_updated
  ON programs(owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS program_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'participant',
  roster_status text NOT NULL DEFAULT 'active',
  jersey_number text,
  group_name text,
  notes text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_program_participants_program_participant
  ON program_participants(program_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_program_participants_program_role
  ON program_participants(program_id, role, roster_status);

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  latitude numeric,
  longitude numeric,
  map_url text,
  parking_notes text,
  accessibility_notes text,
  timezone text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venues_workspace_name
  ON venues(workspace_id, name);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  resource_type text NOT NULL DEFAULT 'other',
  name text NOT NULL,
  capacity integer,
  availability_rule text,
  attributes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_workspace_type
  ON resources(workspace_id, resource_type, status);

CREATE TABLE IF NOT EXISTS event_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  series_type text NOT NULL DEFAULT 'recurring',
  recurrence_rule text,
  start_time_local text,
  duration_minutes integer,
  timezone text,
  status text NOT NULL DEFAULT 'active',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_series_program_status
  ON event_series(program_id, status);

CREATE TABLE IF NOT EXISTS event_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  series_id uuid REFERENCES event_series(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  occurrence_type text NOT NULL DEFAULT 'event',
  start_at timestamptz(6),
  end_at timestamptz(6),
  timezone text,
  location_text text,
  status text NOT NULL DEFAULT 'scheduled',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_occurrences_program_start
  ON event_occurrences(program_id, start_at);

CREATE INDEX IF NOT EXISTS idx_event_occurrences_workspace_start
  ON event_occurrences(workspace_id, start_at);

CREATE TABLE IF NOT EXISTS resource_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES event_occurrences(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  required_attributes_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_requirements_occurrence
  ON resource_requirements(occurrence_id);

CREATE TABLE IF NOT EXISTS resource_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES event_occurrences(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  assigned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  starts_at timestamptz(6) NOT NULL,
  ends_at timestamptz(6) NOT NULL,
  status text NOT NULL DEFAULT 'assigned',
  conflict_status text,
  notes text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_time
  ON resource_assignments(resource_id, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_resource_assignments_occurrence
  ON resource_assignments(occurrence_id);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES event_occurrences(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'expected',
  checked_in_at timestamptz(6),
  checked_out_at timestamptz(6),
  marked_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_attendance_occurrence_participant
  ON attendance_records(occurrence_id, participant_id)
  WHERE participant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_records_occurrence_participant
  ON attendance_records(occurrence_id, participant_id);

CREATE TABLE IF NOT EXISTS event_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
  series_id uuid REFERENCES event_series(id) ON DELETE SET NULL,
  occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE SET NULL,
  legacy_event_history_id uuid REFERENCES event_history(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  target_type text NOT NULL DEFAULT 'program',
  visibility text NOT NULL DEFAULT 'public',
  share_token text UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_pages_program_status
  ON event_pages(program_id, status);

CREATE INDEX IF NOT EXISTS idx_event_pages_legacy_event
  ON event_pages(legacy_event_history_id);

CREATE TABLE IF NOT EXISTS event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL,
  event_type text NOT NULL,
  name text NOT NULL,
  description text,
  title_template text,
  default_form_schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_rsvp_schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_reminders_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_checklist_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_theme_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system boolean NOT NULL DEFAULT true,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_templates_system_type
  ON event_templates(mode, event_type)
  WHERE is_system = true AND workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_templates_workspace_mode
  ON event_templates(workspace_id, mode, event_type);

CREATE TABLE IF NOT EXISTS concierge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  mode text,
  source_kind text NOT NULL DEFAULT 'text',
  input_text text,
  status text NOT NULL DEFAULT 'started',
  model_provider text,
  model_name text,
  raw_output_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_output_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  missing_fields_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_sessions_user_created
  ON concierge_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concierge_sessions_workspace_created
  ON concierge_sessions(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS concierge_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES concierge_sessions(id) ON DELETE CASCADE,
  draft_type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  applied_entity_type text,
  applied_entity_id text,
  applied_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_drafts_session
  ON concierge_drafts(session_id, status);

CREATE TABLE IF NOT EXISTS smart_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE SET NULL,
  event_page_id uuid REFERENCES event_pages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_forms_program
  ON smart_forms(program_id, status);

CREATE TABLE IF NOT EXISTS form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES smart_forms(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  options_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_form_fields_form_key
  ON form_fields(form_id, field_key);

CREATE TABLE IF NOT EXISTS form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES smart_forms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_name text,
  guest_email text,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_responses_form
  ON form_responses(form_id, created_at DESC);

CREATE TABLE IF NOT EXISTS volunteer_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE SET NULL,
  event_page_id uuid REFERENCES event_pages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS volunteer_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES volunteer_boards(id) ON DELETE CASCADE,
  occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  quantity_needed integer NOT NULL DEFAULT 1,
  claimed_quantity integer NOT NULL DEFAULT 0,
  start_at timestamptz(6),
  end_at timestamptz(6),
  requirements_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

ALTER TABLE volunteer_slots
  ADD COLUMN IF NOT EXISTS claimed_quantity integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS volunteer_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES volunteer_slots(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_name text,
  guest_email text,
  status text NOT NULL DEFAULT 'claimed',
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  claimed_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_claims_slot_status
  ON volunteer_claims(slot_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_volunteer_claims_slot_email_active
  ON volunteer_claims(slot_id, lower(guest_email))
  WHERE guest_email IS NOT NULL AND status = 'claimed';

UPDATE volunteer_slots vs
SET claimed_quantity = claimed.claimed_quantity
FROM (
  SELECT slot_id, COALESCE(SUM(quantity), 0)::integer AS claimed_quantity
  FROM volunteer_claims
  WHERE status = 'claimed'
  GROUP BY slot_id
) claimed
WHERE vs.id = claimed.slot_id
  AND vs.claimed_quantity IS DISTINCT FROM claimed.claimed_quantity;

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE SET NULL,
  event_page_id uuid REFERENCES event_pages(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_at timestamptz(6),
  external_payment_url text,
  external_payment_note text,
  status text NOT NULL DEFAULT 'unpaid',
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_workspace_status
  ON payment_requests(workspace_id, status);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid REFERENCES payment_requests(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_name text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'unpaid',
  provider text,
  provider_reference text,
  provider_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  manual_method text,
  paid_at timestamptz(6),
  notes text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_provider_reference
  ON payments(provider_reference);

CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  mode text,
  event_type text,
  trigger_key text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL,
  variables_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE SET NULL,
  event_page_id uuid REFERENCES event_pages(id) ON DELETE SET NULL,
  reminder_type text NOT NULL DEFAULT 'custom',
  channel text NOT NULL DEFAULT 'email',
  audience_filter_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz(6),
  status text NOT NULL DEFAULT 'draft',
  template_id uuid REFERENCES message_templates(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled
  ON reminders(status, scheduled_for);

CREATE TABLE IF NOT EXISTS message_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  name text NOT NULL,
  scope_type text,
  scope_id text,
  audience_filter_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz(6),
  sent_at timestamptz(6),
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES message_campaigns(id) ON DELETE SET NULL,
  reminder_id uuid REFERENCES reminders(id) ON DELETE SET NULL,
  recipient_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  guest_name text,
  channel text NOT NULL DEFAULT 'email',
  to_address text,
  status text NOT NULL DEFAULT 'queued',
  provider text,
  provider_message_id text,
  error_message text,
  sent_at timestamptz(6),
  delivered_at timestamptz(6),
  opened_at timestamptz(6),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

ALTER TABLE message_deliveries
  ADD COLUMN IF NOT EXISTS metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_message_deliveries_status
  ON message_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_message_deliveries_reminder
  ON message_deliveries(reminder_id, created_at DESC);

CREATE TABLE IF NOT EXISTS source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  uploaded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  source_kind text NOT NULL DEFAULT 'text',
  file_url text,
  file_name text,
  file_type text,
  text_content text,
  extracted_text text,
  parse_status text NOT NULL DEFAULT 'pending',
  parsed_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_documents_workspace_created
  ON source_documents(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS extracted_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id uuid NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  title text,
  description text,
  start_at timestamptz(6),
  end_at timestamptz(6),
  confidence numeric,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'proposed',
  applied_entity_type text,
  applied_entity_id text,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extracted_items_document_status
  ON extracted_items(source_document_id, status);

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  occurrence_id uuid REFERENCES event_occurrences(id) ON DELETE SET NULL,
  event_page_id uuid REFERENCES event_pages(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'open',
  sort_order integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_items_program_status
  ON checklist_items(program_id, status);

CREATE TABLE IF NOT EXISTS calendar_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  token text UNIQUE NOT NULL,
  scope_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  timezone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_feeds_token
  ON calendar_feeds(token);

CREATE TABLE IF NOT EXISTS integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'connected',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials_ref text,
  connected_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  last_sync_at timestamptz(6),
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_connections_workspace_provider
  ON integration_connections(workspace_id, provider);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  started_at timestamptz(6),
  completed_at timestamptz(6),
  error_message text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(6) DEFAULT now(),
  updated_at timestamptz(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created
  ON audit_logs(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id);

ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS answers_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS adult_count integer;
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS kid_count integer;
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS allergy_notes text;

CREATE INDEX IF NOT EXISTS idx_rsvp_responses_answers_gin
  ON rsvp_responses USING gin (answers_json);

CREATE INDEX IF NOT EXISTS idx_event_history_concierge_session
  ON event_history(user_id, (data#>>'{conciergeDraft,creationSessionId}'), created_at DESC);
