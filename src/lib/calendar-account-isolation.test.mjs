import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../../", import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
const accountA = { ok: true, userId: "account-a", email: "a@example.com" };
const accountB = { ok: true, userId: "account-b", email: "b@example.com" };
const eventScope = "https://www.googleapis.com/auth/calendar.events.owned";
const payload = Buffer.from(
  encodeURIComponent(
    JSON.stringify({
      type: "oauth_redirect",
      next: "/settings#calendars",
    }),
  ),
).toString("base64");

function harness({ account = accountA, grant = eventScope } = {}) {
  const stored = new Map();
  const calls = { exchanges: 0, writes: [], revocations: 0, validations: 0, appleDisconnections: [] };
  const context = {
    account,
    stored,
    calls,
    tokens: { refresh_token: "new-calendar-token", access_token: "access", scope: grant },
    validationStatus: 200,
  };
  const db = {
    getGoogleRefreshToken: async (email) => stored.get(`google:${email}`) || null,
    getMicrosoftRefreshToken: async (email) => stored.get(`microsoft:${email}`) || null,
    getUserByEmail: async () => ({ preferred_provider: "google", product_scopes: ["snap"] }),
    getUserIdByEmail: async (email) =>
      email === accountA.email ? accountA.userId : accountB.userId,
    getIsAdminByEmail: async () => false,
    saveGoogleRefreshToken: async (email, token) => {
      calls.writes.push(["google", email, token]);
      stored.set(`google:${email}`, token);
    },
    saveMicrosoftRefreshToken: async (email, token) => {
      calls.writes.push(["microsoft", email, token]);
      stored.set(`microsoft:${email}`, token);
    },
    updatePreferredProviderByEmail: async () => {},
    deleteStoredOAuthTokens: async (email, provider) => {
      let deleted = 0;
      for (const name of provider ? [provider] : ["google", "microsoft"]) {
        deleted += Number(stored.delete(`${name}:${email}`));
      }
      return deleted;
    },
  };
  const cache = new Map();
  const load = (relativePath) => {
    if (cache.has(relativePath)) return cache.get(relativePath);
    const filename = fileURLToPath(new URL(relativePath, root));
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    });
    const module = { exports: {} };
    const mocks = {
      "@/lib/auth": { getAuthenticatedRequestUser: async () => context.account },
      "@/lib/db": db,
      "@/lib/apple-calendar-subscription": {
        disconnectAppleCalendarSubscription: async (userId) => calls.appleDisconnections.push(userId),
      },
      "@/lib/calendar-sync-pause": { getCalendarSyncPauseResponse: () => null },
      "@/lib/absolute-url": { absoluteUrl: async (path) => `https://envitefy.com${path}` },
      "@/lib/concierge/creation-intent": {},
      "@/lib/mappers": { toGoogleEvent: (event) => event },
      "next-auth": {},
      "next-auth/providers/google": { default: (config) => config, __esModule: true },
      "next-auth/providers/credentials": { default: (config) => config, __esModule: true },
      "next/headers": {},
      "@/lib/database-errors": {
        isDatabaseUnavailableError: () => false,
        describeDatabaseError: String,
      },
      "@/config/feature-visibility": {},
      "@/lib/product-scopes": {
        normalizePrimarySignupSource: () => "legacy",
        normalizeProductScopes: () => ["snap"],
      },
      "@/lib/signup-intent": {},
      "@/lib/legal-acceptance": {},
      googleapis: {
        google: {
          auth: {
            OAuth2: class {
              generateAuthUrl({ state }) {
                return `https://accounts.google.com/o/oauth2/v2/auth?state=${encodeURIComponent(state)}`;
              }
              async getToken() {
                calls.exchanges++;
                return { tokens: context.tokens };
              }
            },
          },
          calendar: () => {
            throw new Error("Unexpected calendar write");
          },
        },
      },
    };
    vm.runInNewContext(
      outputText,
      {
        module,
        exports: module.exports,
        require: (name) => {
          if (Object.hasOwn(mocks, name)) return mocks[name];
          if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
          return require(name);
        },
        Request,
        Response,
        URL,
        URLSearchParams,
        Buffer,
        AbortSignal,
        Date,
        process: {
          env: {
            AUTH_SECRET: "test-secret",
            GOOGLE_CLIENT_ID: "test-client",
            GOOGLE_CLIENT_SECRET: "test-client-secret",
          },
        },
        console: { info() {}, warn() {}, error() {} },
        fetch: async (url, options) => {
          if (String(url).includes("/revoke")) {
            calls.revocations++;
            return Response.json({});
          }
          if (String(url).includes("microsoftonline.com")) {
            calls.exchanges++;
            return Response.json(context.tokens);
          }
          assert.equal(url, "https://oauth2.googleapis.com/token");
          calls.validations++;
          const token = options.body.get("refresh_token");
          return Response.json(
            context.validationStatus === 200
              ? { scope: token === "login-only" ? "openid email profile" : eventScope }
              : {
                  error:
                    context.validationStatus === 400 ? "invalid_grant" : "temporarily_unavailable",
                },
            { status: context.validationStatus },
          );
        },
      },
      { filename },
    );
    cache.set(relativePath, module.exports);
    return module.exports;
  };
  context.load = load;
  context.begin = async (provider = "google") => {
    const route = provider === "google" ? "google" : "outlook";
    const response = await load(`src/app/api/${route}/auth/route.ts`).GET(
      new Request(
        `https://envitefy.com/api/${route}/auth?next=${encodeURIComponent("/settings#calendars")}`,
      ),
    );
    assert.equal(response.status, 307);
    const state = new URL(response.headers.get("location")).searchParams.get("state");
    const cookieName = load("src/lib/calendar-oauth-state.ts").calendarOAuthCookieName(provider);
    const nonce = response.cookies.get(cookieName).value;
    return { state, cookie: `${cookieName}=${nonce}`, nonce };
  };
  return context;
}

test("Google sign-in cannot create or replace a calendar connection, even with an old calendar grant", async () => {
  const h = harness();
  h.stored.set(`google:${accountA.email}`, "calendar-from-another-google-address");
  const callback = h.load("src/lib/auth.ts").getAuthOptions().callbacks.jwt;
  for (const scope of ["openid email profile", eventScope]) {
    const result = await callback({
      token: { email: accountA.email, providers: { google: { refreshToken: "old-jwt-token" } } },
      user: { email: accountA.email, id: accountA.userId },
      account: {
        provider: "google",
        refresh_token: "signin-token",
        access_token: "signin-access",
        scope,
      },
    });
    assert.equal(result.providers, undefined);
    assert.equal(result.provider, "google");
  }
  assert.deepEqual(h.calls.writes, []);
  assert.equal(h.stored.get(`google:${accountA.email}`), "calendar-from-another-google-address");
  h.stored.clear();
  await callback({
    token: { email: accountA.email },
    account: { provider: "google", refresh_token: "signin-token" },
  });
  assert.equal(h.stored.size, 0);
});

test("connection status distinguishes an identity-only token from another account's calendar", async () => {
  const h = harness();
  h.stored.set(`google:${accountA.email}`, "login-only");
  h.stored.set(`google:${accountB.email}`, "calendar-b");
  const route = h.load("src/app/api/calendars/route.ts");
  const request = new Request("https://envitefy.com/api/calendars", {
    headers: { cookie: "g_refresh=calendar-b; o_refresh=outlook-b" },
  });
  let response = await route.GET(request);
  assert.equal((await response.json()).google, false);
  assert.match(response.headers.get("cache-control"), /no-store/);
  h.account = accountB;
  response = await route.GET(request);
  assert.equal((await response.json()).google, true);
  h.account = { ok: false };
  assert.deepEqual(await (await route.GET(request)).json(), {
    google: false,
    microsoft: false,
    apple: false,
  });
});

test("grant caching cannot keep a disconnected account connected and retries transient errors", async () => {
  const h = harness();
  const { getGoogleCalendarRefreshToken } = h.load("src/lib/google-calendar-connection.ts");
  h.stored.set(`google:${accountA.email}`, "calendar-a");
  await Promise.all([
    getGoogleCalendarRefreshToken(accountA.email),
    getGoogleCalendarRefreshToken(accountA.email),
  ]);
  assert.equal(h.calls.validations, 1);
  h.stored.delete(`google:${accountA.email}`);
  assert.equal(await getGoogleCalendarRefreshToken(accountA.email), null);
  h.stored.set(`google:${accountA.email}`, "new-token");
  h.validationStatus = 503;
  await assert.rejects(() => getGoogleCalendarRefreshToken(accountA.email));
  h.validationStatus = 200;
  assert.equal(await getGoogleCalendarRefreshToken(accountA.email), "new-token");
});

test("a temporary Google verification failure is not reported as a disconnection", async () => {
  const h = harness();
  h.stored.set(`google:${accountA.email}`, "calendar-a");
  h.validationStatus = 503;
  const response = await h
    .load("src/app/api/calendars/route.ts")
    .GET(new Request("https://envitefy.com/api/calendars"));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).google, undefined);
});

for (const provider of ["google", "microsoft"]) {
  const routeName = provider === "google" ? "google" : "outlook";
  test(`${provider} rejects a callback after switching Envitefy accounts, before exchanging credentials`, async () => {
    const h = harness();
    const { state, cookie } = await h.begin(provider);
    h.account = accountB;
    const response = await h
      .load(`src/app/api/${routeName}/callback/route.ts`)
      .GET(
        new Request(
          `https://envitefy.com/api/${routeName}/callback?code=test-code&state=${encodeURIComponent(state)}`,
          { headers: { cookie } },
        ),
      );
    assert.equal(response.status, 400);
    assert.equal(h.calls.exchanges, 0);
    assert.deepEqual(h.calls.writes, []);
  });

  test(`${provider} stores a valid connection only for its initiating Envitefy account`, async () => {
    const h = harness({ grant: provider === "google" ? eventScope : "Calendars.ReadWrite" });
    // A different Google identity is allowed; ownership must remain with account A.
    h.tokens.id_token = `header.${Buffer.from(JSON.stringify({ email: accountB.email })).toString("base64url")}.signature`;
    const { state, cookie } = await h.begin(provider);
    const response = await h
      .load(`src/app/api/${routeName}/callback/route.ts`)
      .GET(
        new Request(
          `https://envitefy.com/api/${routeName}/callback?code=test-code&state=${encodeURIComponent(state)}`,
          { headers: { cookie: `${cookie}; g_refresh=wrong-cookie; o_refresh=wrong-cookie` } },
        ),
      );
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location")).pathname, "/settings");
    assert.deepEqual(h.calls.writes, [[provider, accountA.email, "new-calendar-token"]]);
    assert.equal(h.stored.has(`${provider}:${accountB.email}`), false);
    assert.equal(response.cookies.get(provider === "google" ? "g_refresh" : "o_refresh").value, "");
  });
}

test("Google does not reuse a cookie or stored token when a reconnect omits a refresh token or Calendar scope", async () => {
  for (const tokens of [
    { access_token: "new-access", scope: eventScope },
    { refresh_token: "new-token", scope: "openid email profile" },
    { refresh_token: "new-token" },
  ]) {
    const h = harness();
    h.tokens = tokens;
    h.stored.set(`google:${accountA.email}`, "existing-calendar");
    const { state, cookie } = await h.begin();
    const response = await h
      .load("src/app/api/google/callback/route.ts")
      .GET(
        new Request(
          `https://envitefy.com/api/google/callback?code=test-code&state=${encodeURIComponent(state)}`,
          { headers: { cookie: `${cookie}; g_refresh=other-account-calendar` } },
        ),
      );
    assert.equal(
      new URL(response.headers.get("location")).searchParams.get("googleAuth"),
      "not-stored",
    );
    assert.deepEqual(h.calls.writes, []);
    assert.equal(h.stored.get(`google:${accountA.email}`), "existing-calendar");
  }
});

test("Outlook accepts omitted requested scopes and rejects explicitly missing calendar permissions", async () => {
  for (const scope of [undefined, "https%3A%2F%2Fgraph.microsoft.com%2FCalendars.ReadWrite", "User.Read"]) {
    const h = harness();
    h.tokens.scope = scope;
    const { state, cookie } = await h.begin("microsoft");
    const response = await h.load("src/app/api/outlook/callback/route.ts").GET(new Request(
      `https://envitefy.com/api/outlook/callback?code=test-code&state=${encodeURIComponent(state)}`,
      { headers: { cookie } },
    ));
    assert.equal(response.status, scope === "User.Read" ? 400 : 307);
    assert.equal(h.calls.writes.length, scope === "User.Read" ? 0 : 1);
  }
});

test("OAuth state accepts Next.js request wrappers without copying Request private internals", async () => {
  const h = harness();
  const { state, cookie } = await h.begin();
  const wrapper = {
    url: `https://envitefy.com/api/google/callback?state=${encodeURIComponent(state)}`,
    headers: new Headers({ cookie }),
  };
  const result = await h.load("src/lib/calendar-oauth-state.ts").readCalendarOAuthState(wrapper, accountA, "google");
  assert.equal(result.payload, payload);
});

test("OAuth state rejects tampering, missing/wrong cookies, expiry, provider mismatch, and replay after disconnect", async () => {
  const h = harness();
  const helpers = h.load("src/lib/calendar-oauth-state.ts");
  const { state, cookie } = await h.begin();
  const request = (value, cookies = cookie) =>
    new Request(`https://envitefy.com/api/google/callback?state=${encodeURIComponent(value)}`, {
      headers: { cookie: cookies },
    });
  assert.equal(
    await helpers.readCalendarOAuthState(request(`${state}tampered`), accountA, "google"),
    null,
  );
  assert.equal(await helpers.readCalendarOAuthState(request(state, ""), accountA, "google"), null);
  assert.equal(
    await helpers.readCalendarOAuthState(
      request(state, "envitefy_calendar_oauth_google=wrong"),
      accountA,
      "google",
    ),
    null,
  );
  assert.equal(await helpers.readCalendarOAuthState(request(state), accountA, "microsoft"), null);
  const { encode } = require("next-auth/jwt");
  const expired = await encode({
    secret: "test-secret:calendar-oauth",
    maxAge: -100,
    token: {
      kind: "calendar-connect",
      userId: accountA.userId,
      email: accountA.email,
      provider: "google",
      payload,
      nonce: cookie.split("=")[1],
    },
  });
  assert.equal(await helpers.readCalendarOAuthState(request(expired), accountA, "google"), null);
  const disconnected = helpers.finishCalendarOAuth(NextResponse.json({ ok: true }), "google");
  const clearedCookie = disconnected.cookies.get(helpers.calendarOAuthCookieName("google"));
  assert.equal(
    await helpers.readCalendarOAuthState(
      request(state, `${clearedCookie.name}=${clearedCookie.value}`),
      accountA,
      "google",
    ),
    null,
  );
});

test("disconnecting one account preserves another account's tokens and does not revoke the shared Google grant", async () => {
  const h = harness();
  h.stored.set(`google:${accountA.email}`, "shared-google-grant");
  h.stored.set(`google:${accountB.email}`, "shared-google-grant");
  h.stored.set(`microsoft:${accountA.email}`, "outlook-a");
  const response = await h.load("src/app/api/oauth/disconnect/route.ts").POST(
    new Request("https://envitefy.com/api/oauth/disconnect", {
      method: "POST",
      body: JSON.stringify({ provider: "google" }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(h.stored.has(`google:${accountA.email}`), false);
  assert.equal(h.stored.get(`google:${accountB.email}`), "shared-google-grant");
  assert.equal(h.stored.get(`microsoft:${accountA.email}`), "outlook-a");
  assert.equal(h.calls.revocations, 0);
  assert.equal(response.cookies.get("next-auth.session-token"), undefined);
  assert.equal(response.cookies.get("envitefy_calendar_oauth_google").value, "");
});

test("the privacy disconnect revokes the current account's Apple subscription too", async () => {
  const h = harness();
  const response = await h.load("src/app/api/oauth/disconnect/route.ts").POST(
    new Request("https://envitefy.com/api/oauth/disconnect", { method: "POST", body: "{}" }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(h.calls.appleDisconnections, [accountA.userId]);
});

for (const routeName of ["events/google", "events/google/bulk"]) {
  test(`${routeName} rejects stale cookies for anonymous and disconnected users`, async () => {
    const h = harness();
    const handler = h.load(`src/app/api/${routeName}/route.ts`);
    const request = () =>
      new NextRequest(`https://envitefy.com/api/${routeName}`, {
        method: "POST",
        headers: { cookie: "g_refresh=another-account-token" },
        body: "{}",
      });
    assert.equal((await handler.POST(request())).status, 400);
    h.account = { ok: false };
    assert.equal((await handler.POST(request())).status, 401);
  });
}
