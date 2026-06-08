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

test("parseConciergeInput extracts gymnastics packet level sessions when times are present", () => {
  const draft = parseConciergeInput(
    [
      "38th ANNUAL GASPARILLA CLASSIC",
      "February 20-22, 2026",
      "MEET SITE: World Equestrian Center - Expo Center 1 1284 NW 87th Ct. Rd, Ocala, FL",
      "USA Gymnastics Competition",
      "Level 7 Friday 8 AM",
      "Level 8 Saturday 1 PM",
    ].join("\n"),
    { referenceDate: "2026-01-10T12:00:00.000Z", sourceKind: "pdf_schedule" },
  );

  assert.equal(draft.eventType, "gymnastics_meet");
  assert.deepEqual(
    draft.occurrences.map((item) => [item.title, item.type, item.date, item.startAt]),
    [
      ["Level 7 Session", "meet_session", "2026-02-20", "2026-02-20T08:00:00.000Z"],
      ["Level 8 Session", "meet_session", "2026-02-21", "2026-02-21T13:00:00.000Z"],
    ],
  );
  assert.doesNotMatch(draft.missingFields.join(","), /gymnastics meet time/);
});

test("parseConciergeInput builds wedding weekend timelines, registry, travel notes, and RSVP", () => {
  const draft = parseConciergeInput(
    "Plan Sara and Daniel wedding weekend February 20-22, 2026 in Austin. Welcome drinks Friday at 7 PM, ceremony Saturday at 4 PM, reception follows. Hotel block and registry https://registry.example/sara-daniel.",
    { referenceDate: "2026-01-10T12:00:00.000Z" },
  );

  assert.equal(draft.mode, "social");
  assert.equal(draft.eventType, "wedding_weekend");
  assert.equal(draft.title, "Sara and Daniel Wedding Weekend");
  assert.deepEqual(
    draft.occurrences.map((item) => [item.type, item.date, item.startAt]),
    [
      ["welcome_drinks", "2026-02-20", "2026-02-20T19:00:00.000Z"],
      ["ceremony", "2026-02-21", "2026-02-21T16:00:00.000Z"],
      ["reception", "2026-02-21", "2026-02-21T17:00:00.000Z"],
    ],
  );
  assert.equal(draft.registryLinks[0].url, "https://registry.example/sara-daniel");
  assert.ok(draft.forms[0].fields.some((field) => field.key === "meal_choice"));
  assert.ok(draft.checklistItems.some((item) => /hotel block/i.test(item.title)));
});

test("parseConciergeInput creates football volunteer and family response defaults", () => {
  const draft = parseConciergeInput(
    "Create Woodland Tigers football season schedule with game days, concessions volunteers, gate help, and family RSVP.",
    { referenceDate: "2026-01-10T12:00:00.000Z" },
  );

  assert.equal(draft.mode, "sports");
  assert.equal(draft.eventType, "football_game_day");
  assert.equal(draft.title, "Woodland Tigers Team Schedule");
  assert.ok(draft.volunteerSlots.some((slot) => slot.title === "Concessions"));
  assert.ok(draft.forms[0].fields.some((field) => field.key === "player_name"));
  assert.ok(draft.checklistItems.some((item) => /volunteer/i.test(item.title)));
  assert.ok(draft.missingFields.includes("game dates"));
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

test("parseConciergeInput preserves explicit Live Card birthday details and output metadata", () => {
  const draft = parseConciergeInput(
    "Create a live card for Lara's 8th birthday movie night. It is at AMC Destin Commons on May 22 at 3 PM. Add RSVP, pizza after the movie, and a gift link placeholder.",
    { referenceDate: "2026-01-10T12:00:00.000Z" },
  );
  const payload = buildConciergeV2EventHistoryPayload({ draft });

  assert.equal(draft.eventType, "birthday_party");
  assert.match(draft.title, /Lara/i);
  assert.match(draft.occurrences[0].locationText, /AMC Destin Commons/i);
  assert.ok(draft.occurrences.some((item) => /pizza/i.test(item.title)));
  assert.ok(draft.registryLinks.some((link) => /gift/i.test(link.label)));
  assert.deepEqual(payload.data.requestedOutputs, ["live_card", "event_page"]);
  assert.equal(payload.data.productType, "live_card");
});

test("parseConciergeInput creates baby shower defaults with schedule and registry placeholder", () => {
  const draft = parseConciergeInput(
    "Create an event page for a baby shower for Judith and David in League City, Texas. Include RSVP, schedule, registry link placeholder, location, and a soft premium theme.",
    { referenceDate: "2026-01-10T12:00:00.000Z" },
  );

  assert.equal(draft.eventType, "baby_shower");
  assert.equal(draft.title, "Judith and David Baby Shower");
  assert.match(draft.locationText, /League City/i);
  assert.ok(draft.forms[0].fields.some((field) => field.key === "attending"));
  assert.ok(draft.occurrences.some((item) => /Guest Arrival/i.test(item.title)));
  assert.ok(draft.registryLinks.some((link) => /Registry/i.test(link.label)));
});

test("parseConciergeInput creates schedule-heavy gymnastics meet defaults without social templates", () => {
  const draft = parseConciergeInput(
    "Create a gymnastics meet event page for Livia's Spring Invitational. It is for parents, grandparents, teammates, and coaches. Include athlete check-in, warmups, march-in, two rotations, awards, team lunch, RSVP, directions, add-to-calendar, what to bring, and live updates.",
    { referenceDate: "2026-01-10T12:00:00.000Z" },
  );
  const fieldKeys = draft.forms.flatMap((form) => form.fields.map((field) => field.key));

  assert.equal(draft.mode, "gymnastics");
  assert.equal(draft.eventType, "gymnastics_meet");
  assert.equal(draft.title, "Livia's Spring Invitational");
  assert.ok(draft.occurrences.some((item) => /Athlete Check-in/i.test(item.title)));
  assert.ok(draft.occurrences.some((item) => /Rotation 2/i.test(item.title)));
  assert.ok(fieldKeys.includes("attending"));
  assert.ok(fieldKeys.includes("adult_count"));
  assert.ok(fieldKeys.includes("child_count"));
  assert.ok(fieldKeys.includes("athlete_name"));
  assert.ok(fieldKeys.includes("note"));
  assert.doesNotMatch(draft.title, /Birthday|Wedding|Baby Shower/i);
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
