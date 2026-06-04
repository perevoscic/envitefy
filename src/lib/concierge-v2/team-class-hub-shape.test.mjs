import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Concierge V2 Team/Class Hub creates membership and participant runtime tables", async () => {
  const storage = await readFile(new URL("./storage.ts", import.meta.url), "utf8");
  const source = await readFile(new URL("./team-class-hub.ts", import.meta.url), "utf8");
  assert.match(storage, /create table if not exists memberships/);
  assert.match(storage, /create table if not exists families/);
  assert.match(storage, /create table if not exists family_guardians/);
  assert.match(storage, /create table if not exists participants/);
  assert.match(storage, /create table if not exists program_participants/);
  assert.match(source, /CONCIERGE_V2_WORKSPACE_ROLES/);
  assert.match(source, /ensureOwnerMembership/);
  assert.match(source, /requireHubAccess/);
  assert.match(source, /inviteConciergeV2HubMember/);
  assert.match(source, /createConciergeV2HubParticipant/);
});

test("Concierge V2 Team/Class Hub APIs are flag-gated and role-aware", async () => {
  const route = await readFile(
    new URL("../../app/api/concierge/events/[id]/hub/route.ts", import.meta.url),
    "utf8",
  );
  const membersRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/hub/members/route.ts", import.meta.url),
    "utf8",
  );
  const participantsRoute = await readFile(
    new URL("../../app/api/concierge/events/[id]/hub/participants/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /ENABLE_TEAM_CLASS_HUB/);
  assert.match(route, /getConciergeV2TeamClassHub/);
  assert.match(route, /resolveSessionUserId/);
  assert.match(membersRoute, /inviteConciergeV2HubMember/);
  assert.match(participantsRoute, /createConciergeV2HubParticipant/);
});

test("Concierge V2 Team/Class Hub UI exposes real roster and role actions", async () => {
  const component = await readFile(
    new URL("../../app/concierge-v2/events/[id]/hub/ConciergeV2TeamClassHubClient.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /Team hub/);
  assert.match(component, /Class hub/);
  assert.match(component, /Workspace roles/);
  assert.match(component, /Save member/);
  assert.match(component, /Add participant/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/hub/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/hub\/members/);
  assert.match(component, /\/api\/concierge\/events\/\$\{encodeURIComponent\(eventId\)\}\/hub\/participants/);
  assert.doesNotMatch(component, /\/api\/fake|Coming soon/);
});

test("Concierge V2 owner surfaces link to the Team/Class Hub", async () => {
  const files = [
    "../../app/concierge-v2/ConciergeV2Client.tsx",
    "../../app/concierge-v2/events/[id]/schedule/ConciergeV2ScheduleHubClient.tsx",
    "../../app/concierge-v2/events/[id]/rsvp/ConciergeV2RsvpBoardClient.tsx",
    "../../app/concierge-v2/events/[id]/calendar/ConciergeV2CalendarCenterClient.tsx",
    "../../app/concierge-v2/events/[id]/ops/ConciergeV2OpsClient.tsx",
    "../../app/concierge-v2/events/[id]/imports/ConciergeV2ImportCenterClient.tsx",
    "../../app/event/[id]/page.tsx",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /\/hub/);
  }
});
