// One-time, user-authorized retirement. Default mode is a read-only audit.
// Deletes records, never tables, users, OAuth connections, or current creation sessions.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

// These tables were exclusively owned by the removed V2 foundation/runtime.
export const V2_TABLES = [
  "workspaces", "memberships", "membership_invitations", "families", "family_guardians",
  "participants", "programs", "program_participants", "venues", "resources", "event_series",
  "event_occurrences", "resource_requirements", "resource_assignments", "attendance_records",
  "event_pages", "event_templates", "concierge_sessions", "concierge_drafts", "smart_forms",
  "form_fields", "form_responses", "volunteer_boards", "volunteer_slots", "volunteer_claims",
  "payment_requests", "payments", "message_templates", "reminders", "message_campaigns",
  "message_deliveries", "source_documents", "extracted_items", "checklist_items", "calendar_feeds",
  "audit_logs",
];

const EVENT_IDS = "select id from public.event_history where coalesce(data->>'conciergeVersion' = 'v2' or data ? 'conciergeV2', false)";
const THREAD_IDS = "select id from public.conversation_threads where event_id = any($1::uuid[])";
const PAGE_IDS = "select id from public.dynamic_event_pages where event_id = any($1::uuid[])";
const SCAN_IDS = "select id from public.scan_attempts where event_id = any($1::uuid[])";
export const SHARED_SCOPES = {
  event_history: "id = any($1::uuid[])",
  dynamic_event_pages: "event_id = any($1::uuid[])",
  dynamic_event_page_versions: `event_page_id in (${PAGE_IDS})`,
  conversation_threads: "event_id = any($1::uuid[])",
  conversation_messages: `thread_id in (${THREAD_IDS})`,
  admin_marketing_versions: `conversation_id in (${THREAD_IDS})`,
  admin_marketing_assets: `conversation_id in (${THREAD_IDS})`,
  event_assets: "event_id = any($1::uuid[])",
  event_discoveries: "event_id = any($1::uuid[])",
  event_history_input_blobs: "event_id = any($1::uuid[])",
  event_metrics_cache: "event_id = any($1::uuid[])",
  event_public_slug_aliases: "event_id = any($1::uuid[])",
  event_shares: "event_id = any($1::uuid[])",
  event_tracking_events: "event_id = any($1::uuid[])",
  rsvp_responses: "event_id = any($1::uuid[])",
  scan_attempts: "event_id = any($1::uuid[])",
  scan_diagnostic_jobs: `scan_id in (${SCAN_IDS})`,
  signup_forms: "event_id = any($1::uuid[])",
  // Registry rows predate foreign keys. Stripe webhook event_id is a provider ID.
  registry_items: "event_id = any($1::text[])",
};
const PROTECTED_TABLES = ["users", "oauth_tokens", "creation_sessions", "integration_connections", "sync_jobs", "stripe_webhook_events"];

export function deletionOrder(tables, foreignKeys) {
  // Delete children explicitly before their parents so cascades cannot hide row counts
  // or erase SET NULL links needed to identify the remaining targeted records.
  const pending = new Set(tables);
  const order = [];
  while (pending.size) {
    const next = [...pending].find((parent) => !foreignKeys.some((fk) =>
      fk.parent === parent && fk.child !== parent && pending.has(fk.child)));
    if (!next) throw new Error("Unexpected dependency cycle; refusing cleanup");
    order.push(next);
    pending.delete(next);
  }
  return order;
}

function identifier(value) {
  assert.match(value, /^[a-z_][a-z0-9_]*$/);
  return `"${value}"`;
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const expected = args.find((arg) => arg.startsWith("--expect="))?.slice(9);
  if (execute && !/^[a-f0-9]{64}$/.test(expected || "")) {
    throw new Error("Run the read-only audit first, then pass --execute --expect=<planFingerprint>");
  }
  dotenv.config({ path: ".env.local", quiet: true });
  dotenv.config({ path: ".env", quiet: true });
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const connection = new URL(process.env.DATABASE_URL);
  let ssl;
  if (/^(true|1)$/i.test(process.env.PGSSL_DISABLE_VERIFY || "")) ssl = { rejectUnauthorized: false };
  else if (process.env.PGSSL_CA_BASE64) ssl = {
    ca: Buffer.from(process.env.PGSSL_CA_BASE64, "base64").toString("utf8"), rejectUnauthorized: true,
  };
  if (ssl) { connection.searchParams.delete("ssl"); connection.searchParams.delete("sslmode"); }
  const pool = new pg.Pool({ connectionString: connection.toString(), ssl, max: 1, connectionTimeoutMillis: 8000 });
  let client;
  try {
    client = await pool.connect();
    await client.query(`BEGIN ISOLATION LEVEL REPEATABLE READ${execute ? "" : " READ ONLY"}`);
    await client.query("SET LOCAL statement_timeout = '20s'");
    await client.query("SET LOCAL lock_timeout = '5s'");
    const existing = new Set((await client.query("select tablename from pg_tables where schemaname = 'public'")).rows.map((row) => row.tablename));
    const scopes = Object.fromEntries([
      ...V2_TABLES.map((table) => [table, "true"]), ...Object.entries(SHARED_SCOPES),
    ].filter(([table]) => existing.has(table)));
    if (execute) {
      await client.query(`LOCK TABLE ${V2_TABLES.filter((table) => existing.has(table)).map((table) => `public.${identifier(table)}`).join(", ")} IN SHARE ROW EXCLUSIVE MODE`);
    }
    const eventIds = (await client.query(EVENT_IDS)).rows.map((row) => row.id);
    if (execute && eventIds.length) await client.query("select id from public.event_history where id = any($1::uuid[]) for update", [eventIds]);
    const queryScope = (table, scope, query) => client.query(
      `${query} public.${identifier(table)} t where ${scope}`,
      scope.includes("$1") ? [eventIds] : [],
    );
    const signature = async (table, scope) => (await queryScope(table, scope,
      "select count(*)::int as count, md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' order by md5(to_jsonb(t)::text)), '')) as checksum from",
    )).rows[0];
    // Confirm provenance before treating V2 foundation tables as exclusive.
    for (const table of ["programs", "event_pages"]) {
      if (existing.has(table)) assert.equal((await queryScope(table,
        "metadata_json->>'source' is distinct from 'concierge_v2'", "select count(*)::int as count from")).rows[0].count,
      0, `Unexpected non-V2 records in ${table}`);
    }
    if (existing.has("event_pages")) assert.equal((await queryScope("event_pages",
      "legacy_event_history_id is not null and not (legacy_event_history_id = any($1::uuid[]))", "select count(*)::int as count from")).rows[0].count,
    0, "V2 pages reference events outside the approved scope");

    const foreignKeys = (await client.query(`
      select child.relname as child, parent.relname as parent,
        array(select attname::text from pg_attribute where attrelid=c.conrelid and attnum=any(c.conkey) order by attnum) as child_columns,
        array(select attname::text from pg_attribute where attrelid=c.confrelid and attnum=any(c.confkey) order by attnum) as parent_columns
      from pg_constraint c join pg_class child on child.oid=c.conrelid join pg_class parent on parent.oid=c.confrelid
      join pg_namespace n on n.oid=child.relnamespace join pg_namespace pn on pn.oid=parent.relnamespace
      where c.contype='f' and n.nspname='public' and pn.nspname='public'
    `)).rows;
    // Reject any dependency that would change an untargeted record through a cascade or SET NULL.
    for (const fk of foreignKeys.filter((fk) => Object.hasOwn(scopes, fk.parent))) {
      assert.equal(fk.child_columns.length, 1, "Unexpected composite foreign key");
      assert.equal(fk.parent_columns.length, 1, "Unexpected composite foreign key");
      const childScope = scopes[fk.child] ?? "false";
      const sql = `select count(*)::int as count from public.${identifier(fk.child)} where not coalesce((${childScope}), false)
        and ${identifier(fk.child_columns[0])} in (select ${identifier(fk.parent_columns[0])} from public.${identifier(fk.parent)} where ${scopes[fk.parent]})`;
      assert.equal((await client.query(sql, sql.includes("$1") ? [eventIds] : [])).rows[0].count,
        0, `Untargeted ${fk.child} references targeted ${fk.parent}; refusing cleanup`);
    }
    const targets = {};
    const protectedBefore = {};
    for (const [table, scope] of Object.entries(scopes)) {
      targets[table] = await signature(table, scope);
      if (!V2_TABLES.includes(table)) protectedBefore[table] = await signature(table, `not coalesce((${scope}), false)`);
    }
    for (const table of PROTECTED_TABLES.filter((name) => existing.has(name))) protectedBefore[table] = await signature(table, "true");
    // Include row content checksums, not just counts: replacing or editing a target
    // between audit and execution must require a fresh audit too.
    const planFingerprint = createHash("sha256").update(JSON.stringify(targets)).digest("hex");
    const report = {
      mode: execute ? "executed" : "read-only audit",
      scope: "Database configured for this checkout; Concierge V2 records only",
      planFingerprint,
      targetCounts: Object.fromEntries(Object.entries(targets).map(([table, value]) => [table, value.count])),
      totalTargetRows: Object.values(targets).reduce((sum, value) => sum + value.count, 0),
      protectedCounts: Object.fromEntries(Object.entries(protectedBefore).map(([table, value]) => [table, value.count])),
    };
    report.currentWebsiteOperationSections = (await client.query(`select count(*)::int as count from public.event_history where not (id = any($1::uuid[]))
      and lower(data->>'createdVia') = 'concierge'
      and (lower(data->'publicEvent'->>'primaryOutput') = 'event_page' or lower(data->'publicEvent'->>'renderer') = 'event_page'
        or ((data->'requestedOutputs' ? 'event_page' or data->'outputs' ? 'event_page') and coalesce(data->'publicEvent'->>'primaryOutput', '') = ''))
      and exists (
      select 1 from (values (data->'publicEvent'->'forms'), (data->'publicEvent'->'volunteerSlots'), (data->'publicEvent'->'paymentItems'),
        (data->'publicEvent'->'reminders'), (data->'publicEvent'->'checklistItems'), (data->'smartForms'->'forms'), (data->'forms'),
        (data->'volunteerSignup'->'slots'), (data->'volunteerSlots'), (data->'paymentTracker'->'items'), (data->'paymentItems'),
        (data->'reminderTimeline'->'items'), (data->'reminders'), (data->'checklistItems')) as sections(items)
      where exists (select 1 from jsonb_array_elements(case when jsonb_typeof(items) = 'array' then items else '[]'::jsonb end) item
        where coalesce(nullif(trim(item->>'title'), ''), nullif(trim(item->>'label'), ''), nullif(trim(item->>'name'), '')) is not null))`, [eventIds])).rows[0].count;
    if (execute) {
      assert.equal(report.currentWebsiteOperationSections, 0, "Current event websites still contain operation sections; preserve their renderer before cleanup");
      assert.equal(planFingerprint, expected, "V2 data changed since the audit; rerun the read-only audit");
      report.deletedCounts = {};
      for (const table of deletionOrder(Object.keys(scopes), foreignKeys)) {
        const result = await queryScope(table, scopes[table], "delete from");
        assert.equal(result.rowCount, targets[table].count, `Unexpected deletion count for ${table}`);
        report.deletedCounts[table] = result.rowCount;
      }
      for (const [table, before] of Object.entries(protectedBefore)) {
        const scope = scopes[table] ? `not coalesce((${scopes[table]}), false)` : "true";
        assert.deepEqual(await signature(table, scope), before, `Unrelated ${table} changed; rolling back`);
      }
      for (const [table, scope] of Object.entries(scopes)) assert.equal((await signature(table, scope)).count, 0, `Records remain in ${table}`);
      report.protectedRecordsUnchanged = true;
      await client.query("COMMIT");
      report.committedAt = new Date().toISOString();
    } else await client.query("ROLLBACK");
    mkdirSync(".qa", { recursive: true });
    const reportPath = `.qa/concierge-v2-${execute ? "deletion" : "cleanup-plan"}.json`;
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, reportPath }, null, 2));
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Concierge V2 cleanup stopped: ${error.message}`);
    process.exitCode = 1;
  });
}
