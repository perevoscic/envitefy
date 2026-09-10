import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise the page's real save handler without a browser or live account writes.
const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const parsed = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "saveCalendarDefault") handler = node;
  ts.forEachChild(node, visit);
}
visit(parsed);
assert.ok(handler, "settings must define its default save handler");
const script = ts.transpileModule(handler.getText(parsed), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function createHarness(fetchResponse = async () => ({ ok: true, json: async () => ({}) })) {
  const requests = [];
  const state = {
    calendarDefaultSavingRef: { current: false },
    calendarState: { loading: false, error: null },
    calendarDefaultLoading: false,
    connectionsLoading: false,
    connectionsVerified: true,
    disconnectingProvider: null,
    connectedCalendars: { google: true, microsoft: true, apple: false },
    preferredProvider: "google",
    localDefault: "google",
    autoClearedProviderRef: { current: null },
    setCalendarState(value) { state.calendarState = value; },
    setPreferredProvider(value) { state.preferredProvider = value; },
    mirrorLocalCalendarDefault(value) { state.localDefault = value; },
    async fetch(url, options) {
      requests.push({ url, method: options.method, body: JSON.parse(options.body) });
      return fetchResponse();
    },
  };
  vm.createContext(state);
  vm.runInContext(script, state);
  return { state, requests, save: (provider) => state.saveCalendarDefault(provider) };
}

test("a tile switch saves a new default immediately and can clear it", async () => {
  const { state, requests, save } = createHarness();
  await save("microsoft");
  assert.equal(state.preferredProvider, "microsoft");
  assert.equal(state.localDefault, "microsoft");
  await save(null);
  assert.equal(state.preferredProvider, "");
  assert.equal(state.localDefault, null);
  assert.deepEqual(requests, ["microsoft", null].map((preferredProvider) => ({
    url: "/api/user/profile", method: "PUT", body: { preferredProvider },
  })));
});

test("failed saves preserve the previous selection and allow retry", async () => {
  let shouldFail = true;
  const { state, save } = createHarness(async () => ({
    ok: !shouldFail, json: async () => ({ error: "Could not save" }),
  }));
  await save("microsoft");
  assert.equal(state.preferredProvider, "google");
  assert.equal(state.localDefault, "google");
  assert.equal(state.calendarState.error, "Could not save");
  assert.equal(state.calendarDefaultSavingRef.current, false);
  shouldFail = false;
  await save("microsoft");
  assert.equal(state.preferredProvider, "microsoft");
  assert.equal(state.calendarState.error, null);
});

test("pending saves keep the confirmed state and ignore repeated clicks", async () => {
  let finish;
  const { state, requests, save } = createHarness(() => new Promise((resolve) => { finish = resolve; }));
  const pending = save("microsoft");
  await save(null);
  assert.equal(requests.length, 1);
  assert.equal(state.preferredProvider, "google");
  assert.equal(state.calendarState.loading, true);
  finish({ ok: true, json: async () => ({}) });
  await pending;
  assert.equal(state.preferredProvider, "microsoft");
  assert.equal(state.calendarState.loading, false);
});

test("unverified, disconnected, or still-loading calendars cannot become defaults", async () => {
  for (const blocked of [
    { connectionsVerified: false },
    { calendarDefaultLoading: true },
    { connectionsLoading: true },
    { disconnectingProvider: "microsoft" },
    { connectedCalendars: { google: true, microsoft: false } },
  ]) {
    const { state, requests, save } = createHarness();
    Object.assign(state, blocked);
    await save("microsoft");
    assert.equal(requests.length, 0);
    assert.equal(state.preferredProvider, "google");
  }
});
