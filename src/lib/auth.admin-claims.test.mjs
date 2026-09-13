import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const filename = new URL("./auth.ts", import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: filename.pathname,
});

function harness() {
  const h = { now: 1_800_000_000_000, admin: true, error: null, calls: [] };
  const module = { exports: {} };
  const mocks = {
    "next-auth": {},
    "next-auth/jwt": {},
    "next-auth/providers/credentials": { default: (config) => config },
    "next-auth/providers/google": { default: (config) => config },
    "next/headers": {},
    "@/config/feature-visibility": {},
    "@/lib/signup-intent": {},
    "@/lib/legal-acceptance": {},
    "@/lib/product-scopes": {
      normalizePrimarySignupSource: () => "legacy",
      normalizeProductScopes: () => ["snap"],
    },
    "@/lib/database-errors": {
      describeDatabaseError: String,
      isDatabaseUnavailableError: () => true,
    },
    "@/lib/db": {
      getUserIdByEmail: async () => "admin-id",
      getUserByEmail: async () => ({ primary_signup_source: "legacy", product_scopes: ["snap"] }),
      getIsAdminByEmail: async (email, options) => {
        h.calls.push({ email, options });
        if (h.error) throw h.error;
        return h.admin;
      },
    },
  };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require(name) {
      assert.ok(Object.hasOwn(mocks, name), `Unexpected import: ${name}`);
      return mocks[name];
    },
    Date: class extends Date { static now() { return h.now; } },
    process: { env: { AUTH_SECRET: "test-secret" } },
    console: { warn() {}, error() {} },
  }, { filename: filename.pathname });
  h.jwt = module.exports.getAuthOptions().callbacks.jwt;
  h.session = module.exports.getAuthOptions().callbacks.session;
  h.token = { email: "admin@example.test" };
  return h;
}

test("a failed admin lookup denies access but recovers on the next session request", async () => {
  const h = harness();
  h.error = new Error("Database request timed out");
  await h.jwt({ token: h.token });
  assert.equal(h.token.isAdmin, false);
  assert.equal(h.token.isAdminCheckedAt, undefined);
  assert.equal(h.calls[0].options.throwOnError, true);
  const failedSession = await h.session({ session: { user: {} }, token: h.token });
  assert.equal(failedSession.user.isAdmin, false);

  h.error = null;
  h.now += 1000;
  await h.jwt({ token: h.token });
  assert.equal(h.calls.length, 2);
  assert.equal(h.token.isAdmin, true);
  assert.equal(h.token.isAdminCheckedAt, h.now);
  const recoveredSession = await h.session({ session: { user: {} }, token: h.token });
  assert.equal(recoveredSession.user.isAdmin, true);
});

test("an expired positive admin claim is denied during an outage without caching the failure", async () => {
  const h = harness();
  await h.jwt({ token: h.token });
  h.now += 16 * 60_000;
  h.error = new Error("Database unavailable");
  await h.jwt({ token: h.token });
  assert.equal(h.token.isAdmin, false);
  assert.equal(h.token.isAdminCheckedAt, undefined);
});

test("successful positive and negative checks retain the normal cache", async () => {
  for (const admin of [true, false]) {
    const h = harness();
    h.admin = admin;
    await h.jwt({ token: h.token });
    h.now += 60_000;
    await h.jwt({ token: h.token });
    assert.equal(h.calls.length, 1);
    assert.equal(h.token.isAdmin, admin);
  }
});

test("session update rechecks the database and ignores a client-supplied admin claim", async () => {
  const h = harness();
  await h.jwt({ token: h.token });
  h.admin = false;
  await h.jwt({ token: h.token, trigger: "update", session: { user: { isAdmin: true } } });
  assert.equal(h.calls.length, 2);
  assert.equal(h.token.isAdmin, false);
});

test("signing in again replaces a cached false claim with the current database result", async () => {
  const h = harness();
  h.token.isAdmin = false;
  h.token.isAdminCheckedAt = h.now;
  await h.jwt({ token: h.token, user: { email: h.token.email } });
  assert.equal(h.calls.length, 1);
  assert.equal(h.token.isAdmin, true);
});

test("missing identities cannot retain an admin claim", async () => {
  const h = harness();
  const token = { isAdmin: true, isAdminCheckedAt: h.now };
  await h.jwt({ token });
  assert.equal(token.isAdmin, false);
  assert.equal(token.isAdminCheckedAt, undefined);
  assert.equal(h.calls.length, 0);
});
