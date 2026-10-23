const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === "lucide-react") return new Proxy({}, { get: () => () => null });
  return originalLoad.call(this, request, ...rest);
};
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(
    this,
    request.startsWith("@/") ? path.resolve("src", request.slice(2)) : request,
    parent,
    ...rest,
  );
};
for (const extension of [".ts", ".tsx"])
  Module._extensions[extension] = (module, filename) =>
    module._compile(
      ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
Module._extensions[".css"] = (module) => {
  module.exports = new Proxy({}, { get: (_, key) => String(key) });
};
const { normalizeEventPageComposition } = require("./event-page-composition.ts");
const { EVENT_DESIGN_LAYOUTS } = require("./event-custom-design.ts");
const { buildTemplateDraftPayload } = require("./template-draft-payload.ts");
const {
  EventPageCompositionProvider,
} = require("../components/events/EventPageCompositionContext.tsx");
const Body = require("../components/events/EventPageSections.tsx").default;
const NativeBody = require("../components/events/EventPageNativeSections.tsx").default;
const Signature = require("../app/event/weddings/_renderers/signature-wedding-layouts.tsx").default;
const h = React.createElement;
test("imported native information retains provider maps, attribution and unconfirmed markers", () => {
  const map = { version: 1, sourceImage: "data:image/webp;base64,YQ==", mapImage: "data:image/webp;base64,YQ==", status: "ready", view: { latitude: 30, longitude: -85, zoom: 16, width: 960, height: 640 }, markers: [{ label: "East parking", kind: "parking", note: "Use the entrance.", point: { x: 0.5, y: 0.5 }, confirmed: false }] };
  const value = normalizeEventPageComposition({ version: 1, sections: [{ id: "info:arrival", title: "Arrival", body: "Keep this instruction.", map }] });
  assert.deepEqual(value.sections[0].map, map);
  const html = renderToStaticMarkup(h(EventPageCompositionProvider, { value }, h(Body, null)));
  assert.match(html, /Street map of the event area/);
  assert.match(html, /East parking/);
  assert.match(html, /Keep this instruction/);
  assert.ok(!html.includes("destination="), "Unconfirmed source positions never become directions");
});
const composition = {
  version: 1,
  layout: "cards",
  sections: [
    {
      id: "info:parking",
      title: "Travel & parking",
      body: "Use the east lot. <script>untrusted</script>",
    },
  ],
  sectionLayout: {
    version: 1,
    order: ["info:parking", "schedule", "details"],
    hidden: ["details"],
    added: ["info:parking"],
  },
};
const nativeSections = () => [
  h(
    "section",
    { id: "details", key: "details" },
    h("h2", null, "Details"),
    h("p", null, "Keep this stored description."),
  ),
  h(
    "section",
    { id: "schedule", key: "schedule" },
    h("h2", null, "Schedule"),
    h("a", { href: "https://example.com/program" }, "View program"),
  ),
];

test("composition validation bounds uploaded content and keeps only supported identities and layouts", () => {
  assert.equal(normalizeEventPageComposition(null), undefined);
  assert.equal(normalizeEventPageComposition({ version: 2, sections: [] }), undefined);
  assert.equal(
    normalizeEventPageComposition({ version: 1, layout: "unknown", sections: [] }),
    undefined,
  );
  const value = normalizeEventPageComposition({
    ...composition,
    sections: [
      ...composition.sections,
      composition.sections[0],
      { id: "__proto__", title: "invalid", body: "invalid" },
    ],
  });
  assert.deepEqual(value, composition);
  assert.equal(
    normalizeEventPageComposition({
      version: 1,
      sections: Array.from({ length: 25 }, (_, i) => ({
        id: `info:${i}`,
        title: "t".repeat(300),
        body: "b".repeat(13000),
      })),
    }).sections.length,
    20,
  );
});

test("guest rendering keeps saved order, hidden data, links and safe text in every layout", () => {
  for (const layout of EVENT_DESIGN_LAYOUTS) {
    const html = renderToStaticMarkup(
      h(
        EventPageCompositionProvider,
        { value: { ...composition, layout } },
        h(Body, null, nativeSections()),
      ),
    );
    assert.ok(html.includes(`data-event-body-layout="${layout}"`));
    assert.ok(html.indexOf("Travel &amp; parking") < html.indexOf("View program"));
    assert.ok(!html.includes("Keep this stored description."));
    assert.ok(html.includes('href="https://example.com/program"'));
    assert.ok(html.includes("&lt;script&gt;untrusted&lt;/script&gt;"));
    assert.ok(!html.includes("<script>"));
    assert.ok(
      !html.includes("Edit section") && !html.includes("Move up") && !html.includes("Add section"),
    );
  }
});

test("native galleries and resource links retain guest order, escaped text and hidden-section behavior", () => {
  const raw = {
    version: 1,
    sections: [
      { id: "info:photos", title: "Event photos", body: "Two memories.", kind: "photos", photos: [
        { url: "/api/blob/event-media/first.webp", caption: "Arrival <script>untrusted</script>" },
        { url: "javascript:alert(1)", caption: "Unsafe image" },
        { url: "https://example.com/second.webp", caption: "Friends & family" },
      ] },
      { id: "info:links", title: "Useful resources", body: "Plan your visit.", kind: "links", links: [
        { label: "Venue & directions", url: "https://example.com/venue" },
        { label: "<em>Program</em>", url: "http://example.com/program" },
        { label: "Finish this draft later", url: "" },
        { label: "Unsafe link", url: "javascript:alert(1)" },
      ] },
      { id: "info:legacy", title: "Original information", body: "Keep the original body." },
      { id: "info:hidden", title: "Hidden gallery", body: "Hidden information.", kind: "photos", photos: [
        { url: "/api/blob/event-media/hidden.webp", caption: "Hidden photo" },
      ] },
    ],
    sectionLayout: { version: 1, order: ["info:links", "info:photos", "info:legacy", "info:hidden"], hidden: ["info:hidden"], added: [] },
  };
  const before = structuredClone(raw);
  const restored = normalizeEventPageComposition(JSON.parse(JSON.stringify(raw)));
  assert.deepEqual(restored.sections[2], raw.sections[2], "legacy heading/body has no new media fields");
  assert.equal(restored.sections[3].photos[0].caption, "Hidden photo", "hidden gallery data is retained");
  for (const layout of EVENT_DESIGN_LAYOUTS) {
    const html = renderToStaticMarkup(h(EventPageCompositionProvider, { value: { ...restored, layout } }, h(Body)));
    const photos = [...html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)].map(([figure]) => figure);
    assert.equal(photos.length, 2, layout);
    assert.match(photos[0], /src="\/api\/blob\/event-media\/first.webp"/);
    assert.match(photos[0], /<figcaption>Arrival &lt;script&gt;untrusted&lt;\/script&gt;<\/figcaption>/);
    assert.match(photos[1], /src="https:\/\/example.com\/second.webp"/);
    assert.match(photos[1], /<figcaption>Friends &amp; family<\/figcaption>/);
    assert.match(html, /<a href="https:\/\/example.com\/venue" target="_blank" rel="noopener noreferrer">Venue &amp; directions<\/a>/);
    assert.match(html, /<a href="http:\/\/example.com\/program" target="_blank" rel="noopener noreferrer">&lt;em&gt;Program&lt;\/em&gt;<\/a>/);
    assert.ok(html.indexOf("Useful resources") < html.indexOf("Event photos"), layout);
    assert.ok(html.indexOf("Event photos") < html.indexOf("Original information"), layout);
    assert.match(html, /<h2>Original information<\/h2><p>Keep the original body\.<\/p>/);
    assert.doesNotMatch(html, /Hidden gallery|Hidden information|hidden\.webp|Hidden photo|Finish this draft later|Unsafe image|Unsafe link|javascript:|<script>|<em>/);
  }
  assert.deepEqual(raw, before, "rendering and normalization leave the input untouched");
});

test("old pages retain original markup and template drafts retain composition separately from category fields", () => {
  const original = h("main", { className: "original-design" }, nativeSections());
  assert.equal(
    renderToStaticMarkup(h(EventPageCompositionProvider, {}, h(NativeBody, null, original))),
    renderToStaticMarkup(original),
  );
  const snapshot = {
    data: { childName: "Olivia", age: "6", partyDetails: { theme: "Garden" } },
    pageComposition: composition,
  };
  const draft = buildTemplateDraftPayload(snapshot, "birthdays", "America/Chicago");
  assert.deepEqual(draft.data.eventPageComposition, composition);
  assert.deepEqual(draft.data.partyDetails, snapshot.data.partyDetails);
  assert.deepEqual(draft.data.age, "6");
});

test("a public hero-only choice preserves the native body containers and supplemental sections", () => {
  const hero = require("./event-hero-layout.ts").DEFAULT_EVENT_HERO_LAYOUT;
  const main = h("main", { className: "native-two-column-body" }, h("div", { className: "native-section-wrapper" }, nativeSections()));
  const supplemental = h("section", { className: "native-supplemental" }, "Original extra information.");
  const page = h(NativeBody, {
    heroArtwork: h("img", { src: "/test/hero.webp", alt: "" }),
    heroCopy: h("h1", null, "Your event"),
    supplemental,
  }, h("header", null, h("h1", null, "Your event")), main);
  const html = renderToStaticMarkup(h(EventPageCompositionProvider, { value: { version: 1, sections: [], hero } }, page));
  assert.match(html, /data-event-hero=""/);
  assert.ok(html.includes(renderToStaticMarkup(main)), "native main and its nested section containers remain exact");
  assert.ok(html.includes(renderToStaticMarkup(supplemental)), "native supplemental markup remains exact");
  assert.ok(!html.includes("data-section-row="), "a hero choice does not add the composed body canvas");
});

test("hero-only signature wedding choices preserve every native body section, including Ivory Lace's nested article sections", () => {
  const hero = require("./event-hero-layout.ts").DEFAULT_EVENT_HERO_LAYOUT;
  const theme = { colors: { primary: "#332447", secondary: "#c29c53", background: "#f8f0e3" }, fonts: { headline: "Georgia", body: "Arial" }, decorations: { heroImage: "/test/wedding.webp" } };
  const event = { headlineTitle: "Anna & Lee", story: "Our original story.", schedule: [{ title: "Ceremony", time: "2 PM", location: "Garden" }], travel: "Use the north entrance." };
  const layouts = [...fs.readFileSync(path.resolve("src/app/event/weddings/_renderers/signature-wedding-layouts.tsx"), "utf8").matchAll(/case "([^"]+)":/g)].map((match) => match[1]);
  const sections = (html) => [...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map((match) => match[0]);
  for (const layout of layouts) {
    const page = h(Signature, { theme, event, layout });
    const original = renderToStaticMarkup(page);
    const html = renderToStaticMarkup(h(EventPageCompositionProvider, { value: { version: 1, sections: [], hero } }, page));
    assert.match(html, /data-event-hero=""/, layout);
    assert.deepEqual(sections(html), sections(original), `${layout}: native body section markup remains exact`);
    assert.ok(html.includes("Our original story.") && html.includes("Ceremony"), `${layout}: nested story and program remain visible`);
    assert.ok(!html.includes("data-section-row="), `${layout}: no composed body canvas`);
  }
});

test("signature wedding bodies retain the hero and expose native sections with stable editable identities", () => {
  const theme = {
    colors: { primary: "#332447", secondary: "#c29c53", background: "#f8f0e3" },
    fonts: { headline: "Georgia", body: "Arial" },
    decorations: { heroImage: "/test/wedding.webp" },
  };
  const event = {
    headlineTitle: "Anna & Lee",
    date: "November 3, 2026",
    location: "Garden Pavilion",
    story: "Our original story.",
    schedule: [{ title: "Ceremony", time: "2 PM", location: "Garden" }],
    travel: "Use the north entrance.",
    party: [{ name: "Maria", role: "Bridesmaid" }],
    thingsToDo: "Visit the town square.",
    photos: ["/test/photo.webp"],
    registry: [{ label: "Our registry", url: "https://example.com/registry" }],
    rsvpEnabled: true,
    rsvpLink: "/rsvp/example",
  };
  const layouts = [
    ...fs
      .readFileSync(
        path.resolve("src/app/event/weddings/_renderers/signature-wedding-layouts.tsx"),
        "utf8",
      )
      .matchAll(/case "([^"]+)":/g),
  ].map((match) => match[1]);
  for (const layout of layouts) {
    const original = renderToStaticMarkup(h(Signature, { theme, event, layout }));
    const html = renderToStaticMarkup(
      h(
        EventPageCompositionProvider,
        {
          value: {
            ...composition,
            sectionLayout: {
              version: 1,
              order: ["info:parking", "schedule", "story", "travel"],
              hidden: ["wedding-party"],
              added: [],
            },
          },
        },
        h(Signature, { theme, event, layout }),
      ),
    );
    assert.equal((html.match(/<h1\b/g) || []).length, 1, layout);
    assert.equal(
      (html.match(/src="\/test\/wedding.webp"/g) || []).length,
      (original.match(/src="\/test\/wedding.webp"/g) || []).length,
      `${layout}: retains artwork`,
    );
    assert.ok(html.indexOf("Anna &amp; Lee") < html.indexOf("Travel &amp; parking"), layout);
    for (const id of [
      "info:parking",
      "story",
      "schedule",
      "travel",
      "things-to-do",
      "photos",
      "registry",
      "rsvp",
    ])
      assert.ok(html.includes(`data-section-row="${id}"`), `${layout}: ${id}`);
    assert.ok(html.indexOf("Travel &amp; parking") < html.indexOf("Ceremony"), layout);
    assert.ok(html.indexOf("Ceremony") < html.indexOf("Our original story."), layout);
    assert.ok(!html.includes("Bridesmaid"), layout);
    assert.ok(
      html.includes('href="/rsvp/example"') && html.includes('href="https://example.com/registry"'),
      layout,
    );
  }
});
