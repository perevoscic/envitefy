import assert from "node:assert/strict";
import test from "node:test";
import { parsePracticeScheduleHeuristics } from "./ocr/practice-schedule.ts";
import {
  normalizeScanSchedule,
  scanScheduleFromOcr,
  scanScheduleWhen,
  scanScheduleHistoryFields,
} from "./scan-schedule.ts";
import { buildScanEventPageHistoryPayload } from "./scan-event-page.ts";
import { extractEventWebsiteSchedule } from "./event-website-schedule.ts";
import { extractSportsSchedule, hasSportsScheduleText } from "./ocr/sports-schedule.ts";

import { fallbackExtractConciergeDraft } from "./concierge/fallback.ts";
import { buildConciergeHistoryPayload } from "./concierge/history-payload.ts";

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

test("Concierge upload rows survive follow-up turns, persistence and public reading", () => {
  const scanSchedule = scanScheduleFromOcr({
    schedule: { games },
    fieldsGuess: { title: "Panthers schedule", timezone: "America/Chicago" },
  });
  const draft = fallbackExtractConciergeDraft({
    message: "Create an event page from this team game schedule.",
    requestedOutputs: ["event_page"],
    ocrContext: {
      ocrText: "Panthers team game schedule",
      fieldsGuess: { title: "Panthers schedule", location: "Home field" },
      category: "Sport Events",
      scanSchedule,
    },
  });
  const next = fallbackExtractConciergeDraft({
    message: "Make it blue",
    draft: JSON.parse(JSON.stringify(draft)),
  });
  const payload = buildConciergeHistoryPayload(next);
  assert.equal(next.scanSchedule.items.length, 2);
  assert.equal(payload.data.scanSchedule.items.length, 2);
  assert.equal(extractEventWebsiteSchedule(JSON.parse(JSON.stringify(payload.data))).length, 2);
  assert.equal(payload.data.ownership, "owned");
});
