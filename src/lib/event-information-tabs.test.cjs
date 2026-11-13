const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { eventInformationTabs } = loadTs("src/lib/event-information-tabs.ts");
const { changeEventSectionLayout, normalizeEventSectionLayout } = loadTs("src/lib/event-section-layout.ts");

const sections = [
  { id: "meet-details", label: "Meet Details" },
  { id: "venue-details", label: "Venue Details" },
  { id: "traffic-parking", label: "Travel & parking" },
  { id: "guest-planning", label: "Guest information" },
];

test("tabs match the page-section names and order without broad navigation groups", () => {
  assert.deepEqual(eventInformationTabs(sections), sections.map(section => ({ ...section, sectionIds: [section.id] })));
  assert.deepEqual(eventInformationTabs([...sections, { id: "info:notes", label: "Parent notes" }]).at(-1), {
    id: "info:notes", label: "Parent notes", sectionIds: ["info:notes"],
  });
});

test("section reorder, removal and restoration drive tabs across JSON reload without changing content", () => {
  const original = JSON.stringify(sections);
  let layout = changeEventSectionLayout(undefined, sections.map(section => section.id), { type: "move", id: "guest-planning", index: 0 });
  layout = changeEventSectionLayout(layout, layout.order, { type: "remove", id: "venue-details" });
  layout = normalizeEventSectionLayout(JSON.parse(JSON.stringify(layout)));
  assert.deepEqual(eventInformationTabs(sections, layout).map(tab => tab.label), ["Guest information", "Meet Details", "Travel & parking"]);
  layout = changeEventSectionLayout(layout, eventInformationTabs(sections, layout).map(tab => tab.id), { type: "add", id: "venue-details", index: 1 });
  assert.deepEqual(eventInformationTabs(sections, layout).map(tab => tab.label), ["Guest information", "Venue Details", "Meet Details", "Travel & parking"]);
  assert.equal(JSON.stringify(sections), original);
});

test("saved section pairs retain each tab and show the shared row from either tab", () => {
  const layout = normalizeEventSectionLayout({ version: 1, pairs: [["venue-details", "traffic-parking"]] });
  assert.deepEqual(eventInformationTabs(sections, layout)[1], {
    id: "venue-details", label: "Venue Details", sectionIds: ["venue-details", "traffic-parking"],
  });
  assert.deepEqual(eventInformationTabs(sections, layout)[2], {
    id: "traffic-parking", label: "Travel & parking", sectionIds: ["venue-details", "traffic-parking"],
  });
  assert.deepEqual(eventInformationTabs(sections, layout).map(tab => tab.label), sections.map(section => section.label));
});

test("empty added travel and document tabs survive saved guest-page reloads", () => {
  const layout = normalizeEventSectionLayout(JSON.parse(JSON.stringify({
    version: 1, order: ["meet-details", "documents", "traffic-parking"], hidden: [],
    added: ["documents", "traffic-parking"], pairs: [["meet-details", "documents"]],
  })));
  const tabs = eventInformationTabs([sections[0]], layout);
  assert.deepEqual(tabs.map(tab => tab.label), ["Meet Details", "Documents & links", "Travel & parking"]);
  assert.deepEqual(tabs[1].sectionIds, ["meet-details", "documents"]);
  assert.deepEqual(tabs[2].sectionIds, ["traffic-parking"]);
  layout.hidden.push("traffic-parking");
  assert.equal(eventInformationTabs([sections[0]], layout).length, 2);
});

test("legacy removed tab groups become restorable Page sections without re-hiding on reload", () => {
  let layout = normalizeEventSectionLayout({ version: 1, order: sections.map(section => section.id),
    hiddenInformationTabs: ["venue-parking", "tab:notes"],
    informationTabs: [{ id: "tab:notes", label: "Parent notes", sectionIds: ["info:notes"] }],
  });
  assert.ok(layout.hidden.includes("venue-details"));
  assert.ok(layout.hidden.includes("traffic-parking"));
  assert.ok(layout.hidden.includes("info:notes"));
  assert.equal(layout.hiddenInformationTabs, undefined);
  layout = changeEventSectionLayout(layout, ["meet-details", "guest-planning"], { type: "add", id: "venue-details", index: 1 });
  layout = normalizeEventSectionLayout(JSON.parse(JSON.stringify(layout)));
  assert.equal(eventInformationTabs(sections, layout)[1].label, "Venue Details");
  assert.ok(!layout.hidden.includes("venue-details"));
});
