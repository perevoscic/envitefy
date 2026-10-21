import assert from "node:assert/strict";
import fs from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith(".") &&
      !/\.[a-z]+$/i.test(specifier) &&
      context.parentURL?.startsWith("file:")
    ) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (fs.existsSync(fileURLToPath(url))) return next(url.href, context);
    }
    return next(specifier, context);
  },
});
const { llmExtractGymnasticsScheduleFromImage, llmExtractPracticeScheduleFromImage } = await import(
  "./openai.ts"
);
const { normalizeGymnasticsScheduleEvent } = await import("./schedule-contract.ts");
const { scanScheduleFromOcr } = await import("../scan-schedule.ts");
const originalKey = process.env.OPENAI_API_KEY;
test.beforeEach(() => {
  process.env.OPENAI_API_KEY = "offline-schedule-test";
});
test.afterEach(() => {
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
});
const event = {
  title: "Meet",
  start: null,
  end: null,
  allDay: true,
  location: null,
  description: null,
};
const gymnastics = { season: null, homeTeam: "Team", homeAddress: null, events: [event] };
const practice = { title: "Practice", timeframe: null, timezoneHint: null, groups: [] };

for (const [name, extract, output] of [
  ["gymnastics", llmExtractGymnasticsScheduleFromImage, gymnastics],
  ["practice", llmExtractPracticeScheduleFromImage, practice],
]) {
  test(`${name} sends valid Chat image parts and validates a complete structured response`, async (t) => {
    t.mock.method(console, "info", () => {});
    const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
      assert.equal(url, "https://api.openai.com/v1/chat/completions");
      const body = JSON.parse(options.body);
      assert.equal(body.response_format.type, "json_schema");
      assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(body.messages[1].content[1].type, "image_url");
      assert.equal(body.messages[1].content[1].image_url.detail, "high");
      return Response.json({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
      });
    });
    assert.ok(await extract(Buffer.from("fixture"), "image/png", "America/Chicago"));
    assert.equal(fetch.mock.callCount(), 1);
  });
}

test("missing and impossible meet dates remain unresolved through the schedule adapter", () => {
  for (const start of [null, "", "2026-02-30", "2026-13-01", "tomorrow"]) {
    const normalized = normalizeGymnasticsScheduleEvent({ ...event, start }, "America/Chicago");
    assert.equal(normalized.start, null);
    assert.equal(normalized.end, null);
    const schedule = scanScheduleFromOcr({
      events: [normalized],
      fieldsGuess: { timezone: "America/Chicago" },
    });
    assert.equal(schedule.items[0].date, null);
    assert.equal(schedule.items[0].startAt, null);
    assert.equal(schedule.items[0].endAt, null);
    assert.equal(schedule.items[0].title, "Meet");
  }
});

test("valid all-day dates use an exclusive calendar boundary and timed meets get no guessed end", () => {
  const allDay = normalizeGymnasticsScheduleEvent(
    { ...event, start: "2026-12-31" },
    "America/Chicago",
  );
  assert.equal(allDay.start, "2026-12-31T00:00:00.000Z");
  assert.equal(allDay.end, "2027-01-01T00:00:00.000Z");
  const timed = normalizeGymnasticsScheduleEvent(
    { ...event, allDay: false, start: "2026-10-24T16:00:00-05:00" },
    "America/Chicago",
  );
  assert.equal(timed.start, "2026-10-24T21:00:00.000Z");
  assert.equal(timed.end, null);
  assert.equal(
    normalizeGymnasticsScheduleEvent(
      { ...event, allDay: false, start: "2026-10-24" },
      "America/Chicago",
    ).start,
    null,
  );
  assert.equal(
    normalizeGymnasticsScheduleEvent(
      { ...event, start: "2026-10-24", end: "2026-10-23" },
      "America/Chicago",
    ).end,
    null,
  );
});

test("refused, truncated, malformed and schema-invalid schedule outputs never log success", async (t) => {
  const outcomes = [];
  t.mock.method(console, "info", (_name, entry) => outcomes.push(entry.outcome));
  for (const [choice, expected] of [
    [{ finish_reason: "stop", message: { refusal: "declined" } }, "refused"],
    [{ finish_reason: "length", message: { content: JSON.stringify(gymnastics) } }, "incomplete"],
    [{ finish_reason: "stop", message: { content: "{" } }, "invalid_output"],
    [{ finish_reason: "stop", message: { content: '{"events":"wrong"}' } }, "invalid_output"],
  ]) {
    t.mock.method(globalThis, "fetch", async () => Response.json({ choices: [choice] }));
    assert.equal(
      await llmExtractGymnasticsScheduleFromImage(Buffer.from("fixture"), "image/png", "UTC"),
      null,
    );
    assert.equal(outcomes.at(-1), expected);
  }
  assert.equal(outcomes.length, 4);
  assert.ok(!outcomes.includes("success"));
});
