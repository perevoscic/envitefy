import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const loadModelModule = async () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "src/app/left-sidebar.model.ts"),
    "utf8"
  );
  const compiled = stripTypeScriptTypes(source);
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
  return import(moduleUrl);
};

test("buildGroupedEventLists buckets invited rows, prioritizes drafts, splits past events, and excludes owned signup forms", async () => {
  const { buildGroupedEventLists } = await loadModelModule();

  const grouped = buildGroupedEventLists({
    history: [
      {
        id: "draft-1",
        title: "Wedding draft",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          status: "draft",
          category: "weddings",
          startISO: "2030-04-10T12:00:00.000Z",
        },
      },
      {
        id: "birthday-1",
        title: "Birthday brunch",
        created_at: "2030-04-02T00:00:00.000Z",
        data: {
          category: "birthday party",
          startISO: "2030-04-12T12:00:00.000Z",
        },
      },
      {
        id: "past-1",
        title: "Old soccer game",
        created_at: "2020-04-01T00:00:00.000Z",
        data: {
          category: "sport_soccer",
          startISO: "2020-04-10T12:00:00.000Z",
        },
      },
      {
        id: "invited-1",
        title: "Shared baby shower",
        created_at: "2030-04-03T00:00:00.000Z",
        data: {
          ownership: "invited",
          shareStatus: "pending",
          category: "baby shower",
          startISO: "2030-04-14T12:00:00.000Z",
        },
      },
      {
        id: "signup-1",
        title: "Volunteer signup",
        created_at: "2030-04-03T00:00:00.000Z",
        data: {
          signupForm: true,
          category: "general_event",
          startISO: "2030-04-15T12:00:00.000Z",
        },
      },
    ],
    getEventStartIso: (data) => data?.startISO ?? null,
    buildEventPath: (eventId, title) => `/event/${eventId}-${title}`,
    isSportsPreviewFirstEvent: (data) => Boolean(data?.previewFirst),
    isInvitedEventLikeRecord: (record) =>
      record.ownership === "invited" || record.invitedFromScan === true,
  });

  assert.deepEqual(
    grouped.myEvents.upcoming.map((section) => section.category),
    ["Drafts", "Birthdays"]
  );
  assert.equal(grouped.myEvents.upcoming[0].items[0].row.id, "draft-1");
  assert.deepEqual(
    grouped.myEvents.past.flatMap((section) => section.items.map((item) => item.row.id)),
    ["past-1"]
  );
  assert.deepEqual(
    grouped.invitedEvents.upcoming.flatMap((section) =>
      section.items.map((item) => item.row.id)
    ),
    ["invited-1"]
  );
  assert.equal(grouped.invitedEvents.upcoming[0].items[0].shareStatus, "pending");
  assert.equal(
    grouped.myEvents.upcoming.some((section) =>
      section.items.some((item) => item.row.id === "signup-1")
    ),
    false
  );
});
