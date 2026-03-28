#!/usr/bin/env node
/**
 * Migrate discovery input files from Postgres (bytea / inline JSON dataUrl) to Vercel Blob.
 *
 * Env:
 *   DATABASE_URL, BLOB_READ_WRITE_TOKEN (required for live migrate)
 *   PGSSL_DISABLE_VERIFY, PGSSL_CA_BASE64 — same as other DB scripts
 *   MIGRATE_BATCH_SIZE (default 25), MIGRATE_LIMIT (max rows per run, 0 = unlimited)
 *   DRY_RUN=1 — log actions only, no put() or DB writes
 *   BETWEEN_BATCH_MS (default 0) — pause between batches
 *   MIGRATE_PHASE=1 | 2 | all (default all) — same as --phase; env overrides CLI
 *
 * Usage:
 *   node scripts/migrate-input-blobs-to-vercel.mjs --count
 *   DRY_RUN=1 node scripts/migrate-input-blobs-to-vercel.mjs --limit 5
 *   node scripts/migrate-input-blobs-to-vercel.mjs --phase 1
 */
import "dotenv/config";
import { put } from "@vercel/blob";
import pg from "pg";

const { Pool } = pg;

function parseArgs(argv) {
  const args = { count: false, dryRun: false, limit: 0, phase: "all" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--count") args.count = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--phase" && argv[i + 1]) {
      args.phase = String(argv[++i]);
    } else if (a === "--limit" && argv[i + 1]) {
      args.limit = Math.max(0, Number.parseInt(argv[++i], 10) || 0);
    }
  }
  if (String(process.env.DRY_RUN || "").toLowerCase() === "1" || process.env.DRY_RUN === "true") {
    args.dryRun = true;
  }
  const envLimit = Number.parseInt(process.env.MIGRATE_LIMIT || "0", 10);
  if (!args.limit && envLimit > 0) args.limit = envLimit;
  return args;
}

function getConnectionConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !databaseUrl.trim()) {
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

function sanitizeDiscoveryFileName(name) {
  const base = String(name || "")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .slice(0, 200);
  return base || "upload";
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+);base64,([\s\S]*)$/);
  if (!match) return null;
  try {
    return {
      mimeType: match[1],
      data: Buffer.from(match[2], "base64"),
    };
  } catch {
    return null;
  }
}

async function ensureStorageColumns(pool) {
  await pool.query(`
    alter table event_history_input_blobs
      add column if not exists storage_pathname text
  `);
  await pool.query(`
    alter table event_history_input_blobs
      add column if not exists storage_url text
  `);
  await pool.query(`
    alter table event_history_input_blobs
      alter column data drop not null
  `);
}

async function sleep(ms) {
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}

async function runCounts(pool) {
  const pendingBytea = await pool.query(`
    select count(*)::int as n
    from event_history_input_blobs
    where data is not null
      and octet_length(data) > 0
      and (storage_pathname is null or trim(storage_pathname) = '')
  `);
  const phase2 = await pool.query(`
    select count(*)::int as n
    from event_history eh
    where jsonb_extract_path_text(eh.data, 'discoverySource', 'input', 'type') = 'file'
      and coalesce(
        jsonb_extract_path_text(eh.data, 'discoverySource', 'input', 'dataUrl'),
        ''
      ) <> ''
      and not exists (
        select 1
        from event_history_input_blobs b
        where b.event_id = eh.id
          and b.storage_pathname is not null
          and trim(b.storage_pathname) <> ''
      )
      and not exists (
        select 1
        from event_history_input_blobs b
        where b.event_id = eh.id
          and b.data is not null
          and octet_length(b.data) > 0
      )
  `);
  const n1 = pendingBytea.rows[0]?.n ?? 0;
  const n2 = phase2.rows[0]?.n ?? 0;
  console.log("[migrate-blob] counts");
  console.log(`  event_history_input_blobs pending bytea -> blob: ${n1}`);
  console.log(`  event_history JSON dataUrl only (no blob pathname): ${n2}`);
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.warn("[migrate-blob] BLOB_READ_WRITE_TOKEN is not set (required for live migrate)");
  } else {
    console.log("[migrate-blob] BLOB_READ_WRITE_TOKEN is set");
  }
}

async function migratePhase1Row(pool, row, dryRun) {
  const eventId = row.event_id;
  const mimeType = row.mime_type || "application/octet-stream";
  const fileName = row.file_name || "upload";
  const buf = row.data;
  if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
    return { status: "skipped", reason: "empty-data" };
  }
  const safe = sanitizeDiscoveryFileName(fileName);
  const pathname = `discovery-input/${eventId}/${safe}`;

  if (dryRun) {
    console.log(`[phase1] DRY_RUN would put ${pathname} (${buf.length} bytes)`);
    return { status: "dry_run", bytes: buf.length };
  }

  const blob = await put(pathname, buf, {
    access: "private",
    contentType: mimeType,
    allowOverwrite: true,
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      update event_history_input_blobs
      set
        storage_pathname = $2,
        storage_url = $3,
        data = null,
        updated_at = now()
      where event_id = $1
    `,
      [eventId, blob.pathname, blob.url]
    );
    await client.query("COMMIT");
    return { status: "migrated", bytes: buf.length, pathname: blob.pathname };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      status: "failed",
      reason: err instanceof Error ? err.message : String(err),
    };
  } finally {
    client.release();
  }
}

async function migratePhase2Row(pool, row, dryRun) {
  const eventId = row.id;
  const data = row.data && typeof row.data === "object" ? row.data : null;
  const input =
    data?.discoverySource?.input && typeof data.discoverySource.input === "object"
      ? data.discoverySource.input
      : null;
  if (!input?.dataUrl) {
    return { status: "skipped", reason: "no-dataUrl" };
  }
  const parsed = parseDataUrl(input.dataUrl);
  if (!parsed?.data?.length) {
    return { status: "failed", reason: "malformed-dataUrl" };
  }
  const mimeType = String(input.mimeType || parsed.mimeType || "application/octet-stream");
  const fileName = input.fileName || "upload";
  const safe = sanitizeDiscoveryFileName(fileName);
  const pathname = `discovery-input/${eventId}/${safe}`;

  if (dryRun) {
    console.log(`[phase2] DRY_RUN would put ${pathname} (${parsed.data.length} bytes) + strip JSON`);
    return { status: "dry_run", bytes: parsed.data.length };
  }

  const blob = await put(pathname, parsed.data, {
    access: "private",
    contentType: mimeType,
    allowOverwrite: true,
  });

  const metadataInput = {
    ...input,
    mimeType,
    fileName: input.fileName || null,
    sizeBytes:
      Number.isFinite(input.sizeBytes) && input.sizeBytes > 0
        ? input.sizeBytes
        : parsed.data.length,
    blobStored: true,
  };
  delete metadataInput.dataUrl;

  const nextData = {
    ...data,
    discoverySource: {
      ...data.discoverySource,
      input: metadataInput,
    },
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `
      insert into event_history_input_blobs (
        event_id, mime_type, file_name, size_bytes, data, storage_pathname, storage_url
      )
      values ($1, $2, $3, $4, null, $5, $6)
      on conflict (event_id) do update set
        mime_type = excluded.mime_type,
        file_name = excluded.file_name,
        size_bytes = excluded.size_bytes,
        data = null,
        storage_pathname = excluded.storage_pathname,
        storage_url = excluded.storage_url,
        updated_at = now()
    `,
      [
        eventId,
        mimeType,
        metadataInput.fileName,
        metadataInput.sizeBytes,
        blob.pathname,
        blob.url,
      ]
    );
    await client.query(`update event_history set data = $2::jsonb where id = $1`, [
      eventId,
      JSON.stringify(nextData),
    ]);
    await client.query("COMMIT");
    return { status: "migrated", bytes: parsed.data.length, pathname: blob.pathname };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      status: "failed",
      reason: err instanceof Error ? err.message : String(err),
    };
  } finally {
    client.release();
  }
}

async function runPhase1(pool, args) {
  const batchSize = Math.max(
    1,
    Math.min(200, Number.parseInt(process.env.MIGRATE_BATCH_SIZE || "25", 10) || 25)
  );
  const betweenMs = Math.max(0, Number.parseInt(process.env.BETWEEN_BATCH_MS || "0", 10) || 0);
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let dry = 0;
  let batch = 0;

  while (args.limit === 0 || migrated + skipped + failed + dry < args.limit) {
    const remaining =
      args.limit > 0 ? args.limit - (migrated + skipped + failed + dry) : batchSize;
    const take = Math.min(batchSize, remaining > 0 ? remaining : batchSize);
    const res = await pool.query(
      `
      select event_id, mime_type, file_name, size_bytes, data
      from event_history_input_blobs
      where data is not null
        and octet_length(data) > 0
        and (storage_pathname is null or trim(storage_pathname) = '')
      order by event_id
      limit $1
    `,
      [take]
    );
    const rows = res.rows || [];
    if (!rows.length) break;

    batch += 1;
    console.log(`[phase1] batch ${batch}: ${rows.length} row(s)`);

    for (const row of rows) {
      const result = await migratePhase1Row(pool, row, args.dryRun);
      if (result.status === "migrated") {
        migrated += 1;
        console.log(`[phase1] ok ${row.event_id} ${result.bytes} bytes -> ${result.pathname}`);
      } else if (result.status === "dry_run") {
        dry += 1;
      } else if (result.status === "skipped") {
        skipped += 1;
        console.warn(`[phase1] skipped ${row.event_id}: ${result.reason}`);
      } else {
        failed += 1;
        console.error(`[phase1] failed ${row.event_id}: ${result.reason}`);
      }
      if (args.limit > 0 && migrated + skipped + failed + dry >= args.limit) break;
    }

    await sleep(betweenMs);
    if (rows.length < take) break;
  }

  console.log(
    `[phase1] done migrated=${migrated} dry_run=${dry} skipped=${skipped} failed=${failed}`
  );
  return failed > 0 ? 1 : 0;
}

async function runPhase2(pool, args) {
  const batchSize = Math.max(
    1,
    Math.min(100, Number.parseInt(process.env.MIGRATE_BATCH_SIZE || "25", 10) || 25)
  );
  const betweenMs = Math.max(0, Number.parseInt(process.env.BETWEEN_BATCH_MS || "0", 10) || 0);
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let dry = 0;
  let batch = 0;

  while (args.limit === 0 || migrated + skipped + failed + dry < args.limit) {
    const remaining =
      args.limit > 0 ? args.limit - (migrated + skipped + failed + dry) : batchSize;
    const take = Math.min(batchSize, remaining > 0 ? remaining : batchSize);
    const res = await pool.query(
      `
      select eh.id, eh.data
      from event_history eh
      where jsonb_extract_path_text(eh.data, 'discoverySource', 'input', 'type') = 'file'
        and coalesce(
          jsonb_extract_path_text(eh.data, 'discoverySource', 'input', 'dataUrl'),
          ''
        ) <> ''
        and not exists (
          select 1
          from event_history_input_blobs b
          where b.event_id = eh.id
            and b.storage_pathname is not null
            and trim(b.storage_pathname) <> ''
        )
        and not exists (
          select 1
          from event_history_input_blobs b
          where b.event_id = eh.id
            and b.data is not null
            and octet_length(b.data) > 0
        )
      order by eh.created_at asc nulls last, eh.id asc
      limit $1
    `,
      [take]
    );
    const rows = res.rows || [];
    if (!rows.length) break;

    batch += 1;
    console.log(`[phase2] batch ${batch}: ${rows.length} row(s)`);

    for (const row of rows) {
      const result = await migratePhase2Row(pool, row, args.dryRun);
      if (result.status === "migrated") {
        migrated += 1;
        console.log(`[phase2] ok ${row.id} ${result.bytes} bytes -> ${result.pathname}`);
      } else if (result.status === "dry_run") {
        dry += 1;
      } else if (result.status === "skipped") {
        skipped += 1;
        console.warn(`[phase2] skipped ${row.id}: ${result.reason}`);
      } else {
        failed += 1;
        console.error(`[phase2] failed ${row.id}: ${result.reason}`);
      }
      if (args.limit > 0 && migrated + skipped + failed + dry >= args.limit) break;
    }

    await sleep(betweenMs);
    if (rows.length < take) break;
  }

  console.log(
    `[phase2] done migrated=${migrated} dry_run=${dry} skipped=${skipped} failed=${failed}`
  );
  return failed > 0 ? 1 : 0;
}

async function main() {
  const args = parseArgs(process.argv);
  const pool = new Pool(getConnectionConfig());

  try {
    await ensureStorageColumns(pool);

    if (args.count) {
      await runCounts(pool);
      return;
    }

    if (!args.dryRun && !process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
      throw new Error("BLOB_READ_WRITE_TOKEN is required unless DRY_RUN=1 or --dry-run");
    }

    const phase = String(
      process.env.MIGRATE_PHASE || args.phase || "all"
    ).toLowerCase();
    if (!["1", "2", "all"].includes(phase)) {
      throw new Error(`Invalid phase ${phase} (use 1, 2, or all)`);
    }

    let code = 0;
    if (phase === "1" || phase === "all") {
      code |= await runPhase1(pool, args);
    }
    if (phase === "2" || phase === "all") {
      code |= await runPhase2(pool, args);
    }
    process.exitCode = code;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate-blob] fatal", err instanceof Error ? err.message : err);
  process.exit(1);
});
