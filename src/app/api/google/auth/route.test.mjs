import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const loadTs = require("../../../../../scripts/lib/event-messages-test-loader.cjs");
const callbackSource = readFileSync(new URL("../callback/route.ts", import.meta.url), "utf8");
const account = { ok: true, userId: "account-a", email: "host@example.com" };

function harness(t, signedIn = true) {
  const env = {
    GOOGLE_CLIENT_ID: "verified-client.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    GOOGLE_REDIRECT_URI: "https://envitefy.com/api/google/callback",
  };
  const original = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const calls = { state: 0, cookie: 0 };
  const route = loadTs("src/app/api/google/auth/route.ts", {
    "@/config/calendar-sync": { CONNECTED_CALENDAR_SYNC_ENABLED: true },
    "@/lib/auth": { getAuthenticatedRequestUser: async () => signedIn ? account : { ok: false } },
    "@/lib/calendar-oauth-state": {
      createCalendarOAuthState: async (initiatingAccount, provider) => {
        assert.equal(initiatingAccount, account);
        assert.equal(provider, "google");
        calls.state++;
        return { state: "account-bound-state", nonce: "connection-nonce" };
      },
      setCalendarOAuthCookie: (response, provider, nonce) => {
        assert.equal(provider, "google");
        assert.equal(nonce, "connection-nonce");
        calls.cookie++;
        return response;
      },
    },
    "@/lib/admin/ga4-oauth": {
      beginGa4OAuth: () => { throw new Error("Unexpected Analytics authorization"); },
    },
  });
  return { route, calls, env };
}

test("calendar authorization URL requests only approved scopes without merging old grants", async (t) => {
  const { route, calls, env } = harness(t);
  const response = await route.GET(new Request("https://envitefy.com/api/google/auth"));
  assert.equal(response.status, 307);
  const url = new URL(response.headers.get("location"));
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.pathname, "/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), env.GOOGLE_CLIENT_ID);
  assert.equal(url.searchParams.get("redirect_uri"), env.GOOGLE_REDIRECT_URI);
  assert.deepEqual(url.searchParams.get("scope").split(" "), [
    "https://www.googleapis.com/auth/calendar.events.owned", "openid", "email", "profile",
  ]);
  assert.equal(url.searchParams.get("include_granted_scopes"), "false");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("state"), "account-bound-state");
  assert.deepEqual(calls, { state: 1, cookie: 1 });
});

test("signed-out calendar connections cannot start Google authorization", async (t) => {
  const { route, calls } = harness(t, false);
  const response = await route.GET(new Request("https://envitefy.com/api/google/auth"));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("location"), null);
  assert.deepEqual(await response.json(), { error: "Sign in before connecting a calendar" });
  assert.deepEqual(calls, { state: 0, cookie: 0 });
});

test("calendar connection is stored against the signed-in Envitefy account", () => {
  assert.match(callbackSource, /const sessionEmail = account.email/);
  assert.match(callbackSource, /readCalendarOAuthState\(request, account, "google"\)/);
  assert.doesNotMatch(callbackSource, /cookieRefresh|sessionEmailFromJwt|tokenEmail/);
  assert.match(callbackSource, /googleAuth", debug\.tokenPersisted \? "stored" : "not-stored"/);
});
