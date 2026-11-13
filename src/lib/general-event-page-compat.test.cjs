const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { generalTemplateEventPage, legacyGeneralEventPage } = load("src/lib/general-event-page-compat.ts");
const { normalizeCustomEventPage } = load("src/lib/event-custom-design.ts");
const { getGeneralCreationDesigns } = load("src/lib/create/event-page-collections.ts");

test("General, holiday and school artwork opens as a current Event Page with empty event facts", () => {
  for (const collection of [undefined, "holidays-seasonal", "school", "graduations", "housewarming", "open-house", "religious-events"]) {
    for (const design of getGeneralCreationDesigns(collection)) {
      const page = generalTemplateEventPage(design.id);
      assert.ok(normalizeCustomEventPage(page), design.id);
      assert.equal(page.artwork, design.artwork);
      assert.equal(page.sourceTemplateId, design.id);
      assert.equal(page.design.fontFamily, design.font || design.fontFamily);
      for (const key of ["title", "date", "time", "venue", "location", "host", "rsvpDeadline"]) assert.equal(page.details[key], "", `${design.id}: ${key}`);
    }
  }
  assert.equal(generalTemplateEventPage("missing-template"), null);
});

test("legacy saved General pages retain artwork, pending snapshot facts, disabled RSVP contacts and paired sections without writes", () => {
  const saved = {
    category: "General Events", title: "Saved title", heroImage: "https://media.example.test/saved.webp", date: "2027-04-10",
    rsvpEnabled: false, rsvpDeadline: "2027-04-01", rsvpName: "Reply host", rsvpEmail: "reply@example.test", rsvpPhone: "+1 555 123 4567",
    numberOfGuests: 7, responses: [{ id: "response-1" }],
    manualEditor: { path: "/event/general/customize", snapshot: {
      theme: { bgStyle: { backgroundColor: "#123456", color: "#ffffff" }, accentColor: "#654321" },
      data: { title: "Pending title", details: "Bring lunch.", bodyDesignId: "holidays--halloween--autumn-doorstep", extra: { parking: "North lot" } },
      pageComposition: { version: 1, titleFont: "anton", sections: [{ id: "info:a", title: "Schedule", body: "Arrive at noon." }, { id: "info:b", title: "Travel", body: "Use the shuttle." }],
        sectionLayout: { version: 1, order: ["details", "info:b", "info:a"], hidden: ["info:a"], added: ["info:b"], pairs: [["info:b", "info:a"]] } },
    } },
  };
  const before = JSON.stringify(saved);
  const page = legacyGeneralEventPage(saved);
  assert.ok(normalizeCustomEventPage(page));
  assert.equal(page.details.title, "Pending title");
  assert.equal(page.details.description, "Bring lunch.");
  assert.equal(page.artwork, saved.heroImage);
  assert.match(page.design.fontFamily, /Anton/);
  assert.deepEqual(page.design.colors, { page: "#123456", surface: "#123456", ink: "#ffffff", accent: "#654321" });
  assert.equal(page.details.rsvpEnabled, false);
  for (const key of ["rsvpName", "rsvpEmail", "rsvpPhone", "rsvpDeadline"]) assert.equal(page.details[key], saved[key]);
  assert.deepEqual(page.details.sectionLayout.order, ["overview", "section:1", "section:0"]);
  assert.deepEqual(page.details.sectionLayout.hidden, ["section:0"]);
  assert.deepEqual(page.details.sectionLayout.pairs, [["section:1", "section:0"]]);
  assert.deepEqual(page.details.sections.at(-1), { title: "parking", body: "North lot" });
  assert.equal(JSON.stringify(saved), before);
  assert.equal(legacyGeneralEventPage({ category: "Birthdays" }), null);
  assert.equal(legacyGeneralEventPage({ category: "General Events", createdVia: "livecard-builder" }), null);
});

test("legacy ISO dates retain event-local times and unknown zones cannot silently rewrite saved dates", () => {
  const page = legacyGeneralEventPage({ category: "General Events", timezone: "America/Chicago", timezoneSource: "location", timezoneLocation: "austin, tx", startISO: "2027-04-10T19:30:00.000Z", endISO: "2027-04-11T01:00:00.000Z" });
  assert.equal(page.details.date, "2027-04-10");
  assert.equal(page.details.time, "14:30");
  assert.equal(page.details.endDate, "2027-04-10");
  assert.equal(page.details.endTime, "20:00");
  assert.equal(page.details.timezoneSource, "location");
  assert.equal(page.details.timezoneLocation, "austin, tx");
  assert.throws(() => legacyGeneralEventPage({ category: "General Events", startISO: "2027-04-10T19:30:00.000Z" }), /original time zone/);
});

test("explicit contact clears survive legacy recovery and General edit links use the current editor", () => {
  const page = legacyGeneralEventPage({ category: "General Events", rsvpName: "", rsvpEmail: "", rsvpPhone: "", customFields: { rsvpName: "Stale", rsvpEmail: "stale@example.test" } });
  assert.equal(page.details.rsvpName, "");
  assert.equal(page.details.rsvpEmail, "");
  const { manualEventEditHref } = load("src/lib/manual-event-progress.ts");
  assert.equal(manualEventEditHref("same-event", { manualEditor: { path: "/event/general/customize" } }), "/event/design/customize?edit=same-event");
});

test("selecting another catalog design replaces its artwork while retaining pending event details", async () => {
  let written;
  const { prepareCreationEditor } = load("src/lib/create/editor-navigation.ts", {
    "./creation-intake": { writeCreationIntake: async value => (written = value) },
  });
  const [first, second] = getGeneralCreationDesigns("holidays-seasonal");
  const customPage = generalTemplateEventPage(first.id, { title: "Pending party", rsvpEnabled: false, rsvpEmail: "reply@example.test" });
  const template = { id: second.id, category: "general", family: "custom", href: `/event/design/customize?templateId=${second.id}` };
  const href = await prepareCreationEditor({ id: "same-intake", ownerId: "owner", customPage, editorFamily: "custom" }, template);
  assert.equal(written.customPage.sourceTemplateId, second.id);
  assert.equal(written.customPage.artwork, second.artwork);
  assert.equal(written.customPage.details.title, "Pending party");
  assert.equal(written.customPage.details.rsvpEmail, "reply@example.test");
  assert.equal(written.customPage.details.rsvpEnabled, false);
  assert.match(href, /intake=same-intake/);
  const retained = written.customPage;
  await prepareCreationEditor({ ...written, customPage: retained }, template);
  assert.equal(written.customPage, retained, "reopening the same design preserves mounted design changes");
});
