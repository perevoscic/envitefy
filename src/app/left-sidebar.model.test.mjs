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

test("buildGroupedEventLists ports invited rows into My Events, prioritizes drafts, splits past events, and excludes owned signup forms", async () => {
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
          numberOfGuests: 24,
          startISO: "2030-04-12T12:00:00.000Z",
        },
      },
      {
        id: "past-1",
        title: "Old soccer game",
        created_at: "2020-04-01T00:00:00.000Z",
        data: {
          category: "sport_soccer",
          numberOfGuests: 12,
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
    canShowOwnerRsvpDashboard: (data) => Number(data?.numberOfGuests || 0) > 0,
  });

  assert.deepEqual(
    grouped.myEvents.upcoming.map((section) => section.category),
    ["Drafts", "Birthdays", "Baby Showers"]
  );
  assert.equal(grouped.myEvents.upcoming[0].items[0].row.id, "draft-1");
  const invitedItem = grouped.myEvents.upcoming
    .flatMap((section) => section.items)
    .find((item) => item.row.id === "invited-1");
  assert.ok(invitedItem);
  assert.equal(invitedItem.isInvited, true);
  assert.equal(invitedItem.openMode, "preview");
  assert.equal(invitedItem.shareStatus, "pending");
  assert.deepEqual(
    grouped.myEvents.past.flatMap((section) => section.items.map((item) => item.row.id)),
    ["past-1"]
  );
  assert.deepEqual(
    grouped.invitedEvents.upcoming.flatMap((section) =>
      section.items.map((item) => item.row.id)
    ),
    []
  );
  assert.equal(
    grouped.myEvents.upcoming.some((section) =>
      section.items.some((item) => item.row.id === "signup-1")
    ),
    false
  );
});

test("buildGroupedEventLists keeps concierge product hrefs but opens owner workspace", async () => {
  const { buildGroupedEventLists } = await loadModelModule();

  const grouped = buildGroupedEventLists({
    history: [
      {
        id: "live-card-1",
        title: "Live Card 1",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          createdVia: "concierge",
          primaryOutput: "live_card",
          coverImageUrl: "/event-media/live-card-1/card.webp",
          category: "birthday party",
          startISO: "2030-04-10T12:00:00.000Z",
        },
      },
      {
        id: "flyer-1",
        title: "Movie Flyer",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          createdVia: "concierge",
          requestedOutputs: ["rsvp_page", "digital_flyer"],
          category: "general_event",
          startISO: "2030-04-11T12:00:00.000Z",
        },
      },
      {
        id: "event-page-1",
        title: "Event Page 1",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          createdVia: "concierge",
          primaryOutput: "event_page",
          category: "general_event",
          startISO: "2030-04-12T12:00:00.000Z",
        },
      },
      {
        id: "legacy-live-1",
        title: "Create a live card for Mia's birthday",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          status: "draft",
          category: "birthday party",
          startISO: "2030-04-13T12:00:00.000Z",
        },
      },
    ],
    getEventStartIso: (data) => data?.startISO ?? null,
    buildEventPath: (eventId, title) => `/event/${eventId}-${title}`,
    isSportsPreviewFirstEvent: () => false,
    isInvitedEventLikeRecord: () => false,
    canShowOwnerRsvpDashboard: (data) => Number(data?.numberOfGuests || 0) > 0,
  });

  const items = grouped.myEvents.upcoming.flatMap((section) => section.items);
  const byId = new Map(items.map((item) => [item.row.id, item]));

  assert.equal(byId.get("live-card-1")?.href, "/card/live-card-1-live-card-1");
  assert.equal(byId.get("live-card-1")?.publicHref, "/card/live-card-1-live-card-1");
  assert.equal(byId.get("live-card-1")?.ownerHref, "/event/live-card-1-Live Card 1");
  assert.equal(byId.get("live-card-1")?.productKind, "card");
  assert.equal(byId.get("live-card-1")?.openMode, "dashboard");
  assert.equal(byId.get("flyer-1")?.href, "/card/movie-flyer-flyer-1");
  assert.equal(byId.get("flyer-1")?.ownerHref, "/event/flyer-1-Movie Flyer");
  assert.equal(byId.get("flyer-1")?.productKind, "card");
  assert.equal(byId.get("flyer-1")?.openMode, "dashboard");
  assert.equal(byId.get("event-page-1")?.href, "/event/event-page-1-Event Page 1");
  assert.equal(byId.get("event-page-1")?.publicHref, "/event/event-page-1-Event Page 1");
  assert.equal(byId.get("event-page-1")?.ownerHref, "/event/event-page-1-Event Page 1");
  assert.equal(byId.get("event-page-1")?.productKind, "event");
  assert.equal(byId.get("event-page-1")?.openMode, "dashboard");
  assert.equal(byId.get("legacy-live-1")?.href, "/card/create-a-live-card-for-mia-s-birthday-legacy-live-1");
  assert.equal(byId.get("legacy-live-1")?.openMode, "dashboard");
});

test("buildGroupedEventLists opens owner workspaces for created and owned uploaded events", async () => {
  const { buildGroupedEventLists } = await loadModelModule();

  const grouped = buildGroupedEventLists({
    history: [
      {
        id: "manual-rsvp",
        title: "Manual party",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          category: "birthday party",
          numberOfGuests: 20,
          startISO: "2030-04-10T12:00:00.000Z",
        },
      },
      {
        id: "manual-no-guests",
        title: "Manual no guests",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          category: "general_event",
          startISO: "2030-04-11T12:00:00.000Z",
        },
      },
      {
        id: "uploaded-rsvp",
        title: "Uploaded flyer",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          category: "general_event",
          createdVia: "ocr",
          numberOfGuests: 50,
          startISO: "2030-04-12T12:00:00.000Z",
        },
      },
      {
        id: "snapped-rsvp",
        title: "Snapped flyer",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          category: "general_event",
          numberOfGuests: 40,
          sourceContext: { type: "snap" },
          startISO: "2030-04-13T12:00:00.000Z",
        },
      },
      {
        id: "stored-media-rsvp",
        title: "Stored media flyer",
        created_at: "2030-04-01T00:00:00.000Z",
        data: {
          category: "general_event",
          numberOfGuests: 30,
          thumbnail: "/images/events/stored-media.webp",
          startISO: "2030-04-14T12:00:00.000Z",
        },
      },
    ],
    getEventStartIso: (data) => data?.startISO ?? null,
    buildEventPath: (eventId, title) => `/event/${eventId}-${title}`,
    isSportsPreviewFirstEvent: () => false,
    isInvitedEventLikeRecord: () => false,
    canShowOwnerRsvpDashboard: (data) =>
      Number(data?.numberOfGuests || 0) > 0 && !String(data?.createdVia || "").startsWith("ocr"),
  });

  const items = grouped.myEvents.upcoming.flatMap((section) => section.items);
  const byId = new Map(items.map((item) => [item.row.id, item]));

  assert.equal(byId.get("manual-rsvp")?.openMode, "dashboard");
  assert.equal(byId.get("manual-rsvp")?.hasOwnerRsvp, true);
  assert.equal(byId.get("manual-no-guests")?.openMode, "dashboard");
  assert.equal(byId.get("manual-no-guests")?.hasOwnerRsvp, false);
  assert.equal(byId.get("uploaded-rsvp")?.openMode, "dashboard");
  assert.equal(byId.get("uploaded-rsvp")?.hasOwnerRsvp, false);
  assert.equal(byId.get("snapped-rsvp")?.openMode, "dashboard");
  assert.equal(byId.get("stored-media-rsvp")?.openMode, "dashboard");
});

test("left sidebar opens non-RSVP owner events on the design workspace tab", () => {
  const controllerSource = fs.readFileSync(
    path.join(repoRoot, "src/app/left-sidebar.controller.ts"),
    "utf8"
  );

  assert.match(
    controllerSource,
    /const initialOwnerTab: EventContextTab = item\.hasOwnerRsvp \? "dashboard" : "design";/
  );
  assert.match(controllerSource, /setActiveEventTab\(initialOwnerTab\);/);
  assert.match(controllerSource, /buildEventOwnerHref\(ownerHref, row\.id, initialOwnerTab\)/);
});

test("left sidebar reopens My Events and selects newly created upload routes", () => {
  const controllerSource = fs.readFileSync(
    path.join(repoRoot, "src/app/left-sidebar.controller.ts"),
    "utf8"
  );

  assert.match(controllerSource, /type InferredEventListItem =/);
  assert.match(controllerSource, /const CREATED_EVENT_CONTEXT_STORAGE_KEY = "envitefy:created-event-context:v1";/);
  assert.match(controllerSource, /function readPendingCreatedEventContext\(\)/);
  assert.match(controllerSource, /function pendingCreatedEventMatchesPath\(/);
  assert.match(controllerSource, /const findEventListItemFromPath = useCallback/);
  assert.match(controllerSource, /const createdHint = String\(searchParams\?\.get\("created"\) \|\| ""\)/);
  assert.match(controllerSource, /if \(createdHint !== "true" && createdHint !== "1"\) return;/);
  assert.match(controllerSource, /if \(inferred && inferred\.source === "myEvents"\) \{/);
  assert.match(controllerSource, /const pending = readPendingCreatedEventContext\(\);/);
  assert.match(controllerSource, /if \(!pending \|\| !pendingCreatedEventMatchesPath\(pending, pathname\)\) return;/);
  assert.match(controllerSource, /setSelectedEventId\(row\.id\);/);
  assert.match(controllerSource, /setSelectedEventId\(pending\.id\);/);
  assert.match(controllerSource, /setSelectedEventTitle\(title\);/);
  assert.match(controllerSource, /setSelectedEventHref\(publicHref\);/);
  assert.match(controllerSource, /setSelectedEventOwnerHref\(ownerHref\);/);
  assert.match(controllerSource, /setActiveEventTab\("dashboard"\);/);
  assert.match(controllerSource, /setEventContextSourcePage\("myEvents"\);/);
  assert.match(controllerSource, /setSidebarPage\("myEvents"\);/);
});
