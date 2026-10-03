import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();
function loadTs(relative, mocks = {}, cache = new Map()) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith(".json")) return JSON.parse(readFileSync(file, "utf8"));
  const module = { exports: {} };
  cache.set(file, module);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const resolve = (name) => {
    if (name in mocks) return mocks[name];
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/")
      ? path.join(root, "src", name.slice(2))
      : path.resolve(path.dirname(file), name);
    const resolved = [
      base,
      ...[".ts", ".tsx", ".mjs", ".js", ".json"].map((ext) => base + ext),
    ].find((candidate) => existsSync(candidate));
    if (!resolved) throw new Error(`Missing ${name} from ${file}`);
    return loadTs(resolved, mocks, cache);
  };
  new Function("require", "module", "exports", source)(resolve, module, module.exports);
  return module.exports;
}

test("manual draft saves preserve incomplete fields and use only known editor routes", async (t) => {
  const { saveManualEventProgress, manualEventEditHref } = loadTs(
    "src/lib/manual-event-progress.ts",
  );
  const writes = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const body = JSON.parse(options.body);
    writes.push({ url, body });
    return Response.json({ id: "saved-manual", ...body });
  });
  globalThis.window = { dispatchEvent() {} };
  t.after(() => {
    delete globalThis.window;
  });
  const snapshot = {
    data: { title: "Half finished", date: "", time: "", details: "My unfinished notes" },
    advancedState: { speakers: ["Sam"] },
    themeId: "rose",
  };
  const id = await saveManualEventProgress({
    snapshot,
    path: "/event/workshops/customize",
    category: "Workshops",
    clientDraftId: "stable-id",
  });
  const data = writes[0].body.data;
  assert.equal(id, "saved-manual");
  assert.equal(data.status, "draft");
  assert.equal(data.startISO, null);
  assert.equal(data.endISO, null);
  assert.deepEqual(data.manualEditor.snapshot, snapshot);
  assert.equal(manualEventEditHref(id, data), "/event/workshops/customize?edit=saved-manual");
  assert.equal(manualEventEditHref(id, { manualEditor: { path: "https://bad.example" } }), null);
  assert.equal(writes.length, 1);
});

test("a failed manual save rejects instead of allowing navigation", async (t) => {
  const { saveManualEventProgress } = loadTs("src/lib/manual-event-progress.ts");
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Try again" }, { status: 503 }),
  );
  await assert.rejects(
    saveManualEventProgress({
      snapshot: { data: { title: "Still here" } },
      path: "/event/general/customize",
      category: "General",
      clientDraftId: "stable-id",
    }),
    /Try again/,
  );
});

test("manual draft saves retain PDF attachments and recover an earlier POST identity", async (t) => {
  const { saveManualEventProgress } = loadTs("src/lib/manual-event-progress.ts");
  const writes = [];
  const uploaded = "https://example.com/schedule.pdf";
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "blob:local-pdf") return new Response(new Blob(["%PDF-test"], { type: "application/pdf" }));
    if (url === "/api/upload") {
      assert.equal(options.body.get("usage"), "attachment");
      assert.equal(options.body.get("uploadToken"), "manual-stable-id");
      assert.equal(options.body.get("file").type, "application/pdf");
      return Response.json({ ok: true, stored: { source: { url: uploaded } } });
    }
    if (!options.method) return Response.json({ id: "same-event", data: { status: "draft" } });
    const body = JSON.parse(options.body);
    writes.push({ url, method: options.method, body });
    return Response.json({ id: "same-event", ...(options.method === "PATCH" ? body : {}) });
  });
  globalThis.window = { dispatchEvent() {} };
  t.after(() => { delete globalThis.window; });
  const id = await saveManualEventProgress({
    snapshot: { title: "Newer title", headerPreviewUrl: "blob:local-pdf", accessCode: "private-code" },
    path: "/event/manual",
    category: "General",
    clientDraftId: "stable-id",
  });
  assert.equal(id, "same-event");
  assert.deepEqual(writes.map((write) => write.method), ["POST", "PATCH"]);
  assert.equal(writes[1].body.data.manualEditor.snapshot.headerPreviewUrl, uploaded);
  assert.equal(writes[1].body.data.manualEditor.snapshot.title, "Newer title");
  assert.equal(writes[1].body.data.accessCode, undefined);
});

test("published manual details stay live while a new editing snapshot is saved", async (t) => {
  const { saveManualEventProgress } = loadTs("src/lib/manual-event-progress.ts");
  const published = {
    title: "Original title",
    status: "published",
    startISO: "2028-10-10T15:00:00Z",
    rsvpResponses: ["retained"],
  };
  let saved;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    if (!options.method) return Response.json({ id: "event", data: published });
    saved = JSON.parse(options.body);
    return Response.json({ id: "event", ...saved });
  });
  globalThis.window = { dispatchEvent() {} };
  t.after(() => {
    delete globalThis.window;
  });
  await saveManualEventProgress({
    eventId: "event",
    snapshot: { data: { title: "New title" } },
    path: "/event/general/customize",
    category: "General",
    clientDraftId: "stable-id",
  });
  assert.equal(saved.data.title, published.title);
  assert.equal(saved.data.status, "published");
  assert.deepEqual(saved.data.rsvpResponses, published.rsvpResponses);
  assert.equal(saved.data.manualEditor.snapshot.data.title, "New title");
});
