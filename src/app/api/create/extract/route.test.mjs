import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const parsed = ts.createSourceFile("route.ts", source, ts.ScriptTarget.Latest, true);
const declaration = parsed.statements.find(node => node.name?.text === "POST");
const compiled = ts.transpileModule(`${declaration.getText(parsed)}\nreturn POST;`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
class CreateSourceError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const classification = { category: "sports", sport: "gymnastics", confidence: "high", alternatives: [] };
const evidence = { text: "Gymnastics meet October 25, Session 1 at 9 AM", images: [], pageCount: 1 };
function endpoint(overrides = {}) {
  const dependencies = {
    json: (body, status = 200) => Response.json(body, { status }), requests: new Map(),
    getServerSession: async () => ({}), authOptions: {}, resolveSessionUserId: async () => "host-1",
    requireCreationAccess: async () => {}, creationAccessErrorResponse: () => null,
    customEventCategory: value => value || null, customCategoryForGuess: () => "gymnastics",
    validDiscoveryIntakeKey: value => typeof value === "string" && value.length >= 8 ? value : null,
    sportsGuessForExtraction: () => classification, CreateSourceError,
    prepareSportsSourceIntake: async () => "stored-meet",
    extractCreateInformation: async (_input, _signal, authorize, options) => {
      options.onStage?.("reading");
      if (!await authorize(classification)) return { classification, sourceText: evidence.text, accessRequired: true };
      const discoveryEventId = await options.prepareSports?.(evidence, classification);
      return { classification, sourceText: evidence.text, discoveryEventId };
    }, ...overrides,
  };
  return new Function("exports", ...Object.keys(dependencies), compiled)({}, ...Object.values(dependencies));
}

test("one multipart request streams real stages and returns its retained sports identity", async () => {
  let stored = 0;
  const post = endpoint({ prepareSportsSourceIntake: async params => {
    stored++;
    assert.equal(params.userId, "host-1");
    assert.equal(params.clientIntakeId, "intake-1234");
    assert.equal(params.source, evidence);
    assert.equal(await params.files[0].text(), "original uploaded file bytes");
    params.onStage("storing_source");
    return "stored-meet";
  } });
  const form = new FormData();
  form.set("file", new File(["original uploaded file bytes"], "meet.pdf", { type: "application/pdf" }));
  form.set("clientIntakeId", "intake-1234");
  const response = await post(new Request("https://envitefy.com/api/create/extract", { method: "POST", headers: { Accept: "application/x-ndjson" }, body: form }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/x-ndjson/);
  const messages = (await response.text()).trim().split("\n").map(line => JSON.parse(line));
  assert.deepEqual(messages.slice(0, 2), [{ stage: "reading" }, { stage: "storing_source" }]);
  assert.equal(messages.at(-1).result.discoveryEventId, "stored-meet");
  assert.equal(stored, 1);
});

test("legacy JSON readers keep their response shape and do not create sports shells", async () => {
  const post = endpoint({ prepareSportsSourceIntake: async () => { throw new Error("Unexpected shell"); } });
  const response = await post(new Request("https://envitefy.com/api/create/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: evidence.text }) }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).classification.sport, "gymnastics");
});

test("stream failures retain retry guidance and never expose internal errors", async () => {
  const post = endpoint({ extractCreateInformation: async (_input, _signal, _authorize, options) => { options.onStage("classifying"); throw new Error("private provider details"); } });
  const response = await post(new Request("https://envitefy.com/api/create/extract", { method: "POST", headers: { "content-type": "application/json", Accept: "application/x-ndjson" }, body: JSON.stringify({ text: evidence.text }) }));
  const body = await response.text();
  assert.match(body, /files and notes are kept; please retry/);
  assert.doesNotMatch(body, /private provider details/);
});

test("lazy alternate outputs accept full retained source text without granting it trusted-document status", async () => {
  const retained = "Session and spectator information. ".repeat(1000);
  let calls = 0;
  const post = endpoint({ extractCreateInformation: async input => { calls++; assert.equal(input.sourceText, retained); return { classification, sourceText: retained }; } });
  const request = clientIntakeId => new Request("https://envitefy.com/api/create/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceText: retained, category: "gymnastics", clientIntakeId }) });
  assert.equal((await post(request())).status, 200);
  assert.equal((await post(request("forged-intake-key"))).status, 400);
  assert.equal(calls, 1);
});
