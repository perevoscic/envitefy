const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

function harness({ ready = true, schemaError = null, checkError = null } = {}) {
  const calls = [];
  const state = { ready, schemaError, checkError, calls, clients: 0 };
  const query = async (sql, args) => {
    calls.push({ sql, args });
    if (sql.includes("FROM pg_class")) {
      if (state.checkError) throw state.checkError;
      return { rows: [{ ready: state.ready }] };
    }
    if (sql.startsWith("CREATE TABLE") && state.schemaError) throw state.schemaError;
    if (sql.startsWith("SELECT policy")) {
      return { rows: [{ policy: "restricted", categories: ["gymnastics"], products: ["event_page"] }] };
    }
    return { rows: [] };
  };
  state.api = loadTs("src/lib/creation-access-server.ts", {
    "next/server": {},
    "@/lib/db": {
      query,
      withClient: async (callback) => {
        state.clients++;
        return callback({ query });
      },
    },
    "@/lib/event-collaboration": {},
  });
  return state;
}

test("cold access reads check migrated schema once without DDL and still read fresh grants", async () => {
  const state = harness();
  const access = await Promise.all([
    state.api.getCreationAccess("first-account"),
    state.api.getCreationAccess("second-account"),
  ]);
  await state.api.getCreationAccess("first-account");
  assert.equal(state.clients, 1);
  assert.equal(state.calls.filter(({ sql }) => sql.includes("FROM pg_class")).length, 1);
  assert.equal(state.calls.some(({ sql }) => /^(BEGIN|CREATE|ALTER|REVOKE|COMMIT)/.test(sql)), false);
  const grantReads = state.calls.filter(({ sql }) => sql.startsWith("SELECT policy"));
  assert.deepEqual(grantReads.map(({ args }) => args), [["first-account"], ["second-account"], ["first-account"]]);
  assert.deepEqual(access.map((value) => value.allowedCategories), [["gymnastics"], ["gymnastics"]]);
});

test("schema readiness requires both protected tables, role revocation and the pending request index", async () => {
  const state = harness();
  await state.api.ensureCreationAccessSchema();
  const sql = state.calls[0].sql;
  assert.match(sql, /count\(\*\) = 2/);
  assert.match(sql, /c\.relrowsecurity/);
  assert.match(sql, /aclexplode/);
  assert.match(sql, /grants\.grantee = 0/);
  assert.match(sql, /'anon', 'authenticated'/);
  for (const name of ["creation_account_access", "creation_access_requests", "creation_access_requests_pending"]) {
    assert.ok(sql.includes(`to_regclass('public.${name}')`));
  }
});

test("missing or unsecured schema is repaired atomically before grants are read", async () => {
  const state = harness({ ready: false });
  await Promise.all([state.api.getCreationAccess("account"), state.api.ensureCreationAccessSchema()]);
  assert.equal(state.clients, 1);
  assert.equal(state.calls[1].sql, "BEGIN");
  const schema = state.calls[2].sql;
  assert.match(schema, /CREATE TABLE IF NOT EXISTS creation_account_access/);
  assert.match(schema, /ALTER TABLE creation_account_access ENABLE ROW LEVEL SECURITY/);
  assert.match(schema, /ALTER TABLE creation_access_requests ENABLE ROW LEVEL SECURITY/);
  for (const role of ["PUBLIC", "anon", "authenticated"]) {
    assert.ok(schema.includes(`REVOKE ALL ON TABLE creation_account_access,creation_access_requests FROM ${role}`));
  }
  assert.equal(state.calls[3].sql, "COMMIT");
  assert.ok(state.calls[4].sql.startsWith("SELECT policy"));
});

test("catalog and migration failures deny grants and can recover on the next request", async () => {
  for (const kind of ["checkError", "schemaError"]) {
    const error = new Error("Database temporarily unavailable");
    const state = harness({ ready: false, [kind]: error });
    await assert.rejects(state.api.getCreationAccess("account"), (actual) => actual === error);
    assert.equal(state.calls.some(({ sql }) => sql.startsWith("SELECT policy")), false);
    if (kind === "schemaError") assert.equal(state.calls.at(-1).sql, "ROLLBACK");
    state[kind] = null;
    state.ready = true;
    assert.deepEqual((await state.api.getCreationAccess("account")).allowedCategories, ["gymnastics"]);
    assert.equal(state.clients, 2);
  }
});
