#!/usr/bin/env node
require("dotenv/config");

const { Pool } = require("pg");

const BATCH_SIZE = Math.max(
  1,
  Math.min(500, Number.parseInt(process.env.BACKFILL_BATCH_SIZE || "50", 10) || 50)
);

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

async function ensureBlobTable(pool) {
  await pool.query(`
    create table if not exists event_history_input_blobs (
      event_id uuid primary key references event_history(id) on delete cascade,
      mime_type text not null,
      file_name text null,
      size_bytes integer null,
      data bytea null,
      storage_pathname text null,
      storage_url text null,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    )
  `);
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

async function fetchBatch(pool) {
  const res = await pool.query(
    `
      select id, data
      from event_history
      where jsonb_extract_path_text(data, 'discoverySource', 'input', 'type') = 'file'
        and coalesce(jsonb_extract_path_text(data, 'discoverySource', 'input', 'dataUrl'), '') <> ''
      order by created_at asc nulls last, id asc
      limit $1
    `,
    [BATCH_SIZE]
  );
  return res.rows || [];
}

async function migrateRow(pool, row) {
  const data = row?.data && typeof row.data === "object" ? row.data : null;
  const input =
    data?.discoverySource &&
    typeof data.discoverySource === "object" &&
    data.discoverySource.input &&
    typeof data.discoverySource.input === "object"
      ? data.discoverySource.input
      : null;
  if (!input) {
    return { status: "skipped", reason: "missing-input" };
  }

  const parsed = parseDataUrl(input.dataUrl);
  if (!parsed) {
    return { status: "failed", reason: "malformed-data-url" };
  }

  const metadataInput = {
    ...input,
    mimeType: String(input.mimeType || parsed.mimeType || "application/octet-stream"),
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
          event_id,
          mime_type,
          file_name,
          size_bytes,
          data,
          storage_pathname,
          storage_url
        )
        values ($1, $2, $3, $4, $5, null, null)
        on conflict (event_id)
        do update set
          mime_type = excluded.mime_type,
          file_name = excluded.file_name,
          size_bytes = excluded.size_bytes,
          data = excluded.data,
          storage_pathname = null,
          storage_url = null,
          updated_at = now()
      `,
      [
        row.id,
        metadataInput.mimeType,
        metadataInput.fileName,
        metadataInput.sizeBytes,
        parsed.data,
      ]
    );
    await client.query(`update event_history set data = $2::jsonb where id = $1`, [
      row.id,
      JSON.stringify(nextData),
    ]);
    await client.query("COMMIT");
    return { status: "migrated", bytes: parsed.data.length };
  } catch (error) {
    await client.query("ROLLBACK");
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : String(error || "unknown error"),
    };
  } finally {
    client.release();
  }
}

async function main() {
  const pool = new Pool(getConnectionConfig());
  let scanned = 0;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let batchNumber = 0;

  try {
    await ensureBlobTable(pool);

    while (true) {
      const rows = await fetchBatch(pool);
      if (!rows.length) break;

      batchNumber += 1;
      console.log(`[backfill] batch ${batchNumber}: processing ${rows.length} rows`);

      for (const row of rows) {
        scanned += 1;
        const result = await migrateRow(pool, row);
        if (result.status === "migrated") {
          migrated += 1;
          console.log(`[backfill] migrated ${row.id} (${result.bytes} bytes)`);
          continue;
        }
        if (result.status === "skipped") {
          skipped += 1;
          console.warn(`[backfill] skipped ${row.id}: ${result.reason}`);
          continue;
        }
        failed += 1;
        console.error(`[backfill] failed ${row.id}: ${result.reason}`);
      }
    }

    console.log(
      `[backfill] complete scanned=${scanned} migrated=${migrated} skipped=${skipped} failed=${failed}`
    );
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[backfill] fatal", error instanceof Error ? error.message : error);
  process.exit(1);
});
