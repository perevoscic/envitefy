import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("gymnastics schedule module keeps schedule detection heuristic", async () => {
  const source = await readFile(new URL("./gymnastics-schedule.ts", import.meta.url), "utf8");
  assert.match(source, /gymnastics/i);
  assert.match(source, /schedule/i);
  assert.match(source, /hasGymnasticsScheduleText/);
});

test("gymnastics schedule heuristic still emits all-day sport events", async () => {
  const source = await readFile(new URL("./gymnastics-schedule.ts", import.meta.url), "utf8");
  assert.match(source, /allDay:\s*true/);
  assert.match(source, /category:\s*"Sport Events"/);
  assert.match(source, /Gymnastics:\s*\$\{/);
});
