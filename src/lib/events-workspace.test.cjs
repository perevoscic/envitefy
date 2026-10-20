const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

function load(file, dependencies = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function("require", "module", "exports", source)(
    (name) => {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const filters = load("src/lib/events-workspace.ts");
function history(rows = []) {
  const calls = [];
  const api = load("src/lib/history-page.ts", {
    "./events-workspace": filters,
    "./event-draft-access": load("src/lib/event-draft-access.ts"),
    "@/lib/db": {
      query: async (sql, args) => {
        calls.push({ sql, args });
        return { rows };
      },
      buildDashboardCoverImageUrlSql: () => "NULL",
      buildOwnedHistoryOwnershipSql: () => "to_jsonb('owned'::text)",
      buildOwnedHistoryStudioVisibilitySql: () => "true",
    },
  });
  return { ...api, calls };
}

test("workspace filter normalization accepts only supported views and bounds search input", () => {
  assert.deepEqual(
    filters.normalizeEventWorkspaceFilters({
      kind: "drafts",
      relation: "invited",
      search: "  School  ",
    }),
    { kind: "drafts", relation: "invited", search: "School" },
  );
  assert.deepEqual(
    filters.normalizeEventWorkspaceFilters({ kind: "private", relation: "admin", search: {} }),
    { kind: "all", relation: "all", search: "" },
  );
  assert.equal(
    filters.normalizeEventWorkspaceFilters({ search: "x".repeat(500) }).search.length,
    200,
  );
});

test("history pagination carries a bounded stable cursor including null creation dates", async () => {
  const rows = [
    { id: "10000000-0000-4000-8000-000000000001", created_at: null, title: "Draft", data: {} },
    { id: "00000000-0000-4000-8000-000000000001", created_at: null, title: "Older", data: {} },
  ];
  const api = history(rows);
  const first = await api.listHistoryCardPage("owner", 1, null);
  assert.deepEqual(first.items, [rows[0]]);
  assert.deepEqual(api.decodeHistoryCursor(first.nextCursor), { createdAt: null, id: rows[0].id });
  await api.listHistoryCardPage("owner", 900, api.decodeHistoryCursor(first.nextCursor));
  assert.equal(api.calls[1].args[1], 201, "the requested page cannot bypass the server limit");
  assert.deepEqual(api.calls[1].args.slice(2, 5), [null, rows[0].id, true]);
});

test("malformed and oversized cursors cannot alter SQL or restart a partial page silently", () => {
  const api = history();
  for (const raw of [
    "x",
    "a".repeat(257),
    Buffer.from(
      JSON.stringify({ createdAt: "bad", id: "10000000-0000-4000-8000-000000000001" }),
    ).toString("base64url"),
    Buffer.from(JSON.stringify({ createdAt: null, id: "malformed" })).toString("base64url"),
  ]) {
    assert.throws(() => api.decodeHistoryCursor(raw), /Invalid history cursor/);
  }
  assert.equal(api.decodeHistoryCursor(null), null);
});

test("workspace filters remain parameterized within owner, accepted co-host and shared-event authorization", async () => {
  const api = history();
  const search = "O'Brien % _";
  await api.listHistoryCardPage("viewer", 24, null, {
    kind: "signups",
    relation: "invited",
    search,
  });
  const { sql, args } = api.calls[0];
  assert.deepEqual(args.slice(5), ["signups", "invited", search]);
  assert.ok(!sql.includes(search));
  assert.match(sql, /c\.revoked_at IS NULL/);
  assert.match(sql, /s\.status IN \('pending','accepted'\)/);
  assert.match(sql, /NOT member\.allowed/);
  assert.match(sql, /review_ready/);
  assert.match(sql, /<>\s*'cancelled'/);
  assert.doesNotMatch(sql, /signupForm'->'responses'/, "cards never select participant responses");
});
