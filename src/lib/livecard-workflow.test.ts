import assert from "node:assert/strict";
import test from "node:test";
import { createLiveCardForm, liveCardScheduleSummary } from "./livecard-builder.ts";
import {
  LiveCardGenerationFailure, liveCardGenerationErrorResponse,
  readLiveCardGenerationFailure, recordLiveCardGeneration,
} from "./livecard-generation-failure.ts";

test("Review includes event-local end times, overnight dates, and never invents an end", () => {
  const form = { ...createLiveCardForm("America/Chicago"), date: "2026-09-27", startTime: "14:00", endTime: "16:00" };
  assert.equal(liveCardScheduleSummary(form), "Sep 27, 2026, 2:00 PM–4:00 PM");
  assert.equal(liveCardScheduleSummary({ ...form, endTime: "" }), "Sep 27, 2026, 2:00 PM");
  assert.equal(liveCardScheduleSummary({ ...form, startTime: "22:00", endDate: "2026-09-28", endTime: "01:00" }), "Sep 27, 2026, 10:00 PM–Sep 28, 2026, 1:00 AM");
  assert.equal(liveCardScheduleSummary({ ...form, timezone: "Asia/Tokyo", startTime: "00:30", endTime: "02:00" }), "Sep 27, 2026, 12:30 AM–2:00 AM");
  assert.equal(liveCardScheduleSummary(createLiveCardForm()), "Add a date and time");
});

test("structured failures preserve legacy messages and filter untrusted diagnostic fields", (t) => {
  const failure = new LiveCardGenerationFailure("Please retry.", "lettering", "quality_rejected", ["missing_copy", "secret@example.com", "missing_copy"]);
  assert.deepEqual(liveCardGenerationErrorResponse(failure, "lettering"), {
    error: "Please retry.", stage: "lettering", code: "quality_rejected", retryable: true, issues: ["missing_copy"],
  });
  const legacy = readLiveCardGenerationFailure({ error: "Older server error" }, "design", "Fallback");
  assert.equal(legacy.message, "Older server error");
  assert.equal(legacy.retryable, true);
  assert.equal(readLiveCardGenerationFailure({ retryable: false, code: "private content" }, "design", "Fallback").retryable, false);
  const logs: unknown[] = [];
  t.mock.method(console, "info", (...args) => { logs.push(args); });
  recordLiveCardGeneration({ stage: "lettering", startedAt: Date.now(), attempt: 2, outcome: "quality_rejected", issues: ["missing_copy", "secret@example.com"] });
  assert.doesNotMatch(JSON.stringify(logs), /secret@example/);
  const entry = (logs[0] as [string, Record<string, unknown>])[1];
  assert.deepEqual(Object.keys(entry), ["stage", "durationMs", "attempt", "outcome", "issues"]);
  assert.equal(entry.attempt, 2);
});
