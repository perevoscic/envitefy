const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const {
  sourceUpdateCutoff,
  reviewSourceChanges,
  applySourceChanges,
  acceptedSourceBaseline,
  snapshotSourceFacts,
  snapshotWithSourceFacts,
  eventSourceUrl,
  readSourceUpdateState,
} = load("src/lib/event-source-updates.ts");

test("native aliases compare the visible host edits and applying another field retains names and unrelated controls", () => {
  for (const aliases of [
    { partyDetails: { notes: "Host description" }, headlineTitle: "Host title" },
    { babyDetails: { notes: "Host description" }, eventTitle: "Host title" },
    { story: "Host description", partner1: "Jane", partner2: "John" },
  ]) {
    const snapshot = {
      data: {
        title: "Stale imported title",
        details: "Stale imported description",
        address: "Old address",
        hosts: [
          { id: 1, name: "Host one", role: "Parent" },
          { id: 2, name: "Host two", role: "Parent" },
        ],
        ...aliases,
      },
    };
    const current = snapshotSourceFacts(snapshot);
    assert.equal(current.details, "Host description");
    assert.notEqual(current.title, "Stale imported title");
    const changes = reviewSourceChanges({ details: "Stale imported description" }, current, {
      details: "New source description",
    });
    assert.equal(changes[0].conflict, true);
    const next = snapshotWithSourceFacts(snapshot, { ...current, address: "New address" });
    assert.equal(next.data.address, "New address");
    assert.deepEqual(next.data.hosts, snapshot.data.hosts);
    assert.equal(next.data.partner1, snapshot.data.partner1);
    assert.equal(next.data.partner2, snapshot.data.partner2);
    assert.equal(next.data.details, snapshot.data.details);
  }
});

test("uncoded preliminary sessions match by gym and level; ambiguous rows require manual editing", () => {
  const previous = {
    advancedSections: {
      schedule: {
        days: [
          {
            id: "day",
            isoDate: "2027-04-10",
            sessions: [
              { id: "six", code: "", label: "Gym A", group: "Level 6", startTime: "" },
              { id: "seven", code: "", label: "Gym A", group: "Level 7", startTime: "" },
            ],
          },
        ],
      },
    },
  };
  const incoming = structuredClone(previous);
  incoming.advancedSections.schedule.days[0].sessions[1].startTime = "10:00";
  const changes = reviewSourceChanges(previous, previous, incoming);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].path.at(-1), "startTime");
  assert.equal(
    applySourceChanges(previous, changes).advancedSections.schedule.days[0].sessions[1].id,
    "seven",
  );
  const ambiguous = {
    sections: [
      { id: "one", title: "Schedule", body: "First" },
      { id: "two", title: "Schedule", body: "Second" },
    ],
  };
  const next = structuredClone(ambiguous);
  next.sections[0].body = "Changed";
  const review = reviewSourceChanges(ambiguous, ambiguous, next);
  assert.equal(review[0].manualReview, true);
  assert.equal(review[0].conflict, true);
  assert.throws(() => applySourceChanges(ambiguous, review), /cannot be matched reliably/);
});

test("end cutoff uses the inclusive final day in the event zone, exact timed ends, and conservative unknown dates", () => {
  assert.equal(
    sourceUpdateCutoff(
      { startISO: "2027-05-16T02:00:00Z", timezone: "America/Chicago" },
      Date.parse("2027-05-16T05:00:00Z"),
    ).ended,
    true,
  );
  assert.equal(
    sourceUpdateCutoff(
      {
        allDay: true,
        startISO: "2027-05-15T05:00:00Z",
        endISO: "2027-05-18T05:00:00Z",
        timezone: "America/Chicago",
      },
      Date.parse("2027-05-18T05:00:00Z"),
    ).ended,
    true,
  );
  const event = {
    date: "2027-03-13",
    endDate: "2027-03-14",
    timezone: "America/Chicago",
    allDay: true,
  };
  assert.equal(sourceUpdateCutoff(event, Date.parse("2027-03-15T04:59:59Z")).ended, false);
  assert.equal(sourceUpdateCutoff(event, Date.parse("2027-03-15T05:00:00Z")).ended, true);
  assert.equal(
    sourceUpdateCutoff(
      { ...event, endDate: undefined, gymnasticsDateVersion: 1, endISO: "2027-03-15" },
      Date.parse("2027-03-15T05:00:00Z"),
    ).ended,
    true,
  );
  assert.equal(
    sourceUpdateCutoff({ endAt: "2027-03-14T18:00:00-05:00" }, Date.parse("2027-03-14T23:00:00Z"))
      .ended,
    true,
  );
  assert.equal(sourceUpdateCutoff({ date: "2020-01-01", timezone: "invalid" }).ended, false);
  assert.equal(sourceUpdateCutoff({}).ended, false);
  assert.equal(
    sourceUpdateCutoff(
      { date: "2027-03-14", time: "10:00", timezone: "America/Chicago" },
      Date.parse("2027-03-14T20:00:00Z"),
    ).ended,
    false,
  );
});

test("review preserves host edits, flags disappeared facts, and advances only accepted baselines", () => {
  const previous = { title: "Meet", venue: "Arena", address: "Old road", details: "Bring water" };
  const current = { ...previous, venue: "Host venue" };
  const incoming = {
    title: "Meet",
    venue: "New arena",
    address: "New road",
    details: "",
    city: "Chicago",
  };
  const changes = reviewSourceChanges(previous, current, incoming);
  assert.equal(changes.find((c) => c.path[0] === "venue").conflict, true);
  assert.equal(changes.find((c) => c.path[0] === "address").conflict, false);
  assert.equal(changes.find((c) => c.path[0] === "details").kind, "removed");
  const selected = changes.filter((c) => c.path[0] === "address");
  assert.deepEqual(applySourceChanges(current, selected), { ...current, address: "New road" });
  const baseline = acceptedSourceBaseline(previous, selected);
  assert.equal(baseline.venue, "Arena");
  assert.equal(
    reviewSourceChanges(baseline, { ...current, address: "New road" }, incoming).some(
      (c) => c.path[0] === "venue",
    ),
    true,
  );
  assert.throws(
    () => applySourceChanges({ ...current, address: "Edited during review" }, selected),
    /changed while/,
  );
});

test("schedule updates match session codes rather than time, retain IDs, clubs and host notes, and repeat without duplicates", () => {
  const session = {
    id: "source-session",
    code: "A1",
    label: "Gym A",
    group: "Level 6",
    startTime: "09:00",
    note: "Original",
    clubs: [{ id: "club", name: "Host Gym", athleteCount: 12 }],
  };
  const previous = {
    advancedSections: {
      schedule: { days: [{ id: "source-day", isoDate: "2027-04-10", sessions: [session] }] },
    },
  };
  const current = structuredClone(previous);
  current.advancedSections.schedule.days[0].id = "saved-day";
  const mounted = current.advancedSections.schedule.days[0].sessions[0];
  mounted.id = "saved-session";
  mounted.note = "Host instructions";
  const incoming = structuredClone(previous);
  incoming.advancedSections.schedule.days[0].sessions[0].startTime = "10:00";
  incoming.advancedSections.schedule.importSources = [
    {
      id: "fresh-document",
      fileName: "schedule.pdf",
      text: "A1 starts at 10:00",
      url: "https://example.com/schedule.pdf",
    },
  ];
  incoming.advancedSections.schedule.days[0].sessions[0].source = {
    importId: "fresh-document",
    fileName: "schedule.pdf",
  };
  incoming.advancedSections.schedule.days[0].sessions.push({
    id: "new-session",
    code: "A2",
    label: "Gym A",
    group: "Level 7",
    startTime: "",
    clubs: [],
  });
  const changes = reviewSourceChanges(previous, current, incoming);
  assert.equal(changes.length, 2);
  const updated = applySourceChanges(current, changes, incoming);
  const day = updated.advancedSections.schedule.days[0];
  assert.equal(day.id, "saved-day");
  assert.equal(day.sessions[0].id, "saved-session");
  assert.equal(day.sessions[0].startTime, "10:00");
  assert.equal(
    day.sessions[0].source.importId,
    updated.advancedSections.schedule.importSources[0].id,
  );
  assert.equal(updated.advancedSections.schedule.importSources[0].text, "A1 starts at 10:00");
  assert.equal(day.sessions[0].note, "Host instructions");
  assert.equal(day.sessions[0].clubs[0].athleteCount, 12);
  assert.equal(day.sessions[1].startTime, "");
  assert.deepEqual(
    reviewSourceChanges(acceptedSourceBaseline(previous, changes), updated, incoming),
    [],
  );
});

test("older imports with no baseline compare existing session leaves instead of replacing a host's whole day", () => {
  const current = {
    advancedSections: {
      schedule: {
        days: [
          {
            id: "saved",
            isoDate: "2027-04-10",
            sessions: [
              { id: "session", code: "A1", startTime: "09:00", note: "Host" },
              { id: "host", code: "B1", note: "Keep" },
            ],
          },
        ],
      },
    },
  };
  const incoming = {
    advancedSections: {
      schedule: {
        days: [
          {
            id: "new",
            isoDate: "2027-04-10",
            sessions: [{ id: "new-session", code: "A1", startTime: "10:00", note: "" }],
          },
        ],
      },
    },
  };
  const changes = reviewSourceChanges(undefined, current, incoming);
  assert.equal(changes.find((c) => c.path.at(-1) === "startTime").conflict, true);
  const updated = applySourceChanges(
    current,
    changes.filter((c) => c.path.at(-1) === "startTime"),
  );
  assert.equal(updated.advancedSections.schedule.days[0].sessions.length, 2);
  assert.equal(updated.advancedSections.schedule.days[0].sessions[0].note, "Host");
  const baseline = acceptedSourceBaseline(
    undefined,
    changes.filter((c) => c.path.at(-1) === "startTime"),
  );
  assert.equal(
    reviewSourceChanges(baseline, updated, incoming).some((c) => c.path.at(-1) === "startTime"),
    false,
  );
});

test("custom and native snapshot adapters preserve design, artwork, host sections and metadata", () => {
  const snapshot = {
    page: {
      artwork: "/saved.webp",
      design: { colors: { page: "#111b3a" } },
      details: {
        title: "Meet",
        description: "Old",
        location: "Old address",
        sections: [{ title: "Parking", body: "Host" }],
      },
    },
  };
  const facts = snapshotSourceFacts(snapshot);
  const updated = snapshotWithSourceFacts(snapshot, {
    ...facts,
    details: "New",
    address: "New address",
  });
  assert.equal(updated.page.details.description, "New");
  assert.equal(updated.page.details.location, "New address");
  assert.deepEqual(updated.page.design, snapshot.page.design);
  assert.equal(updated.page.artwork, snapshot.page.artwork);
  assert.deepEqual(updated.page.details.sections, snapshot.page.details.sections);
  const native = {
    data: { title: "Meet", hero: "/saved.webp", importedTheme: { enabled: true } },
    advancedState: { schedule: { enabled: false, days: [] } },
    discoverySource: { input: { type: "url", url: "https://example.com/meet" } },
  };
  const next = snapshotWithSourceFacts(native, {
    ...snapshotSourceFacts(native),
    title: "Updated",
  });
  assert.equal(next.data.hero, native.data.hero);
  assert.equal(next.advancedState.schedule.enabled, false);
  assert.equal(
    eventSourceUrl({ discoverySource: native.discoverySource }),
    "https://example.com/meet",
  );
  assert.equal(eventSourceUrl({ sourceUpdates: { version: 1, url: "javascript:alert(1)" } }), "");
  assert.deepEqual(
    readSourceUpdateState({
      version: 1,
      url: "https://example.com/",
      facts: { websiteImport: { schedule: { notice: "New" } }, title: "Meet" },
    }).facts.websiteImport.schedule.notice,
    "New",
  );
});
