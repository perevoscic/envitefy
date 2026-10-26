const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const cache = new Map();
const read = name => load(name, {}, cache);
const { classifyCreateText, customCategoryForGuess } = read("src/lib/create/create-intent.ts");
const { SCHOOL_EVENT_DESIGNS } = read("src/lib/school-event-designs.ts");
const { getCreationTemplates } = read("src/lib/create/template-selection.ts");
const { loadCreationCatalog } = read("src/lib/create/creation-template-loader.ts");
const { defaultCreationTemplate } = read("src/lib/create/default-creation-template.ts");
const { getGeneralEventPageDesign, getGeneralEventBodyPresentation } = read("src/lib/general-event-presentation.ts");
const { schoolStarterSections } = read("src/lib/school-events.ts");
const { emptyCustomEventDetails, normalizeCustomEventInformation } = read("src/lib/event-custom-design.ts");
const { hydrateCreationValue, creationNativePayload } = read("src/lib/create/editor-handoff.ts");

const examples = [
  ["weekly-memo", fs.readFileSync("scripts/fixtures/school-memo.txt", "utf8")],
  ["field-trip", "Grade 3 class field trip to the science museum November 6. Permission slips due November 2. Bring lunch. School bus leaves at 9 AM."],
  ["school-celebration", "Oak Elementary School Spirit Day. Friday November 6 at 2 PM. Students wear school colors. Family activities and music."],
  ["parent-meeting", "Oak School parent-teacher conferences November 6 at 4 PM. Meet in Room 3. Agenda: student progress."],
];

test("four school purposes select four delivered designs in the Create event flow", async () => {
  assert.equal(SCHOOL_EVENT_DESIGNS.length, 4);
  for (const [kind, source] of examples) {
    const guess = classifyCreateText(source);
    assert.equal(guess.category, "school");
    assert.equal(guess.schoolTemplate, kind);
    assert.equal(guess.confidence, "high");
    assert.equal(customCategoryForGuess(guess), "general", "school uses the existing shared editor grant");
    const sync = getCreationTemplates(guess), asyncCatalog = await loadCreationCatalog(guess);
    assert.deepEqual(sync.map(({ id }) => id), asyncCatalog.templates.map(({ id }) => id));
    const selected = defaultCreationTemplate(sync, guess);
    assert.equal(selected.id, `school--${kind}`);
    const href = new URL(selected.href, "https://envitefy.test");
    assert.equal(href.pathname, "/event/general/customize");
    assert.equal(href.searchParams.get("collection"), "school");
    const design = getGeneralEventPageDesign(selected.id);
    assert.ok(design && getGeneralEventBodyPresentation(selected.id));
    assert.ok(fs.existsSync(path.join("public", design.artwork)));
    assert.ok(schoolStarterSections(kind).every(section => section.title && section.body === ""));
  }
  assert.equal(new Set(SCHOOL_EVENT_DESIGNS.map(({ id }) => getGeneralEventPageDesign(id).editorLayout)).size, 4);
});

test("unclear school uploads show the collection; other school contexts retain their original workflows", () => {
  const broad = classifyCreateText("Oak school event for families");
  assert.equal(broad.category, "school");
  assert.equal(broad.confidence, "low");
  assert.equal(defaultCreationTemplate(getCreationTemplates(broad), broad), undefined);
  assert.equal(classifyCreateText("Oak High School football schedule: Tigers vs Central").category, "sports");
  assert.equal(classifyCreateText("Maya's birthday party with school friends").category, "birthdays");
  assert.notEqual(classifyCreateText("Parent meeting with the dentist for a medical appointment").category, "school");
  assert.equal(classifyCreateText(`${examples[0][1]}\nParent meeting November 7\nClass field trip November 12`).schoolTemplate, "weekly-memo");
  const selected = getCreationTemplates(broad)[2];
  assert.equal(defaultCreationTemplate(getCreationTemplates(broad), broad, selected.id)?.id, selected.id);
});

test("school identity and template sections survive native hydration and explicit saved snapshots", () => {
  for (const [kind] of examples) {
    const information = normalizeCustomEventInformation({ version: 1, kind: "information", category: "general",
      design: { version: 1, name: "School", description: "", layout: "editorial", font: "editorial", colors: { page: "#ffffff", surface: "#ffffff", ink: "#111111", accent: "#607e68" } },
      details: { ...emptyCustomEventDetails(), title: "My school page", schoolTemplate: kind, sections: schoolStarterSections(kind) } });
    const fields = hydrateCreationValue("general", "data", {}, information);
    const saved = creationNativePayload({ title: fields.title, data: { createdVia: "template" } }, { data: fields });
    assert.equal(saved.data.category, "School & classroom");
    assert.equal(saved.data.creationCollection, "school");
    assert.equal(JSON.parse(JSON.stringify(saved)).data.schoolTemplate, kind);
    assert.equal(fields.date, "");
    assert.equal(fields.venue, "");
  }
});

test("Save draft retains school identity, artwork and memo dates without publishing or assigning a parent date", async () => {
  const { saveManualEventProgress } = read("src/lib/manual-event-progress.ts");
  const { extractSchoolMemoDates } = read("src/lib/ocr/school-memo.ts");
  const scanSchedule = extractSchoolMemoDates(examples[0][1], "America/Chicago", new Date("2026-10-26T15:00:00Z"));
  let payload;
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent() {} };
  try { await saveManualEventProgress({ category: "general_event", templateId: "general", path: "/event/general/customize", clientDraftId: "school-draft",
    snapshot: { data: { title: "Weekly classroom memo", schoolTemplate: "weekly-memo", bodyDesignId: "school--weekly-memo", scanSchedule }, themeId: "school--weekly-memo" },
    historyFetch: async (_url, options) => { payload = JSON.parse(options.body); return Response.json({ id: "saved-school-draft", data: payload.data }); },
  }); } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; }
  assert.equal(payload.data.status, "draft");
  assert.equal(payload.data.category, "School & classroom");
  assert.equal(payload.data.schoolTemplate, "weekly-memo");
  assert.equal(payload.data.bodyDesignId, "school--weekly-memo");
  assert.equal(payload.data.startISO, null);
  assert.equal(payload.data.noindex, true);
  assert.deepEqual(payload.data.scanSchedule.items.map(item => item.id), scanSchedule.items.map(item => item.id));
});
