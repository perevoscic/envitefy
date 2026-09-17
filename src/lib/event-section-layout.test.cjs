const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "lucide-react") {
    const file = path.join(process.cwd(), "node_modules/lucide-react/dist/cjs/lucide-react.js");
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, "utf8"), file);
    return mod.exports;
  }
  return originalLoad.call(this, request, parent, isMain);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(
    this,
    request.startsWith("@/") ? path.join(process.cwd(), "src", request.slice(2)) : request,
    parent,
    ...rest,
  );
};
for (const extension of [".ts", ".tsx"])
  Module._extensions[extension] = (mod, file) =>
    mod._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        fileName: file,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
      file,
    );
Module._extensions[".css"] = (mod) => {
  mod.exports = new Proxy({}, { get: (_, key) => (key === "__esModule" ? false : String(key)) });
};
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const {
  normalizeEventSectionLayout,
  orderEventSections,
  changeEventSectionLayout,
  groupEventSectionRows,
} = require("./event-section-layout.ts");
const { buildTemplateDraftPayload } = require("./template-draft-payload.ts");
const {
  normalizeGymMeetEventData,
} = require("../components/gym-meet-templates/normalizeGymMeetEventData.ts");
const { GYM_MEET_TEMPLATE_LIBRARY } = require("../components/gym-meet-templates/registry.ts");
const GymnasticsProgram = require("../components/gym-meet-templates/GymnasticsProgram.tsx").default;
const {
  GYMNASTICS_PRESENTATIONS,
} = require("../components/gym-meet-templates/gymnasticsPresentations.ts");
const {
  EventSectionBuilderProvider,
  EventSectionCanvas,
  EventSectionsReadOnly,
} = require("../components/events/EventSectionBuilder.tsx");

test("legacy layouts retain their default order; untrusted layout values are bounded", () => {
  const sections = [
    { id: "details", content: "Keep me" },
    { id: "games", content: "Schedule" },
  ];
  assert.deepEqual(orderEventSections(sections), sections);
  assert.equal(normalizeEventSectionLayout({ version: 2 }), undefined);
  assert.deepEqual(
    normalizeEventSectionLayout({
      version: 1,
      order: ["games", "games", null, {}, "<script>"],
      hidden: "details",
      added: [],
    }),
    { version: 1, order: ["games"], hidden: [], added: [] },
  );
  assert.equal(
    normalizeEventSectionLayout({
      version: 1,
      order: Array.from({ length: 200 }, (_, i) => `section-${i}`),
    }).order.length,
    100,
  );
});

test("move, remove, restore and add preserve content and resolve insertion positions", () => {
  const sections = [
    { id: "details", content: "Original" },
    { id: "games", content: "Games" },
    { id: "rsvp", content: "Guest responses" },
  ];
  const snapshot = JSON.stringify(sections);
  const moved = changeEventSectionLayout(
    undefined,
    sections.map((s) => s.id),
    { type: "move", id: "rsvp", index: 0 },
  );
  assert.deepEqual(
    orderEventSections(sections, moved).map((s) => s.id),
    ["rsvp", "details", "games"],
  );
  const removed = changeEventSectionLayout(moved, moved.order, { type: "remove", id: "games" });
  assert.deepEqual(
    orderEventSections(sections, removed).map((s) => s.id),
    ["rsvp", "details"],
  );
  const restored = changeEventSectionLayout(removed, ["rsvp", "details"], {
    type: "add",
    id: "games",
    index: 1,
  });
  assert.deepEqual(
    orderEventSections(sections, restored).map((s) => s.id),
    ["rsvp", "games", "details"],
  );
  assert.equal(JSON.stringify(sections), snapshot);
  assert.deepEqual(
    orderEventSections([...sections, { id: "updates" }], moved).map((s) => s.id),
    ["rsvp", "details", "games", "updates"],
  );
});

test("resize and pair sections with complementary widths without changing their contents", () => {
  const sections = [
    { id: "details", content: "Original" },
    { id: "games", content: "Games" },
    { id: "rsvp", content: "Responses" },
  ];
  const original = JSON.stringify(sections);
  const ids = sections.map((section) => section.id);
  const resized = changeEventSectionLayout(undefined, ids, {
    type: "resize",
    id: "details",
    width: 8,
  });
  const paired = changeEventSectionLayout(resized, ids, {
    type: "pair",
    id: "rsvp",
    besideId: "details",
  });
  assert.deepEqual(paired.widths, { details: 8, rsvp: 4 });
  assert.deepEqual(
    groupEventSectionRows(sections, paired).map((row) => row.map((section) => section.id)),
    [["details", "rsvp"], ["games"]],
  );
  const half = changeEventSectionLayout(paired, paired.order, {
    type: "resize",
    id: "rsvp",
    width: 6,
  });
  assert.deepEqual(half.widths, { details: 6, rsvp: 6 });
  const full = changeEventSectionLayout(half, half.order, {
    type: "resize",
    id: "details",
    width: 12,
  });
  assert.deepEqual(full.pairs, []);
  assert.deepEqual(full.widths, { details: 12, rsvp: 12 });
  assert.equal(JSON.stringify(sections), original);
  assert.deepEqual(
    paired.widths,
    { details: 8, rsvp: 4 },
    "previous snapshots remain available for Undo",
  );
});

test("pairing can add, restore, replace a neighbor and move sections into their own rows", () => {
  const sections = ["details", "games", "updates", "rsvp"].map((id) => ({ id }));
  const paired = changeEventSectionLayout(undefined, ["details", "games", "updates"], {
    type: "pair",
    id: "rsvp",
    besideId: "details",
  });
  assert.deepEqual(paired.added, ["rsvp"]);
  const removed = changeEventSectionLayout(paired, paired.order, { type: "remove", id: "rsvp" });
  assert.deepEqual(
    groupEventSectionRows(sections, removed).map((row) => row.map((section) => section.id)),
    [["details"], ["games"], ["updates"]],
  );
  const restored = changeEventSectionLayout(removed, ["details", "games", "updates"], {
    type: "add",
    id: "rsvp",
    index: 1,
  });
  assert.deepEqual(restored.pairs, [["details", "rsvp"]]);
  const replaced = changeEventSectionLayout(restored, restored.order, {
    type: "pair",
    id: "games",
    besideId: "rsvp",
  });
  assert.deepEqual(replaced.pairs, [["rsvp", "games"]]);
  assert.equal(groupEventSectionRows(sections, replaced).flat().length, 4);
  const moved = changeEventSectionLayout(replaced, replaced.order, {
    type: "move",
    id: "games",
    index: 0,
  });
  assert.deepEqual(moved.pairs, []);
  assert.equal(groupEventSectionRows(sections, moved)[0][0].id, "games");
  const unpaired = changeEventSectionLayout(replaced, replaced.order, {
    type: "unpair",
    id: "rsvp",
  });
  assert.deepEqual(unpaired.pairs, []);
  assert.equal(unpaired.widths.games, 12);
  assert.equal(unpaired.widths.rsvp, 12);
});

test("untrusted column settings reject invalid sizes and duplicate or malformed pairs", () => {
  const layout = normalizeEventSectionLayout({
    version: 1,
    widths: { details: 8, games: 200, updates: "6", rsvp: -4 },
    pairs: [
      ["details", "games"],
      ["games", "rsvp"],
      ["rsvp", "rsvp"],
      ["<script>", "updates"],
      ["a", "b", "c"],
    ],
  });
  assert.deepEqual(layout.widths, { details: 8, games: 4 });
  assert.deepEqual(layout.pairs, [["details", "games"]]);
  const inheritedKey = normalizeEventSectionLayout({
    version: 1,
    pairs: [["constructor", "toString"]],
  });
  assert.equal(inheritedKey.widths.constructor, 6);
  assert.equal(inheritedKey.widths.toString, 6);
});

test("gymnastics explicit drafts preserve composition and every design respects saved order", () => {
  const layout = {
    version: 1,
    order: ["schedule", "meet-details", "venue-details"],
    hidden: ["venue-details"],
    added: ["schedule"],
    widths: { schedule: 8, "meet-details": 4 },
    pairs: [["schedule", "meet-details"]],
  };
  const payload = buildTemplateDraftPayload(
    {
      data: {
        title: "Club meet",
        createdVia: "simple-template",
        details: "Bring water",
        sectionLayout: layout,
      },
    },
    "gymnastics",
    "America/Chicago",
  );
  const saved = JSON.parse(JSON.stringify(payload));
  const model = normalizeGymMeetEventData({ eventData: saved.data, eventTitle: saved.title });
  assert.deepEqual(model.sectionLayout, layout);
  const sections = [
    {
      id: "meet-details",
      label: "Meet details",
      kind: "meet_overview",
      blocks: [{ id: "a", text: "Overview marker" }],
    },
    {
      id: "venue-details",
      label: "Venue",
      kind: "venue",
      blocks: [{ id: "b", text: "Venue marker" }],
    },
    {
      id: "schedule",
      label: "Schedule",
      kind: "schedule",
      blocks: [{ id: "c", text: "Schedule marker" }],
    },
  ];
  for (const design of GYM_MEET_TEMPLATE_LIBRARY) {
    const html = renderToStaticMarkup(
      React.createElement(GymnasticsProgram, {
        sections,
        presentation: GYMNASTICS_PRESENTATIONS[design.id],
        sectionLayout: model.sectionLayout,
        renderBlock: (block) => React.createElement("p", null, block.text),
      }),
    );
    assert.ok(html.indexOf("Schedule marker") < html.indexOf("Overview marker"), design.id);
    assert.ok(!html.includes("Venue marker"), design.id);
    assert.ok(!html.includes("data-editable-section"), design.id);
    assert.ok(!html.includes("Add section"), design.id);
    assert.ok(html.includes('data-section-row="schedule meet-details"'), design.id);
    assert.ok(html.includes('data-section-width="8"'), design.id);
    assert.ok(html.includes('data-section-width="4"'), design.id);
  }
});

test("editor empty sections are configurable and disappear from clean previews", () => {
  const layout = { version: 1, order: ["games"], hidden: [], added: ["games"] };
  const canvas = React.createElement(EventSectionCanvas, { sections: [] });
  const provider = (children) =>
    React.createElement(
      EventSectionBuilderProvider,
      {
        layout,
        onChange() {},
        catalog: [{ id: "games", label: "Game Schedule" }],
        renderEditor: () => null,
      },
      children,
    );
  const editable = renderToStaticMarkup(provider(canvas));
  assert.ok(editable.includes('data-editable-section="games"'));
  assert.ok(editable.includes("Edit section"));
  const readOnly = renderToStaticMarkup(
    provider(React.createElement(EventSectionsReadOnly, null, canvas)),
  );
  assert.ok(!readOnly.includes("data-editable-section"));
  assert.ok(!readOnly.includes("Add section at position"));
});

test("football publishes saved tab order and restores previously hidden attendance without touching responses", async () => {
  const { normalizeFootballEventData } = await import(
    "../components/football-discovery/normalizeFootballEventData.mjs"
  );
  const source = {
    title: "Club season",
    details: "Team notes",
    rsvpEnabled: true,
    footballHiddenSections: ["rsvp"],
    advancedSections: { games: { games: [{ opponent: "Visiting Tigers", date: "2026-10-17" }] } },
    sectionLayout: { version: 1, order: ["rsvp", "games", "details"], hidden: [], added: ["rsvp"] },
  };
  const original = JSON.stringify(source);
  const restored = normalizeFootballEventData({ eventData: JSON.parse(original) });
  assert.deepEqual(
    restored.navItems.slice(0, 3).map((item) => item.id),
    ["attendance", "games", "details"],
  );
  assert.equal(restored.attendance.visible, true);
  assert.equal(JSON.stringify(source), original);
});

test("authored gymnastics sections render from the actual editor fields for both manual and imported meets", () => {
  for (const imported of [false, true]) {
    const eventData = {
      createdVia: imported ? "meet-discovery" : "simple-template",
      ...(imported
        ? {
            discoverySource: {
              input: { type: "url" },
              publicPageSections: {
                travel: { visibility: "hidden" },
                documents: { visibility: "hidden" },
              },
            },
          }
        : {}),
      title: "Autumn invitational",
      venue: "Club arena",
      address: "123 Club Road",
      sectionLayout: {
        version: 1,
        order: [
          "announcements",
          "documents",
          "coaches",
          "hotels",
          "results",
          "admission",
          "schedule",
        ],
        hidden: [],
        added: [
          "announcements",
          "documents",
          "coaches",
          "hotels",
          "results",
          "admission",
          "schedule",
        ],
      },
      customFields: { admission: "Adults: $15" },
      advancedSections: {
        announcements: { announcements: [{ id: "update", text: "Bring your team spirit" }] },
        logistics: {
          hotelName: "Team Hotel",
          hotelAddress: "456 Hotel Road",
          parking: "Use the east lot",
          additionalDocuments: [
            { id: "packet", name: "Team packet", url: "https://example.com/team.pdf" },
          ],
        },
        meet: { scoresLink: "https://example.com/results" },
        coaches: { enabled: true, signIn: "Coach desk opens at 8am" },
        schedule: {
          enabled: true,
          days: [
            {
              id: "day",
              date: "October 17",
              shortDate: "Oct 17",
              sessions: [{ id: "session", label: "Level 5", startTime: "9:00", clubs: [] }],
            },
          ],
        },
      },
    };
    const snapshot = JSON.stringify(eventData);
    const model = normalizeGymMeetEventData({ eventData });
    const sections = model.discovery.sections;
    for (const id of [
      "announcements",
      "documents",
      "coaches",
      "hotels",
      "results",
      "admission",
      "traffic-parking",
    ])
      assert.ok(
        sections.some((section) => section.id === id),
        (imported ? "Imported " : "Manual ") + id,
      );
    assert.equal(
      sections.filter((section) =>
        JSON.stringify(section.blocks).includes("Bring your team spirit"),
      ).length,
      1,
    );
    assert.ok(
      JSON.stringify(sections.find((section) => section.id === "documents")).includes(
        "https://example.com/team.pdf",
      ),
    );
    assert.ok(
      JSON.stringify(sections.find((section) => section.id === "admission")).includes("15"),
    );
    assert.ok(
      JSON.stringify(sections.find((section) => section.id === "coaches")).includes("Coach desk"),
    );
    assert.equal(model.schedule.days[0].sessions[0].label, "Level 5");
    assert.equal(JSON.stringify(eventData), snapshot);
  }
});

test("saved imported meets enter the full section editor instead of a disconnected sidebar", () => {
  const { resolveEditHref } = require("../utils/event-edit-route.ts");
  assert.equal(
    resolveEditHref(
      "gym-1",
      {
        createdVia: "meet-discovery",
        category: "sport_gymnastics_schedule",
        discoverySource: { input: { type: "url" } },
      },
      "Club meet",
    ),
    "/event/gymnastics/customize?edit=gym-1",
  );
  assert.equal(
    resolveEditHref(
      "football-1",
      { category: "sport_football_season", discoverySource: { input: { type: "url" } } },
      "Club season",
    ),
    "/event/football/customize?edit=football-1",
  );
});

test("complete gymnastics guest pages render saved extra sections in order with hidden attendance", () => {
  const Renderer = require("../components/gym-meet-templates/GymMeetTemplateRenderer.tsx").default;
  const snapshot = buildTemplateDraftPayload(
    {
      data: {
        title: "Autumn Club Meet",
        venue: "Club Arena",
        sectionLayout: {
          version: 1,
          order: ["schedule", "announcements", "meet-details"],
          hidden: ["rsvp"],
          added: ["schedule", "announcements"],
        },
        rsvpEnabled: true,
        advancedSections: {
          schedule: {
            enabled: true,
            days: [
              {
                id: "day",
                date: "October 17",
                sessions: [
                  { id: "session", label: "Saved session marker", startTime: "09:00", clubs: [] },
                ],
              },
            ],
          },
          announcements: { announcements: [{ id: "update", text: "Saved update marker" }] },
        },
      },
    },
    "gymnastics",
    "America/Chicago",
  );
  for (const design of GYM_MEET_TEMPLATE_LIBRARY) {
    const model = normalizeGymMeetEventData({
      eventTitle: snapshot.title,
      eventData: { ...snapshot.data, pageTemplateId: design.id },
      rosterAthletes: [],
      navItems: [],
    });
    const html = renderToStaticMarkup(
      React.createElement(Renderer, {
        model,
        isReadOnly: true,
        suppressActionStrip: true,
        rsvpProps: { submitted: true },
      }),
    );
    assert.ok(html.includes("Saved session marker"), design.id);
    assert.ok(
      html.indexOf("Saved session marker") < html.indexOf("Saved update marker"),
      design.id,
    );
    assert.ok(!html.includes("Attendance updated."), design.id);
    assert.ok(!html.includes("data-editable-section"), design.id);
    assert.ok(!html.includes("Add section"), design.id);
    assert.ok(!html.includes("Reorder"), design.id);
  }
});

test("football saves column widths and renders a paired row as one accessible tab panel", async () => {
  const { normalizeFootballEventData } = await import(
    "../components/football-discovery/normalizeFootballEventData.mjs"
  );
  const FootballContent =
    require("../components/football-season-templates/FootballPageContent.tsx").default;
  const {
    default: FootballTabs,
    useFootballSectionTabs,
  } = require("../components/football-season-templates/FootballSectionTabs.tsx");
  const {
    FootballPageTextProvider,
  } = require("../components/football-season-templates/FootballPageText.tsx");
  const layout = changeEventSectionLayout(undefined, ["details", "games", "rsvp"], {
    type: "pair",
    id: "rsvp",
    besideId: "details",
  });
  const resized = changeEventSectionLayout(layout, layout.order, {
    type: "resize",
    id: "details",
    width: 8,
  });
  const payload = buildTemplateDraftPayload(
    {
      data: {
        title: "Club season",
        details: "Saved detail marker",
        rsvpEnabled: true,
        sectionLayout: resized,
        advancedSections: { games: { games: [{ opponent: "Visitors", date: "2027-10-17" }] } },
      },
    },
    "sport-events",
    "America/Chicago",
  );
  const model = normalizeFootballEventData({ eventData: JSON.parse(JSON.stringify(payload)).data });
  assert.deepEqual(model.sectionLayout, resized);
  assert.deepEqual(
    model.navItems.map((item) => item.id),
    ["details", "games"],
  );
  assert.deepEqual(
    model.navItems[0].members.map((item) => item.id),
    ["details", "attendance"],
  );
  function GuestPage() {
    const tabs = useFootballSectionTabs(model.navItems, false);
    assert.equal(
      tabs.panelId("attendance"),
      tabs.panelId("details"),
      "deep links to either section resolve to the paired panel",
    );
    return React.createElement(
      FootballPageTextProvider,
      { text: { "nav:details": "Team information", "nav:attendance": "Join us" } },
      React.createElement(FootballTabs, { tabs, activeClassName: "active", idleClassName: "idle" }),
      React.createElement(FootballContent, {
        sections: model.sections,
        sectionLayout: model.sectionLayout,
        tabs,
        chrome: {},
        schedule: { games: [] },
        attendance: model.attendance,
      }),
    );
  }
  const html = renderToStaticMarkup(React.createElement(GuestPage));
  assert.ok(html.includes("Team information + Join us"));
  assert.ok(html.includes('data-section-row="details rsvp"'));
  assert.ok(html.includes('data-section-width="8"'));
  assert.ok(html.includes('data-section-width="4"'));
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 2);
  assert.equal((html.match(/hidden=""/g) || []).length, 1);
  assert.equal((html.match(/Saved detail marker/g) || []).length, 1);
  assert.ok(!html.includes("Place beside"));
});
