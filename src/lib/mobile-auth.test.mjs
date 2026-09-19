import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../../", import.meta.url);
function compile(file, dependencies = {}, env = {}, browser = {}) {
  const source = readFileSync(new URL(file, root), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", "process", "window", "navigator", output)(
    (name) => dependencies[name] ?? require(name),
    module,
    module.exports,
    { env },
    browser.window,
    browser.navigator,
  );
  return module.exports;
}
const contract = compile("src/lib/mobile-auth-contract.ts");
const { NextRequest } = require("next/server");
const verifier = "v".repeat(43);
const state = "s".repeat(43);

test("native sign-in sends a string-only message and preserves ordinary browser login", () => {
  const dependencies = { "./mobile-auth-contract": contract };
  const input = { mode: "signup", returnTo: "//evil.test", intent: undefined };
  assert.equal(compile("src/lib/native-ios.ts", dependencies).startNativeIOSSignIn(input), false);
  const messages = [];
  const browser = {
    window: {
      webkit: {
        messageHandlers: { envitefy: { postMessage: (message) => messages.push(message) } },
      },
    },
    navigator: { userAgent: "Safari" },
  };
  const native = compile("src/lib/native-ios.ts", dependencies, {}, browser);
  assert.equal(native.startNativeIOSSignIn(input), false);
  assert.equal(messages.length, 0);
  browser.navigator.userAgent = "Safari EnvitefyIOS/1.0";
  assert.equal(native.startNativeIOSSignIn(input), true);
  assert.deepEqual(messages.pop(), {
    action: "request-authenticate",
    mode: "signup",
    returnTo: "/",
  });
  native.startNativeIOSSignIn({ ...input, intent: "signup_forms", returnTo: "/settings" });
  assert.deepEqual(messages.pop(), {
    action: "request-authenticate",
    mode: "signup",
    returnTo: "/settings",
    intent: "signup_forms",
  });
  let proceed;
  native.guardNativeIOSSignIn({ ...input, calendar: "google" }, (callback) => {
    proceed = callback;
  });
  assert.equal(
    messages.length,
    0,
    "No account change while Save / Discard / Keep editing is unresolved",
  );
  proceed();
  assert.deepEqual(messages.pop(), {
    action: "authenticate",
    mode: "signup",
    returnTo: "/",
    calendar: "google",
  });
});

function harness() {
  const h = {
    rows: new Map(),
    issues: 0,
    authenticated: true,
    token: "encrypted-session",
    queries: [],
  };
  h.env = {
    IOS_AUTH_ENABLED: "1",
    NODE_ENV: "production",
    AUTH_SECRET: "test-only-secret",
    NEXTAUTH_URL: "https://envitefy.com",
  };
  const query = async (sql, values) => {
    h.queries.push({ sql, values });
    if (sql.includes("INSERT INTO mobile_auth_codes")) {
      if (++h.issues > 20) return { rowCount: 0, rows: [] };
      const [userId, hash, challenge, token, expires, returnTo] = values;
      h.rows.set(hash, {
        challenge,
        user_id: userId,
        session_token: token,
        session_expires: expires,
        return_to: returnTo,
        expires_at: Date.now() + 90000,
      });
      return { rowCount: 1, rows: [{ code_hash: hash }] };
    }
    const [hash, challenge] = values;
    const row = h.rows.get(hash);
    if (
      !row ||
      row.consumed ||
      row.challenge !== challenge ||
      row.expires_at <= Date.now() ||
      row.session_expires.getTime() <= Date.now()
    )
      return { rows: [] };
    row.consumed = true;
    return { rows: [{ ...row }] };
  };
  h.lib = compile(
    "src/lib/mobile-auth.ts",
    { "@/lib/db": { query }, "./mobile-auth-contract": contract },
    h.env,
  );
  const deps = {
    "@/lib/mobile-auth": h.lib,
    "@/lib/mobile-auth-contract": contract,
    "@/lib/auth": {
      getAuthenticatedRequestUser: async () => ({ ok: h.authenticated, userId: "user-id" }),
    },
    "next-auth/jwt": {
      getToken: async ({ raw }) => (raw ? h.token : { exp: Math.floor(Date.now() / 1000) + 86400 }),
    },
  };
  h.authorize = compile("src/app/api/mobile/auth/authorize/route.ts", deps, h.env).POST;
  h.exchange = compile("src/app/api/mobile/auth/exchange/route.ts", deps, h.env).POST;
  h.request = (route, body, headers = {}) =>
    new NextRequest(`https://envitefy.com/api/mobile/auth/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://envitefy.com", ...headers },
      body: JSON.stringify(body),
    });
  h.issue = async (returnTo = "/event/test") => {
    const result = await h.authorize(
      h.request("authorize", { challenge: h.lib.mobileAuthHash(verifier), state, returnTo }),
    );
    assert.equal(result.status, 200);
    const body = await result.json();
    return new URL(body.callback).searchParams.get("code");
  };
  return h;
}

test("safe return destinations never leave the origin or target authentication APIs", () => {
  for (const path of [
    "//evil.test",
    "https://evil.test",
    "/\\evil.test",
    "/api/auth/signout",
    "/mobile/sign-in",
    "/a/../api/user",
    "/bad\npath",
    "/".repeat(2100),
  ]) {
    assert.equal(contract.mobileReturnPath(path), "/", path);
  }
  assert.equal(
    contract.mobileReturnPath("/event/example?preview=owner#rsvp"),
    "/event/example?preview=owner#rsvp",
  );
});

test("callback contains only a bounded authorization code and native state", () => {
  const url = new URL(contract.mobileAuthCallback("c".repeat(43), state));
  assert.equal(url.protocol, "envitefy:");
  assert.deepEqual([...url.searchParams.keys()], ["code", "state"]);
  assert.throws(() => contract.mobileAuthCallback("token", state));
});

test("handoff issues a code, checks PKCE, then delivers HttpOnly cookies without exposing the token in JSON", async () => {
  const h = harness();
  const code = await h.issue();
  assert.ok(!h.rows.has(code), "Only the code hash is persisted");
  const wrong = await h.exchange(h.request("exchange", { code, verifier: "w".repeat(43) }));
  assert.equal(wrong.status, 401);
  const response = await h.exchange(h.request("exchange", { code, verifier }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { returnTo: "/event/test" });
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /__Secure-next-auth.session-token=encrypted-session/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=lax/i);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const replay = await h.exchange(h.request("exchange", { code, verifier }));
  assert.equal(replay.status, 401);
});

test("missing session, invalid challenge, cross-site origin and form posts are denied", async () => {
  const h = harness();
  const body = { challenge: h.lib.mobileAuthHash(verifier), state };
  assert.equal(
    (await h.authorize(h.request("authorize", body, { Origin: "https://evil.test" }))).status,
    403,
  );
  assert.equal(
    (await h.authorize(h.request("authorize", body, { "Sec-Fetch-Site": "cross-site" }))).status,
    403,
  );
  assert.equal(
    (await h.authorize(h.request("authorize", body, { "Content-Type": "text/plain" }))).status,
    403,
  );
  assert.equal(
    (await h.authorize(h.request("authorize", { ...body, challenge: "short" }))).status,
    400,
  );
  h.authenticated = false;
  assert.equal((await h.authorize(h.request("authorize", body))).status, 401);
  assert.equal(h.queries.length, 0);
});

test("expired handoffs and expired sessions are denied", async () => {
  const h = harness();
  let code = await h.issue();
  h.rows.get(h.lib.mobileAuthHash(code)).expires_at = Date.now() - 1;
  assert.equal((await h.exchange(h.request("exchange", { code, verifier }))).status, 401);
  code = await h.issue();
  h.rows.get(h.lib.mobileAuthHash(code)).session_expires = new Date(0);
  assert.equal((await h.exchange(h.request("exchange", { code, verifier }))).status, 401);
});

test("long sessions use NextAuth-compatible cookie chunks", async () => {
  const h = harness();
  h.token = "a".repeat(5000);
  const code = await h.issue("https://evil.test");
  const response = await h.exchange(h.request("exchange", { code, verifier }));
  assert.equal(response.status, 200);
  const chunks = response.cookies.getAll();
  assert.equal(chunks[0].name, "__Secure-next-auth.session-token.0");
  assert.equal(chunks[0].value.length, 3933);
  assert.equal(chunks[1].name, "__Secure-next-auth.session-token.1");
  assert.equal(chunks.map((c) => c.value).join(""), h.token);
  assert.equal((await response.json()).returnTo, "/");
});

test("native exchange permits no Origin but never accepts a foreign browser origin", async () => {
  const h = harness();
  const code = await h.issue();
  assert.equal(
    (await h.exchange(h.request("exchange", { code, verifier }, { Origin: "https://evil.test" })))
      .status,
    403,
  );
  const request = h.request("exchange", { code, verifier });
  request.headers.delete("origin");
  assert.equal((await h.exchange(request)).status, 200);
});

test("feature stays disabled until the migration and web deployment are ready", async () => {
  const h = harness();
  h.env.IOS_AUTH_ENABLED = "0";
  assert.equal((await h.authorize(h.request("authorize", {}))).status, 503);
  assert.equal((await h.exchange(h.request("exchange", {}))).status, 503);
  assert.equal(h.queries.length, 0);
});

test("request size is bounded independently of Content-Length", async () => {
  const h = harness();
  assert.equal(
    await h.lib.readMobileAuthBody(
      new Request("https://envitefy.com", {
        method: "POST",
        body: JSON.stringify({ value: "x".repeat(8192) }),
      }),
    ),
    null,
  );
  assert.equal(
    await h.lib.readMobileAuthBody(
      new Request("https://envitefy.com", { method: "POST", body: "[]" }),
    ),
    null,
  );
  assert.deepEqual(
    await h.lib.readMobileAuthBody(
      new Request("https://envitefy.com", { method: "POST", body: '{"a":1}' }),
    ),
    { a: 1 },
  );
});

test("database quota exhaustion is surfaced as 429", async () => {
  const h = harness();
  h.issues = 20;
  assert.equal(
    (
      await h.authorize(
        h.request("authorize", { challenge: h.lib.mobileAuthHash(verifier), state }),
      )
    ).status,
    429,
  );
});
