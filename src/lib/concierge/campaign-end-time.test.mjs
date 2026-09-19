import assert from "node:assert/strict";
import test from "node:test";
import { fallbackExtractConciergeDraft, parseChrono } from "./fallback.ts";
import { extractConciergeDraft, normalizeConciergeDraft } from "./extract.ts";

const outputs = ["live_card", "digital_flyer", "event_page"];

function fixture(output, extra = {}) {
  return {
    ...fallbackExtractConciergeDraft({
      message: "Create a birthday invitation for Nora turning 7 on October 30, 2026 at 2 PM at Maple Community Center, Austin, TX. Rainbow theme.",
      requestedOutputs: [output],
    }),
    dateText: "October 30, 2026", timeText: "2:00 PM",
    startISO: "2026-10-30T19:00:00.000Z", endISO: "2026-10-30T21:00:00.000Z",
    timezone: "America/Chicago", currentQuestion: null, missingFields: [], ...extra,
  };
}

test("campaign end replies preserve the approved start, date, timezone and format", () => {
  for (const output of outputs) {
    const before = fixture(output);
    for (const message of [
      "It ends at 4:00 PM. All times are America/Chicago. I'm Priya Rivera; the RSVP contact is mom.birthday@example.invalid.",
      "Please change the end time to 5 PM.",
      "We finish at 5 PM, not 4 PM.",
    ]) {
      const after = fallbackExtractConciergeDraft({ message, draft: before });
      assert.equal(after.startISO, before.startISO, `${output}: ${message}`);
      assert.equal(after.dateText, before.dateText);
      assert.equal(after.timeText, before.timeText);
      assert.equal(after.timezone, before.timezone);
      assert.equal(after.endISO, message.startsWith("It ends") ? "2026-10-30T21:00:00.000Z" : "2026-10-30T22:00:00.000Z");
      assert.deepEqual(after.requestedOutputs, [output]);
    }
  }
});

test("field-trip return corrections do not move departure or reuse the rejected time", () => {
  for (const output of outputs) {
    const before = fixture(output, {
      eventType: "field_trip", timeText: "9:00 AM", startISO: "2026-10-30T14:00:00.000Z",
      endISO: "2026-10-30T19:30:00.000Z",
    });
    const after = fallbackExtractConciergeDraft({
      message: "Small correction: the bus returns at 3:00 PM, not 2:30 PM. That is also the end of the trip. The departure time and museum location stay the same.",
      draft: before,
    });
    assert.equal(after.startISO, before.startISO);
    assert.equal(after.endISO, "2026-10-30T20:00:00.000Z");
    assert.equal(after.timeText, "9:00 AM");
    assert.equal(after.dateText, before.dateText);
  }
});

test("an end-only reply uses the event timezone even when server and calendar dates differ", () => {
  for (const [timezone, startISO, endISO] of [
    ["America/Chicago", "2026-10-31T00:00:00.000Z", "2026-10-31T02:00:00.000Z"],
    ["America/New_York", "2026-10-30T23:00:00.000Z", "2026-10-31T01:00:00.000Z"],
    ["Asia/Tokyo", "2026-10-30T10:00:00.000Z", "2026-10-30T12:00:00.000Z"],
  ]) {
    const before = fixture("event_page", { timezone, startISO, endISO: null, timeText: "7:00 PM" });
    const after = parseChrono("It ends at 9 PM.", before);
    assert.equal(after.startISO, startISO, timezone);
    assert.equal(after.endISO, endISO, timezone);
    assert.equal(after.dateText, before.dateText, timezone);
  }
});

test("an end-only reply cannot fabricate the missing start or accept an invalid end", () => {
  const missingStart = fixture("event_page", { startISO: null, endISO: null, timeText: null });
  assert.equal(parseChrono("It ends at 4 PM.", missingStart).startISO, null);
  const before = fixture("event_page");
  const invalid = parseChrono("It ends at 1 PM.", before);
  assert.equal(invalid.startISO, before.startISO);
  assert.equal(invalid.endISO, before.endISO);
  assert.equal(invalid.needsConfirmation, true);
});

test("ambiguous daylight-saving end times require confirmation instead of choosing an offset", () => {
  const before = fixture("event_page", {
    dateText: "November 1, 2026", timeText: "12:30 AM",
    startISO: "2026-11-01T05:30:00.000Z", endISO: null,
  });
  const after = parseChrono("It ends at 1:30 AM.", before);
  assert.equal(after.startISO, before.startISO);
  assert.equal(after.endISO, null);
  assert.equal(after.needsConfirmation, true);
});

test("explicit start corrections still change start rather than being treated as an end", () => {
  for (const output of outputs) {
    const before = fixture(output);
    for (const message of ["Change the start time to 3 PM.", "Actually it starts at 3 PM.", "Change the time to 3 PM."]) {
      const after = fallbackExtractConciergeDraft({ message, draft: before });
      assert.notEqual(after.startISO, before.startISO);
      assert.equal(after.timeText, "3:00 PM");
      assert.equal(after.dateText, before.dateText);
    }
  }
});

test("real field-trip return correction updates the displayed range and return stop without changing departure", () => {
  for (const output of outputs) {
    const before = fixture(output, {
      eventType: "field_trip", title: "Grade Two Nature Museum Trip",
      dateText: "Wednesday, December 2, 2026", timeText: "9:00 AM–2:30 PM",
      startISO: "2026-12-02T15:00:00.000Z", endISO: "2026-12-02T20:30:00.000Z",
      additionalLocations: [
        { label: "Bus departure and return", venue: "Example Elementary", location: "Example Elementary", address: null, timeText: "Departs 9 AM; returns 2:30 PM", description: null, mapQuery: "Example Elementary" },
        { label: "Museum visit", venue: "Example Nature Museum", location: "Austin, TX", address: "300 Example Lane", timeText: "2:30 PM", description: null, mapQuery: "Example Nature Museum" },
      ],
    });
    const after = fallbackExtractConciergeDraft({ draft: before, message: "Small correction: the bus returns at 3:00 PM, not 2:30 PM. That is also the end of the trip. The departure time and museum location stay the same." });
    assert.equal(after.startISO, before.startISO);
    assert.equal(after.endISO, "2026-12-02T21:00:00.000Z");
    assert.equal(after.dateText, before.dateText);
    assert.equal(after.timeText, "9:00 AM–3:00 PM");
    assert.match(after.previewCopy.scheduleLine, /9:00 AM–3:00 PM/);
    assert.doesNotMatch(after.previewCopy.scheduleLine, /2:30 PM/);
    assert.equal(after.additionalLocations[0].timeText, "Departs 9 AM; returns 3:00 PM");
    assert.equal(after.additionalLocations[0].venue, "Example Elementary");
    assert.deepEqual(after.additionalLocations[1], before.additionalLocations[1]);
  }
});

test("end-only corrections synchronize ranges embedded in date labels and preserve their separators", () => {
  for (const separator of ["–", " - ", " to ", " until "]) {
    const before = fixture("event_page", {
      dateText: `October 30, 2026, 2:00 PM${separator}4:00 PM`,
      timeText: `2:00 PM${separator}4:00 PM`,
    });
    const after = fallbackExtractConciergeDraft({ draft: before, message: "It ends at 5 PM instead." });
    assert.equal(after.startISO, before.startISO);
    assert.equal(after.timeText, `2:00 PM${separator}5:00 PM`);
    assert.equal(after.dateText, `October 30, 2026, 2:00 PM${separator}5:00 PM`);
    assert.doesNotMatch(after.previewCopy.scheduleLine, /4:00 PM/);
  }
});

test("return-labeled stops may use a bare time or range but unrelated stops and event-end-only edits stay separate", () => {
  const before = fixture("event_page", {
    timeText: "2 PM–4 PM",
    additionalLocations: [
      { label: "Bus return", location: "School", timeText: "4 PM", description: "The bus returns at 4 PM." },
      { label: "Bus departure and return", location: "School entrance", timeText: "2 PM–4 PM" },
      { label: "Museum closes", location: "Museum", timeText: "4 PM" },
    ],
  });
  const returned = fallbackExtractConciergeDraft({ draft: before, message: "The bus returns at 5 PM." });
  assert.equal(returned.additionalLocations[0].timeText, "5:00 PM");
  assert.equal(returned.additionalLocations[0].description, "The bus returns at 5:00 PM.");
  assert.equal(returned.additionalLocations[1].timeText, "2 PM–5:00 PM");
  assert.deepEqual(returned.additionalLocations[2], before.additionalLocations[2]);
  const ended = fallbackExtractConciergeDraft({ draft: before, message: "The event ends at 5 PM." });
  assert.deepEqual(ended.additionalLocations, before.additionalLocations);
});

test("a faulty model cannot restore the old end after the captured anniversary answer", () => {
  const message = "It ends at 6:30 PM. All times are America/Chicago. I'm Jamie Lee; the RSVP contact is general.anniversary@example.com. Use only the details I've given you, and leave anything else blank.";
  for (const output of outputs) {
    const before = fixture(output, {
      dateText: "Thursday, November 5, 2026 at 2:00 PM", timeText: "2:00 PM",
      startISO: "2026-11-05T20:00:00.000Z", endISO: "2026-11-05T22:00:00.000Z",
    });
    const fallback = fallbackExtractConciergeDraft({ draft: before, message });
    const after = normalizeConciergeDraft({ startISO: before.startISO, endISO: before.endISO, timeText: before.timeText }, fallback, { previousDraft: before, message });
    assert.equal(after.startISO, before.startISO);
    assert.equal(after.endISO, "2026-11-06T00:30:00.000Z");
    assert.equal(after.timeText, "2:00 PM");
    assert.equal(after.timezone, "America/Chicago");
  }
});

test("the extraction pipeline cannot recompute a two-hour end when the model restates an old date", async () => {
  const before = fixture("event_page", {
    dateText: "Thursday, November 5, 2026 at 2:00 PM", timeText: "2:00 PM",
    startISO: "2026-11-05T20:00:00.000Z", endISO: "2026-11-05T22:00:00.000Z",
  });
  const message = "It ends at 6:30 PM. All times are America/Chicago.";
  const result = await extractConciergeDraft({ draft: before, message }, {
    openAiApiKey: "test-key",
    createOpenAiClient: () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      edits: [{ field: "dateText", operation: "set", value: before.dateText, source: "latest_user_message", sourceText: "It ends at 6:30 PM" }], previewCopy: null,
    }) } }] }) } } }),
  });
  assert.equal(result.usedAi, true);
  assert.equal(result.draft.startISO, before.startISO);
  assert.equal(result.draft.endISO, "2026-11-06T00:30:00.000Z");
});

test("model merging respects corrected return displays and still accepts actual start changes", () => {
  const before = fixture("event_page", {
    timeText: "2 PM–4 PM",
    additionalLocations: [{ label: "Bus return", location: "School", timeText: "4 PM" }],
  });
  const message = "The bus returns at 5 PM.";
  const fallback = fallbackExtractConciergeDraft({ draft: before, message });
  const merged = normalizeConciergeDraft({ timeText: before.timeText, endISO: before.endISO, additionalLocations: before.additionalLocations }, fallback, { previousDraft: before, message });
  assert.equal(merged.timeText, "2 PM–5:00 PM");
  assert.equal(merged.additionalLocations[0].timeText, "5:00 PM");
  const startMessage = "Change the start time to 3 PM.";
  const changedStart = fallbackExtractConciergeDraft({ draft: before, message: startMessage });
  const startMerged = normalizeConciergeDraft({ startISO: changedStart.startISO, timeText: "3:00 PM" }, changedStart, { previousDraft: before, message: startMessage });
  assert.notEqual(startMerged.startISO, before.startISO);
  assert.equal(startMerged.startISO, changedStart.startISO);
  assert.equal(startMerged.timeText, "3:00 PM");
});
