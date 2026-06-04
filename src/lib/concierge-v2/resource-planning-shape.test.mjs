import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 resource planning creates resource, attendance, and template runtime tables", async () => {
  const storage = await readFile(new URL("./storage.ts", import.meta.url), "utf8");
  const source = await readFile(new URL("./resource-planning.ts", import.meta.url), "utf8");
  assert.match(storage, /create table if not exists venues/);
  assert.match(storage, /create table if not exists resources/);
  assert.match(storage, /create table if not exists resource_requirements/);
  assert.match(storage, /create table if not exists resource_assignments/);
  assert.match(storage, /create table if not exists attendance_records/);
  assert.match(storage, /create table if not exists event_templates/);
  assert.match(source, /getConciergeV2ResourcePlanningCenter/);
  assert.match(source, /createConciergeV2Resource/);
  assert.match(source, /assignConciergeV2Resource/);
  assert.match(source, /updateConciergeV2Attendance/);
  assert.match(source, /buildResourceConflicts/);
  assert.match(source, /ensureOwnerMembership/);
});

test("Concierge V2 ships system templates for the required event and activity types", async () => {
  const templates = await readFile(new URL("./system-templates.ts", import.meta.url), "utf8");
  for (const eventType of [
    "birthday",
    "baby_shower",
    "graduation",
    "school_field_trip",
    "spirit_week",
    "class_party",
    "fundraiser",
    "gymnastics_practice",
    "gymnastics_meet",
    "team_dinner",
    "uniform_pickup",
    "fee_deadline",
    "workshop_open_house",
  ]) {
    assert.match(templates, new RegExp(`eventType: "${eventType}"`));
  }
});

test("Concierge V2 resource APIs are flag-gated and expose create, assign, and attendance actions", async () => {
  const route = await readFile(
    new URL("../../app/api/concierge/events/[id]/resources/route.ts", import.meta.url),
    "utf8",
  );
  const assignmentsRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/resources/assignments/route.ts", import.meta.url),
    "utf8",
  );
  const attendanceRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/resources/attendance/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /ENABLE_RESOURCE_PLANNING/);
  assert.match(route, /getConciergeV2ResourcePlanningCenter/);
  assert.match(route, /createConciergeV2Resource/);
  assert.match(assignmentsRoute, /assignConciergeV2Resource/);
  assert.match(attendanceRoute, /updateConciergeV2Attendance/);
  assert.match(attendanceRoute, /resolveSessionUserId/);
});

test("Concierge V2 Resources UI exposes real planning and day-of check-in controls", async () => {
  const page = await readFile(new URL("../../app/concierge-v2/events/[id]/resources/page.tsx", import.meta.url), "utf8");
  const component = await readFile(
    new URL("../../app/concierge-v2/events/[id]/resources/ConciergeV2ResourcesClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(page, /ENABLE_RESOURCE_PLANNING/);
  assert.match(page, /getConciergeV2ResourcePlanningCenter/);
  assert.match(component, /Resource board/);
  assert.match(component, /Save resource/);
  assert.match(component, /Assign resource/);
  assert.match(component, /Day-of check-in/);
  assert.match(component, /Double-bookings to resolve/);
  assert.match(component, /Present/);
  assert.match(component, /Late/);
  assert.match(component, /Absent/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/resources/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/resources\/assignments/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/resources\/attendance/);
  assert.doesNotMatch(component, /\/api\/fake|Coming soon/);
});

test("Concierge V2 owner surfaces link to resource planning from each owner surface", async () => {
  const files = [
    "../../app/concierge-v2/ConciergeV2Client.tsx",
    "../../app/concierge-v2/events/[id]/schedule/ConciergeV2ScheduleHubClient.tsx",
    "../../app/concierge-v2/events/[id]/rsvp/ConciergeV2RsvpBoardClient.tsx",
    "../../app/concierge-v2/events/[id]/calendar/ConciergeV2CalendarCenterClient.tsx",
    "../../app/concierge-v2/events/[id]/ops/ConciergeV2OpsClient.tsx",
    "../../app/concierge-v2/events/[id]/imports/ConciergeV2ImportCenterClient.tsx",
    "../../app/concierge-v2/events/[id]/hub/ConciergeV2TeamClassHubClient.tsx",
    "../../app/event/[id]/page.tsx",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /\/resources/);
  }
});
