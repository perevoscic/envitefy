import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.createSourceFile("db.ts", readFileSync(new URL("./db.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
const guards = ["ensureUsersHasAdminAndMetricsColumns", "ensureUsersHasProductScopeColumns", "ensureUsersHasAvatarUrlColumn"];
const names = new Set(["ensureOnce", ...guards]);
const code = ts.transpileModule(source.statements
  .filter((node) => ts.isFunctionDeclaration(node) && names.has(node.name?.text))
  .map((node) => node.getText(source)).join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness(guard, ready = true) {
  const state = { ready, calls: [], error: null, migrationError: null };
  const context = vm.createContext({
    ensureReadyKeys: new Set(), ensureInflight: new Map(),
    async query(sql) {
      state.calls.push(sql);
      if (state.error) throw state.error;
      if (sql.includes("from pg_attribute")) return { rows: [{ ready: state.ready }] };
      assert.equal(state.ready, false, "migrated accounts must never request an exclusive users lock");
      if (state.migrationError) throw state.migrationError;
      return { rows: [] };
    },
  });
  vm.runInContext(code, context);
  state.ensure = vm.runInContext(guard, context);
  return state;
}

for (const guard of guards) {
  test(`${guard}: concurrent cold reads of a migrated schema avoid table alterations`, async () => {
    const h = harness(guard);
    await Promise.all(Array.from({ length: 8 }, () => h.ensure()));
    await h.ensure();
    assert.equal(h.calls.length, 1);
    assert.match(h.calls[0], /attrelid = to_regclass\('public.users'\)/);
    assert.match(h.calls[0], /not attisdropped/);
    assert.match(h.calls[0], /atthasdef/);
    assert.doesNotMatch(h.calls[0], /alter table/);
  });

  test(`${guard}: missing schema still migrates once before reads continue`, async () => {
    const h = harness(guard, false);
    await Promise.all([h.ensure(), h.ensure()]);
    await h.ensure();
    assert.equal(h.calls.length, 2);
    assert.match(h.calls[1], /alter table users add column if not exists/);
  });

  test(`${guard}: failed checks propagate and remain retryable`, async () => {
    const h = harness(guard);
    h.error = new Error("catalog unavailable");
    await assert.rejects(h.ensure(), (error) => error === h.error);
    h.error = null;
    await h.ensure();
    assert.equal(h.calls.length, 2);
    assert.ok(h.calls.every((sql) => !sql.includes("alter table")));
  });

  test(`${guard}: failed legacy migrations cannot mark the schema ready`, async () => {
    const h = harness(guard, false);
    const error = new Error("migration unavailable");
    h.migrationError = error;
    await assert.rejects(h.ensure(), (actual) => actual === error);
    h.migrationError = null;
    await h.ensure();
    assert.equal(h.calls.filter((sql) => sql.includes("alter table")).length, 2);
  });
}
