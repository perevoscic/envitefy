#!/usr/bin/env node
/**
 * Deletes event_history_input_blobs rows with no bytea and no storage_pathname.
 * Does not delete event_history. Use only after backfill failed and you accept loss.
 *
 *   node scripts/delete-broken-event-history-input-blobs.mjs          # lists count + sample
 *   DELETE_BROKEN_INPUT_BLOBS=1 node scripts/delete-broken-event-history-input-blobs.mjs --apply
 */

import { createPoolFromEnv } from "./lib/pg-from-env.mjs";

const PREVIEW_SQL = `
  select event_id::text, file_name, created_at
  from public.event_history_input_blobs
  where coalesce(length(data), 0) = 0
    and nullif(trim(coalesce(storage_pathname, '')), '') is null
  order by created_at desc nulls last
`;

const COUNT_SQL = `
  select count(*)::int as n
  from public.event_history_input_blobs
  where coalesce(length(data), 0) = 0
    and nullif(trim(coalesce(storage_pathname, '')), '') is null
`;

const DELETE_SQL = `
  delete from public.event_history_input_blobs
  where coalesce(length(data), 0) = 0
    and nullif(trim(coalesce(storage_pathname, '')), '') is null
`;

async function main() {
  const apply = process.argv.includes("--apply");
  const pool = createPoolFromEnv();
  const client = await pool.connect();
  try {
    const { rows: countRows } = await client.query(COUNT_SQL);
    const n = countRows[0]?.n ?? 0;
    console.log(`[cleanup] broken input_blob rows: ${n}`);

    const { rows: samples } = await client.query(`${PREVIEW_SQL} limit 10`);
    for (const r of samples) {
      console.log(`  sample ${r.event_id} ${r.file_name}`);
    }

    if (!apply) {
      console.log("[cleanup] dry-run. To delete, run with DELETE_BROKEN_INPUT_BLOBS=1 and --apply");
      return;
    }
    if (process.env.DELETE_BROKEN_INPUT_BLOBS !== "1") {
      console.error("[cleanup] Refusing: set DELETE_BROKEN_INPUT_BLOBS=1");
      process.exit(1);
    }
    const del = await client.query(DELETE_SQL);
    console.log(`[cleanup] deleted ${del.rowCount} rows`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
