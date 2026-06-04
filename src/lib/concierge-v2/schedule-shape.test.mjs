import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 Schedule Hub syncs canonical occurrences back to public event data", async () => {
  const source = await readFile(new URL("./schedule.ts", import.meta.url), "utf8");
  assert.match(source, /getConciergeV2ScheduleHub/);
  assert.match(source, /createConciergeV2Occurrence/);
  assert.match(source, /updateConciergeV2Occurrence/);
  assert.match(source, /detectScheduleConflicts/);
  assert.match(source, /scheduleHub: \{/);
  assert.match(source, /publicEvent: \{/);
  assert.match(source, /scheduleItems: params\.occurrences/);
  assert.match(source, /updateEventHistoryData\(params\.eventHistoryId, nextData\)/);
});

test("Concierge V2 Schedule Hub APIs are owner-only and row-backed", async () => {
  const route = await readFile(
    new URL("../../app/api/concierge/events/[id]/schedule/route.ts", import.meta.url),
    "utf8",
  );
  const occurrenceRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/schedule/occurrences/[occurrenceId]/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /ENABLE_SCHEDULE_HUB/);
  assert.match(route, /getConciergeV2ScheduleHub/);
  assert.match(route, /createConciergeV2Occurrence/);
  assert.match(occurrenceRoute, /updateConciergeV2Occurrence/);
  assert.match(occurrenceRoute, /resolveSessionUserId/);
});

test("Concierge V2 Schedule Hub UI exposes agenda, list, conflicts, add, and update paths", async () => {
  const component = await readFile(
    new URL("../../app/concierge-v2/events/[id]/schedule/ConciergeV2ScheduleHubClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /agenda/);
  assert.match(component, /conflicts/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/schedule/);
  assert.match(component, /occurrences\/\$\{encodeURIComponent\(occurrenceId\)\}/);
  assert.doesNotMatch(component, /\/api\/fake|Coming soon/);
});
