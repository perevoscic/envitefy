import test from "node:test";
import assert from "node:assert/strict";
import { matchesSchema, normalizeSourceEvidence } from "./source-evidence.ts";
import { creationModelBudget } from "./openai-workloads.ts";
import { localClockToIso, resolveScheduleCorrection } from "./calendar-validation.ts";
import { EVENT_EXTRACTION_SCHEMA, parseEventExtraction } from "../ocr/extraction-contract.ts";
import {
  CONCIERGE_EXTRACTION_SCHEMA,
  parseConciergeEdits,
} from "../concierge/extraction-contract.ts";
import { EVENT_ACTION_SCHEMA, parseEventActionContract } from "../concierge/action-contract.ts";
import { attachCreationReadiness, getCreationReadiness } from "../concierge/readiness.ts";
import { fallbackExtractConciergeDraft } from "../concierge/fallback.ts";

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
const ready = () =>
  fallbackExtractConciergeDraft({
    message:
      "Create a live card for Elena's 30th birthday on October 24, 2099 at 4 PM at Garden Hall. No RSVP. Elegant florals.",
  });
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
test("strict edits enforce typed values, exact evidence, allowlisted fields and explicit clears", () => {
  const request = { message: "Remove the RSVP contact. Set the location to Garden Hall." };
  const valid = {
    edits: [
      {
        field: "rsvpContact",
        operation: "clear",
        value: null,
        source: "latest_user_message",
        sourceText: "Remove the RSVP contact.",
      },
      {
        field: "location",
        operation: "set",
        value: "Garden Hall",
        source: "latest_user_message",
        sourceText: "Garden Hall",
      },
    ],
    previewCopy: null,
  };
  const result = parseConciergeEdits(valid, request);
  assert.deepEqual(result.patch, { rsvpContact: null, location: "Garden Hall" });
  assert.equal(parseConciergeEdits({ ...valid, ownership: "owned" }, request), null);
  assert.equal(
    parseConciergeEdits(
      { ...valid, edits: [{ ...valid.edits[0], field: "draftStatus" }] },
      request,
    ),
    null,
  );
  assert.deepEqual(
    parseConciergeEdits(
      { ...valid, edits: [{ ...valid.edits[1], sourceText: "Different venue" }] },
      request,
    ).patch,
    {},
  );
  assert.deepEqual(
    parseConciergeEdits({ ...valid, edits: [{ ...valid.edits[1], field: "rsvpEnabled" }] }, request)
      .patch,
    {},
  );
  assert.equal(matchesSchema(valid, CONCIERGE_EXTRACTION_SCHEMA), true);
});
test("uploads cannot overwrite existing user facts or clear them", () => {
  const request = { draft: ready(), ocrContext: { ocrText: "Old Hall" } };
  const edits = [
    {
      field: "location",
      operation: "set",
      value: "Old Hall",
      source: "source_text",
      sourceText: "Old Hall",
    },
  ];
  assert.deepEqual(parseConciergeEdits({ edits, previewCopy: null }, request).patch, {});
  assert.deepEqual(
    parseConciergeEdits(
      { edits: [{ ...edits[0], operation: "clear", value: null }], previewCopy: null },
      request,
    ).patch,
    {},
  );
});
test("preview and draft save work before logistics; publication still requires them", () => {
  const draft = fallbackExtractConciergeDraft({
    message: "Create a birthday live card for Elena, 30.",
  });
  const state = getCreationReadiness(draft);
  assert.equal(state.canPreview, true);
  assert.equal(state.canSaveDraft, true);
  assert.equal(state.canPublish, false);
  assert.ok(state.publishBlockers.includes("date"));
  const complete = {
    ...ready(),
    tone: null,
    rsvpName: null,
    rsvpContact: null,
    rsvpEnabled: null,
    currentQuestion: "tone",
    missingFields: ["tone"],
  };
  assert.equal(getCreationReadiness(complete).canPreview, true);
  assert.equal(getCreationReadiness(complete).canPublish, true);
});
test("publication rejects impossible dates, end-before-start, invalid timezone and source conflicts", () => {
  const draft = ready();
  assert.equal(
    getCreationReadiness({ ...draft, startISO: "2099-02-30T16:00:00Z" }).canPublish,
    false,
  );
  assert.equal(
    getCreationReadiness({ ...draft, endISO: "2099-01-01T00:00:00Z" }).canPublish,
    false,
  );
  assert.equal(getCreationReadiness({ ...draft, timezone: "Mars/Unknown" }).canPublish, false);
  const sourceEvidence = normalizeSourceEvidence({
    sourceText: "Oct 24 / Oct 25",
    fields: { start: { status: "conflicting", sourceText: ["Oct 24", "Oct 25"] } },
  });
  const ambiguous = { ...draft, sourceMaterial: { sourceEvidence } };
  assert.equal(getCreationReadiness(ambiguous).canPublish, false);
  const corrected = attachCreationReadiness(
    { ...ambiguous, dateText: "October 25, 2099" },
    ambiguous,
    "Use October 25, 2099.",
  );
  assert.deepEqual(corrected.sourceMaterial.sourceEvidence, sourceEvidence);
  assert.equal(corrected.sourceResolutions.start, "Use October 25, 2099.");
  assert.equal(getCreationReadiness(corrected).canPublish, true);
});
test("saved-event actions reject model status changes and out-of-scope assets", () => {
  const edit = { field: "status", operation: "set", value: "published", sourceText: "publish" };
  const value = {
    actions: [{ type: "update_event", edits: [edit] }],
    assistantMessage: "",
    suggestedReplies: [],
  };
  assert.equal(matchesSchema(value, EVENT_ACTION_SCHEMA), false);
  assert.deepEqual(parseEventActionContract(value, "publish", []), []);
  assert.deepEqual(
    parseEventActionContract(
      {
        ...value,
        actions: [
          {
            type: "update_asset",
            assetId: "another-event",
            title: "New",
            body: null,
            sourceText: "New",
          },
        ],
      },
      "New",
      [],
    ),
    [],
  );
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
