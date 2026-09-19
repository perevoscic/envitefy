import assert from "node:assert/strict";
import test from "node:test";
import * as chrono from "chrono-node";
import { normalizeEventScheduleText, resolveFuzzyMonth } from "./conversation-edits.ts";
import { normalizeConciergeDraft } from "./extract.ts";
import { buildAssistantMessage, fallbackExtractConciergeDraft, repairMisparsedBirthdayDraft } from "./fallback.ts";

const screenshotMessage = "Livia, 10 years old, on septmeber 25th.";

test("month typo repair preserves time corrections and only repairs day numbers", () => {
  for (const word of ["not", "now", "for", "noon"]) {
    assert.equal(resolveFuzzyMonth(word), null, word);
  }
  for (const message of [
    "We finish at 5 PM, not 4 PM.",
    "The bus returns at 3:00 PM, not 2:30 PM.",
    "We finish at 5, not 4.",
    "It starts at 3 PM, not 2pm.",
    "spee 4 PM", "spee4:30", "spee 4 a.m.",
  ]) {
    assert.equal(normalizeEventScheduleText(message), message);
  }
  assert.equal(normalizeEventScheduleText("spee 26thth at 4 PM"), "September 26th at 4 PM");
  assert.equal(normalizeEventScheduleText("sept26 at 4 PM"), "September 26 at 4 PM");
  assert.equal(normalizeEventScheduleText("for 2 hours"), "");
});

function expectSeptember25(draft) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), 8, 25, 12);
  const year = candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? now.getFullYear() + 1 : now.getFullYear();
  const start = draft.startISO ? new Date(draft.startISO) : chrono.parseDate(draft.dateText, now, { forwardDate: true });
  if (!draft.timeText) {
    assert.equal(draft.startISO, null, "An unknown clock must not fabricate a noon instant");
    assert.equal(draft.endISO, null);
  }
  assert.equal(start.getMonth(), 8);
  assert.equal(start.getDate(), 25);
  assert.equal(start.getFullYear(), year);
  assert.doesNotMatch(draft.dateText, /years?|turning/);
}

test("the reported Livia reply supplies a name and age while the misspelled month supplies the date", () => {
  for (const args of [{ message: screenshotMessage }, { message: screenshotMessage, starterCategory: "Birthday" }]) {
    const draft = fallbackExtractConciergeDraft(args);
    assert.equal(draft.eventType, "birthday");
    assert.equal(draft.honoreeName, "Livia");
    assert.equal(draft.ageOrMilestone, "10");
    assert.match(draft.title, /Livia.*10/);
    assert.doesNotMatch(draft.title, /years old|septmeber|September 25/);
    assert.equal(draft.timeText, null);
    assert.ok(!draft.missingFields.includes("honoreeName"));
    expectSeptember25(draft);
  }
});

test("ordinary name-age-date variations do not turn the age into a clock time", () => {
  for (const message of [
    "Livia, 10 years old, on September 25th.",
    "Livia is 10 years old. September 25.",
    "Livia turning 10 on September 25th.",
    "Livia, turning 10, on setpember 25th.",
    "Livia, aged 10, on September 25.",
    "livia, 10 years old, on September 25.",
    "Livia, 10, on September 25.",
  ]) {
    const draft = fallbackExtractConciergeDraft({ message, starterCategory: "Birthday" });
    assert.equal(draft.honoreeName, "Livia", message);
    assert.equal(draft.ageOrMilestone, "10", message);
    assert.equal(draft.timeText, null, message);
    expectSeptember25(draft);
  }
});

test("an age by itself never fabricates a date", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Livia is 10 years old." });
  assert.equal(draft.honoreeName, "Livia");
  assert.equal(draft.ageOrMilestone, "10");
  assert.equal(draft.dateText, null);
  assert.equal(draft.startISO, null);
  assert.equal(draft.timeText, null);
});

test("the movie birthday message captures the facts despite turnig and asks specifically for the event date", () => {
  const message = "Livia is turnig 10. the are going to watch Forgotten islan at amc grand boulevard. she like katseyes and needoh. no rsvp";
  for (const requestedOutputs of [null, ["live_card"]]) {
    let draft = fallbackExtractConciergeDraft({ message, requestedOutputs });
    assert.equal(draft.eventType, "birthday");
    assert.equal(draft.honoreeName, "Livia");
    assert.equal(draft.ageOrMilestone, "10");
    assert.equal(draft.location, "amc grand boulevard");
    assert.match(draft.theme, /Forgotten islan.*katseyes and needoh/);
    assert.equal(draft.rsvpEnabled, false);
    assert.equal(draft.dateText, null);
    assert.equal(draft.startISO, null);
    assert.equal(draft.timeText, null);
    assert.equal(draft.currentQuestion, "date");
    assert.equal(buildAssistantMessage(draft), "What date is Livia’s birthday celebration?");

    draft = fallbackExtractConciergeDraft({ message: "September 26 2099", draft });
    assert.equal(draft.currentQuestion, "time");
    assert.match(buildAssistantMessage(draft), /What time should it start/);
    assert.equal(draft.honoreeName, "Livia");
    assert.equal(draft.ageOrMilestone, "10");
    assert.equal(draft.location, "amc grand boulevard");
  }
});

test("a typo month and doubled ordinal such as spee 26thth is September 26", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Livia is turnig 10. the are going to watch Forgotten islan at amc grand boulevard. she like katseyes and needoh. no rsvp",
  });
  draft = fallbackExtractConciergeDraft({ message: "spee 26thth", draft });
  const start = draft.startISO
    ? new Date(draft.startISO)
    : chrono.parseDate(draft.dateText, new Date(), { forwardDate: true });
  assert.ok(start, draft.dateText);
  assert.equal(start.getMonth(), 8);
  assert.equal(start.getDate(), 26);
  assert.notEqual(draft.currentQuestion, "date");
  assert.doesNotMatch(buildAssistantMessage(draft), /What date is Livia|still need the year|still need the month/i);
  draft = fallbackExtractConciergeDraft({ message: "yes", draft });
  assert.match(draft.dateText || "", /September 26/i);
  assert.notEqual(draft.currentQuestion, "date");
  assert.doesNotMatch(buildAssistantMessage(draft), /still need the year|still need the month/i);
});

test("year and month fragments complete a date already started in chat", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Birthday live card for Livia turning 10 at AMC Grand Boulevard at 4pm",
  });
  draft = fallbackExtractConciergeDraft({
    message: "2026",
    draft,
    recentUserMessages: ["spee 26thth"],
  });
  const yearStart = chrono.parseDate(draft.dateText, new Date(), { forwardDate: true });
  assert.ok(yearStart, draft.dateText);
  assert.equal(yearStart.getMonth(), 8);
  assert.equal(yearStart.getDate(), 26);
  assert.equal(yearStart.getFullYear(), 2026);

  draft = fallbackExtractConciergeDraft({
    message: "Birthday live card for Livia turning 10 at AMC Grand Boulevard at 4pm",
  });
  draft = fallbackExtractConciergeDraft({
    message: "September",
    draft,
    recentUserMessages: ["spee 26thth", "2026"],
  });
  const monthStart = chrono.parseDate(draft.dateText, new Date(), { forwardDate: true });
  assert.ok(monthStart, draft.dateText);
  assert.equal(monthStart.getMonth(), 8);
  assert.equal(monthStart.getDate(), 26);
});

test("a compact Saturday the 26th reply captures the date instead of asking again", () => {
  let draft = fallbackExtractConciergeDraft({
    message: "Livia is turnig 10. the are going to watch Forgotten islan at amc grand boulevard. she like katseyes and needoh. no rsvp",
  });
  draft = fallbackExtractConciergeDraft({ message: "Sat26tth, 4 rsvps", draft });
  const start = draft.startISO
    ? new Date(draft.startISO)
    : chrono.parseDate(draft.dateText, new Date(), { forwardDate: true });
  assert.ok(start, draft.dateText);
  assert.equal(start.getDate(), 26);
  assert.equal(start.getDay(), 6);
  assert.equal(draft.numberOfGuests, 4);
  assert.equal(draft.rsvpEnabled, true);
  assert.notEqual(draft.currentQuestion, "date");
  assert.doesNotMatch(buildAssistantMessage(draft), /What date is Livia/i);
  assert.doesNotMatch(buildAssistantMessage(draft), /have4|Whatdate|plannning/i);
});

test("a spaced Saturday 26th is a calendar date and Saturday 26 kids is not", () => {
  const dateDraft = fallbackExtractConciergeDraft({
    message: "Birthday live card for Livia turning 10",
  });
  const saturdayThe26th = fallbackExtractConciergeDraft({
    message: "Saturday the 26th",
    draft: dateDraft,
  });
  const kids = fallbackExtractConciergeDraft({
    message: "Saturday 26 kids",
    draft: dateDraft,
  });
  const parsed = chrono.parseDate(saturdayThe26th.dateText, new Date(), { forwardDate: true });
  assert.ok(parsed);
  assert.equal(parsed.getDate(), 26);
  assert.equal(parsed.getDay(), 6);
  assert.doesNotMatch(kids.dateText || "", /26/);
  assert.equal(kids.numberOfGuests, 26);
});

test("a stated party time remains distinct from the birthday age", () => {
  const draft = fallbackExtractConciergeDraft({ message: "Livia, 10 years old, on septmeber 25th at 4 pm." });
  expectSeptember25(draft);
  assert.equal(new Intl.DateTimeFormat("en-GB", { timeZone: draft.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(draft.startISO)), "16:00");
  assert.equal(draft.ageOrMilestone, "10");
});

test("event durations and anniversary counts are not honoree ages or event dates", () => {
  for (const message of [
    "The workshop lasts 10 hours on September 25th.",
    "Our 10 year anniversary is on September 25th.",
    "Our 10th anniversary is on September 25th.",
  ]) {
    const draft = fallbackExtractConciergeDraft({ message });
    assert.notEqual(draft.eventType, "birthday", message);
    assert.equal(draft.ageOrMilestone, /anniversary/.test(message) ? "10" : null, message);
    assert.equal(draft.honoreeName, null, message);
    assert.equal(draft.timeText, null, message);
    expectSeptember25(draft);
  }
});

test("stale model values cannot turn explicit age and date facts back into a title or duration", () => {
  const fallback = fallbackExtractConciergeDraft({ message: screenshotMessage, starterCategory: "Birthday" });
  const normalized = normalizeConciergeDraft({ title: screenshotMessage, honoreeName: "September", ageOrMilestone: "25", dateText: "10 years", timeText: "10 AM", startISO: "2036-09-05T10:00:00.000Z", endISO: "2036-09-05T12:00:00.000Z" }, fallback, { message: screenshotMessage });
  assert.equal(normalized.title, fallback.title);
  assert.equal(normalized.honoreeName, "Livia");
  assert.equal(normalized.ageOrMilestone, "10");
  assert.equal(normalized.timeText, null);
  expectSeptember25(normalized);
});

test("the next date correction can recover an already contaminated unsaved draft", () => {
  const previous = { ...fallbackExtractConciergeDraft({ message: "Create a birthday live card." }), title: screenshotMessage, eventPurpose: screenshotMessage, honoreeName: null, ageOrMilestone: null, dateText: "10 years", startISO: "2036-09-05T10:00:00.000Z", endISO: "2036-09-05T12:00:00.000Z", timeText: null, titleConfirmed: false };
  const draft = fallbackExtractConciergeDraft({ message: "The date is September 25th.", draft: previous });
  assert.equal(draft.honoreeName, "Livia");
  assert.equal(draft.ageOrMilestone, "10");
  assert.doesNotMatch(draft.title, /years old|septmeber/);
  expectSeptember25(draft);
  assert.equal(previous.title, screenshotMessage);
});

test("reopening or a complaint can recover the original facts without retyping or mutating storage", () => {
  const previous = { ...fallbackExtractConciergeDraft({ message: "Create a birthday live card." }), title: screenshotMessage, eventPurpose: screenshotMessage, honoreeName: null, ageOrMilestone: null, dateText: "10 years", startISO: "2036-09-05T10:00:00.000Z", endISO: "2036-09-05T12:00:00.000Z", timeText: null, titleConfirmed: false };
  for (const draft of [repairMisparsedBirthdayDraft(previous), fallbackExtractConciergeDraft({ message: "I already gave you her name.", draft: previous })]) {
    assert.equal(draft.honoreeName, "Livia");
    assert.equal(draft.ageOrMilestone, "10");
    assert.doesNotMatch(draft.title, /years old|septmeber/);
    assert.ok(!draft.missingFields.includes("honoreeName"));
    expectSeptember25(draft);
  }
  assert.equal(previous.honoreeName, null);
  assert.equal(previous.dateText, "10 years");
  const confirmed = { ...previous, title: "Livia's Garden Party", titleConfirmed: true };
  assert.equal(repairMisparsedBirthdayDraft(confirmed), confirmed);
  const placeholder = { ...previous, previewCopy: { ...previous.previewCopy, body: "Join us to celebrate the guest of honor." } };
  assert.equal(repairMisparsedBirthdayDraft(placeholder).previewCopy.body, "Join us to celebrate Livia turning 10.");
});

test("narrow recovery preserves authored invitation wording when only the structured name was missing", () => {
  const initial = fallbackExtractConciergeDraft({ message: screenshotMessage });
  const body = "Bring your favorite story about Livia.\nTraigan su historia favorita de Livia.";
  const previous = { ...initial, title: screenshotMessage, honoreeName: null, titleConfirmed: false, previewCopy: { ...initial.previewCopy, body }, copyStatus: "ready" };
  const repaired = repairMisparsedBirthdayDraft(previous);
  assert.equal(repaired.honoreeName, "Livia");
  assert.equal(repaired.previewCopy.body, body);
  assert.equal(repaired.copyStatus, "ready");
  assert.equal(previous.honoreeName, null);
  const contaminated = { ...previous, previewCopy: { ...initial.previewCopy, body: `Join us for ${screenshotMessage}` } };
  const corrected = repairMisparsedBirthdayDraft(contaminated);
  assert.doesNotMatch(corrected.previewCopy.body, /septmeber/);
  assert.equal(corrected.copyStatus, "needs_update");
});

test("a generated title does not silently restore a deliberately cleared name", () => {
  const initial = fallbackExtractConciergeDraft({ message: "Mia, turning 6", starterCategory: "Birthday" });
  const previous = { ...initial, honoreeName: null, missingFields: ["honoreeName"], currentQuestion: "honoreeName" };
  const draft = fallbackExtractConciergeDraft({ message: "bright rainbow with balloons and soft pastels", draft: previous });
  assert.equal(draft.honoreeName, null);
  assert.equal(repairMisparsedBirthdayDraft(previous), previous);
});
