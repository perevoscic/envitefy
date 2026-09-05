import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../../", import.meta.url);
const nextServer = require("next/server");
const realReact = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function loadModule(relativePath, { enabled = false, calls = [] } = {}) {
  const filename = fileURLToPath(new URL(relativePath, root));
  let source = readFileSync(filename, "utf8");
  if (relativePath === "src/config/calendar-sync.ts" && enabled !== undefined) {
    source = source.replace(/SYNC_ENABLED: boolean = (true|false)/, `SYNC_ENABLED: boolean = ${enabled}`);
  }
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  const module = { exports: {} };
  const forbidden = (name) => new Proxy(() => {
    calls.push(name);
    throw new Error(`Unexpected side effect: ${name}`);
  }, {
    get(_target, key) {
      if (key === "__esModule") return true;
      return forbidden(`${name}.${String(key)}`);
    },
  });
  const localRequire = (name) => {
    if (name === "next/server") return nextServer;
    if (name === "react") return realReact;
    if (name === "react/jsx-runtime") return require(name);
    if (name === "@/config/calendar-sync") {
      return loadModule("src/config/calendar-sync.ts", { enabled, calls });
    }
    if (name === "@/lib/calendar-sync-pause") {
      return loadModule("src/lib/calendar-sync-pause.ts", { enabled, calls });
    }
    return forbidden(name);
  };
  vm.runInNewContext(result.outputText, {
    module,
    exports: module.exports,
    require: localRequire,
    Request,
    Response,
    URL,
    URLSearchParams,
    Buffer,
    process: { env: {} },
    fetch: forbidden("fetch"),
    console: { info() {}, warn() {}, error() {} },
  }, { filename });
  return module.exports;
}

test("the disabled switch pauses sync, and the same switch can restore it", async () => {
  const paused = loadModule("src/lib/calendar-sync-pause.ts").getCalendarSyncPauseResponse();
  assert.equal(paused.status, 503);
  assert.equal(paused.headers.get("cache-control"), "no-store");
  assert.equal((await paused.json()).code, "CALENDAR_SYNC_PAUSED");
  assert.equal(loadModule("src/lib/calendar-sync-pause.ts", { enabled: true }).getCalendarSyncPauseResponse(), null);
});

const writeRoutes = [
  "events/calendar/auto",
  ...["google", "outlook"].flatMap(provider => [
    `events/${provider}`,
    `events/${provider}/bulk`,
    `${provider}/insert`,
  ]),
];

for (const route of writeRoutes) {
  test(`${route} refuses calendar writes before using existing credentials or touching data`, async () => {
    const calls = [];
    const handler = loadModule(`src/app/api/${route}/route.ts`, { calls });
    const response = await handler.POST(new nextServer.NextRequest(`https://envitefy.com/api/${route}`, {
      method: "POST",
      headers: { cookie: "g_refresh=existing; o_refresh=existing" },
      body: JSON.stringify({ eventId: "saved-event", title: "Saved invitation" }),
    }));
    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.equal(payload.status, "paused");
    assert.equal(payload.ok, false);
    assert.deepEqual(calls, []);
  });
}

for (const provider of ["google", "outlook"]) {
  for (const action of ["auth", "callback"]) {
    test(`${provider}/${action} cannot request scopes or exchange an in-flight OAuth code`, async () => {
      const calls = [];
      const handler = loadModule(`src/app/api/${provider}/${action}/route.ts`, { calls });
      const response = await handler.GET(new Request(
        `https://envitefy.com/api/${provider}/${action}?code=old-code&analytics=1&next=https://example.com`,
      ));
      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), "https://envitefy.com/settings#calendars");
      assert.deepEqual(calls, []);
    });
  }
}

test("old calendar setup URLs do not render a connection prompt or sync notice", () => {
  const calls = [];
  const { default: Prompt } = loadModule("src/components/FirstScanCalendarPrompt.tsx", { calls });
  const html = renderToStaticMarkup(realReact.createElement(Prompt, {
    userId: "owner",
    eventId: "saved-event",
    returnPath: "/event/saved-event",
    syncStatus: "needs_connection",
    calendarSetupProvider: "google",
    calendarSetupStatus: "stored",
  }));
  assert.equal(html, "");
  assert.deepEqual(calls, []);
});

test("marketing omits paused background sync and restores the original claim when enabled", () => {
  const paused = loadModule("src/lib/product-marketing-catalog.ts").buildEnvitefyMarketingCatalogPrompt();
  assert.doesNotMatch(paused, /background sync/);
  assert.match(paused, /manually save events/);
  const restored = loadModule("src/lib/product-marketing-catalog.ts", { enabled: true }).buildEnvitefyMarketingCatalogPrompt();
  assert.match(restored, /Google Calendar and Outlook background sync/);
});
