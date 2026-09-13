import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Execute the production lookup against a query stub without starting a Postgres pool.
const filename = new URL("./db.ts", import.meta.url);
const source = ts.createSourceFile("db.ts", readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
const lookup = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "getIsAdminByEmail");
assert.ok(lookup);
const { outputText } = ts.transpileModule(lookup.getText(source), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});

function harness(results, migrationError = null) {
  const h = { calls: [], migrations: 0 };
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    async query(sql, params) {
      h.calls.push({ sql, params: Array.from(params) });
      const result = results.shift();
      if (result instanceof Error) throw result;
      return { rows: result };
    },
    async ensureUsersHasAdminAndMetricsColumns() {
      h.migrations++;
      if (migrationError) throw migrationError;
    },
    isTransientPgError: () => true,
    describeDatabaseError: String,
    console: { warn() {}, error() {} },
  });
  h.lookup = module.exports.getIsAdminByEmail;
  return h;
}

test("strict lookups distinguish a successful denial from a database failure", async () => {
  for (const rows of [[], [{ is_admin: null }], [{ is_admin: false }]]) {
    const h = harness([rows]);
    assert.equal(await h.lookup(" Admin@Example.Test ", { throwOnError: true }), false);
    assert.deepEqual(h.calls[0].params, ["admin@example.test"]);
  }
  const h = harness([[{ is_admin: true }]]);
  assert.equal(await h.lookup("admin@example.test", { throwOnError: true }), true);
});

test("strict lookup errors propagate while existing callers still deny access", async () => {
  const error = new Error("Database unavailable");
  const strict = harness([error]);
  await assert.rejects(strict.lookup("admin@example.test", { throwOnError: true }), (actual) => actual === error);
  const existing = harness([error]);
  assert.equal(await existing.lookup("admin@example.test"), false);
});

test("legacy schema recovery still retries the admin lookup", async () => {
  const missingColumn = Object.assign(new Error("Missing is_admin"), { code: "42703" });
  const h = harness([missingColumn, [{ is_admin: true }]]);
  assert.equal(await h.lookup("admin@example.test", { throwOnError: true }), true);
  assert.equal(h.migrations, 1);
  assert.equal(h.calls.length, 2);
});

test("strict lookup propagates failures during schema recovery and its retry", async () => {
  const missingColumn = Object.assign(new Error("Missing is_admin"), { code: "42703" });
  const error = new Error("Database unavailable");
  for (const h of [harness([missingColumn], error), harness([missingColumn, error])]) {
    await assert.rejects(h.lookup("admin@example.test", { throwOnError: true }), (actual) => actual === error);
  }
});
