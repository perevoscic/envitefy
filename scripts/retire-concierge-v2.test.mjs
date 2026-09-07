import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { deletionOrder, SHARED_SCOPES, V2_TABLES } from "./retire-concierge-v2.mjs";

test("retirement deletes children before parents even for SET NULL relationships", () => {
  assert.deepEqual(deletionOrder(["events", "forms", "responses"], [
    { child: "forms", parent: "events" }, { child: "responses", parent: "forms" },
  ]), ["responses", "forms", "events"]);
  assert.throws(() => deletionOrder(["a", "b"], [
    { child: "a", parent: "b" }, { child: "b", parent: "a" },
  ]), /cycle/);
});

test("shared records are always scoped to selected event IDs and current sessions/accounts are protected", () => {
  for (const scope of Object.values(SHARED_SCOPES)) assert.ok(scope.includes("$1::"));
  for (const table of ["users", "oauth_tokens", "creation_sessions", "integration_connections", "sync_jobs"]) {
    assert.equal(V2_TABLES.includes(table), false);
    assert.equal(Object.hasOwn(SHARED_SCOPES, table), false);
  }
  for (const table of Object.keys(SHARED_SCOPES)) assert.equal(V2_TABLES.includes(table), false);
});

test("executing without a reviewed plan fingerprint stops before connecting to the database", () => {
  const result = spawnSync(process.execPath, ["scripts/retire-concierge-v2.mjs", "--execute"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Run the read-only audit first/);
});
