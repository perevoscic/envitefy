import assert from "node:assert/strict";
import test from "node:test";
import { fallbackExtractConciergeDraft } from "./fallback.ts";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";

for (const output of ["live_card", "digital_flyer", "event_page"]) {
  test(`${output}: a gymnast's explicit birthday exclusion cannot change the meet category`, () => {
    const draft = fallbackExtractConciergeDraft({
      message: "Create a live card for Nora's Fall Gymnastics Meet on November 2, 2099 at 2 PM at Maple Gym. I am competing, not hosting a birthday. Use artistic gymnastics beam artwork; no football imagery.",
      requestedOutputs: [output],
    });
    assert.equal(draft.eventType, "gym_meet");
    const normalized = normalizeConciergeDraft({ eventType: "birthday" }, draft, {
      message: "Create a live card for Nora's Fall Gymnastics Meet. I am competing, not hosting a birthday.",
    });
    assert.equal(normalized.eventType, "gym_meet");
    const after = fallbackExtractConciergeDraft({ draft, message: "It ends at 4:30 PM.", activeContext: { selectedCategory: "Birthday" }, requestedOutputs: [output] });
    assert.equal(after.eventType, "gym_meet");
    assert.deepEqual(after.requestedOutputs, [output]);
  });
}

test("negation keeps actual birthday requests and replacement category instructions", () => {
  assert.equal(fallbackExtractConciergeDraft({ message: "Create a birthday invitation, not a football flyer." }).eventType, "birthday");
  assert.equal(fallbackExtractConciergeDraft({ message: "It is not only a birthday but also a family gathering." }).eventType, "birthday");
  const draft = fallbackExtractConciergeDraft({ message: "Create a birthday invitation for Nora turning 7." });
  assert.equal(fallbackExtractConciergeDraft({ draft, message: "Actually this is not a birthday; it is a gymnastics meet." }).eventType, "gym_meet");
});

test("a faulty model cannot classify a gymnastics meet from the excluded birthday span", async () => {
  const message = "Create a live card for Nora's Fall Gymnastics Meet on November 2, 2099 at 2 PM at Maple Gym. I am competing, not hosting a birthday. Use artistic gymnastics beam artwork; no football imagery.";
  const result = await extractConciergeDraft({ message, requestedOutputs: ["live_card"] }, {
    openAiApiKey: "test-key",
    createOpenAiClient: () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      edits: [{ field: "eventType", operation: "set", value: "birthday", source: "latest_user_message", sourceText: "not hosting a birthday" }], previewCopy: null,
    }) } }] }) } } }),
  });
  assert.equal(result.usedAi, true);
  assert.equal(result.draft.eventType, "gym_meet");
});

test("normalization still accepts a real birthday and an explicit replacement of a gymnastics event", () => {
  const previous = fallbackExtractConciergeDraft({ message: "Create a gymnastics meet live card." });
  for (const message of [
    "Actually create a birthday invitation for Nora turning 7, not a gymnastics meet.",
    "It is not only a birthday but also a family gathering.",
  ]) {
    const fallback = fallbackExtractConciergeDraft({ draft: previous, message });
    assert.equal(fallback.eventType, "birthday");
    assert.equal(normalizeConciergeDraft({ eventType: "birthday" }, fallback, { previousDraft: previous, message }).eventType, "birthday");
  }
});
