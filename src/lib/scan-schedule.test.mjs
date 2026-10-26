import assert from "node:assert/strict";
import test from "node:test";
import { parsePracticeScheduleHeuristics } from "./ocr/practice-schedule.ts";
import {
  normalizeScanSchedule,
  scanScheduleFromOcr,
  scanScheduleWhen,
  scanScheduleHistoryFields,
  scanScheduleCalendarEvent,
} from "./scan-schedule.ts";
import { buildScanEventPageHistoryPayload } from "./scan-event-page.ts";
import { extractEventWebsiteSchedule } from "./event-website-schedule.ts";
import { extractSportsSchedule, hasSportsScheduleText } from "./ocr/sports-schedule.ts";

const practiceLines = [
  "Team Practice Schedule",
  "2026-2027 School Year",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Level 3 Group",
  "4:15-6:00 rec",
  "OFF",
  "4:15-6:00 rec",
  "OFF",
  "4:15-6:00 rec",
];
const games = [
  {
    title: "Panthers vs Cougars",
    start: "2026-09-18T19:00:00-05:00",
    end: "2026-09-18T21:00:00-05:00",
    location: "Home field",
  },
  {
    title: "Panthers at Tigers",
    start: "2026-09-25T19:00:00-05:00",
    end: "2026-09-25T21:00:00-05:00",
    location: "Tiger Stadium",
  },
];

test("OFF cells preserve all three practices and their correct weekdays through save and public reading", () => {
  const practiceSchedule = parsePracticeScheduleHeuristics(practiceLines, "America/Chicago");
  assert.ok(practiceSchedule);
  assert.deepEqual(
    practiceSchedule.groups[0].sessions.filter((s) => s.hasPractice).map((s) => s.day),
    ["MO", "WE", "FR"],
  );
  assert.deepEqual(
    practiceSchedule.groups[0].sessions
      .filter((s) => s.hasPractice)
      .map((s) => [s.startTime, s.endTime, s.note]),
    Array.from({ length: 3 }, () => ["16:15", "18:00", "rec"]),
  );
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    ocr: {
      category: "Sport Events",
      fieldsGuess: { title: "Team Practice Schedule", timezone: "America/Chicago" },
      practiceSchedule,
      ocrText: practiceLines.join("\n"),
    },
  });
  const reloaded = JSON.parse(JSON.stringify(payload.data));
  const rows = extractEventWebsiteSchedule(reloaded);
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => row.day),
    ["MO", "WE", "FR"],
  );
  assert.equal(reloaded.scanSchedule.timeframe, "2026-2027 School Year");
  assert.equal(payload.ownership, "owned");
  assert.equal(rows[0].startAt, null, "a weekly schedule must not invent a dated occurrence");
  assert.match(scanScheduleWhen(reloaded.scanSchedule.items[0]), /Every Monday · 4:15 PM–6:00 PM/);
});

test("consecutive OFF cells and a second group never shift table columns", () => {
  const parsed = parsePracticeScheduleHeuristics(
    [
      "Team Practice Schedule",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Level 3 Group",
      "OFF",
      "OFF",
      "16:30-18:30",
      "OFF",
      "OFF",
      "Level 4 Group",
      "17:00-19:00",
      "OFF",
      "OFF",
      "17:00-19:00",
      "OFF",
    ],
    "America/Chicago",
  );
  assert.deepEqual(
    parsed.groups.map((g) =>
      g.sessions.filter((s) => s.hasPractice).map((s) => [s.day, s.startTime]),
    ),
    [
      [["WE", "16:30"]],
      [
        ["MO", "17:00"],
        ["TH", "17:00"],
      ],
    ],
  );
});

test("a two-day practice table is supported", () => {
  const parsed = parsePracticeScheduleHeuristics(
    ["Team Practice Schedule", "Tue", "Thu", "Team Blue", "4:00-5:00 pm", "4:00-5:00 pm"],
    "America/Chicago",
  );
  assert.equal(parsed.groups[0].sessions.filter((s) => s.hasPractice).length, 2);
});

test("both extracted games survive the quick-page builder, JSON storage and public schedule", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    ocr: {
      category: "Sport Events",
      fieldsGuess: { title: "Panthers Football Season Schedule", timezone: "America/Chicago" },
      ocrText: "Panthers Football Season Schedule 2026",
      events: games,
      schedule: { games },
    },
  });
  const rows = extractEventWebsiteSchedule(JSON.parse(JSON.stringify(payload.data)));
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.title),
    games.map((row) => row.title),
  );
  assert.equal(rows[1].locationText, "Tiger Stadium");
  assert.equal(rows[0].startTime, "19:00");
  assert.equal(rows[0].startAt, "2026-09-19T00:00:00.000Z");
});

test("a 48-game season is not truncated, and explicit removal stays authoritative", () => {
  const schedule = scanScheduleFromOcr({
    schedule: {
      season: "Fall 2026",
      games: Array.from({ length: 48 }, (_, i) => ({ ...games[0], title: `Game ${i + 1}` })),
    },
  });
  assert.equal(schedule.items.length, 48);
  assert.equal(extractEventWebsiteSchedule({ scanSchedule: schedule }).length, 48);
  assert.deepEqual(
    extractEventWebsiteSchedule({ scanSchedule: schedule, publicEvent: { scheduleItems: [] } }),
    [],
  );
});

test("mixed schedules keep every practice and game, and missing times remain unknown", () => {
  const schedule = normalizeScanSchedule({
    title: "Team week",
    timezone: "America/Chicago",
    items: [
      {
        title: "Practice",
        type: "practice",
        day: "TUE",
        startTime: "17:00",
        endTime: "18:00",
        group: "JV",
      },
      { title: "Game", type: "game", date: "2026-10-03", homeAway: "away", opponent: "Tigers" },
    ],
  });
  assert.equal(schedule.items.length, 2);
  assert.equal(schedule.items[1].startAt, null);
  assert.match(scanScheduleWhen(schedule.items[1]), /Oct 3, 2026 · Time TBD/);
  assert.equal(normalizeScanSchedule({ items: [null, {}, "bad"] }), null);
  assert.equal(
    normalizeScanSchedule({ items: [{ title: "Bad date", date: "2026-02-30" }] }).items[0].date,
    null,
  );
});

test("sports analysis keeps a full model response and rejects truncated output", async (t) => {
  assert.ok(hasSportsScheduleText("Soccer season schedule\nSep 18 vs Cougars\nSep 25 at Tigers"));
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  t.after(() => {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  });
  const response = {
    title: "Soccer schedule",
    timezone: "America/Chicago",
    items: games.map((game) => ({ ...game, type: "game" })),
  };
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.match(JSON.parse(options.body).messages[0].content, /EVERY row/);
    return new Response(
      JSON.stringify({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(response) } }],
      }),
    );
  });
  assert.equal(
    (await extractSportsSchedule("Soccer season schedule", "America/Chicago", 5000)).items.length,
    2,
  );
  globalThis.fetch.mock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({ choices: [{ finish_reason: "length", message: { content: "{}" } }] }),
      ),
  );
  await assert.rejects(
    extractSportsSchedule("Soccer season schedule", "America/Chicago", 5000),
    /too long/,
  );
});

test("reviewed timing replaces stale primary event timing, including weekly-only edits", () => {
  const schedule = scanScheduleFromOcr({ schedule: { timezone: "America/Chicago", games } });
  schedule.items[0] = {
    ...schedule.items[0],
    date: "2026-10-10",
    startTime: "18:30",
    endTime: "20:30",
    startAt: null,
    endAt: null,
  };
  const reviewed = normalizeScanSchedule(schedule);
  const fields = scanScheduleHistoryFields(reviewed);
  assert.equal(fields.startISO, "2026-10-10T23:30:00.000Z");
  assert.equal(fields.start, fields.startAt);
  const weekly = normalizeScanSchedule({
    timezone: "America/Chicago",
    items: [{ title: "Practice", type: "practice", day: "MO", startTime: "16:00" }],
  });
  assert.equal(scanScheduleHistoryFields(weekly).startISO, null);
  assert.equal(scanScheduleHistoryFields(weekly).endISO, null);
});

test("school memo dates retain source precision, selection and identities after review", () => {
  const memo = normalizeScanSchedule({
    kind: "school-memo",
    title: "Weekly memo",
    issueDate: "2026-10-26",
    timezone: "America/Chicago",
    items: [
      { type: "event", title: "Spirit Week", date: "2026-10-26", endDate: "2026-10-30", yearInferred: true, sourceText: "Spirit Week October 26 - 30" },
      { type: "test", title: "Bible test", date: "2026-10-30", calendarSelected: false },
      { type: "test", title: "Spelling test", date: "2026-10-30" },
      { type: "event", title: "Pumpkin Day", date: "2026-10-30", startTime: "during lunch" },
      { type: "closure", title: "No School", date: "2026-11-11" },
    ],
  });
  assert.equal(memo.kind, "school-memo");
  assert.equal(memo.issueDate, "2026-10-26");
  assert.ok(memo.items.every((item) => item.startAt === null && item.endAt === null));
  assert.equal(memo.items[1].type, "test");
  assert.equal(memo.items[4].type, "closure");
  assert.match(scanScheduleWhen(memo.items[0]), /Oct 26, 2026–Oct 30, 2026/);
  const ids = memo.items.map((item) => item.id);
  assert.equal(new Set(ids).size, memo.items.length);
  memo.items[1].title = "Updated Bible test";
  memo.items[1].date = "2026-11-02";
  const reloaded = normalizeScanSchedule(JSON.parse(JSON.stringify({ ...memo, items: [...memo.items].reverse() })));
  assert.deepEqual(reloaded.items.map((item) => item.id), ids.reverse());
  const bible = reloaded.items.find((item) => item.type === "test" && item.title === "Updated Bible test");
  assert.equal(bible.calendarSelected, false);
  assert.equal(reloaded.items.at(-1).yearInferred, true);
  assert.equal(reloaded.items.at(-1).sourceText, "Spirit Week October 26 - 30");
  const fields = scanScheduleHistoryFields(reloaded);
  assert.equal(fields.startISO, null);
  assert.equal(fields.endISO, null);
  assert.equal(fields.scheduleLine, "5 dates");
});

test("a school memo without actionable dates remains a memo without calendar events", () => {
  const memo = normalizeScanSchedule({
    kind: "school-memo", title: "Class newsletter", issueDate: "2026-10-26",
    timezone: "America/Chicago", items: [],
  });
  assert.equal(memo.kind, "school-memo");
  assert.equal(memo.title, "Class newsletter");
  assert.equal(memo.issueDate, "2026-10-26");
  assert.deepEqual(memo.items, []);
  assert.equal(scanScheduleHistoryFields(memo).startISO, null);
  assert.equal(scanScheduleHistoryFields(memo).scheduleLine, "0 dates");
  assert.equal(normalizeScanSchedule({ title: "Team schedule", items: [] }), null);
});

test("school calendar adapter exports inclusive ranges and date-only items without inventing times", () => {
  for (const timezone of ["America/Chicago", "Pacific/Kiritimati", "Pacific/Honolulu"]) {
    const memo = normalizeScanSchedule({
      kind: "school-memo", timezone,
      items: [
        { id: "spirit", type: "event", title: "Spirit Week", date: "2026-10-26", endDate: "2026-10-30" },
        { id: "pumpkin", type: "event", title: "Pumpkin Day", date: "2026-10-30", notes: "During lunch" },
        { id: "bible", type: "test", title: "Bible test", date: "2026-10-30" },
        { id: "spelling", type: "test", title: "Spelling test", date: "2026-10-30" },
      ],
    });
    const events = memo.items.map((item) => scanScheduleCalendarEvent(item, memo, "saved-memo"));
    assert.deepEqual(events.map((event) => [event.start, event.end]), [
      ["2026-10-26", "2026-10-31"],
      ["2026-10-30", "2026-10-31"],
      ["2026-10-30", "2026-10-31"],
      ["2026-10-30", "2026-10-31"],
    ]);
    assert.ok(events.every((event) => event.allDay && event.recurrence === null && event.reminders.length === 0));
    assert.match(events[1].description, /During lunch/);
    assert.equal(new Set(events.map((event) => event.uid)).size, 4);
    assert.notEqual(events[2].uid, scanScheduleCalendarEvent(memo.items[2], memo, "other-memo").uid);
  }
});

test("calendar adapter leaves a missing timed end absent and excludes undated or cancelled rows", () => {
  const memo = normalizeScanSchedule({
    kind: "school-memo", timezone: "America/Chicago",
    items: [
      { title: "Meeting", type: "event", date: "2026-11-02", startTime: "15:30" },
      { title: "Undated homework", type: "deadline" },
      { title: "Cancelled test", type: "test", date: "2026-11-02", status: "cancelled" },
      { title: "Uncertain time", type: "test", date: "2026-11-02", startTime: "3 (AM/PM unspecified)" },
    ],
  });
  assert.equal(scanScheduleCalendarEvent(memo.items[0], memo).end, null);
  assert.equal(scanScheduleCalendarEvent(memo.items[0], memo).allDay, false);
  assert.equal(scanScheduleCalendarEvent(memo.items[1], memo), null);
  assert.equal(scanScheduleCalendarEvent(memo.items[2], memo), null);
  const uncertain = scanScheduleCalendarEvent(memo.items[3], memo);
  assert.equal(uncertain.allDay, true);
  assert.match(uncertain.description, /AM\/PM unspecified/);
});
