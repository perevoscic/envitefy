import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env"]) {
  try {
    const values = dotenv.parse(await fs.readFile(path.join(projectRoot, file)));
    for (const [key, value] of Object.entries(values)) process.env[key] ??= value;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function databasePool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  const url = new URL(process.env.DATABASE_URL);
  let ssl;
  if (/^(1|true)$/i.test(process.env.PGSSL_DISABLE_VERIFY || "")) {
    ssl = { rejectUnauthorized: false };
  } else if (process.env.PGSSL_CA_BASE64) {
    ssl = { rejectUnauthorized: true, ca: Buffer.from(process.env.PGSSL_CA_BASE64, "base64").toString("utf8") };
  }
  if (ssl) {
    url.searchParams.delete("sslmode");
    url.searchParams.delete("ssl");
  }
  return new pg.Pool({ connectionString: url.toString(), ssl, max: 1, connectionTimeoutMillis: 10000 });
}

async function withDatabase(callback) {
  const pool = databasePool();
  try { return await callback(pool); } finally { await pool.end(); }
}

async function check() {
  const schema = await withDatabase(async (pool) => {
    const result = await pool.query(`select
      to_regclass('public.conversation_threads') is not null as conversations,
      to_regclass('public.admin_marketing_versions') is not null as versions,
      to_regclass('public.admin_marketing_assets') is not null as assets,
      exists(select 1 from information_schema.columns where table_schema='public'
        and table_name='conversation_threads' and column_name='metadata') as metadata`);
    return result.rows[0];
  });
  console.log(JSON.stringify({ schema, configuration: {
    images: Boolean(process.env.OPENAI_API_KEY),
    video: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY),
    privateStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    workerSecret: Boolean(process.env.CRON_SECRET || process.env.ADMIN_MARKETING_STUDIO_CRON_SECRET),
  } }, null, 2));
  if (!Object.values(schema).every(Boolean)) process.exitCode = 1;
}

async function migrate() {
  const sql = await fs.readFile(path.join(projectRoot, "prisma/manual_sql/20260904_add_admin_marketing_studio.sql"), "utf8");
  await withDatabase(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query(sql);
      await client.query("COMMIT");
      console.log("Content Studio additive migration applied.");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  });
}

async function reconcile() {
  const secret = process.env.ADMIN_MARKETING_STUDIO_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) throw new Error("Configure ADMIN_MARKETING_STUDIO_CRON_SECRET or CRON_SECRET.");
  const baseUrl = process.env.MARKETING_STUDIO_BASE_URL || "http://localhost:3000";
  const response = await fetch(new URL("/api/admin/marketing-studio/reconcile", baseUrl), {
    method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(300000),
  });
  if (!response.ok) throw new Error(`Studio worker returned HTTP ${response.status}.`);
  console.log(await response.text());
}

async function providers() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("A Google API key is required for video.");
  const model = process.env.ADMIN_MARKETING_VIDEO_MODEL || "gemini-omni-1.1-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, {
    headers: { "x-goog-api-key": apiKey }, signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  console.log(JSON.stringify({ model, available: response.ok, status: response.status,
    ...(response.ok ? {} : { error: result.error?.message || "Video model unavailable." }),
  }, null, 2));
  if (!response.ok) process.exitCode = 1;
}

async function verify() {
  const id = process.argv[3];
  if (!/^[0-9a-f-]{36}$/i.test(id || "")) throw new Error("Pass a Content Studio conversation ID to verify its database environment.");
  const { createStudioRepository } = await import("../src/lib/admin/marketing-studio/repository.ts");
  const { DEFAULT_STUDIO_SETTINGS } = await import("../src/lib/admin/marketing-studio/types.ts");
  await withDatabase(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const owner = await client.query(`select u.email from conversation_threads t join users u on u.id=t.user_id
        where t.id=$1 and t.thread_type='admin_marketing' and u.is_admin=true`, [id]);
      if (!owner.rows[0]) throw new Error("Choose a saved Content Studio conversation created by an admin.");
      const repository = createStudioRepository((sql, parameters) => client.query(sql, parameters));
      const settings = { ...DEFAULT_STUDIO_SETTINGS, output: "prompt" };
      const a = await repository.createConversation(owner.rows[0].email, "Temporary database verification", settings);
      const b = await repository.createConversation(owner.rows[0].email, "Temporary isolation verification", settings);
      const input = { clientRequestId: randomUUID(), text: "Verify a saved prompt", settings,
        parentVersionId: null, referenceAssetIds: [], promptOverride: "  Exact prompt.\n" };
      const first = await repository.createTurn(a.id, owner.rows[0].email, input);
      const duplicate = await repository.createTurn(a.id, owner.rows[0].email, input);
      assert.equal(first.id, duplicate.id);
      assert.equal(first.input.promptOverride, input.promptOverride);
      await assert.rejects(repository.createTurn(a.id, owner.rows[0].email, { ...input, text: "Different input" }), /different content/);
      await assert.rejects(repository.createTurn(b.id, owner.rows[0].email, { ...input, clientRequestId: randomUUID(), parentVersionId: first.id }), /does not belong/);
      const conversation = await repository.getConversation(a.id);
      assert.equal(conversation.messages.length, 1);
      assert.equal(conversation.versions.length, 1);
      const claims = await Promise.all([repository.claimVersion(first.id), repository.claimVersion(first.id)]);
      assert.equal(claims.filter(Boolean).length, 1);
      const claim = claims.find(Boolean);
      await repository.updateClaimedVersion(first.id, claim.leaseToken, { status: "submitting" }, false);
      await client.query("update admin_marketing_versions set lease_until=now()-interval '1 second' where id=$1", [first.id]);
      assert.equal(await repository.claimVersion(first.id), null);
      assert.equal((await repository.getVersion(first.id)).status, "submission_unknown");
      await client.query("update conversation_threads set thread_type='event_assistant' where id=$1", [b.id]);
      assert.equal(await repository.getConversation(b.id), null);
      console.log("Database verification passed: exact prompts, deduplication, parent isolation, single claims, expired-submission protection, and customer-thread isolation. Temporary records rolled back.");
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
}

const command = process.argv[2] || "check";
try {
  if (command === "check") await check();
  else if (command === "migrate") await migrate();
  else if (command === "providers") await providers();
  else if (command === "verify") await verify();
  else if (command === "reconcile") {
    const watch = process.argv.includes("--watch");
    do {
      try { await reconcile(); }
      catch (error) {
        if (!watch) throw error;
        console.error(`${error instanceof Error ? error.message : "Worker unavailable."} Checking again in one minute.`);
      }
      if (watch) await new Promise((resolve) => setTimeout(resolve, 60000));
    } while (watch);
  } else throw new Error("Usage: node scripts/marketing-studio.mjs check|migrate|providers|verify <conversation-id>|reconcile [--watch]");
} catch (error) {
  // Connection errors can contain the hostname; never print connection strings or headers.
  console.error(error instanceof Error ? error.message || error.name : "Content Studio maintenance failed.");
  process.exitCode = 1;
}
