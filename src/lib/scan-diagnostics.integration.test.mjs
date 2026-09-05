// Opt-in real PostgreSQL test. Only temporary tables are used; all changes roll back.
// node scripts/run-travel-tests.mjs src/lib/scan-diagnostics.integration.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";
import sharp from "sharp";
import { connectScanDatabase } from "../../scripts/scan-diagnostics-db.mjs";

test("atomic scan accounting, diagnostic retries, lease recovery and saved-event preservation", async () => {
  const client = await connectScanDatabase();
  // Redirect only the database boundary to the isolated transaction connection.
  globalThis.__scanTestQuery = (sql, values) => client.query(sql, values);
  const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/db") return {
      url: `data:text/javascript,${encodeURIComponent("export const query = (...args) => globalThis.__scanTestQuery(...args);")}`,
      shortCircuit: true,
    };
    return nextResolve(specifier, context);
  }});
  try {
    const { recordCompletedScanAttempt, markScanAttemptSaved } = await import("./scan-attempts.ts");
    const { processScanDiagnosticJobs } = await import("./scan-diagnostic-worker.ts");
    hooks.deregister();
    await client.query("BEGIN");
    await client.query("SET LOCAL search_path TO pg_temp");
    await client.query(`create temporary table users (id uuid primary key default gen_random_uuid(), email text unique);
      create temporary table event_history (id uuid primary key default gen_random_uuid());`);
    const migration = await readFile("prisma/manual_sql/20260905_scan_diagnostics_queue.sql", "utf8");
    await client.query(migration.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "")
      .replace(/create table if not exists/gi, "create temporary table if not exists"));
    const user = (await client.query("insert into users(email) values('scan-fixture@example.invalid') returning id")).rows[0];
    const event = (await client.query("insert into event_history default values returning id")).rows[0];
    const image = await sharp({ create: { width: 64, height: 64, channels: 3, background: "white" } }).jpeg().toBuffer();
    const params = { scanAttemptId: "fixture-scan", email: "scan-fixture@example.invalid", category: "Birthdays", diagnosticImageBytes: image };
    await recordCompletedScanAttempt(params);
    await recordCompletedScanAttempt(params);
    assert.deepEqual((await client.query("select scans_total, scans_birthdays from users")).rows[0], { scans_total: 1, scans_birthdays: 1 });
    assert.equal((await client.query("select * from scan_diagnostic_jobs")).rows.length, 1);
    await markScanAttemptSaved({ scanAttemptId: params.scanAttemptId, userId: user.id, eventId: event.id });
    assert.deepEqual(await processScanDiagnosticJobs(), { completed: 1, failed: 0 });
    const saved = (await client.query("select status, event_id, preview_bytes, preview_mime_type from scan_attempts")).rows[0];
    assert.equal(saved.status, "saved");
    assert.equal(saved.event_id, event.id);
    assert.equal(saved.preview_mime_type, "image/jpeg");
    assert.ok(saved.preview_bytes.length > 0);
    assert.equal((await client.query("select * from scan_diagnostic_jobs")).rows.length, 0);

    await recordCompletedScanAttempt({ ...params, scanAttemptId: "fixture-retry", diagnosticImageBytes: Buffer.from("broken") });
    assert.deepEqual(await processScanDiagnosticJobs(), { completed: 0, failed: 1 });
    const retry = (await client.query("select attempts, locked_until, available_at > now() as delayed from scan_diagnostic_jobs")).rows[0];
    assert.deepEqual(retry, { attempts: 1, locked_until: null, delayed: true });
    assert.deepEqual(await processScanDiagnosticJobs(), { completed: 0, failed: 0 });
    await client.query("update scan_diagnostic_jobs set image_bytes=$1, available_at=now(), locked_until=now()-interval '1 second'", [image]);
    assert.deepEqual(await processScanDiagnosticJobs(), { completed: 1, failed: 0 });

    // A failed queue write must roll back the scan row AND its counter increment.
    await client.query("savepoint failed_write");
    await client.query("alter table scan_diagnostic_jobs add constraint reject_test_bytes check (octet_length(image_bytes)>10)");
    await assert.rejects(recordCompletedScanAttempt({ ...params, scanAttemptId: "fixture-rollback", diagnosticImageBytes: Buffer.from("x") }));
    await client.query("rollback to savepoint failed_write");
    assert.equal((await client.query("select * from scan_attempts where scan_attempt_id='fixture-rollback'")).rows.length, 0);
    assert.equal((await client.query("select scans_total from users")).rows[0].scans_total, 2);
  } finally {
    hooks.deregister();
    await client.query("ROLLBACK");
    await client.end();
    delete globalThis.__scanTestQuery;
  }
});
