import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const require = createRequire(import.meta.url);
const root = new URL("../../../", import.meta.url);
const { google } = require("googleapis");
const scope = "https://www.googleapis.com/auth/analytics.readonly";
const admin = { ok: true, userId: "admin-id", email: "admin@example.com" };

function harness() {
  const h = {
    account: admin,
    isAdmin: true,
    saved: null,
    failSave: false,
    exchanges: 0,
    calendarWrites: 0,
    reportTokens: [],
    tokens: { refresh_token: "selected-token", id_token: "signed-identity", scope },
    identity: { email: "different@example.com", email_verified: true },
  };
  const env = {
    AUTH_SECRET: "test-secret",
    GOOGLE_CLIENT_ID: "test-client",
    GOOGLE_CLIENT_SECRET: "test-secret",
    GOOGLE_REDIRECT_URI: "https://envitefy.com/api/google/callback",
    GOOGLE_ANALYTICS_PROPERTY_ID: "511549693",
    GOOGLE_ANALYTICS_OAUTH_EMAIL: "configured@example.com",
    GOOGLE_ANALYTICS_REFRESH_TOKEN: "configured-token",
  };
  const db = {
    getIsAdminByEmail: async () => h.isAdmin,
    getGoogleRefreshToken: async () => "legacy-calendar-token",
    saveGoogleRefreshToken: async () => {
      h.calendarWrites++;
    },
    updatePreferredProviderByEmail: async () => {
      h.calendarWrites++;
    },
    query: async (sql, values) => {
      assert.match(sql, /provider = 'google-analytics'|'google-analytics', \$2/);
      if (sql.startsWith("select")) {
        return {
          rows: h.saved ? [{ email: h.saved.email, refresh_token: h.saved.refreshToken }] : [],
        };
      }
      if (h.failSave) throw new Error("Storage unavailable");
      assert.equal(values[2], admin.userId);
      h.saved = { email: values[0], refreshToken: values[1] };
      return { rows: [] };
    },
  };
  const mocks = {
    "@/lib/auth": { getAuthenticatedRequestUser: async () => h.account },
    "@/lib/db": db,
    "@/lib/absolute-url": { absoluteUrl: async (path) => `https://envitefy.com${path}` },
    "@/lib/concierge/creation-intent": {},
    "@/lib/mappers": {},
    "@/lib/admin/analytics": { getAdminAnalyticsSnapshot: async () => h.snapshot },
    "lucide-react": { LogIn: (props) => createElement("svg", props) },
    googleapis: {
      google: {
        auth: {
          ...google.auth,
          OAuth2: class extends google.auth.OAuth2 {
            async getToken() {
              h.exchanges++;
              return { tokens: h.tokens };
            }
            async verifyIdToken(options) {
              assert.equal(options.audience, env.GOOGLE_CLIENT_ID);
              return { getPayload: () => h.identity };
            }
          },
        },
        analyticsdata: ({ auth }) => {
          h.reportTokens.push(auth.credentials.refresh_token);
          return {
            properties: {
              runReport: async () => ({ data: {} }),
              runRealtimeReport: async () => ({ data: {} }),
            },
          };
        },
      },
    },
  };
  const cache = new Map();
  h.load = (relative) => {
    if (cache.has(relative)) return cache.get(relative);
    const filename = fileURLToPath(new URL(relative, root));
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    const module = { exports: {} };
    vm.runInNewContext(
      outputText,
      {
        module,
        exports: module.exports,
        require: (name) => {
          if (Object.hasOwn(mocks, name)) return mocks[name];
          if (name.startsWith("@/")) {
            const path = `src/${name.slice(2)}.ts`;
            return h.load(existsSync(new URL(path, root)) ? path : `${path}x`);
          }
          if (name.startsWith(".")) {
            const url = new URL(`${name}.ts`, new URL(relative, root));
            return h.load(url.href.slice(root.href.length));
          }
          return require(name);
        },
        Request,
        Response,
        URL,
        URLSearchParams,
        Buffer,
        Date,
        process: { env },
        console: { info() {}, warn() {}, error() {} },
      },
      { filename },
    );
    cache.set(relative, module.exports);
    return module.exports;
  };
  h.begin = async () => {
    const response = await h
      .load("src/app/api/google/auth/route.ts")
      .GET(new Request("https://envitefy.com/api/google/auth?analytics=1"));
    if (response.status !== 307) return { response };
    const url = new URL(response.headers.get("location"));
    const cookieName = "envitefy_calendar_oauth_google-analytics";
    return {
      response,
      url,
      state: url.searchParams.get("state"),
      cookie: `${cookieName}=${response.cookies.get(cookieName).value}`,
    };
  };
  h.complete = async (attempt, params = "code=authorization-code") => {
    return h
      .load("src/app/api/google/callback/route.ts")
      .GET(
        new Request(
          `https://envitefy.com/api/google/callback?${params}&state=${encodeURIComponent(attempt.state)}`,
          { headers: { cookie: attempt.cookie } },
        ),
      );
  };
  return h;
}

test("Analytics page keeps the account-switch action available after connection and on access errors", async () => {
  const h = harness();
  const reporting = h.load("src/lib/admin/ga4-reporting.ts");
  h.snapshot = {
    ga4: { ...(await reporting.getGa4ReportingConfigStatusForRequest()), connected: true },
    ga4Report: await reporting.getGa4DashboardSnapshot(),
    firstParty: {
      eventsLast30Days: 0,
      publicEvents: 0,
      sharesLast30Days: 0,
      rsvpsLast30Days: 0,
      publicEventViews30Days: 0,
      linkClicks30Days: 0,
      registryClicks30Days: 0,
    },
    trackingGaps: [],
  };
  const Page = h.load("src/app/admin/analytics/page.tsx").default;
  for (const status of ["available", "error"]) {
    h.snapshot.ga4Report.status = status;
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    assert.match(html, /Change Google account/);
    assert.match(html, /href="\/api\/google\/auth\?consent=1&amp;analytics=1/);
    assert.match(html, /configured@example.com/);
  }
  const html = renderToStaticMarkup(
    await Page({ searchParams: Promise.resolve({ analyticsAuth: "cancelled" }) }),
  );
  assert.match(html, /role="status"/);
  assert.match(html, /Google connection cancelled/);
  const unrecognized = renderToStaticMarkup(
    await Page({ searchParams: Promise.resolve({ analyticsAuth: "__proto__" }) }),
  );
  assert.ok(!unrecognized.includes('role="status"'));
});

test("Analytics always offers account selection without an email hint or calendar scope", async () => {
  const h = harness();
  const { url } = await h.begin();
  assert.equal(url.searchParams.get("prompt"), "consent select_account");
  assert.equal(url.searchParams.get("login_hint"), null);
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("redirect_uri"), "https://envitefy.com/api/google/callback");
  assert.ok(url.searchParams.get("scope").includes(scope));
  assert.ok(!url.searchParams.get("scope").includes("calendar"));
});

test("selected Google identity persists and overrides the configured email and reporting token", async () => {
  const h = harness();
  const attempt = await h.begin();
  const response = await h.complete(attempt);
  assert.equal(
    new URL(response.headers.get("location")).searchParams.get("analyticsAuth"),
    "connected",
  );
  assert.deepEqual(h.saved, { email: "different@example.com", refreshToken: "selected-token" });
  assert.equal(h.calendarWrites, 0);
  assert.ok(!response.headers.get("set-cookie").includes("o_refresh"));
  assert.ok(!response.headers.get("set-cookie").includes("g_refresh"));

  const reporting = h.load("src/lib/admin/ga4-reporting.ts");
  const status = await reporting.getGa4ReportingConfigStatusForRequest();
  assert.equal(status.oauthEmail, "different@example.com");
  assert.equal(status.ready, true);
  assert.equal(status.refreshToken, undefined);
  assert.equal(status.oauthRefreshToken, undefined);
  assert.equal((await reporting.getGa4DashboardSnapshot()).status, "available");
  assert.deepEqual(h.reportTokens, ["selected-token"]);
});

test("existing environment credentials remain usable before an account is explicitly connected", async () => {
  const h = harness();
  const reporting = h.load("src/lib/admin/ga4-reporting.ts");
  assert.equal(
    (await reporting.getGa4ReportingConfigStatusForRequest()).oauthEmail,
    "configured@example.com",
  );
  await reporting.getGa4DashboardSnapshot();
  assert.deepEqual(h.reportTokens, ["configured-token"]);
});

test("only admins can start or finish an Analytics account change", async () => {
  const h = harness();
  h.account = { ok: false };
  assert.equal((await h.begin()).response.status, 401);
  h.account = admin;
  h.isAdmin = false;
  assert.equal((await h.begin()).response.status, 403);
  h.isAdmin = true;
  const attempt = await h.begin();
  h.isAdmin = false;
  assert.equal((await h.complete(attempt)).status, 403);
  assert.equal(h.exchanges, 0);
  assert.equal(h.saved, null);
});

test("missing nonce, changed session, and a calendar state cannot authorize an Analytics change", async () => {
  for (const change of ["cookie", "session", "provider"]) {
    const h = harness();
    const attempt = await h.begin();
    if (change === "cookie") attempt.cookie = "";
    if (change === "session") h.account = { ...admin, userId: "other-admin" };
    if (change === "provider") {
      const state = await h
        .load("src/lib/calendar-oauth-state.ts")
        .createCalendarOAuthState(admin, "google", null);
      attempt.state = state.state;
    }
    assert.equal((await h.complete(attempt)).status, 400);
    assert.equal(h.exchanges, 0);
    assert.equal(h.saved, null);
  }
});

for (const failure of [
  "cancelled",
  "missing-scope",
  "missing-refresh-token",
  "identity-error",
  "failed",
]) {
  test(`${failure} keeps the prior Analytics connection and returns useful feedback`, async () => {
    const h = harness();
    h.saved = { email: "previous@example.com", refreshToken: "previous-token" };
    const attempt = await h.begin();
    if (failure === "missing-scope") h.tokens.scope = "openid email";
    if (failure === "missing-refresh-token") h.tokens.refresh_token = undefined;
    if (failure === "identity-error") h.identity.email_verified = false;
    if (failure === "failed") h.failSave = true;
    const response = await h.complete(
      attempt,
      failure === "cancelled" ? "error=access_denied" : "code=code",
    );
    assert.equal(
      new URL(response.headers.get("location")).searchParams.get("analyticsAuth"),
      failure,
    );
    assert.deepEqual(h.saved, { email: "previous@example.com", refreshToken: "previous-token" });
    assert.equal(h.calendarWrites, 0);
  });
}
