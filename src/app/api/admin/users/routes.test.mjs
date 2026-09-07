import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as metrics from "../../../../lib/admin-user-metrics-sql.ts";

const require = createRequire(import.meta.url);
const nextServer = require("next/server");

function loadRoute(name, { rows = [], authenticated = true, admin = true } = {}) {
  const filename = new URL(`./${name}/route.ts`, import.meta.url);
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename.pathname,
  });
  const calls = [];
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: module.exports,
    module,
    require(name) {
      if (name === "next/server") return nextServer;
      if (name === "next-auth") {
        return {
          getServerSession: async () => authenticated ? { user: { email: "admin@example.test" } } : null,
        };
      }
      if (name === "@/lib/auth") return { authOptions: {} };
      if (name === "@/lib/admin-user-metrics-sql") return metrics;
      if (name === "@/lib/db") {
        return {
          getIsAdminByEmail: async () => admin,
          query: async (sql, values) => {
            calls.push({ sql, values: Array.from(values) });
            return { rows };
          },
        };
      }
      throw new Error(`Unexpected dependency: ${name}; user routes must use the shared database connection`);
    },
    URL,
    Buffer,
    console: { error() {} },
  }, { filename: filename.pathname });
  return { ...module.exports, calls };
}

const users = [
  { id: "00000000-0000-0000-0000-000000000002", email: "alice@example.test", created_at: "2026-09-07T12:00:00.000Z", scans_total: 4, shares_sent: 2 },
  { id: "00000000-0000-0000-0000-000000000001", email: "bob@example.test", created_at: "2026-09-06T12:00:00.000Z", scans_total: 1, shares_sent: 0 },
];

for (const view of ["all", "scans", "shares"]) {
  test(`${view} users load and paginate through the shared database connection`, async () => {
    const route = loadRoute("filter", { rows: users });
    const response = await route.GET(new Request(`https://envitefy.test/api/admin/users/filter?view=${view}&limit=1`));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.items, [users[0]]);
    const sortKey = view === "scans" ? "scans_total" : view === "shares" ? "shares_sent" : "created_at";
    assert.deepEqual(JSON.parse(Buffer.from(body.nextCursor, "base64").toString("utf8")), {
      [sortKey]: users[0][sortKey], id: users[0].id,
    });
    assert.match(route.calls[0].sql, new RegExp(`order by ${sortKey} desc nulls last, id desc`));
    assert.match(route.calls[0].sql, /from admin_users_with_metrics/);
    assert.match(route.calls[0].sql, /limit 2/);
    const nextPage = await route.GET(new Request(`https://envitefy.test/api/admin/users/filter?view=${view}&limit=1&cursor=${encodeURIComponent(body.nextCursor)}`));
    assert.equal(nextPage.status, 200);
    assert.deepEqual(route.calls[1].values, [users[0][sortKey], users[0].id]);
  });
}

test("search uses the shared database connection and keeps its search parameters", async () => {
  const route = loadRoute("search", { rows: [users[0]] });
  const response = await route.GET(new Request("https://envitefy.test/api/admin/users/search?q=Alice"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, items: [users[0]], nextCursor: null });
  assert.deepEqual(route.calls[0].values, ["%alice%", "%alice%", "%alice%"]);
  assert.match(route.calls[0].sql, /from admin_users_with_metrics/);
});

for (const name of ["filter", "search"]) {
  for (const access of [{ authenticated: false, admin: false, status: 401 }, { authenticated: true, admin: false, status: 403 }]) {
    test(`${name} rejects ${access.status} before querying user data`, async () => {
      const route = loadRoute(name, access);
      const response = await route.GET(new Request(`https://envitefy.test/api/admin/users/${name}?view=all&q=alice`));
      assert.equal(response.status, access.status);
      assert.equal(route.calls.length, 0);
    });
  }
}
