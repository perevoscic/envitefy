import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as databaseErrors from "./database-errors.ts";

const source = ts.createSourceFile("db.ts", readFileSync(new URL("./db.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
const names = new Set(["parsePositiveInt", "isAuthenticationPgError", "isTransientPgError", "createPgPool", "getPool", "shouldRetryPoolConnect", "connectPoolClient", "withClient"]);
const code = ts.transpileModule(source.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text)).map(node => node.getText(source)).join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness(env = {}) {
  const pools = [];
  const attached = [];
  const h = { connections: 0, releases: 0, failure: null, pools, attached };
  class Pool {
    constructor(options) { this.options = options; this.ends = 0; pools.push(this); }
    on() {}
    async connect() {
      h.connections++;
      if (h.failure) throw h.failure;
      return { on() {}, removeListener() {}, release() { h.releases++; } };
    }
    async end() { this.ends++; }
  }
  const module = { exports: {} };
  const context = vm.createContext({
    module, exports: module.exports, global: {}, Buffer, Pool,
    process: { env: { DATABASE_URL: "postgres://user:password@database.test:5432/postgres", ...env }, on() {} },
    attachDatabasePool(pool) { attached.push(pool); },
    assertEnv(name, value) { assert.ok(value, name); },
    resolvePoolConnection: async (connectionString, ssl) => ({ connectionString, ssl }),
    ...databaseErrors,
    console: { warn() {}, error() {} }, setTimeout,
    PG_AUTH_ERROR_THRESHOLD: 2, PG_AUTH_BACKOFF_MS: 60000,
    pgAuthErrorCount: 0, pgAuthBackoffUntil: 0,
  });
  vm.runInContext(code, context);
  h.withClient = module.exports.withClient;
  return h;
}

test("Vercel pools have bounded connection defaults and register lifecycle cleanup once", async () => {
  const h = harness({ VERCEL: "1" });
  assert.deepEqual(await Promise.all(Array.from({ length: 12 }, (_, index) => h.withClient(async () => index))), Array.from({ length: 12 }, (_, index) => index));
  assert.equal(h.pools.length, 1);
  assert.deepEqual(h.attached, h.pools);
  assert.equal(h.pools[0].options.max, 2);
  assert.equal(h.pools[0].options.idleTimeoutMillis, 5000);
  assert.equal(h.releases, 12);
});

test("local pool defaults and explicit deployment overrides are preserved", async () => {
  for (const [env, max, idle] of [
    [{}, 8, 30000],
    [{ VERCEL: "1", PG_POOL_MAX: "3", PG_IDLE_TIMEOUT_MS: "1200" }, 3, 1200],
    [{ VERCEL: "1", PG_POOL_MAX: "invalid", PG_IDLE_TIMEOUT_MS: "-1" }, 2, 5000],
  ]) {
    const h = harness(env);
    await h.withClient(async () => {});
    assert.equal(h.pools[0].options.max, max);
    assert.equal(h.pools[0].options.idleTimeoutMillis, idle);
    assert.deepEqual(h.attached, h.pools);
  }
});

test("session exhaustion does not open retry connections or replace a healthy pool", async () => {
  const h = harness({ VERCEL: "1" });
  h.failure = Object.assign(new Error("(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15"), { code: "XX000" });
  await assert.rejects(h.withClient(async () => assert.fail("Unavailable clients cannot run queries")), error => error === h.failure);
  assert.equal(h.connections, 1);
  assert.equal(h.pools.length, 1);
  assert.equal(h.pools[0].ends, 0);
  h.failure = null;
  assert.equal(await h.withClient(async () => "recovered"), "recovered");
  assert.equal(h.pools.length, 1);
  assert.equal(h.releases, 1);
});
