import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as signupHandoff from "./signup-handoff.ts";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
const { signupFormHandoff } = signupHandoff;

function loadModule(path, dependencies, effects) {
  const compiled = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)((name) => dependencies[name] || new Proxy({}, {
    get: (_target, key) => () => { effects.push(`${name}.${String(key)}`); throw new Error("Unexpected provider or storage call"); },
  }), module, module.exports);
  return module.exports;
}

const message = "Create a volunteer sign-up form for September 23, 2026.";
function harness(extract) {
  const effects = [];
  const intake = loadModule("src/lib/concierge/intake.ts", {
    "./signup-handoff.ts": signupHandoff,
    "./fallback.ts": { fallbackExtractConciergeDraft },
    ...(extract ? { "./extract.ts": { extractConciergeDraft: extract } } : {}),
  }, effects);
  const dependencies = {
    "next/server": { NextResponse: Response },
    "next-auth": { getServerSession: async () => ({ user: { id: "offline-owner" } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "offline-owner" },
    "@/lib/concierge/api-errors": { conciergeApiErrorMessage: (_error, fallback) => fallback },
    "@/lib/concierge/intake": intake,
    "@/lib/concierge/signup-handoff": { signupFormHandoff },
    "@/lib/server-timing": { isTimingRequested: () => false, createServerTimingTracker: () => ({ enabled: false, time: (_name, run) => run(), applyHeader: () => {} }) },
  };
  return { effects, intake, dependencies };
}

function eventDraft() {
  return fallbackExtractConciergeDraft({ message: "Create an event page for Nora's birthday on September 23, 2026 at 2 PM at Maple Hall, Austin, TX." });
}

test("intake resolve, handle and finalize return handoff without extraction, provider or persistence", async () => {
  const { intake, effects } = harness();
  const draft = eventDraft();
  const before = structuredClone(draft);
  const request = { message, draft, creationSessionId: "do-not-replace-id", persistSession: true, requestedOutputs: ["signup_form"] };
  for (const response of [
    await intake.resolveCreationIntakeDraft({ request }),
    await intake.handleCreationIntake({ userId: "offline-owner", request }),
    await intake.finalizeCreationIntake({ userId: "offline-owner", request, result: { draft: { ...draft, title: "Do not apply this candidate" } }, assistantMessageOverride: "Do not use this candidate reply" }),
  ]) {
    assert.strictEqual(response.draft, draft);
    assert.equal(response.assistantMessage, signupFormHandoff(message));
    assert.equal(response.canSave, false);
  }
  assert.deepEqual(draft, before);
  assert.deepEqual(effects, []);
});

test("legacy selectors and resolved model signup types hand off before persona or persistence", async () => {
  for (const selection of [{ requestedOutputs: ["signup_form"] }, { starterCategory: "Sign-up Form" }, { activeContext: { selectedCategory: "Smart Sign-up" } }]) {
    const { intake, effects } = harness();
    const result = await intake.handleCreationIntake({ userId: "offline-owner", request: { message: "September 23, 2026", persistSession: true, ...selection } });
    assert.equal(result.assistantMessage, signupFormHandoff(message));
    assert.equal(result.draft.eventType, "unknown");
    assert.deepEqual(result.draft.requestedOutputs, []);
    assert.deepEqual(effects, []);
  }
  for (const resultKind of ["signup_draft", "already_guarded_reply"]) {
    const existing = eventDraft();
    let extractions = 0;
    const { intake, effects, dependencies } = harness(async () => {
      extractions += 1;
      return resultKind === "signup_draft"
        ? { draft: { ...existing, eventType: "smart_signup", requestedOutputs: ["signup_form"] } }
        : { draft: existing, assistantMessage: signupFormHandoff(message), suggestedReplies: [], canSave: false, usedAi: true };
    });
    const request = { message: "Coordinate the class helpers.", draft: existing, persistSession: true };
    const response = await intake.handleCreationIntake({ userId: "offline-owner", request });
    assert.strictEqual(response.draft, existing);
    assert.equal(response.assistantMessage, signupFormHandoff(message));
    const route = loadModule("src/app/api/creation/intake/stream/route.ts", dependencies, effects);
    const streamed = await route.POST(new Request("http://localhost/offline-resolved-form", { method: "POST", body: JSON.stringify(request) }));
    const body = await streamed.text();
    assert.equal(streamed.status, 200);
    assert.match(body, /\/signup-forms\/templates/);
    assert.doesNotMatch(body, /event: error/);
    assert.equal(extractions, 2);
    assert.deepEqual(effects, []);
  }
});

test("save actions retain legacy signup data and bypass the handoff", async () => {
  const { intake, effects } = harness();
  const draft = { ...eventDraft(), eventType: "smart_signup", requestedOutputs: ["signup_form"] };
  const request = { action: "save", message, draft };
  assert.equal(intake.creationSignupHandoff(request), null);
  const resolved = await intake.resolveCreationIntakeDraft({ request });
  assert.strictEqual(resolved.draft, draft);
  assert.deepEqual(effects, []);
});

for (const path of ["src/app/api/creation/intake/route.ts", "src/app/api/concierge/message/route.ts", "src/app/api/creation/intake/stream/route.ts"]) {
  test(`${path}: actual signup handoff preserves an existing generated draft and never processes it`, async () => {
    for (const draft of [null, { ...eventDraft(), draftStatus: "preview_ready" }]) {
      const { effects, dependencies } = harness();
      const route = loadModule(path, dependencies, effects);
      const response = await route.POST(new Request("http://localhost/offline-signup", {
        method: "POST", body: JSON.stringify({ message, draft, persistSession: true, studioInvite: { imageUrl: "/accepted.webp" } }),
      }));
      assert.equal(response.status, 200);
      const text = await response.text();
      const payload = path.includes("/stream/") ? JSON.parse(text.match(/event: state\ndata: ([^\n]+)/)?.[1] || "null") : JSON.parse(text);
      assert.equal(payload.assistantMessage, signupFormHandoff(message));
      assert.equal(payload.canSave, false);
      if (draft) assert.deepEqual(payload.draft, JSON.parse(JSON.stringify(draft)));
      else {
        assert.equal(payload.draft.eventType, "unknown");
        assert.equal(payload.draft.canPersist, false);
        assert.deepEqual(payload.draft.requestedOutputs, []);
      }
      assert.deepEqual(effects, []);
      if (path.includes("/stream/")) assert.doesNotMatch(text, /event: error/);
    }
  });
}

test("saved-event route and action planner hand off without edits, history writes or providers", async () => {
  const { effects, dependencies } = harness();
  const event = { id: "saved-event", title: "September 23 Birthday", user_id: "offline-owner", data: { startISO: "2026-09-23T19:00:00Z", acceptedImage: "/accepted.webp" } };
  const assets = [{ id: "accepted-asset", imageUrl: "/accepted.webp" }];
  const route = loadModule("src/app/api/concierge/events/[id]/message/route.ts", {
    ...dependencies,
    "@/lib/db": { getEventHistoryById: async () => event },
    "@/lib/concierge/event-storage": new Proxy({ listEventAssets: async () => assets }, {
      get: (target, key) => target[key] || (() => { effects.push(`storage.${String(key)}`); throw new Error("Unexpected write"); }),
    }),
  }, effects);
  const response = await route.POST(new Request("http://localhost/offline-saved-event", { method: "POST", body: JSON.stringify({ message }) }), { params: Promise.resolve({ id: event.id }) });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(result.event, { id: event.id, title: event.title, data: event.data });
  assert.deepEqual(result.assets, assets);
  assert.deepEqual(result.actions, []);
  assert.equal(result.assistantMessage, signupFormHandoff(message));
  const actions = loadModule("src/lib/concierge/event-actions.ts", { "./signup-handoff.ts": { signupFormHandoff } }, effects);
  const plan = await actions.buildEventActionPlan({ message, event, assets, history: [] });
  assert.deepEqual(plan, { actions: [], assistantMessage: signupFormHandoff(message), suggestedReplies: [] });
  assert.deepEqual(effects, []);
});
