const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Exercise the actual UI callback without a provider, account or browser write.
const filename = path.resolve("src/app/create/UnifiedCreatePageClient.tsx");
const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let initializer;
function find(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === "openLiveCard") initializer = node.initializer;
  ts.forEachChild(node, find);
}
find(source);
assert.ok(initializer, "Live Card alternate callback must exist");
const callback = ts.transpileModule(`const callback = ${initializer.getText(source)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

const template = { id: "live-card", family: "live-card", category: "gymnastics" };
const information = { version: 1, kind: "information", category: "gymnastics", details: { title: "Spring meet", date: "" } };
function fixture(overrides = {}) {
  const file = { name: "meet.pdf", original: true };
  const intake = { id: "sports-intake", discoveryEventId: "stored-sports-shell", guess: { category: "sports", sport: "gymnastics" }, sourceText: "Complete meet packet. ".repeat(800), source: { kind: "files", files: [file], text: "Session 2 moved to 1 PM" } };
  const phases = [], errors = [], requests = [], saves = [], opened = [];
  const env = {
    current: { current: intake }, submitting: { current: false }, epoch: { current: 0 },
    request: { current: null }, preparingLiveCard: { current: null },
    setPhase: value => phases.push(value), setError: value => errors.push(value), setWorkingLabel: () => {},
    customCategoryForGuess: () => "gymnastics", normalizeCustomEventInformation: value => value?.kind === "information" ? value : null,
    withCalendarDate: (_intake, facts) => facts, CREATE_EXTRACTION_STAGE_LABELS: {},
    readCreateExtractionResponse: response => response.json(),
    fetch: async (url, options) => { requests.push({ url, options }); return Response.json({ information }); },
    persist: async next => { saves.push(next); return next; },
    openTemplate: async (...args) => { opened.push(args); },
    ...overrides,
  };
  return { env, intake, phases, errors, requests, saves, opened, run: new Function(...Object.keys(env), `${callback}\nreturn callback;`)(...Object.values(env)) };
}

test("existing extracted information opens its Live Card without another read", async () => {
  const state = fixture();
  state.intake.information = information;
  await state.run(template);
  assert.equal(state.requests.length, 0);
  assert.equal(state.opened.length, 1);
  assert.equal(state.opened[0][0], template);
  assert.equal(state.saves.length, 0);
});

test("sports alternate extracts facts only on click and retains the original source and shell", async () => {
  const state = fixture();
  assert.equal(state.requests.length, 0);
  await state.run(template);
  assert.equal(state.requests.length, 1);
  const submitted = JSON.parse(state.requests[0].options.body);
  assert.deepEqual(submitted, { sourceText: state.intake.sourceText, text: state.intake.source.text, category: "gymnastics" });
  assert.ok(submitted.sourceText.length > 12000, "long packets must remain complete");
  assert.equal(state.saves[0].source, state.intake.source);
  assert.equal(state.saves[0].discoveryEventId, "stored-sports-shell");
  assert.deepEqual(state.saves[0].information, information);
  assert.equal(state.opened[0][1], state.saves[0]);
  assert.equal(state.env.preparingLiveCard.current, null);
  assert.equal(state.env.submitting.current, false);
});

test("a failed alternate read leaves the sports source available for retry", async () => {
  const state = fixture({ fetch: async () => Response.json({ information: null }) });
  await state.run(template);
  assert.equal(state.opened.length, 0);
  assert.equal(state.saves.length, 0);
  assert.equal(state.phases.at(-1), "templates");
  assert.match(state.errors.at(-1), /source is kept; please retry/);
  assert.equal(state.env.current.current, state.intake);
  assert.equal(state.env.submitting.current, false);
});

test("cancelling alternate preparation never applies a late response", async () => {
  let release;
  const state = fixture({ fetch: () => new Promise(resolve => { release = resolve; }) });
  const work = state.run(template);
  assert.ok(state.env.preparingLiveCard.current);
  state.env.preparingLiveCard.current.abort();
  release(Response.json({ information }));
  await work;
  assert.equal(state.saves.length, 0);
  assert.equal(state.opened.length, 0);
  assert.deepEqual(state.errors, [""]);
  assert.equal(state.env.current.current.discoveryEventId, "stored-sports-shell");
});

test("changing the source while alternate facts load rejects the stale result", async () => {
  let release;
  const state = fixture({ fetch: () => new Promise(resolve => { release = resolve; }) });
  const work = state.run(template);
  state.env.epoch.current++;
  state.env.current.current = { id: "replacement-intake" };
  release(Response.json({ information }));
  await work;
  assert.equal(state.saves.length, 0);
  assert.equal(state.opened.length, 0);
  assert.equal(state.env.current.current.id, "replacement-intake");
});
