import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { artworkCheckDeps, verifyStudioArtwork } from "./output-checks.ts";

const event = { title: "Livia is turning 10", category: "Birthday", links: [] };
const context = { imageEdit: { sourceImageDataUrl: "data:image/png;base64,c291cmNl", editInstruction: "NO band memebrer, maket erhe text to bu cursvie in Livia is trunin 10" } };
test.afterEach(() => mock.restoreAll());

async function check(requestedChangesApplied, inspect = () => {}) {
  const savedKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  mock.method(artworkCheckDeps, "resolveStudioSourceImage", async () => ({ mimeType: "image/png", data: "c291cmNl" }));
  mock.method(artworkCheckDeps, "createClient", () => ({ chat: { completions: { create: async (request) => {
    inspect(request);
    return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ visibleText: ["Livia is turning 10"], issues: [], repairInstructions: [], requestedChangesApplied }) } }] };
  } } } }));
  try { return await verifyStudioArtwork("data:image/png;base64,cmVzdWx0", event, "live_card", context); }
  finally {
    if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = savedKey;
  }
}

test("readable artwork still fails when the requested subject removal or cursive change was not applied", async () => {
  const result = await check(false, (request) => {
    const input = JSON.parse(request.messages[1].content[0].text);
    assert.equal(input.requiredVisualChanges.length, 2);
    assert.match(input.requiredVisualChanges[0], /member photos on posters or album covers/);
    assert.match(input.requiredVisualChanges[1], /entire birthday headline.*cursive/);
    assert.match(request.messages[0].content, /even if it was already present in the source/);
    assert.match(request.messages[0].content, /overlay the bottom edge/);
  });
  assert.equal(result.status, "failed");
  assert.deepEqual(result.issues, ["requested_change_not_applied"]);
});

test("an edit with every requested visual change applied can pass", async () => {
  assert.deepEqual(await check(true), { status: "passed", issues: [], repairInstructions: [] });
});
