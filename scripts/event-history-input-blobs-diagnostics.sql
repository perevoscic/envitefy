-- event_history_input_blobs diagnostics
-- Run against your Postgres (e.g. psql, DBeaver). Adjust schema if not public.
-- Same counts as CLI: npm run blob:input-blobs-report

-- 1) Row counts by storage shape
select
  count(*) filter (
    where coalesce(length(data), 0) > 0
      and nullif(trim(coalesce(storage_pathname, '')), '') is null
  ) as legacy_bytes_only,
  count(*) filter (
    where coalesce(length(data), 0) = 0
      and nullif(trim(coalesce(storage_pathname, '')), '') is not null
  ) as blob_pointer_only,
  count(*) filter (
    where coalesce(length(data), 0) > 0
      and nullif(trim(coalesce(storage_pathname, '')), '') is not null
  ) as both_bytes_and_path,
  count(*) filter (
    where coalesce(length(data), 0) = 0
      and nullif(trim(coalesce(storage_pathname, '')), '') is null
  ) as broken_no_bytes_no_path,
  count(*) as total
from public.event_history_input_blobs;

-- 2) Broken rows (app cannot load: no bytea and no blob pathname)
select
  b.event_id,
  b.mime_type,
  b.file_name,
  b.size_bytes,
  b.created_at
from public.event_history_input_blobs b
where coalesce(length(b.data), 0) = 0
  and nullif(trim(coalesce(b.storage_pathname, '')), '') is null
order by b.created_at desc nulls last;

-- 3) Typical Vercel Blob key (ingest uses sanitizeDiscoveryFileName; path may differ slightly from file_name)
--    discovery-input/<event_id>/<sanitized_file_name>
select
  b.event_id,
  'discovery-input/' || b.event_id::text || '/' || coalesce(b.file_name, '') as guessed_blob_prefix
from public.event_history_input_blobs b
where coalesce(length(b.data), 0) = 0
  and nullif(trim(coalesce(b.storage_pathname, '')), '') is null;
