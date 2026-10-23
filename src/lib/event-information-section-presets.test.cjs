const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

const {
  EVENT_INFORMATION_SECTION_PRESETS: presets,
  availableEventInformationPresets,
} = loadTs("src/lib/event-information-section-presets.ts");

const expectedTitles = [
  "Schedule",
  "Venue & directions",
  "Parking & arrival",
  "Dress code",
  "What to bring",
  "Food & drinks",
  "Accessibility",
  "Travel & hotels",
  "Things to do",
  "FAQs",
  "Contact host",
  "Event updates",
];
const titlesFor = (sections) => availableEventInformationPresets(sections).map(({ title }) => title);

test("offers the twelve informational headings without prefilled event facts or functional sections", () => {
  assert.deepEqual(titlesFor([]), expectedTitles);
  assert.equal(new Set(presets.map(({ title }) => title)).size, 12);
  for (const preset of presets) {
    assert.equal(typeof preset.description, "string");
    assert.ok(preset.description.trim(), `${preset.title} explains what the host can add`);
    assert.ok(!Object.hasOwn(preset, "body"), `${preset.title} does not supply guest-visible facts`);
    assert.doesNotMatch(preset.title, /rsvp|registry|photo|map|live score|sign.?up/i);
  }
});

test("existing native identities retain their editor even when their displayed heading changes", () => {
  const sections = [
    { id: "wedding-schedule", label: "Our evening" },
    { id: "venue-details", label: "The pavilion" },
    { id: "traffic-parking", label: "Getting inside" },
    { id: "hotels", label: "Stay nearby" },
    { id: "attractions", label: "Explore with us" },
    { id: "announcements", label: "Latest news" },
  ];
  assert.deepEqual(titlesFor(sections), expectedTitles.filter((title) => ![
    "Schedule", "Venue & directions", "Parking & arrival", "Travel & hotels", "Things to do", "Event updates",
  ].includes(title)));
});

test("custom headings match without relying on their positional identity, case or punctuation", () => {
  const sections = [
    { id: "section:0", label: "  DRESS—CODE! " },
    { id: "section:1", label: "What to bring" },
    { id: "info:original", label: "Food & drinks" },
    { id: "section:3", label: "Frequently asked questions" },
    { id: "section:4", label: "HOST CONTACT" },
    { id: "section:5", label: "Travel & parking" },
  ];
  assert.deepEqual(titlesFor(sections), expectedTitles.filter((title) => ![
    "Dress code", "What to bring", "Food & drinks", "FAQs", "Contact host", "Parking & arrival",
  ].includes(title)));
});

test("retained hidden sections still reserve their starter and matching leaves stored entries untouched", () => {
  const retained = Object.freeze([
    Object.freeze({ id: "info:parking", label: "Parking & arrival", hidden: true }),
    Object.freeze({ id: "section:6", label: "Accessibility", hidden: true }),
    Object.freeze({ id: "schedule", label: "Schedule", hidden: false }),
  ]);
  const before = JSON.stringify(retained);
  assert.deepEqual(titlesFor(retained), expectedTitles.filter((title) => ![
    "Parking & arrival", "Accessibility", "Schedule",
  ].includes(title)));
  assert.equal(JSON.stringify(retained), before);
  assert.deepEqual(titlesFor([]), expectedTitles, "matching one page does not affect another page");
});

test("wedding template identities reuse native schedules, venue and travel editors", () => {
  const sections = [
    { id: "atelier-schedule", label: "Order of the evening" },
    { id: "location", label: "Garden Pavilion" },
    { id: "atelier-travel", label: "Getting here" },
    { id: "around-town", label: "Around town" },
  ];
  assert.deepEqual(titlesFor(sections), expectedTitles.filter((title) => ![
    "Schedule", "Venue & directions", "Travel & hotels", "Things to do",
  ].includes(title)));
});

test("related names and functional tools do not hide independent informational starters", () => {
  const sections = [
    { id: "games", label: "Game Schedule" },
    { id: "practice", label: "Practice Schedule" },
    { id: "logistics", label: "Travel & Logistics" },
    { id: "guest-planning", label: "Before you arrive" },
    { id: "rsvp", label: "Attendance / RSVP" },
    { id: "registry", label: "Registry" },
    { id: "photos", label: "Photo gallery" },
    { id: "roster", label: "Team Roster" },
    { id: "section:9", label: "Schedule a call with the host" },
  ];
  assert.deepEqual(titlesFor(sections), expectedTitles);
});
