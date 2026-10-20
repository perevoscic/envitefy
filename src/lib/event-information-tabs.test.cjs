const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { eventInformationTabs } = loadTs("src/lib/event-information-tabs.ts");

test("information tabs group source sections and retain custom information without event-specific names", () => {
  const tabs = eventInformationTabs([
    { id: "meet-details" },
    { id: "schedule-availability" },
    { id: "admission" },
    { id: "participating-clubs" },
    { id: "venue-details" },
    { id: "traffic-parking" },
    { id: "travel" },
    { id: "hotels" },
    { id: "attractions" },
    { id: "info:custom" },
  ]);
  assert.deepEqual(
    tabs.map((tab) => tab.label),
    ["Overview", "Schedule", "Teams", "Venue & Parking", "Hotels", "Explore"],
  );
  assert.deepEqual(tabs[0].sectionIds, ["meet-details", "admission", "info:custom"]);
  assert.deepEqual(tabs[3].sectionIds, ["venue-details", "traffic-parking", "travel"]);
  assert.deepEqual(tabs[4].sectionIds, ["hotels"]);
  assert.deepEqual(tabs[5].sectionIds, ["attractions"]);
  assert.equal(new Set(tabs.flatMap((tab) => tab.sectionIds)).size, 10);
});

test("tab grouping honors saved hiding, order and pairs, and omits empty tabs", () => {
  const tabs = eventInformationTabs(
    [
      { id: "meet-details" },
      { id: "schedule-availability" },
      { id: "participating-clubs" },
      { id: "hotels" },
      { id: "attractions" },
    ],
    {
      version: 1,
      order: [
        "hotels",
        "meet-details",
        "attractions",
        "participating-clubs",
        "schedule-availability",
      ],
      hidden: ["schedule-availability"],
      added: [],
      pairs: [["hotels", "meet-details"]],
    },
  );
  assert.deepEqual(
    tabs.map((tab) => tab.id),
    ["teams", "hotels", "explore"],
  );
  assert.deepEqual(tabs[1].sectionIds, ["hotels", "meet-details"]);
  assert.deepEqual(tabs[2].sectionIds, ["attractions"]);
  assert.deepEqual(
    eventInformationTabs([{ id: "schedule" }]).map((tab) => tab.id),
    ["schedule"],
  );
});
