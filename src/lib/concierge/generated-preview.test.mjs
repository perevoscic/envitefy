import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { parseCreationGeneratedPreview } from "./generated-preview.ts";
import { persistDraftPreview } from "../../app/chat/draft-preview-storage.ts";

function loadModule(relativePath, dependencies) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    module,
    module.exports,
  );
  return module.exports;
}

const preview = {
  imageUrl: "https://example.com/generated/livia.png",
  invitationData: {
    title: "Livia is turning 10",
    theme: { primaryColor: "#685bdb" },
    eventDetails: { date: "2099-09-26", time: "15:00", rsvpEnabled: false },
  },
};

function fixture() {
  let signedInUserId = "owner";
  let failWrites = false;
  let writes = 0;
  const row = {
    id: "session_livia",
    user_id: "owner",
    status: "preview_ready",
    draft: { creationSessionId: "session_livia", draftStatus: "preview_ready", requestedOutputs: ["live_card"] },
    active_context: { route: "/chat" },
    source_context: {},
    metadata: { canPersist: true, chatMessages: [{ role: "user", text: "Livia is turning 10" }] },
  };
  const storage = loadModule("./event-storage.ts", {
    "@/lib/db": {
      async query(sql, values) {
        if (sql.includes("create table") || sql.includes("create index")) return { rows: [] };
        if (sql.includes("update creation_sessions")) {
          if (failWrites) throw new Error("Database unavailable");
          assert.match(sql, /where id = \$1 and user_id = \$2/);
          assert.match(sql, /status not in \('published', 'publishing'\)/);
          assert.match(sql, /not \(metadata \? 'savedEventId'\)/);
          assert.doesNotMatch(sql, /set status|draft =/);
          if (values[0] !== row.id || values[1] !== row.user_id ||
              ["published", "publishing"].includes(row.status) || row.metadata.savedEventId) {
            return { rows: [] };
          }
          row.metadata = { ...row.metadata, ...JSON.parse(values[2]) };
          writes += 1;
          return { rows: [structuredClone(row)] };
        }
        if (sql.includes("from creation_sessions")) {
          const owned = values.length === 1
            ? values[0] === row.user_id
            : values[0] === row.id && values[1] === row.user_id;
          return { rows: owned ? [structuredClone(row)] : [] };
        }
        assert.fail(`Preview persistence must not create an event: ${sql}`);
      },
    },
    "./fallback.ts": { repairMisparsedBirthdayDraft: (draft) => draft },
  });
  const intake = loadModule("./intake.ts", {
    "@/lib/dashboard-cache": {},
    "@/lib/db": {},
    "@/lib/history-cache": {},
    "./assets.ts": {},
    "./event-storage.ts": storage,
    "./extract.ts": {},
    "./generated-preview.ts": { parseCreationGeneratedPreview },
    "./fallback.ts": {
      buildAssistantMessage: () => "Ready to continue.",
      buildSuggestedReplies: () => [],
      canSaveConciergeDraft: () => true,
    },
    "./history-payload.ts": {},
  });
  const route = loadModule("../../app/api/creation/intake/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "next-auth": { getServerSession: async () => ({ user: { id: signedInUserId } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => signedInUserId },
    "@/lib/concierge/api-errors": { conciergeApiErrorMessage: (_error, fallback) => fallback },
    "@/lib/concierge/intake": intake,
    "@/lib/concierge/generated-preview": { parseCreationGeneratedPreview },
    "@/lib/server-timing": {
      isTimingRequested: () => false,
      createServerTimingTracker: () => ({ enabled: false, time: (_name, work) => work(), applyHeader() {} }),
    },
  });
  const save = (overrides = {}) => route.PATCH(new Request("http://localhost/api/creation/intake", {
    method: "PATCH",
    body: JSON.stringify({
      creationSessionId: row.id,
      studioInvite: preview,
      chatMessages: [{ role: "assistant", text: "Your live card is generated." }],
      ...overrides,
    }),
  }));
  const reopen = (query = `?threadId=${row.id}`) => route.GET(new Request(`http://localhost/api/creation/intake${query}`));
  return { row, save, reopen, get writes() { return writes; }, signIn: (id) => { signedInUserId = id; }, failWrites: (fail) => { failWrites = fail; } };
}

test("generated artwork and invitation metadata survive saving and reopening the draft", async () => {
  const app = fixture();
  const originalDraft = structuredClone(app.row.draft);
  assert.equal((await app.save()).status, 200);
  for (const query of ["?threadId=session_livia", ""]) {
    const restored = await (await app.reopen(query)).json();
    assert.deepEqual(restored.studioInvite, preview);
    assert.equal(restored.chatMessages.at(-1).text, "Your live card is generated.");
    assert.equal(restored.savedEventId, null);
    assert.deepEqual(restored.draft, originalDraft);
  }
  assert.equal(app.row.status, "preview_ready");
  assert.equal(app.row.metadata.canPersist, true);
});

test("edits replace the saved preview and preserve unrelated session metadata", async () => {
  const app = fixture();
  await app.save();
  const edited = { ...preview, imageUrl: "https://example.com/generated/livia-edited.png" };
  await app.save({ studioInvite: edited });
  const reopened = await (await app.reopen()).json();
  assert.deepEqual(reopened.studioInvite, edited);
  assert.equal(app.row.metadata.canPersist, true);
  assert.equal(app.writes, 2);
});

test("legacy drafts without an image still reopen without a preview", async () => {
  const app = fixture();
  const reopened = await (await app.reopen()).json();
  assert.equal(reopened.studioInvite, null);
  assert.equal(reopened.draft.creationSessionId, app.row.id);
});

test("preview writes require the signed-in owner and an unpublished draft", async () => {
  const app = fixture();
  app.signIn(null);
  assert.equal((await app.save()).status, 401);
  app.signIn("someone-else");
  assert.equal((await app.save({ userId: "owner" })).status, 409);
  assert.equal((await (await app.reopen()).json()).draft, null);
  app.signIn("owner");
  for (const status of ["published", "publishing"]) {
    app.row.status = status;
    assert.equal((await app.save()).status, 409);
  }
  app.row.status = "preview_ready";
  app.row.metadata.savedEventId = "published-event";
  assert.equal((await app.save()).status, 409);
  assert.equal(app.writes, 0);
});

test("temporary images and malformed payloads cannot be reported as saved previews", async () => {
  const app = fixture();
  for (const imageUrl of ["", "blob:http://localhost/image", "data:image/png;base64,AA==", "javascript:alert(1)"]) {
    assert.equal((await app.save({ studioInvite: { ...preview, imageUrl } })).status, 400);
  }
  assert.equal((await app.save({ studioInvite: { imageUrl: preview.imageUrl } })).status, 400);
  assert.equal(app.writes, 0);
});

test("a failed save leaves the prior preview intact and can be retried without generation", async () => {
  const app = fixture();
  await app.save();
  const edited = { ...preview, imageUrl: "https://example.com/generated/new.png" };
  app.failWrites(true);
  assert.equal((await app.save({ studioInvite: edited })).status, 500);
  assert.deepEqual((await (await app.reopen()).json()).studioInvite, preview);
  app.failWrites(false);
  assert.equal((await app.save({ studioInvite: edited })).status, 200);
  assert.deepEqual((await (await app.reopen()).json()).studioInvite, edited);
});

test("the client saves through PATCH and surfaces failed persistence", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, ...options });
    return Response.json({ ok: requests.length > 1 }, { status: requests.length > 1 ? 200 : 503 });
  });
  const request = { creationSessionId: "session_livia", studioInvite: preview, chatMessages: [] };
  await assert.rejects(persistDraftPreview(request));
  await persistDraftPreview(request);
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.url, "/api/creation/intake");
    assert.equal(request.method, "PATCH");
    assert.equal(request.credentials, "include");
    assert.deepEqual(JSON.parse(request.body).studioInvite, preview);
  }
});
