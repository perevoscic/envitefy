#!/usr/bin/env node

import pg from "pg";

const { Pool } = pg;

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function cleanString(value, maxLength = 500) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function dateOrNull(value) {
  const text = cleanString(value, 100);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const limit = Math.max(1, Math.min(1000, Number(argValue("--limit", "100")) || 100));
const write = hasArg("--write");
const confirm = argValue("--confirm");

if (write && confirm !== "concierge-v2-backfill") {
  console.error("Refusing to write without --confirm=concierge-v2-backfill.");
  process.exit(2);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(2);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getOrCreateWorkspace(client, userId) {
  const existing = await client.query(
    `select id from workspaces
     where owner_user_id = $1 and workspace_type = 'personal'
     order by created_at asc
     limit 1`,
    [userId],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;
  const created = await client.query(
    `insert into workspaces (owner_user_id, name, slug, workspace_type, created_by_user_id)
     values ($1, 'Personal workspace', concat('personal-', substr($1::text, 1, 8), '-', substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), 'personal', $1)
     returning id`,
    [userId],
  );
  return created.rows[0].id;
}

async function backfillRow(client, row) {
  const data = asRecord(row.data);
  const workspaceId = await getOrCreateWorkspace(client, row.user_id);
  await client.query(
    `insert into memberships (workspace_id, user_id, role, status, invited_by_user_id, accepted_at)
     values ($1, $2, 'program_manager', 'active', $2, now())
     on conflict do nothing`,
    [workspaceId, row.user_id],
  );
  const title = cleanString(row.title || data.title || data.name, 220) || "Untitled event";
  const program = await client.query(
    `insert into programs (workspace_id, owner_user_id, title, mode, status, metadata_json)
     values ($1, $2, $3, $4, 'active', $5::jsonb)
     returning id`,
    [
      workspaceId,
      row.user_id,
      title,
      cleanString(data.mode || data.category, 80) || "social",
      JSON.stringify({ createdVia: "legacy_backfill", legacyEventHistoryId: row.id }),
    ],
  );
  const startAt = dateOrNull(data.startAt || data.startISO || data.start);
  const endAt = dateOrNull(data.endAt || data.endISO || data.end);
  let occurrenceId = null;
  if (startAt) {
    const occurrence = await client.query(
      `insert into event_occurrences (
         workspace_id, program_id, owner_user_id, title, occurrence_type,
         start_at, end_at, timezone, location_text, status, metadata_json
       )
       values ($1, $2, $3, $4, 'event', $5::timestamptz, $6::timestamptz, $7, $8, 'scheduled', $9::jsonb)
       returning id`,
      [
        workspaceId,
        program.rows[0].id,
        row.user_id,
        title,
        startAt,
        endAt,
        cleanString(data.timezone || data.tz, 80) || "America/Chicago",
        cleanString(data.locationText || data.location || data.address, 500) || null,
        JSON.stringify({ createdVia: "legacy_backfill" }),
      ],
    );
    occurrenceId = occurrence.rows[0].id;
  }
  await client.query(
    `insert into event_pages (
       workspace_id, program_id, occurrence_id, legacy_event_history_id, owner_user_id,
       title, target_type, visibility, share_token, status, metadata_json
     )
     values ($1, $2, $3, $4, $5, $6, 'program', $7, concat('backfill-', substr(replace(gen_random_uuid()::text, '-', ''), 1, 24)), 'published', $8::jsonb)`,
    [
      workspaceId,
      program.rows[0].id,
      occurrenceId,
      row.id,
      row.user_id,
      title,
      cleanString(data.visibility, 80) || "public",
      JSON.stringify({ createdVia: "legacy_backfill" }),
    ],
  );
}

try {
  const candidates = await pool.query(
    `select eh.id, eh.user_id, eh.title, eh.data, eh.created_at
     from event_history eh
     left join event_pages ep on ep.legacy_event_history_id = eh.id
     where ep.id is null and eh.user_id is not null
     order by eh.created_at asc
     limit $1`,
    [limit],
  );
  console.log(`${write ? "WRITE" : "DRY RUN"}: ${candidates.rows.length} legacy event_history rows need Concierge V2 links.`);
  for (const row of candidates.rows.slice(0, 10)) {
    console.log(`- ${row.id} | user ${row.user_id} | ${cleanString(row.title, 120) || "Untitled"}`);
  }
  if (!write || candidates.rows.length === 0) {
    await pool.end();
    process.exit(0);
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const row of candidates.rows) await backfillRow(client, row);
    await client.query("commit");
    console.log(`Backfilled ${candidates.rows.length} legacy rows.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
  await pool.end();
} catch (error) {
  await pool.end();
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
