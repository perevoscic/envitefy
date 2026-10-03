import test from "node:test";
import assert from "node:assert/strict";
import { creationModelBudget } from "./openai-workloads.ts";
import { localClockToIso, resolveScheduleCorrection } from "./calendar-validation.ts";
import { EVENT_EXTRACTION_SCHEMA, parseEventExtraction } from "../ocr/extraction-contract.ts";

function empty(schema) {
  if (schema.anyOf) return empty(schema.anyOf[0]);
  if (schema.enum) return schema.enum[0];
  const type = Array.isArray(schema.type)
    ? schema.type.includes("null")
      ? "null"
      : schema.type[0]
    : schema.type;
  if (type === "null") return null;
  if (type === "array") return [];
  if (type === "object")
    return Object.fromEntries(Object.entries(schema.properties).map(([k, s]) => [k, empty(s)]));
  if (type === "boolean") return false;
  if (type === "number" || type === "integer") return 0;
  return "";
}
test("OCR preserves verbatim transcript separately from normalized facts and rejects unsupported evidence", () => {
  const value = empty(EVENT_EXTRACTION_SCHEMA);
  value.sourceEvidence.sourceText = "Elena's birthday\n30\nGarden Hall";
  value.title = "Elena's 30th Birthday";
  value.birthdayAge = 30;
  value.sourceEvidence.fields.title = { status: "inferred", sourceText: ["Elena's birthday"] };
  value.sourceEvidence.fields.birthdayAge = {
    status: "observed",
    sourceText: ["30", "Elena's birthday"],
  };
  value.sourceEvidence.fields.venueName = { status: "observed", sourceText: ["Invented venue"] };
  value.venueName = "Invented venue";
  const parsed = parseEventExtraction(value);
  assert.equal(parsed.sourceEvidence.sourceText, value.sourceEvidence.sourceText);
  assert.equal(parsed.birthdayAge, 30);
  assert.equal(parsed.venueName, null);
  assert.notEqual(parsed.title, parsed.sourceEvidence.sourceText);
  assert.equal(parseEventExtraction({ ...value, ownership: "invited" }), null);
});
test("conflicting or missing birthday age remains null despite a decorative numeral", () => {
  const value = empty(EVENT_EXTRACTION_SCHEMA);
  value.sourceEvidence.sourceText = "Birthday 30 40";
  value.birthdayAge = 30;
  value.sourceEvidence.fields.birthdayAge = { status: "conflicting", sourceText: ["30", "40"] };
  assert.equal(parseEventExtraction(value).birthdayAge, null);
});

test("OCR description keeps cited source wording instead of model-written invitation prose", () => {
  const value = empty(EVENT_EXTRACTION_SCHEMA);
  value.sourceEvidence.sourceText = "Elena's birthday\nbring your towel!\n¡Sin regalos!";
  value.description = "Join Elena for a luxurious pool party with free towels and gifts.";
  value.sourceEvidence.fields.description = {
    status: "inferred",
    sourceText: ["bring your towel!", "¡Sin regalos!"],
  };
  assert.equal(parseEventExtraction(value).description, "bring your towel!\n¡Sin regalos!");
  assert.equal(value.description, "Join Elena for a luxurious pool party with free towels and gifts.");
  value.sourceEvidence.fields.description = { status: "missing", sourceText: [] };
  assert.equal(parseEventExtraction(value).description, "");
});

test("OCR normalized dates cannot roll impossible calendar dates into another month", () => {
  const value = empty(EVENT_EXTRACTION_SCHEMA);
  value.sourceEvidence.sourceText = "February 30, 2026";
  value.start = "2026-02-30T16:00:00Z";
  value.sourceEvidence.fields.start = { status: "inferred", sourceText: ["February 30, 2026"] };
  assert.equal(parseEventExtraction(value).start, null);
});
test("Astra budgets preserve reasoning headroom and never send unsupported temperature", () => {
  const plan = creationModelBudget("gpt-6-astra", "creative_plan");
  const correction = creationModelBudget("gpt-6-astra", "correction");
  assert.equal(plan.reasoning_effort, "medium");
  assert.equal(correction.reasoning_effort, "low");
  assert.ok(plan.max_completion_tokens > correction.max_completion_tokens);
  assert.equal(plan.temperature, undefined);
  assert.equal(creationModelBudget("gpt-5.6-terra", "correction").reasoning_effort, "none");
});
test("calendar conversion uses event timezone and rejects missing or repeated DST times", () => {
  assert.equal(
    localClockToIso({ year: 2026, month: 9, day: 5, hour: 16, minute: 0 }, "America/Chicago"),
    "2026-09-05T21:00:00.000Z",
  );
  assert.equal(
    localClockToIso({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, "America/Chicago"),
    null,
  );
  assert.equal(
    localClockToIso({ year: 2026, month: 11, day: 1, hour: 1, minute: 30 }, "America/Chicago"),
    null,
  );
  assert.equal(
    localClockToIso({ year: 2026, month: 2, day: 30, hour: 16, minute: 0 }, "America/Chicago"),
    null,
  );
  const changed = resolveScheduleCorrection({
    dateText: "October 24, 2026",
    previousStart: "2026-09-05T21:00:00Z",
    previousEnd: "2026-09-05T23:00:00Z",
    timezone: "America/Chicago",
  });
  assert.equal(changed.startISO, "2026-10-24T21:00:00.000Z");
  assert.equal(changed.endISO, "2026-10-24T23:00:00.000Z");
});
