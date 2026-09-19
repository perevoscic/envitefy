// Isolated PostgreSQL-engine checks; never reads .env or opens a network database.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const require = createRequire(import.meta.url);
const qaRequire = createRequire(new URL(".qa/ios-postgres/package.json", root));
let PGlite;
try {
  ({ PGlite } = qaRequire("@electric-sql/pglite"));
} catch {
  throw new Error(
    "Install the isolated test dependency: npm install --prefix .qa/ios-postgres --no-save --package-lock=false @electric-sql/pglite",
  );
}
const db = new PGlite();
function load(file, dependencies = {}) {
  const output = ts.transpileModule(readFileSync(new URL(file, root), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", output)(
    (name) => dependencies[name] ?? require(name),
    module,
    module.exports,
  );
  return module.exports;
}
const contract = load("src/lib/mobile-auth-contract.ts");
const auth = load("src/lib/mobile-auth.ts", {
  "./mobile-auth-contract": contract,
  "@/lib/db": {
    query: async (sql, values) => {
      const result = await db.query(sql, values);
      return { ...result, rowCount: result.affectedRows ?? result.rows.length };
    },
  },
});
const userId = "00000000-0000-4000-8000-000000000001";
const verifier = "v".repeat(43);
const issue = (overrides = {}) =>
  auth.issueMobileAuthCode({
    userId,
    challenge: auth.mobileAuthHash(verifier),
    sessionToken: "test-encrypted-session",
    sessionExpires: new Date(Date.now() + 3600000),
    returnTo: "/event/test",
    ...overrides,
  });
try {
  await db.exec("CREATE TABLE users (id uuid PRIMARY KEY)");
  await db.query("INSERT INTO users VALUES ($1)", [userId]);
  const migration = readFileSync(new URL("prisma/manual_sql/mobile_auth_codes.sql", root), "utf8");
  await db.exec(migration);
  await db.exec(migration); // Idempotent on reapplication.
  const code = await issue();
  assert.ok(code);
  assert.equal(await auth.consumeMobileAuthCode(code, "w".repeat(43)), null);
  const accepted = await auth.consumeMobileAuthCode(code, verifier);
  assert.equal(accepted.session_token, "test-encrypted-session");
  assert.equal(accepted.return_to, "/event/test");
  assert.equal(await auth.consumeMobileAuthCode(code, verifier), null);
  const stored = await db.query(
    "SELECT session_token, consumed_at FROM mobile_auth_codes WHERE code_hash = $1",
    [auth.mobileAuthHash(code)],
  );
  assert.equal(stored.rows[0].session_token, null);
  assert.ok(stored.rows[0].consumed_at);
  console.log("PASS: migration, PKCE, atomic consumption, replay denial and credential clearing");

  const expired = await issue();
  await db.query(
    "UPDATE mobile_auth_codes SET expires_at = now() - interval '1 second' WHERE code_hash = $1",
    [auth.mobileAuthHash(expired)],
  );
  assert.equal(await auth.consumeMobileAuthCode(expired, verifier), null);
  const expiredSession = await issue({ sessionExpires: new Date(0) });
  assert.equal(await auth.consumeMobileAuthCode(expiredSession, verifier), null);
  const redirect = await issue({ returnTo: "//evil.test" });
  assert.equal((await auth.consumeMobileAuthCode(redirect, verifier)).return_to, "/");
  console.log("PASS: authorization/session expiry and unsafe return-path normalization");

  await db.exec("DELETE FROM mobile_auth_rate_limits");
  const batch = await Promise.all(Array.from({ length: 22 }, () => issue()));
  assert.equal(batch.filter(Boolean).length, 20);
  assert.equal(batch.filter((value) => value === null).length, 2);
  const attempts = await db.query("SELECT attempts FROM mobile_auth_rate_limits");
  assert.equal(attempts.rows[0].attempts, 20);
  const results = await Promise.all([
    auth.consumeMobileAuthCode(batch[0], verifier),
    auth.consumeMobileAuthCode(batch[0], verifier),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  console.log(
    "PASS: atomic quota upsert and repeated exchange (single PGlite connection; not a multi-server load test)",
  );

  await db.exec(
    "CREATE ROLE ios_test_reader; GRANT USAGE ON SCHEMA public TO ios_test_reader; GRANT SELECT ON mobile_auth_codes, mobile_auth_rate_limits TO ios_test_reader; SET ROLE ios_test_reader;",
  );
  assert.equal((await db.query("SELECT * FROM mobile_auth_codes")).rows.length, 0);
  assert.equal((await db.query("SELECT * FROM mobile_auth_rate_limits")).rows.length, 0);
  await db.exec("RESET ROLE");
  await db.query("DELETE FROM users WHERE id = $1", [userId]);
  assert.equal((await db.query("SELECT * FROM mobile_auth_codes")).rows.length, 0);
  assert.equal((await db.query("SELECT * FROM mobile_auth_rate_limits")).rows.length, 0);
  console.log("PASS: RLS protects both tables and account deletion cascades both tables");
} finally {
  await db.close();
}
