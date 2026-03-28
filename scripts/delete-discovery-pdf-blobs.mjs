#!/usr/bin/env node
/**
 * One-off cleanup: delete legacy discovery PDF blobs from Vercel Blob and clear Postgres references.
 *
 * Env: DATABASE_URL, BLOB_READ_WRITE_TOKEN (required when not dry-run)
 *      DRY_RUN=1 | --dry-run — log only
 *      BATCH_LIMIT (default 50) — max rows per run
 *      BETWEEN_BATCH_MS (default 0)
 *
 * Usage:
 *   DRY_RUN=1 node scripts/delete-discovery-pdf-blobs.mjs
 *   node scripts/delete-discovery-pdf-blobs.mjs --limit 20
 */
import "dotenv/config";
import { del } from "@vercel/blob";
import pg from "pg";

const { Pool } = pg;

function parseArgs(argv) {
  const args = { dryRun: false, limit: 50 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--limit" && argv[i + 1]) {
      args.limit = Math.max(1, Number.parseInt(argv[++i], 10) || 50);
    }
  }
  if (String(process.env.DRY_RUN || "").toLowerCase() === "1" || process.env.DRY_RUN === "true") {
    args.dryRun = true;
  }
  const envLimit = Number.parseInt(process.env.BATCH_LIMIT || process.env.MIGRATE_LIMIT || "0", 10);
  if (envLimit > 0) args.limit = envLimit;
  return args;
}

function getConnectionConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }
  let ssl;
  const disableVerify = String(process.env.PGSSL_DISABLE_VERIFY || "").toLowerCase();
  const caBase64 = process.env.PGSSL_CA_BASE64;
  if (disableVerify === "1" || disableVerify === "true") {
    ssl = { rejectUnauthorized: false };
  } else if (caBase64?.trim()) {
    ssl = {
      rejectUnauthorized: true,
      ca: Buffer.from(caBase64, "base64").toString("utf8"),
    };
  }
  let connectionString = databaseUrl;
  if (ssl) {
    try {
      const parsed = new URL(databaseUrl);
      parsed.searchParams.delete("sslmode");
      parsed.searchParams.delete("ssl");
      connectionString = parsed.toString();
    } catch {}
  }
  return ssl ? { connectionString, ssl } : { connectionString };
}

async function sleep(ms) {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

async function processRow(pool, row, dryRun) {
  const eventId = row.event_id;
  const pathname = row.storage_pathname?.trim() || null;

  if (dryRun) {
    console.log(
      `[dry-run] event_id=${eventId} pathname=${pathname || "(none)"} bytea=${row.has_bytea ? row.bytea_len : 0}`
    );
    return { status: "dry_run" };
  }

  if (pathname) {
    try {
      await del(pathname);
      console.log(`[deleted blob] ${pathname}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/not\s*found|404|does not exist/i.test(msg)) {
        console.warn(`[blob missing, continuing] ${pathname}: ${msg}`);
      } else {
        return { status: "blob_error", reason: msg };
      }
    }
  }

  const client = await pool.connect();
  try {
    await client.query(
      `
      update event_history_input_blobs
      set
        data = null,
        storage_pathname = null,
        storage_url = null,
        updated_at = now()
      where event_id = $1
    `,
      [eventId]
    );
    return { status: "ok" };
  } finally {
    client.release();
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const betweenMs = Number.parseInt(process.env.BETWEEN_BATCH_MS || "0", 10) || 0;

  if (!args.dryRun && !process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.error("BLOB_READ_WRITE_TOKEN is required unless DRY_RUN=1");
    process.exit(1);
  }

  const pool = new Pool(getConnectionConfig());
  try {
    const countRes = await pool.query(`
      select count(*)::int as n
      from event_history_input_blobs
      where
        (
          lower(coalesce(mime_type, '')) like '%pdf%'
          or lower(coalesce(file_name, '')) like '%.pdf'
        )
    `);
    const total = countRes.rows[0]?.n ?? 0;
    console.log(`PDF-related input blob rows (approx): ${total}`);
    if (total === 0) return;

    const res = await pool.query(
      `
      select
        event_id,
        mime_type,
        file_name,
        storage_pathname,
        storage_url,
        (data is not null and octet_length(data) > 0) as has_bytea,
        coalesce(octet_length(data), 0)::int as bytea_len
      from event_history_input_blobs
      where
        (
          lower(coalesce(mime_type, '')) like '%pdf%'
          or lower(coalesce(file_name, '')) like '%.pdf'
        )
      order by updated_at asc nulls first
      limit $1
    `,
      [args.limit]
    );

    let ok = 0;
    let failed = 0;
    for (const row of res.rows) {
      const out = await processRow(pool, row, args.dryRun);
      if (out.status === "ok" || out.status === "dry_run") ok++;
      else {
        failed++;
        console.error(`[failed] event_id=${row.event_id}`, out);
      }
      await sleep(betweenMs);
    }
    console.log(`Done. processed=${res.rows.length} ok/dry=${ok} failed=${failed}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
