#!/usr/bin/env node
/**
 * Verify Vercel Blob objects for broken event_history_input_blobs rows and optionally
 * backfill storage_pathname + storage_url.
 *
 * Requires: DATABASE_URL, BLOB_READ_WRITE_TOKEN (same as app ingest).
 *
 * Default: dry-run (no DB writes). Prints head/list result per row.
 *   node scripts/backfill-discovery-blob-pathnames.mjs
 *   node scripts/backfill-discovery-blob-pathnames.mjs --limit 5
 * Apply updates:
 *   node scripts/backfill-discovery-blob-pathnames.mjs --apply
 *
 * Pathname rules must match src/lib/discovery-input-storage.ts (see comment there).
 */

import { BlobNotFoundError, head, list } from "@vercel/blob";
import { createPoolFromEnv } from "./lib/pg-from-env.mjs";

/** Keep in sync with sanitizeDiscoveryFileName in src/lib/discovery-input-storage.ts */
function sanitizeDiscoveryFileName(name) {
  const base = String(name ?? "").replace(/[/\\?%*:|"<>]/g, "_").slice(0, 200);
  return base || "upload";
}

function discoveryInputPathname(eventId, fileName) {
  return `discovery-input/${eventId}/${sanitizeDiscoveryFileName(fileName)}`;
}

function parseArgs(argv) {
  let limit = null;
  let apply = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") apply = true;
    else if (a === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
      if (!Number.isFinite(limit) || limit < 1) {
        console.error("--limit must be a positive number");
        process.exit(1);
      }
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: node scripts/backfill-discovery-blob-pathnames.mjs [--limit N] [--apply]
  --apply   Write storage_pathname and storage_url (default: verify only)
  --limit N Process at most N rows`);
      process.exit(0);
    }
  }
  const dryRun = !apply;
  return { limit, apply, dryRun };
}

const BROKEN_SQL = `
  select b.event_id::text as event_id, b.file_name, b.size_bytes
  from public.event_history_input_blobs b
  where coalesce(length(b.data), 0) = 0
    and nullif(trim(coalesce(b.storage_pathname, '')), '') is null
  order by b.created_at desc nulls last
`;

async function resolveBlobMeta(eventId, fileName, sizeBytes, token) {
  const guessed = discoveryInputPathname(eventId, fileName);
  try {
    const meta = await head(guessed, { token });
    return { pathname: meta.pathname, url: meta.url, via: "head" };
  } catch (e) {
    if (!(e instanceof BlobNotFoundError)) throw e;
  }

  const prefix = `discovery-input/${eventId}/`;
  const { blobs, hasMore } = await list({ prefix, limit: 1000, token });
  if (hasMore) {
    console.warn(`[warn] list hasMore for ${prefix} — increase limit or fix manually`);
  }
  const exact = blobs.find((b) => b.pathname === guessed);
  if (exact) {
    return { pathname: exact.pathname, url: exact.url, via: "list_exact" };
  }
  if (blobs.length === 1) {
    const b = blobs[0];
    return { pathname: b.pathname, url: b.url, via: "list_single" };
  }
  if (sizeBytes != null && Number.isFinite(Number(sizeBytes))) {
    const want = Number(sizeBytes);
    const bySize = blobs.filter((b) => b.size === want);
    if (bySize.length === 1) {
      const b = bySize[0];
      return { pathname: b.pathname, url: b.url, via: "list_size_match" };
    }
  }
  return null;
}

async function main() {
  const { limit, apply, dryRun } = parseArgs(process.argv);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token?.trim()) {
    console.error("BLOB_READ_WRITE_TOKEN is not set.");
    process.exit(1);
  }

  const pool = createPoolFromEnv();
  let client;
  try {
    client = await pool.connect();
    let sql = BROKEN_SQL;
    const params = [];
    if (limit != null) {
      sql = `${BROKEN_SQL.trim()}\n  limit $1`;
      params.push(limit);
    }
    const { rows } = await client.query(sql, params);
    console.log(`[backfill] broken rows to process: ${rows.length}${dryRun ? " (dry-run)" : " (--apply)"}`);

    let ok = 0;
    let miss = 0;
    let updated = 0;

    for (const row of rows) {
      const { event_id: eventId, file_name: fileName, size_bytes: sizeBytes } = row;
      const guessed = discoveryInputPathname(eventId, fileName);
      let meta;
      try {
        meta = await resolveBlobMeta(eventId, fileName, sizeBytes, token);
      } catch (err) {
        console.error(`[error] ${eventId}:`, err?.message || err);
        miss++;
        continue;
      }
      if (!meta) {
        console.log(`[miss] ${eventId} guessed=${guessed}`);
        miss++;
        continue;
      }
      ok++;
      console.log(`[ok] ${eventId} pathname=${meta.pathname} via=${meta.via}`);
      if (!apply) continue;
      const up = await client.query(
        `update public.event_history_input_blobs
         set storage_pathname = $2,
             storage_url = $3,
             updated_at = now()
         where event_id = $1::uuid
         returning event_id`,
        [eventId, meta.pathname, meta.url]
      );
      if (up.rowCount === 1) updated++;
      else console.warn(`[warn] update rowCount=${up.rowCount} for ${eventId}`);
    }

    console.log(
      `[backfill] summary resolved=${ok} missing=${miss} updated=${apply ? updated : 0} (dryRun=${dryRun})`
    );
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
