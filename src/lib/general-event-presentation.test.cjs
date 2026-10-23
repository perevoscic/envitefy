const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const stubs = { "lucide-react": new Proxy({}, { get: () => () => null }) };
const cache = new Map();
const load = (file) => loadTs(file, stubs, cache);
const { HOLIDAY_COLLECTIONS } = load("src/lib/holiday-collections.ts");
const { GENERAL_EVENT_DESIGNS } = load("src/lib/general-event-designs.ts");
const { AVAILABLE_HOLIDAY_TEMPLATE_IDS } = load("src/assets/holiday-template-availability.ts");
const { getSignupDesign } = load("src/lib/signup-designs.ts");
const { EVENT_PAGE_THEMED_COLLECTIONS, EVENT_PAGE_THEMED_DESIGNS } = load(
  "src/data/event-page-themed-designs.ts",
);
const { getThemedEventDesign, getThemedEventBodyPresentation } = load(
  "src/lib/event-page-themed-designs.ts",
);
const { getGeneralEventPageDesign, getGeneralEventBodyPresentation } = load(
  "src/lib/general-event-presentation.ts",
);
const Header = load("src/components/templates/ThemedEventHeader.tsx").default;
const Body = load("src/components/templates/TemplateBodyLayout.tsx").default;
const h = React.createElement;

const sections = ["details", "schedule", "story", "hosts", "rsvp"].map((id) => ({
  id,
  content: h("section", { id }, h("h2", null, id), h("p", null, `Useful ${id} information.`)),
}));

function renderDesign(design, body) {
  const markup = renderToStaticMarkup(
    h(
      React.Fragment,
      null,
      h(
        Header,
        { design },
        h("div", null, h("img", { src: design.artwork, alt: "Authored artwork" })),
        h("div", null, h("h1", null, "The event title")),
      ),
      h(Body, { presentation: body, sections }),
    ),
  );
  assert.ok(
    markup.includes(`data-themed-event-header="${design.id}"`),
    `${design.id}: header is rendered with selected identity`,
  );
  assert.ok(
    markup.includes(`data-composition="${design.composition}"`),
    `${design.id}: authored header arrangement is rendered`,
  );
  assert.ok(
    markup.includes(`data-template-body-layout="${body.layout}"`),
    `${design.id}: authored body arrangement is rendered`,
  );
  assert.ok(
    markup.includes(`data-body-surface="${body.surface}"`),
    `${design.id}: section shapes are rendered`,
  );
  assert.equal(
    (markup.match(/data-body-section=/g) || []).length,
    sections.length,
    `${design.id}: usable sections survive the design`,
  );
  return markup;
}

// Exclude artwork, wording, color and typeface so replacing only a photo or palette
// cannot satisfy the requirement for different full-page compositions.
function structuralSignature(design, body) {
  return JSON.stringify({
    header: design.composition,
    page: design.editorLayout,
    body: {
      layout: body.layout,
      surface: body.surface,
      heading: body.heading,
      flow: body.flow,
      borderRadius: body.borderRadius,
      spacing: body.spacing,
      surfaceTone: body.surfaceTone,
    },
  });
}

test("the 440 original holiday IDs, artwork, colors, typography and full-page recipes remain frozen", () => {
  const stable = value => Array.isArray(value) ? value.map(stable)
    : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  const originals = HOLIDAY_COLLECTIONS.flatMap(collection => collection.designs.slice(0, 10).map(original => {
    const id = `holidays--${collection.id}--${original.slug}`;
    return { id, page: getGeneralEventPageDesign(id), body: getGeneralEventBodyPresentation(id), signup: getSignupDesign(id) };
  })).sort((first, second) => first.id.localeCompare(second.id));
  assert.equal(originals.length, 440);
  assert.equal(createHash("sha256").update(JSON.stringify(stable(originals))).digest("hex"), "9d70ed680eef5c92723f24f8d3d38497f98baeb71fbcfb0f8990eebc00fe2f44");
});

test("all twelve everyday General designs render their artwork with distinct full-page compositions", () => {
  const designs = GENERAL_EVENT_DESIGNS.filter((design) => !design.occasion);
  assert.equal(designs.length, 12);
  const signatures = new Map();
  for (const original of designs) {
    const design = getGeneralEventPageDesign(original.id),
      body = getGeneralEventBodyPresentation(original.id);
    assert.ok(design, `${original.id}: full-page design resolves`);
    assert.ok(body, `${original.id}: body design resolves`);
    assert.equal(design.id, original.id);
    assert.equal(design.artwork, original.artwork);
    renderDesign(design, body);
    const signature = structuralSignature(design, body);
    assert.ok(
      !signatures.has(signature),
      `${original.id}: duplicates ${signatures.get(signature)} without considering photo, wording, palette or typeface`,
    );
    signatures.set(signature, original.id);
  }
  assert.equal(signatures.size, 12);
});

test("all available holiday choices render selected artwork with distinct full-page compositions per occasion", () => {
  const holidayDesigns = GENERAL_EVENT_DESIGNS.filter((design) => design.occasion);
  assert.equal(holidayDesigns.length, AVAILABLE_HOLIDAY_TEMPLATE_IDS.length);
  assert.equal(HOLIDAY_COLLECTIONS.length, 44);
  for (const collection of HOLIDAY_COLLECTIONS) {
    const designs = holidayDesigns.filter((design) => design.occasion === collection.id);
    const available = AVAILABLE_HOLIDAY_TEMPLATE_IDS.filter(id => id.startsWith(`holidays--${collection.id}--`));
    assert.equal(designs.length, available.length, collection.id);
    const signatures = new Map();
    for (const original of designs) {
      const design = getGeneralEventPageDesign(original.id),
        body = getGeneralEventBodyPresentation(original.id);
      assert.ok(design, `${original.id}: editor and guest page can resolve the selected holiday`);
      assert.ok(body, `${original.id}: body never falls back to an unstyled shared layout`);
      assert.equal(design.id, original.id);
      assert.equal(design.artwork, original.artwork);
      assert.equal(design.occasion, collection.id);
      assert.equal(design.label, collection.name);
      assert.ok(
        design.coverTitle,
        `${original.id}: selected design provides a meaningful title fallback`,
      );
      renderDesign(design, body);
      const signature = structuralSignature(design, body);
      assert.ok(
        !signatures.has(signature),
        `${original.id}: duplicates ${signatures.get(signature)} without considering its photo, wording, palette or typeface`,
      );
      signatures.set(signature, original.id);
    }
    assert.equal(signatures.size, available.length, collection.id);
  }
  assert.equal(getGeneralEventPageDesign("missing-design"), undefined);
  assert.equal(getGeneralEventBodyPresentation("missing-design"), undefined);
  for (const collection of HOLIDAY_COLLECTIONS) for (const original of collection.designs) {
    const id = `holidays--${collection.id}--${original.slug}`;
    if (!AVAILABLE_HOLIDAY_TEMPLATE_IDS.includes(id)) {
      assert.equal(getGeneralEventPageDesign(id), undefined, `${id}: pending artwork has no direct page entry`);
      assert.equal(getGeneralEventBodyPresentation(id), undefined, `${id}: pending artwork has no direct body entry`);
    }
  }
});

test("all sixty planned holiday designs independently render distinct complete page structures before artwork is published", () => {
  const plannedCache = new Map();
  const plannedStubs = { ...stubs, "@/lib/holiday-template-availability": { isHolidayTemplateAvailable: () => true } };
  const plannedLoad = file => loadTs(file, plannedStubs, plannedCache);
  const { GENERAL_EVENT_DESIGNS: plannedDesigns } = plannedLoad("src/lib/general-event-designs.ts");
  const planned = plannedLoad("src/lib/general-event-presentation.ts");
  const { HOLIDAY_SIGNUP_DESIGNS: plannedSignups } = plannedLoad("src/lib/signup-designs.ts");
  for (const collection of HOLIDAY_COLLECTIONS) {
    assert.equal(collection.designs.length, 60, collection.id);
    const designs = plannedDesigns.filter(design => design.occasion === collection.id);
    const signupDesigns = plannedSignups.filter(design => design.id.startsWith(`holidays--${collection.id}--`));
    assert.equal(designs.length, 60, collection.id);
    assert.equal(signupDesigns.length, 60, collection.id);
    const signatures = new Set();
    const signupSignatures = new Set();
    for (const original of designs) {
      const design = planned.getGeneralEventPageDesign(original.id);
      const body = planned.getGeneralEventBodyPresentation(original.id);
      assert.ok(design, original.id);
      assert.ok(body, original.id);
      renderDesign(design, body);
      signatures.add(structuralSignature(design, body));
    }
    for (const design of signupDesigns) {
      signupSignatures.add(JSON.stringify([
        design.composition, design.palette, design.reverse,
        ["menu", "botanical", "journal", "invitation", "scrapbook"].includes(design.composition) ? design.motif : null,
      ]));
    }
    assert.equal(signatures.size, 60, `${collection.id}: page structures differ without artwork, wording, palette or typeface`);
    assert.equal(signupSignatures.size, 60, `${collection.id}: signup art directions differ without their artwork`);
  }
});

test("all 1080 v2 designs render authored headers and bodies with sixty different compositions in every collection", () => {
  const modern = EVENT_PAGE_THEMED_DESIGNS.filter((design) => design.artDirectionVersion === 2);
  assert.equal(modern.length, 1080);
  assert.equal(EVENT_PAGE_THEMED_COLLECTIONS.length, 18);
  for (const collection of EVENT_PAGE_THEMED_COLLECTIONS) {
    const designs = modern.filter((design) => design.collection === collection.id);
    assert.equal(designs.length, 60, collection.id);
    const signatures = new Map();
    for (const original of designs) {
      const design = getThemedEventDesign(original.id),
        body = getThemedEventBodyPresentation(original.id);
      assert.ok(design, original.id);
      assert.ok(body, original.id);
      assert.equal(design.artwork, original.artwork);
      renderDesign(design, body);
      const signature = structuralSignature(design, body);
      assert.ok(
        !signatures.has(signature),
        `${original.id}: duplicates ${signatures.get(signature)} without considering its photo, wording, palette or typeface`,
      );
      signatures.set(signature, original.id);
    }
    assert.equal(signatures.size, 60, collection.id);
  }
});
