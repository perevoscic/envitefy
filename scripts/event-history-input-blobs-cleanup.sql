-- Optional cleanup when blobs are gone and you accept data loss for discovery inputs.
-- Review broken rows first (see scripts/event-history-input-blobs-diagnostics.sql).
-- event_history rows are NOT deleted here; only the input_blob sidecar rows.

-- Preview
select event_id, mime_type, file_name, size_bytes, created_at
from public.event_history_input_blobs
where coalesce(length(data), 0) = 0
  and nullif(trim(coalesce(storage_pathname, '')), '') is null;

-- Delete broken sidecar rows (run in a transaction; uncomment to execute)
-- begin;
-- delete from public.event_history_input_blobs
-- where coalesce(length(data), 0) = 0
--   and nullif(trim(coalesce(storage_pathname, '')), '') is null;
-- commit;
