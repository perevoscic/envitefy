import assert from "node:assert/strict";
import test from "node:test";
import { readIntakeResponse } from "./lib/create-campaign-browser.mjs";

test("stream evidence keeps actual assistant text and AI/fallback provenance alongside final facts", () => {
  const response = [
    'event: assistant_delta\ndata: {"text":"Hi"}',
    'event: assistant_done\ndata: {"assistantMessage":"Hello Nora","usedAi":true}',
    'event: state\ndata: {"ok":true,"draft":{"title":"Nora birthday"}}',
    'event: done\ndata: {"ok":true}',
  ].join("\n\n");
  assert.deepEqual(readIntakeResponse(response), { ok: true, assistantMessage: "Hello Nora", usedAi: true, draft: { title: "Nora birthday" } });
});

test("stream and nonstream failures cannot become a completed conversation", () => {
  assert.equal(readIntakeResponse('event: error\ndata: {"error":"Budget exhausted"}\n\n').error, "Budget exhausted");
  assert.equal(readIntakeResponse('{"ok":false,"error":"Unauthorized"}').ok, false);
  assert.equal(readIntakeResponse("bad response").error, "Invalid intake response");
});
