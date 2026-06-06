import assert from "node:assert/strict";
import test from "node:test";
import {
  applyOccurrenceException,
  buildIcsFeed,
  claimVolunteerSlotState,
  detectEventMode,
  detectScheduleConflicts,
  generateDefaultForms,
  generateOccurrences,
  markPaymentStatus,
  parseConciergeInput,
  validateFormSchema,
} from "./core.mjs";
import { buildConciergeV2EventHistoryPayload } from "./public-event.ts";

test("detectEventMode identifies gymnastics meet prompts", () => {
  const result = detectEventMode(
    "Lara has gymnastics every Tuesday and Thursday at 5:30, meet on March 12 in Orlando.",
  );
  assert.equal(result.mode, "gymnastics");
  assert.ok(result.confidence >= 0.8);
});

test("parseConciergeInput creates a structured gymnastics draft with recurrence and meet", () => {
  const draft = parseConciergeInput(
    "Lara has gymnastics every Tuesday and Thursday at 5:30, meet on March 12 in Orlando, team dinner the night before, and I need to invite grandparents.",
    { referenceDate: "2026-01-10T12:00:00.000Z" },
  );
  assert.equal(draft.mode, "gymnastics");
  assert.equal(draft.program.title, "Lara Gymnastics Season");
  assert.equal(draft.series[0].recurrenceRule, "FREQ=WEEKLY;BYDAY=TU,TH");
  assert.equal(draft.series[0].startTimeLocal, "17:30");
  assert.ok(draft.occurrences.some((item) => item.type === "meet"));
  assert.ok(draft.occurrences.some((item) => item.type === "team_dinner"));
  assert.ok(draft.checklistItems.some((item) => /grips/i.test(item.title)));
});

test("parseConciergeInput grounds gymnastics packet ranges and leaves missing time explicit", () => {
  const draft = parseConciergeInput(
    [
      "38 th ANNUAL GASPARILLA CLASSIC",
      "February 20-22, 2026",
      "Men's Meet Information",
      "MEET SITE: World Equestrian Center - Expo Center 1 1284 NW 87 th Ct. Rd, Ocala, FL",
      "MEET DIRECTOR: Tim Keckler - lcgymnasts@aol.com",
      "USA Gymnastics Competition",
    ].join("\n"),
    { referenceDate: "2026-06-06T12:00:00.000Z", sourceKind: "pdf_schedule" },
  );

  assert.equal(draft.title, "38th Annual Gasparilla Classic");
  assert.equal(draft.occurrences[0].date, "2026-02-20");
  assert.equal(draft.occurrences[0].startAt, null);
  assert.match(draft.occurrences[0].locationText, /World Equestrian Center/i);
  assert.ok(draft.missingFields.includes("gymnastics meet time"));
  assert.doesNotMatch(draft.missingFields.join(","), /location/);
});

test("Concierge V2 public event payload formats schedule labels instead of exposing raw ISO", () => {
  const payload = buildConciergeV2EventHistoryPayload({
    draft: {
      title: "38th Annual Gasparilla Classic",
      mode: "gymnastics",
      eventType: "gymnastics_meet",
      timezone: "America/New_York",
      occurrences: [
        {
          title: "Gymnastics Meet",
          startAt: "2026-03-06T12:00:00.000Z",
          endAt: "2026-03-06T15:00:00.000Z",
          timezone: "America/New_York",
        },
      ],
    },
  });

  assert.equal(payload.data.scheduleLine, "Mar 6, 2026, 7:00 AM");
  assert.equal(payload.data.whenLabel, "Mar 6, 2026, 7:00 AM");
  assert.doesNotMatch(payload.data.publicEvent.scheduleLine, /T12:00:00/);
});

test("parseConciergeInput expands school spirit week daily items", () => {
  const draft = parseConciergeInput(
    "Lara has spirit week next week: Monday pajamas, Tuesday crazy hair, Wednesday bring canned food, Thursday team shirt, Friday early dismissal.",
    { referenceDate: "2026-02-02T12:00:00.000Z" },
  );
  assert.equal(draft.mode, "school");
  assert.equal(draft.eventType, "spirit_week");
  assert.equal(draft.occurrences.length, 5);
  assert.equal(draft.occurrences[0].title, "Pajamas");
  assert.equal(draft.occurrences[4].type, "deadline");
});

test("parseConciergeInput builds birthday draft without hallucinating missing logistics", () => {
  const draft = parseConciergeInput("Plan Lara's 8th birthday, cat theme, pool party.", {
    referenceDate: "2026-01-10T12:00:00.000Z",
  });
  assert.equal(draft.mode, "social");
  assert.equal(draft.eventType, "birthday_party");
  assert.match(draft.title, /Pool Party/);
  assert.ok(draft.missingFields.includes("event date"));
  assert.ok(draft.missingFields.includes("event time"));
});

test("generateOccurrences materializes weekly Tue/Thu series and applies cancellation", () => {
  const occurrences = generateOccurrences(
    {
      id: "practice-series",
      title: "Gymnastics Practice",
      recurrenceRule: "FREQ=WEEKLY;BYDAY=TU,TH",
      startTimeLocal: "17:30",
      durationMinutes: 90,
    },
    { start: "2026-01-05T00:00:00.000Z", end: "2026-01-16T00:00:00.000Z" },
    [{ date: "2026-01-08", action: "cancel" }],
  );
  assert.deepEqual(
    occurrences.map((item) => item.startAt.slice(0, 10)),
    ["2026-01-06", "2026-01-13", "2026-01-15"],
  );
});

test("applyOccurrenceException moves or cancels one occurrence", () => {
  const occurrence = {
    id: "a",
    title: "Practice",
    startAt: "2026-01-06T17:30:00.000Z",
    endAt: "2026-01-06T19:00:00.000Z",
  };
  assert.equal(applyOccurrenceException(occurrence, { action: "cancel" }).status, "canceled");
  assert.equal(
    applyOccurrenceException(occurrence, {
      action: "move",
      startAt: "2026-01-07T17:30:00.000Z",
      endAt: "2026-01-07T19:00:00.000Z",
    }).startAt,
    "2026-01-07T17:30:00.000Z",
  );
});

test("detectScheduleConflicts catches overlapping venue and participant conflicts", () => {
  const conflicts = detectScheduleConflicts([
    {
      id: "a",
      title: "Practice",
      startAt: "2026-01-06T17:30:00.000Z",
      endAt: "2026-01-06T19:00:00.000Z",
      locationText: "Main Gym",
      participantIds: ["lara"],
    },
    {
      id: "b",
      title: "Dinner",
      startAt: "2026-01-06T18:00:00.000Z",
      endAt: "2026-01-06T19:30:00.000Z",
      locationText: "Main Gym",
      participantIds: ["lara"],
    },
  ]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].reason, "participant_overlap");
});

test("form validation, volunteer capacity, payment status, and ICS feed behave deterministically", () => {
  const [form] = generateDefaultForms("school", "class_party");
  assert.equal(validateFormSchema(form).ok, true);

  const slotResult = claimVolunteerSlotState(
    { quantityNeeded: 2 },
    [{ quantity: 1, status: "claimed" }],
    { guestName: "Alex", quantity: 2 },
  );
  assert.equal(slotResult.ok, false);

  const payment = markPaymentStatus({ title: "Team fee", status: "unpaid" }, "paid");
  assert.equal(payment.ok, true);
  assert.equal(payment.paymentRequest.status, "paid");

  const ics = buildIcsFeed({
    name: "Team Schedule",
    occurrences: [
      {
        id: "event-1",
        title: "Practice",
        startAt: "2026-01-06T17:30:00.000Z",
        endAt: "2026-01-06T19:00:00.000Z",
        locationText: "Main Gym",
      },
    ],
  });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Practice/);
  assert.match(ics, /LOCATION:Main Gym/);
});
