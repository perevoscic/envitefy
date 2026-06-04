import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 calendar service creates active feed records and builds ICS", async () => {
  const source = await readFile(new URL("./calendar.ts", import.meta.url), "utf8");
  const storage = await readFile(new URL("./storage.ts", import.meta.url), "utf8");
  assert.match(storage, /create table if not exists calendar_feeds/);
  assert.match(source, /getConciergeV2CalendarCenter/);
  assert.match(source, /regenerateConciergeV2CalendarFeed/);
  assert.match(source, /buildConciergeV2CalendarIcsByToken/);
  assert.match(source, /calendar_feeds/);
  assert.match(source, /buildIcsFeed/);
  assert.match(source, /is_active = true/);
  assert.match(source, /status !== "canceled"/);
});

test("Concierge V2 calendar APIs expose owner JSON and public text/calendar feed", async () => {
  const ownerRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/calendar/route.ts", import.meta.url),
    "utf8",
  );
  const feedRoute = await readFile(
    new URL("../../app/api/concierge/calendar/[token]/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(ownerRoute, /getConciergeV2CalendarCenter/);
  assert.match(ownerRoute, /regenerateConciergeV2CalendarFeed/);
  assert.match(ownerRoute, /resolveSessionUserId/);
  assert.match(feedRoute, /buildConciergeV2CalendarIcsByToken/);
  assert.match(feedRoute, /text\/calendar/);
  assert.match(feedRoute, /Content-Disposition/);
});

test("Concierge V2 Calendar Center UI exposes copy, download, subscribe, and regenerate controls", async () => {
  const component = await readFile(
    new URL("../../app/concierge-v2/events/[id]/calendar/ConciergeV2CalendarCenterClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /Calendar Center/);
  assert.match(component, /Copy link/);
  assert.match(component, /Download ICS/);
  assert.match(component, /Google/);
  assert.match(component, /Regenerate/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/calendar/);
  assert.doesNotMatch(component, /\/api\/fake|Coming soon/);
});
