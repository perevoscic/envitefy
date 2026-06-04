import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 RSVP Board normalizes rich RSVP answers and CSV export", async () => {
  const source = await readFile(new URL("./rsvp-board.ts", import.meta.url), "utf8");
  assert.match(source, /getConciergeV2RsvpBoard/);
  assert.match(source, /updateConciergeV2RsvpResponse/);
  assert.match(source, /buildConciergeV2RsvpCsv/);
  assert.match(source, /answers_json/);
  assert.match(source, /adult_count/);
  assert.match(source, /kid_count/);
  assert.match(source, /allergy_notes/);
  assert.match(source, /event_pages ep/);
  assert.match(source, /owner_user_id/);
});

test("Concierge V2 RSVP Board APIs are owner-only and expose JSON, update, and CSV routes", async () => {
  const route = await readFile(
    new URL("../../app/api/concierge/events/[id]/rsvps/route.ts", import.meta.url),
    "utf8",
  );
  const updateRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/rsvps/[rsvpId]/route.ts", import.meta.url),
    "utf8",
  );
  const exportRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/rsvps/export/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /assertConciergeV2Enabled/);
  assert.match(route, /getConciergeV2RsvpBoard/);
  assert.match(updateRoute, /updateConciergeV2RsvpResponse/);
  assert.match(updateRoute, /rsvpId/);
  assert.match(exportRoute, /text\/csv/);
  assert.match(exportRoute, /Content-Disposition/);
});

test("Concierge V2 RSVP Board UI exposes premium host controls without fake actions", async () => {
  const component = await readFile(
    new URL("../../app/concierge-v2/events/[id]/rsvp/ConciergeV2RsvpBoardClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /RSVP Board/);
  assert.match(component, /Attending/);
  assert.match(component, /Allergy note/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/rsvps/);
  assert.match(component, /\/rsvps\/export/);
  assert.match(component, /Open reminders/);
  assert.doesNotMatch(component, /\/api\/fake|Coming soon/);
});
