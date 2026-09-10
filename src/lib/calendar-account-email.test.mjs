import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function harness() {
  const h = {
    signedIn: true,
    googleGrantValid: true,
    google: "google-calendar-token",
    microsoft: "outlook-calendar-token",
    requests: [],
    profileStatus: 200,
    profileOverride: undefined,
    afterProfile: () => {},
    apple: null,
    appleReads: [],
    appleFailure: false,
  };
  function load(file, mocks = {}) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    });
    const module = { exports: {} };
    vm.runInNewContext(outputText, {
      module, exports: module.exports,
      require: (name) => mocks[name] || require(name),
      URL, URLSearchParams, AbortSignal,
      process: { env: {
        GOOGLE_CLIENT_ID: "google-client", GOOGLE_CLIENT_SECRET: "google-secret",
        OUTLOOK_CLIENT_ID: "outlook-client", OUTLOOK_CLIENT_SECRET: "outlook-secret",
      } },
      fetch: async (url, options) => {
        h.requests.push({ url, options });
        if (url.includes("/token")) {
          return Response.json({ access_token: options.body.get("refresh_token") });
        }
        h.afterProfile();
        return Response.json(h.profileOverride ?? (
          url.includes("userinfo")
            ? { email: options.headers.Authorization.includes("new-token") ? "new@example.com" : "calendar@gmail.com" }
            : { owner: { address: "calendar@outlook.com" } }
        ), { status: h.profileStatus });
      },
    });
    return module.exports;
  }
  h.helper = load("./calendar-account-email.ts");
  const readToken = (provider) => async (email) => {
    assert.equal(email, "envitefy-login@example.com");
    return h[provider];
  };
  h.route = load("../app/api/calendars/route.ts", {
    "@/lib/auth": { getAuthenticatedRequestUser: async () => h.signedIn
      ? { ok: true, email: "envitefy-login@example.com", userId: "local-owner" }
      : { ok: false } },
    "@/lib/db": {
      getGoogleRefreshToken: readToken("google"),
      getMicrosoftRefreshToken: readToken("microsoft"),
    },
    "@/lib/google-calendar-connection": {
      getGoogleCalendarRefreshToken: async (email) => h.googleGrantValid ? readToken("google")(email) : null,
    },
    "@/lib/calendar-account-email": h.helper,
    "@/lib/apple-calendar-subscription": {
      getAppleCalendarSubscription: async (userId) => {
        h.appleReads.push(userId);
        if (h.appleFailure) throw new Error("Subscription status unavailable");
        return h.apple;
      },
    },
  });
  h.get = (details = true) => h.route.GET(new Request(
    `https://envitefy.com/api/calendars${details ? "?includeAccounts=1" : ""}`,
    { headers: { cookie: "g_refresh=other-account-token" } },
  ));
  return h;
}

test("Settings receives the provider emails, even when they differ from the Envitefy login", async () => {
  const h = harness();
  const response = await h.get();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.accountEmails, { google: "calendar@gmail.com", microsoft: "calendar@outlook.com" });
  assert.equal(body.google, true);
  assert.equal(body.microsoft, true);
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.doesNotMatch(JSON.stringify(body), /token|secret|envitefy-login/);
  const outlook = h.requests.find(({ url }) => url.includes("graph.microsoft.com"));
  assert.equal(outlook.url, "https://graph.microsoft.com/v1.0/me/calendar?$select=owner");
  assert.equal(outlook.options.headers.Authorization, "Bearer outlook-calendar-token");
});

test("ordinary status reads and signed-out requests never fetch account details", async () => {
  const h = harness();
  await h.get(false);
  assert.equal(h.requests.length, 0);
  assert.equal(h.appleReads.length, 0);
  h.signedIn = false;
  assert.deepEqual(await (await h.get()).json(), {
    google: false, microsoft: false, apple: false,
    accountEmails: { google: null, microsoft: null },
    appleSubscription: null,
  });
  assert.equal(h.requests.length, 0);
  assert.equal(h.appleReads.length, 0);
});

test("Settings includes only the current account's Apple status without contacting any disconnected provider", async () => {
  const h = harness();
  h.google = null;
  h.microsoft = null;
  const disconnected = await (await h.get()).json();
  assert.deepEqual(disconnected.appleSubscription, { ready: false, connected: false });
  h.apple = { token: "private-feed-token", last_fetched_at: null };
  assert.deepEqual((await (await h.get()).json()).appleSubscription, { ready: true, connected: false });
  h.apple.last_fetched_at = "2026-09-10T12:00:00Z";
  const connected = await (await h.get()).json();
  assert.deepEqual(connected.appleSubscription, { ready: true, connected: true });
  assert.equal(connected.apple, false, "a feed subscription is not a writable calendar destination");
  assert.doesNotMatch(JSON.stringify(connected), /token|last_fetched_at/);
  assert.deepEqual(h.appleReads, ["local-owner", "local-owner", "local-owner"]);
  assert.equal(h.requests.length, 0);
});

test("Apple status failures do not claim disconnection or block Google and Outlook", async () => {
  const h = harness();
  h.appleFailure = true;
  const response = await h.get();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.appleSubscription, null);
  assert.equal(body.google, true);
  assert.equal(body.microsoft, true);
});

test("cached emails cannot keep a disconnected account visible", async () => {
  const h = harness();
  await h.get();
  h.google = null;
  h.microsoft = null;
  const result = await (await h.get()).json();
  assert.deepEqual(result.accountEmails, { google: null, microsoft: null });
  assert.equal(result.google, false);
  assert.equal(h.requests.length, 4);
});

test("a stored identity-only Google grant stays disconnected without hiding Outlook's email", async () => {
  const h = harness();
  h.googleGrantValid = false;
  const response = await h.get();
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.google, false);
  assert.deepEqual(result.accountEmails, { google: null, microsoft: "calendar@outlook.com" });
  assert.equal(h.requests.length, 2);
});

test("a new connection uses its own identity instead of the previous cached email", async () => {
  const h = harness();
  await h.get();
  h.google = "new-token";
  const result = await (await h.get()).json();
  assert.equal(result.accountEmails.google, "new@example.com");
  assert.equal(h.requests.length, 6);
});

test("disconnect or reconnect during lookup cannot expose the old identity", async () => {
  for (const nextToken of [null, "new-token"]) {
    const h = harness();
    h.afterProfile = () => { h.google = nextToken; };
    const response = await h.get();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).accountEmails, undefined);
  }
});

test("profile errors preserve connection status and allow a later Refresh to retry", async () => {
  const h = harness();
  h.profileStatus = 503;
  const first = await (await h.get()).json();
  assert.equal(first.google, true);
  assert.equal(first.microsoft, true);
  assert.deepEqual(first.accountEmails, { google: null, microsoft: null });
  h.profileStatus = 200;
  assert.equal((await (await h.get()).json()).accountEmails.google, "calendar@gmail.com");
});

test("missing or malformed provider email never falls back to the login", async () => {
  for (const profile of [null, {}, { email: "bad email", owner: { address: 123 } }]) {
    const h = harness();
    h.profileOverride = profile || {};
    assert.deepEqual((await (await h.get()).json()).accountEmails, { google: null, microsoft: null });
  }
});

test("concurrent lookups share one request per credential", async () => {
  const h = harness();
  const results = await Promise.all([
    h.helper.getCalendarAccountEmail("google", h.google),
    h.helper.getCalendarAccountEmail("google", h.google),
  ]);
  assert.deepEqual(results, ["calendar@gmail.com", "calendar@gmail.com"]);
  assert.equal(h.requests.length, 2);
});
