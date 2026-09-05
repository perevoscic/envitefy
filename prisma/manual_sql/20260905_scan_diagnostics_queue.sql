-- Run before deploying the scan worker; scan requests never create schema.

BEGIN;

create table if not exists scan_attempts (
  id uuid primary key default gen_random_uuid(),
  scan_attempt_id varchar(120) not null,
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid references event_history(id) on delete set null,
  status varchar(24) not null default 'processed',
  title varchar(300),
  category varchar(160),
  source_type varchar(32),
  file_name varchar(512),
  file_size bigint,
  mime_type varchar(160),
  ocr_source varchar(80),
  ocr_text text,
  fields_guess jsonb not null default '{}'::jsonb,
  preview_bytes bytea,
  preview_mime_type varchar(80),
  error_message text,
  created_at timestamptz(6) not null default now(),
  expires_at timestamptz(6) not null default (now() + interval '30 days'),
  completed_at timestamptz(6),
  saved_at timestamptz(6),
  updated_at timestamptz(6) not null default now()
);

alter table scan_attempts
add column if not exists expires_at timestamptz(6) default (now() + interval '30 days');

update scan_attempts
set expires_at = created_at + interval '30 days'
where expires_at is null;

create unique index if not exists idx_scan_attempts_user_attempt_unique
on scan_attempts(user_id, scan_attempt_id);

create index if not exists idx_scan_attempts_user_created_at
on scan_attempts(user_id, created_at desc);

create index if not exists idx_scan_attempts_status_created_at
on scan_attempts(status, created_at desc);

create index if not exists idx_scan_attempts_event_id
on scan_attempts(event_id)
where event_id is not null;

create index if not exists idx_scan_attempts_expires_at
on scan_attempts(expires_at)
where expires_at is not null;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_total integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_birthdays integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_weddings integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_sport_events integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_appointments integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_doctor_appointments integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_play_days integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_general_events integer DEFAULT 0;

ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_car_pool integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS scan_diagnostic_jobs (
  scan_id uuid PRIMARY KEY REFERENCES scan_attempts(id) ON DELETE CASCADE,
  image_bytes bytea NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  lease_token uuid,
  last_error text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);
CREATE INDEX IF NOT EXISTS idx_scan_diagnostic_jobs_ready
  ON scan_diagnostic_jobs(available_at) WHERE attempts < 6;

COMMIT;

