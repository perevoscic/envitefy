import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { signupFormHandoff } from "./signup-handoff.ts";

const routes = [
  "src/app/api/creation/intake/route.ts",
  "src/app/api/creation/intake/stream/route.ts",
  "src/app/api/concierge/message/route.ts",
  "src/app/api/concierge/events/[id]/message/route.ts",
];

function loadRoute(path) {
  const calls = [];
  const record = (name, result) => async (input) => {
    calls.push({ name, input });
    return typeof result === "function" ? result(input) : result;
  };
  const event = { id: "offline-event", user_id: "offline-owner", title: "September 23 Workshop", data: {} };
  const dependencies = {
    "next/server": { NextResponse: Response },
    "next-auth": { getServerSession: async () => ({ user: { id: "offline-owner" } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "offline-owner" },
    "@/lib/concierge/api-errors": { conciergeApiErrorMessage: (_error, fallback) => fallback },
    "@/lib/concierge/signup-handoff": { signupFormHandoff },
    "@/lib/concierge/generated-preview": { parseCreationGeneratedPreview: () => null },
    "@/lib/concierge/fallback": { buildAssistantMessage: record("fallback", "In this chat.") },
    "@/lib/concierge/copy-workflow": { nextPendingReply: () => null },
    "@/lib/concierge/intake": {
      creationSignupHandoff: () => null,
      handleCreationIntake: record("intake", { ok: true }),
      resolveCreationIntakeDraft: record("extract", { draft: {} }),
      finalizeCreationIntake: record("persist", { ok: true }),
    },
    "@/lib/concierge/persona": { streamConciergePersona: record("persona", { assistantMessage: "In this chat.", usedAi: false }) },
    "@/lib/concierge/weather-context": {
      resolveConciergeWeatherContextFromDraft: record("weather", null),
      resolveConciergeWeatherContextFromEvent: record("weather", null),
    },
    "@/lib/concierge/event-actions": {
      buildEventActionPlan: record("planner", { actions: [], assistantMessage: "In this chat." }),
      applyEventActions: record("apply", { event, assets: [], appliedActions: [] }),
    },
    "@/lib/concierge/event-storage": {
      getOrCreateEventThread: record("persist", { id: "offline-thread" }),
      appendConversationMessage: record("persist", null),
      touchConversationThread: record("persist", null),
      listConversationMessages: async () => [],
      listEventAssets: async () => [],
    },
    "@/lib/db": { getEventHistoryById: async () => event },
    "@/lib/server-timing": {
      isTimingRequested: () => false,
      createServerTimingTracker: () => ({ enabled: false, time: (_name, run) => run(), applyHeader: () => {} }),
    },
  };
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    assert.ok(name in dependencies, `Unexpected route dependency ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return { calls, POST: module.exports.POST };
}

for (const path of routes) {
  test(`${path}: oversized facts fail before any model, weather, intake or persistence call`, async () => {
    for (const action of ["message", "save"]) {
      const { POST, calls } = loadRoute(path);
      const response = await POST(new Request("http://localhost/offline-intake", {
        method: "POST",
        body: JSON.stringify({ action, message: `${"x".repeat(12000)} No open flames.`, ocrContext: { text: "September 23, 2026" } }),
      }), { params: Promise.resolve({ id: "offline-event" }) });
      assert.equal(response.status, 400);
      assert.equal(response.headers.get("content-type")?.startsWith("application/json"), true);
      assert.deepEqual(calls, [], "no partial extraction, response, event edits or writes");
      const body = await response.json();
      assert.equal(body.ok, false);
      assert.match(body.error, /12,000 characters/);
      assert.match(body.error, /split.*shorter messages/i);
    }
  });

  test(`${path}: an exactly 12000-character request reaches processing intact`, async () => {
    const { POST, calls } = loadRoute(path);
    const ending = " September 23, 2026. No open flames.";
    const message = `${"a".repeat(12000 - ending.length)}${ending}`;
    const response = await POST(new Request("http://localhost/offline-intake", {
      method: "POST", body: JSON.stringify({ message }),
    }), { params: Promise.resolve({ id: "offline-event" }) });
    await response.text();
    assert.equal(response.status, 200);
    const processing = calls.find(({ name }) => ["intake", "extract", "planner"].includes(name));
    assert.ok(processing);
    assert.equal(processing.input.request?.message ?? processing.input.message, message);
  });
}
