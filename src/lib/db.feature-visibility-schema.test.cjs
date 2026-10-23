const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Execute the real schema guard and read against a query stub without opening a pool.
const source = ts.createSourceFile("db.ts", readFileSync("src/lib/db.ts", "utf8"), ts.ScriptTarget.Latest, true);
const names = new Set(["ensureOnce", "ensureUsersHasFeatureVisibilityColumn", "getFeatureVisibilityByEmail"]);
const code = ts.transpileModule(source.statements
  .filter((node) => ts.isFunctionDeclaration(node) && names.has(node.name?.text))
  .map((node) => node.getText(source)).join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness({ ready = true, checkError = null, migrationError = null } = {}) {
  const state = { ready, checkError, migrationError, calls: [] };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    ensureReadyKeys: new Set(),
    ensureInflight: new Map(),
    query: async (sql, params) => {
      state.calls.push({ sql, params: params && Array.from(params) });
      if (sql.includes("from pg_attribute")) {
        if (state.checkError) throw state.checkError;
        return { rows: [{ ready: state.ready }] };
      }
      if (sql.includes("alter table users")) {
        if (state.migrationError) throw state.migrationError;
        return { rows: [] };
      }
      return { rows: [{ id: params[0], feature_visibility: { visibleTemplateKeys: ["gymnastics"] } }] };
    },
  });
  state.read = module.exports.getFeatureVisibilityByEmail;
  return state;
}

test("cold preference reads use a single catalog check and no users table alteration when migrated", async () => {
  const state = harness();
  const rows = await Promise.all([state.read("First@Example.Test"), state.read("Second@Example.Test")]);
  await state.read("First@Example.Test");
  assert.equal(state.calls.filter(({ sql }) => sql.includes("from pg_attribute")).length, 1);
  assert.equal(state.calls.some(({ sql }) => sql.includes("alter table users")), false);
  const check = state.calls[0].sql;
  assert.match(check, /attrelid = to_regclass\('public\.users'\)/);
  assert.match(check, /attname = 'feature_visibility' and not attisdropped/);
  const reads = state.calls.filter(({ sql }) => sql.includes("from users"));
  assert.deepEqual(reads.map(({ params }) => params), [["first@example.test"], ["second@example.test"], ["first@example.test"]]);
  assert.deepEqual(rows.map((row) => row.id), ["first@example.test", "second@example.test"]);
});

test("an older schema adds the missing column once before concurrent preferences reads", async () => {
  const state = harness({ ready: false });
  await Promise.all([state.read("first@example.test"), state.read("second@example.test")]);
  assert.equal(state.calls.filter(({ sql }) => sql.includes("alter table users")).length, 1);
  assert.match(state.calls[1].sql, /alter table users add column if not exists feature_visibility jsonb/);
  assert.ok(state.calls[2].sql.includes("from users"));
});

test("failed catalog checks and migrations propagate without reading fabricated preferences and remain retryable", async () => {
  for (const kind of ["checkError", "migrationError"]) {
    const error = new Error("Database temporarily unavailable");
    const state = harness({ ready: false, [kind]: error });
    await assert.rejects(state.read("account@example.test"), (actual) => actual === error);
    assert.equal(state.calls.some(({ sql }) => sql.includes("from users")), false);
    state[kind] = null;
    state.ready = true;
    const row = await state.read("account@example.test");
    assert.equal(row.id, "account@example.test");
    assert.equal(state.calls.filter(({ sql }) => sql.includes("from pg_attribute")).length, 2);
  }
});
