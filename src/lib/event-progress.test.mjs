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

const fallback = loadTs("src/lib/concierge/fallback.ts");
function fixture() {
  const sessions = new Map();
  let writes = 0;
  const storage = {
    async getCreationSession({ userId, sessionId }) {
      const row = sessions.get(sessionId);
      return row?.user_id === userId ? row : null;
    },
    async upsertCreationSession({ userId, draft, metadata }) {
      const existing = sessions.get(draft.creationSessionId);
      if (existing && existing.user_id !== userId)
        throw new Error("Creation session id is not available for this user.");
      const row = {
        id: draft.creationSessionId,
        user_id: userId,
        draft: structuredClone(draft),
        status: draft.draftStatus,
        metadata: { ...existing?.metadata, ...structuredClone(metadata) },
        created_at: "2026-09-09",
        updated_at: "2026-09-09",
      };
      sessions.set(row.id, row);
      writes++;
      return row;
    },
  };
  const intake = loadTs("src/lib/concierge/intake.ts", {
    "@/lib/db": {},
    "@/lib/dashboard-cache": {},
    "@/lib/history-cache": {},
    "./event-storage.ts": storage,
    "./assets.ts": {},
    "./history-payload.ts": {},
  });
  return {
    intake,
    sessions,
    get writes() {
      return writes;
    },
  };
}
const example = () =>
  fallback.fallbackExtractConciergeDraft({
    message:
      "Create a birthday live card for Maya turning 10 on September 26, 2028 at 3 pm at the garden. A space disco theme. No RSVP.",
    requestedOutputs: ["live_card"],
  });

test("ordinary intake turns remain in memory across every event category", async () => {
  const app = fixture();
  for (const category of [
    "birthday",
    "wedding",
    "baby shower",
    "gender reveal",
    "gymnastics meet",
    "community signup",
  ]) {
    const draft = fallback.fallbackExtractConciergeDraft({
      message: `Create a ${category} for October 10, 2028`,
      requestedOutputs: ["event_page"],
    });
    for (const persistSession of [undefined, false]) {
      const result = await app.intake.finalizeCreationIntake({
        userId: "owner",
        request: {
          message: category,
          persistSession,
          chatMessages: [{ role: "user", text: category }],
        },
        result: { draft },
      });
      assert.equal(result.ok, true);
      assert.equal(result.creationSession, null);
    }
  }
  assert.equal(app.writes, 0);
});

test("explicit save stores a single draft with artwork, conversation, and unsent text", async () => {
  const app = fixture();
  const draft = example();
  draft.explicitlyClearedFields = ["registryLink"];
  draft.titleConfirmed = false;
  draft.contextStartMessage = "This is Maya's event";
  draft.conversationState = {
    ...draft.conversationState,
    registrySkipped: true,
    finalSummaryShown: true,
  };
  draft.copyStatus = "ready";
  draft.previewCopy.body = "Join Maya among the stars. Bring your dancing shoes!";
  const studioInvite = {
    imageUrl: "https://example.com/maya.webp",
    invitationData: { title: "Maya turns 10" },
  };
  const input = {
    draft,
    studioInvite,
    composerText: "Please add parking",
    pendingUpload: {
      url: "https://example.com/source.pdf",
      name: "source.pdf",
      type: "application/pdf",
      source: "upload",
    },
    chatMessages: [
      { role: "user", text: "Make it a space disco", createdAt: "2026-09-09T00:00:00Z" },
    ],
  };
  const saved = await app.intake.saveCreationDraft("owner", input);
  assert.equal(saved.id, draft.creationSessionId);
  assert.deepEqual(saved.metadata.generatedPreview, studioInvite);
  assert.equal(saved.metadata.composerText, input.composerText);
  assert.deepEqual(saved.metadata.pendingUpload, input.pendingUpload);
  assert.deepEqual(saved.metadata.chatMessages, input.chatMessages);
  assert.equal(saved.metadata.explicitlySaved, true);
  assert.deepEqual(saved.draft.explicitlyClearedFields, draft.explicitlyClearedFields);
  assert.deepEqual(saved.draft.conversationState, draft.conversationState);
  assert.equal(saved.draft.titleConfirmed, false);
  assert.equal(saved.draft.contextStartMessage, draft.contextStartMessage);
  assert.equal(saved.draft.previewCopy.body, draft.previewCopy.body);
  await app.intake.saveCreationDraft("owner", { ...input, composerText: "Updated note" });
  assert.equal(app.sessions.size, 1);
  assert.equal(app.writes, 2);
});

test("draft saves reject foreign identities, published events and temporary previews", async () => {
  const app = fixture();
  const draft = example();
  await app.intake.saveCreationDraft("owner", { draft });
  await assert.rejects(app.intake.saveCreationDraft("intruder", { draft }), /not available/);
  for (const status of ["published", "publishing"]) {
    app.sessions.get(draft.creationSessionId).status = status;
    await assert.rejects(app.intake.saveCreationDraft("owner", { draft }), /already published/);
  }
  app.sessions.get(draft.creationSessionId).status = "preview_ready";
  await assert.rejects(
    app.intake.saveCreationDraft("owner", {
      draft,
      studioInvite: { imageUrl: "blob:temporary", invitationData: { title: "Draft" } },
    }),
    /preview/,
  );
  assert.equal(app.writes, 1);
});

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
