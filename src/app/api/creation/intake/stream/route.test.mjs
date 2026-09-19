import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
import { streamConciergePersona } from "../../../../../lib/concierge/persona.ts";
import { fallbackExtractConciergeDraft } from "../../../../../lib/concierge/fallback.ts";

test("the actual intake stream gives the persona the previous state and returns the guarded reply", async () => {
  const draft = fallbackExtractConciergeDraft({ message: "Create an Event Page for Rivera Workshop on September 23, 2026 at 2 PM at Maple Center, Austin, TX." });
  let finalized;
  let receipt;
  const deps = {
    "next-auth": { getServerSession: async () => ({ user: { id: "offline-owner" } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "offline-owner" },
    "@/lib/concierge/api-errors": { conciergeApiErrorMessage: error => error.message },
    "@/lib/concierge/fallback": { buildAssistantMessage: () => "The details are in this chat." },
    "@/lib/concierge/copy-workflow": { nextPendingReply: () => null },
    "@/lib/concierge/intake": {
      creationSignupHandoff: () => null,
      resolveCreationIntakeDraft: async () => ({ draft: structuredClone(draft) }),
      finalizeCreationIntake: async input => { finalized = input; return { ok: true, draft: input.result.draft, assistantMessage: input.assistantMessageOverride }; },
    },
    "@/lib/concierge/persona": { streamConciergePersona: params => streamConciergePersona(params, {
      openAiApiKey: "offline-test-key",
      createOpenAiClient: () => ({ chat: { completions: { create: async request => {
        receipt = JSON.parse(request.messages.at(-1).content).turnReceipt;
        return (async function* () {
          for (const content of ["I've sa", "ved your event. ", "I changed the title."]) yield { choices: [{ delta: { content } }] };
        })();
      } } } }),
    }) },
    "@/lib/concierge/weather-context": { resolveConciergeWeatherContextFromDraft: async () => null },
    "@/lib/server-timing": { isTimingRequested: () => false, createServerTimingTracker: () => ({ enabled: false, time: (_name, run) => run() }) },
  };
  const compiled = ts.transpileModule(fs.readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(name => {
    assert.ok(name in deps, `Unexpected route dependency ${name}`);
    return deps[name];
  }, module, module.exports);
  const response = await module.exports.POST(new Request("http://localhost/api/creation/intake/stream", {
    method: "POST", body: JSON.stringify({ message: "Keep the current details.", draft }),
  }));
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.equal(receipt.hasPreviousDraft, true);
  assert.deepEqual(receipt.changedFields, []);
  assert.equal(receipt.persistence, "in_memory");
  assert.doesNotMatch(body, /I've saved|I changed the title|event: error/);
  assert.match(body, /in this chat/);
  assert.match(body, /unchanged/);
  assert.equal(finalized.request.action, "message");
  assert.doesNotMatch(finalized.assistantMessageOverride, /I've saved|I changed the title/);
  assert.match(body, /event: state/);
});
