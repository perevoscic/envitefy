import assert from "node:assert/strict";
import test from "node:test";
import { applyBuilderExtraction } from "./livecard-assistance";
import { createLiveCardForm, LIVE_CARD_EVENT_TYPES } from "./livecard-builder";

test("all Live Card event types retain an explicit future year even when the evidence quote omits it", () => {
  for (const eventType of LIVE_CARD_EVENT_TYPES) {
    const before = { ...createLiveCardForm("America/Chicago"), eventType };
    const result = applyBuilderExtraction(
      before,
      {
        date: "2030-09-24",
        evidence: [{ field: "date", quote: "September 24" }],
      },
      "Our event is on September 24, 2030.",
    );
    assert.equal(result.form.date, "2030-09-24", eventType);
  }
});

test("an appearance edit keeps the approved event date unchanged", () => {
  const before = {
    ...createLiveCardForm("America/Chicago"),
    title: "Our celebration",
    date: "2030-09-24",
  };
  const result = applyBuilderExtraction(
    before,
    { design: "Blue flowers", date: "2026-09-24", evidence: [] },
    "Make the background blue.",
  );
  assert.equal(result.form.date, "2030-09-24");
});
