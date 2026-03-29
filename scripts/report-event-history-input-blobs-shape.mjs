#!/usr/bin/env node
/**
 * Prints the same shape counts as scripts/event-history-input-blobs-diagnostics.sql query 1.
 * Usage: node scripts/report-event-history-input-blobs-shape.mjs
 */

import { createPoolFromEnv } from "./lib/pg-from-env.mjs";

const SQL = `
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
from public.event_history_input_blobs
`;

async function main() {
  const pool = createPoolFromEnv();
  try {
    const { rows } = await pool.query(SQL);
    console.log(JSON.stringify(rows[0], null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
