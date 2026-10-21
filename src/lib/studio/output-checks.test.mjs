import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { artworkCheckDeps, verifyStudioArtwork } from "./output-checks.ts";

const event = { title: "Livia is turning 10", category: "Birthday", links: [] };
const context = { imageEdit: { sourceImageDataUrl: "data:image/png;base64,c291cmNl", editInstruction: "NO band memebrer, maket erhe text to bu cursvie in Livia is trunin 10" } };
test.afterEach(() => mock.restoreAll());

async function checkPayload(payload, inspect = () => {}, verificationContext = context) {
  const savedKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  mock.method(artworkCheckDeps, "resolveStudioSourceImage", async () => ({ mimeType: "image/png", data: "c291cmNl" }));
  mock.method(artworkCheckDeps, "createClient", () => ({ chat: { completions: { create: async (request) => {
    inspect(request);
    return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(payload) } }] };
  } } } }));
  try { return await verifyStudioArtwork("data:image/png;base64,cmVzdWx0", event, "live_card", verificationContext); }
  finally {
    if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = savedKey;
  }
}

function check(requestedChangesApplied, inspect = () => {}, verificationContext = context) {
  return checkPayload({ visibleText: ["Livia is turning 10"], issues: [], repairInstructions: [], requestedChangesApplied }, inspect, verificationContext);
}

test("guided background check passes without inspecting artwork wording, design direction or source edits", async () => {
  let calls = 0;
  const result = await checkPayload({ issues: [], repairInstructions: [] }, (request) => {
    calls++;
    assert.equal(request.response_format.json_schema.name, "guided_background_safety_v1");
    const schema = request.response_format.json_schema.schema;
    assert.deepEqual(schema.properties.issues.items.enum, ["safety_mismatch"]);
    assert.equal(schema.properties.visibleText, undefined);
    assert.equal(schema.properties.requestedChangesApplied, undefined);
    const input = JSON.parse(request.messages[1].content[0].text);
    assert.equal(input.approvedArtworkText, undefined);
    assert.equal(input.visualDirection, undefined);
    assert.equal(input.requiredVisualChanges, undefined);
    assert.equal(request.messages[1].content.filter((item) => item.type === "image_url").length, 1);
    const prompt = request.messages[0].content;
    assert.match(prompt, /pornography or explicit sexual content, nudity, violent acts or graphic injuries, or profanity/);
    assert.match(prompt, /regardless of the supplied brief/);
    assert.match(prompt, /Ordinary dresses, swimwear/);
    assert.match(prompt, /benign sports, costumes and props without visible violent acts are allowed/);
    assert.match(prompt, /incidental nonprofane text, painted controls and disagreement with a design brief are not safety issues/);
    assert.match(prompt, /do not transcribe or compare event wording/);
  }, {
    safetyOnly: true,
    ...context,
    layeredLettering: true,
    guidance: { visualDirection: "Require another color and remove every incidental sign." },
    references: [{ mimeType: "image/png", data: "cmVmZXJlbmNl" }],
  });
  assert.equal(calls, 1);
  assert.equal(artworkCheckDeps.resolveStudioSourceImage.mock.callCount(), 0);
  assert.deepEqual(result, { status: "passed", issues: [], repairInstructions: [] });
});

for (const prohibited of ["pornography", "nudity", "violence", "profanity"]) {
  test(`guided background check retains an observed ${prohibited} rejection`, async () => {
    const instructions = [`Remove the observed ${prohibited} in the center of the background.`];
    const result = await checkPayload({ issues: ["safety_mismatch"], repairInstructions: instructions }, () => {}, { safetyOnly: true });
    assert.deepEqual(result, { status: "failed", issues: ["safety_mismatch"], repairInstructions: instructions });
  });
}

test("guided safety schema rejects a checker response that tries to gate style", async () => {
  const result = await checkPayload({ issues: ["style_mismatch"], repairInstructions: ["Change the palette."] }, () => {}, { safetyOnly: true });
  assert.deepEqual(result, { status: "unavailable", issues: [], unavailableReason: "invalid_response" });
});

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

test("lettering checks require concrete obstruction evidence and preserve approved background objects", async () => {
  const result = await check(true, (request) => {
    const input = JSON.parse(request.messages[1].content[0].text);
    assert.equal(input.contract.width, 1024);
    assert.equal(input.contract.height, 1536);
    assert.equal(input.contract.safeMargin, undefined);
    assert.match(input.contract.description, /composition targets, not clipping boundaries/);
    assert.match(request.messages[0].content, /name the exact affected word or face/);
    assert.match(request.messages[0].content, /Never report hypothetical overlap/);
    assert.match(request.messages[0].content, /do not reject unchanged background composition/);
    assert.doesNotMatch(request.messages[0].content, /For NEW invitations|For a flyer EDIT|band-members request/);
    assert.ok(request.messages[0].content.length < 3000, "lettering uses its focused checker rather than the full studio review");
  }, { letteringOnly: true, references: [{ mimeType: "image/png", data: "c291cmNl" }] });
  assert.equal(result.status, "passed");
});

for (const verificationContext of [{ letteringOnly: true }, { letteringOnly: true, layeredLettering: true }]) {
  test(`${verificationContext.layeredLettering ? "layered" : "guided"} lettering detects prohibited content independently of approved wording`, async () => {
    const result = await checkPayload({
      visibleText: ["Livia is turning 10"],
      issues: ["safety_mismatch"],
      requestedChangesApplied: true,
      repairInstructions: ["Remove the violent act visible behind the headline."],
      ...(verificationContext.layeredLettering ? { findings: [] } : {}),
    }, (request) => {
      assert.match(request.messages[0].content, /Report safety_mismatch only for visible pornography/);
      assert.match(request.messages[0].content, /regardless of the supplied brief/);
      assert.match(request.messages[0].content, /Require every approved title and opening-line word|require every title and opening-line word/);
    }, verificationContext);
    assert.equal(result.status, "failed");
    assert.deepEqual(result.issues, ["safety_mismatch"]);
  });
}

test("layered findings distinguish concrete missing wording, refusal and unavailable checks", async () => {
  const savedKey = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = "test-key";
  const finding = { field: "opening_line", expectedWording: "You're invited", observedWording: "", region: "above title", concernType: "missing_copy", explanation: "The supplied opening line is absent." };
  const payload = { visibleText: ["Livia is turning 10"], issues: ["missing_copy"], findings: [finding], repairInstructions: ["Restore the exact opening line."], requestedChangesApplied: true };
  const outcomes = [
    { choice: { finish_reason: "stop", message: { content: JSON.stringify(payload) } }, status: "failed" },
    { choice: { finish_reason: "stop", message: { content: "not JSON" } }, status: "unavailable", reason: "invalid_response" },
    { choice: { finish_reason: "length", message: { content: "{}" } }, status: "unavailable", reason: "incomplete" },
    { choice: { finish_reason: "stop", message: { refusal: "Provider refusal", content: null } }, status: "unavailable", reason: "refused" },
    { error: new Error("Controlled checker timeout"), status: "unavailable", reason: "checker_error" },
  ];
  try {
    for (const outcome of outcomes) {
      mock.restoreAll();
      let checks = 0;
      mock.method(artworkCheckDeps, "createClient", () => ({ chat: { completions: { create: async (request, options) => {
        checks++; assert.equal(options.maxRetries, 0); assert.ok(request.response_format.json_schema.schema.properties.findings);
        if (outcome.error) throw outcome.error;
        return { choices: [outcome.choice] };
      } } } }));
      const result = await verifyStudioArtwork("data:image/png;base64,cmVzdWx0", { ...event, requiredArtworkLines: ["You're invited"] }, "live_card", { layeredLettering: true, letteringOnly: true });
      assert.equal(checks, 1); assert.equal(result.status, outcome.status);
      if (outcome.reason) assert.equal(result.unavailableReason, outcome.reason);
      else assert.deepEqual(result.findings, [finding]);
    }
  } finally { if (savedKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = savedKey; }
});
