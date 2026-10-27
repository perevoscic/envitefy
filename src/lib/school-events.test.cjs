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

test("four school purposes select current designs in the expanded Create collection", async () => {
  assert.equal(SCHOOL_EVENT_DESIGNS.length, 12);
  for (const [kind, source] of examples) {
    const guess = classifyCreateText(source);
    assert.equal(guess.category, "school");
    assert.equal(guess.schoolTemplate, kind);
    assert.equal(guess.confidence, "high");
    assert.equal(customCategoryForGuess(guess), "general", "school uses the existing shared editor grant");
    const sync = getCreationTemplates(guess), asyncCatalog = await loadCreationCatalog(guess);
    assert.deepEqual(sync.map(({ id }) => id), asyncCatalog.templates.map(({ id }) => id));
    const selected = defaultCreationTemplate(sync, guess);
    assert.ok(selected.id.startsWith(`school--${kind}--`));
    assert.equal(getGeneralEventPageDesign(selected.id).schoolTemplate, kind);
    const href = new URL(selected.href, "https://envitefy.test");
    assert.equal(href.pathname, "/event/general/customize");
    assert.equal(href.searchParams.get("collection"), "school");
    const design = getGeneralEventPageDesign(selected.id);
    assert.ok(design && getGeneralEventBodyPresentation(selected.id));
    assert.ok(fs.existsSync(path.join("public", design.artwork)));
    assert.ok(schoolStarterSections(kind).every(section => section.title && section.body === ""));
  }
  assert.ok(new Set(SCHOOL_EVENT_DESIGNS.map(({ id }) => getGeneralEventPageDesign(id).editorLayout)).size >= 7);
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

test("memo content follows printed subjects and repairs the former single transcript block without writing", () => {
  const { schoolMemoSections, schoolMemoSectionLayout } = read("src/lib/school-memo-content.ts");
  const { normalizeEventPageComposition } = read("src/lib/event-page-composition.ts");
  const source = `Page 1\n${examples[0][1].replace("Science:", "Page 2\nScience:")}`;
  const notes = schoolMemoSections(source);
  assert.deepEqual(notes.map(section => section.title), ["Important Reminders", "Bible", "Science", "Reading, Math & ELA", "At Home Partnership Tips", "Important Events"]);
  assert.match(notes.find(section => section.title === "Science").body, /Water Project/);
  assert.match(notes.find(section => section.title === "At Home Partnership Tips").body, /Binders are taken home/);
  assert.ok(!notes.some(section => /Page [12]|Mrs. Example|October 26th$/.test(section.body)));
  const original = { version: 1, sections: [{ id: "info:import-0", title: "School memo", body: source }] };
  const before = JSON.stringify(original);
  const composition = normalizeEventPageComposition(original);
  assert.equal(JSON.stringify(original), before, "opening only normalizes in memory");
  assert.equal(composition.sections.length, 6);
  assert.equal(composition.sectionLayout.order[0], "schedule");
  assert.equal(composition.sectionLayout.widths.schedule, 12);
  assert.equal(composition.sectionLayout.pairs.length, 3);
  assert.deepEqual(normalizeEventPageComposition(composition), composition);
  assert.deepEqual(schoolMemoSectionLayout(composition.sections), composition.sectionLayout);
  const custom = { ...original, sections: [{ ...original.sections[0], id: "info:my-custom-notes" }] };
  assert.equal(normalizeEventPageComposition(custom).sections.length, 1, "custom sections keep the author's chosen structure");
});


test("all school choices use delivered new artwork, distinct layouts and scoped durable backgrounds", () => {
  const { getSchoolEventDesign } = read("src/lib/school-event-designs.ts");
  const { getHolidayBackground, getHolidayBackgrounds, getHolidayBackgroundChoice, normalizeHolidayBackgroundChoice } = read("src/lib/holiday-backgrounds.ts");
  const backgrounds = getHolidayBackgrounds("school");
  assert.equal(backgrounds.length, 8);
  assert.equal(new Set(SCHOOL_EVENT_DESIGNS.map(design => design.artwork)).size, 12);
  assert.equal(new Set(SCHOOL_EVENT_DESIGNS.map(design => design.id)).size, 12);
  for (const design of SCHOOL_EVENT_DESIGNS) {
    assert.match(design.artwork, /^\/templates\/event-pages\/v2\//);
    assert.ok(fs.existsSync(path.join("public", design.artwork)));
    assert.ok(getGeneralEventPageDesign(design.id));
    assert.ok(getGeneralEventBodyPresentation(design.id));
    const background = getHolidayBackground(design.id);
    assert.equal(background.id, design.backgroundId);
    assert.equal(background.occasion, "school");
    for (const option of backgrounds) {
      const choice = getHolidayBackgroundChoice(option.id);
      assert.deepEqual(normalizeHolidayBackgroundChoice(JSON.parse(JSON.stringify(choice))), choice);
      assert.equal(getHolidayBackground(design.id, choice).id, option.id);
    }
    const unrelated = getHolidayBackgroundChoice(getHolidayBackgrounds("halloween")[0].id);
    assert.equal(getHolidayBackground(design.id, unrelated).id, background.id);
    assert.equal(getHolidayBackground(read("src/lib/general-event-designs.ts").GENERAL_EVENT_DESIGNS.find(item => item.occasion === "halloween").id, getHolidayBackgroundChoice(background.id)).occasion === "school", false);
  }
  for (const [kind] of examples) {
    const oldId = `school--${kind}`;
    assert.ok(!SCHOOL_EVENT_DESIGNS.some(design => design.id === oldId), "retired covers stay out of new pickers");
    assert.equal(getSchoolEventDesign(oldId).schoolTemplate, kind, "existing pages retain the old design identity and artwork");
    assert.match(getSchoolEventDesign(oldId).artwork, /^\/templates\/signup\//);
    assert.equal(getHolidayBackground(oldId, getHolidayBackgroundChoice(backgrounds[1].id)).id, backgrounds[1].id, "legacy owners can explicitly choose a new school background");
  }
});
