const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const cache = new Map();
const load = (file) => loadTs(file, {}, cache);
const { saveManualEventProgress } = load("src/lib/manual-event-progress.ts");
const { getHolidayBackground, getHolidayBackgroundChoice, getHolidayBackgrounds } = load("src/lib/holiday-backgrounds.ts");

const designId = "holidays--halloween--friendly-ghosts";
const background = getHolidayBackground(designId);
const theme = { id: designId, bg: "bg-pink-100", text: "text-slate-900", fontFamily: "Georgia", bgStyle: { backgroundColor: "#E9DDE6", color: "#3D253C" } };
const snapshot = {
  data: { title: "Ghost gathering", date: "", time: "", hero: "/original-artwork.webp", bodyDesignId: designId, creationCollection: "holidays-seasonal", holidayOccasion: "halloween", pageBackground: getHolidayBackgroundChoice(background.id, "template") },
  themeId: designId,
  theme,
};

async function save(t, editedSnapshot, existing) {
  let saved;
  globalThis.window = { dispatchEvent() {} };
  t.after(() => { delete globalThis.window; });
  const historyFetch = async (_url, options) => {
    if (!options?.method) return Response.json({ id: "holiday-event", data: existing });
    saved = JSON.parse(options.body);
    return Response.json({ id: "holiday-event", ...saved });
  };
  await saveManualEventProgress({ eventId: existing ? "holiday-event" : undefined, snapshot: editedSnapshot, category: "general", templateId: "general-event", path: "/event/general/customize", clientDraftId: "holiday-background-test", historyFetch });
  return saved.data;
}

test("holiday drafts persist the effective background for owner rendering and retain their full snapshot", async (t) => {
  const data = await save(t, snapshot);
  assert.deepEqual(data.pageBackground, snapshot.data.pageBackground);
  assert.equal(data.bodyDesignId, designId);
  assert.equal(data.themeId, designId);
  assert.equal(data.theme.backgroundColor, background.page);
  assert.deepEqual(data.theme.bgStyle, { backgroundColor: background.page, color: background.ink });
  assert.equal(data.theme.fontFamily, "Georgia");
  assert.equal(data.heroImage, snapshot.data.hero);
  assert.equal(data.startISO, null);
  assert.deepEqual(data.manualEditor.snapshot, snapshot);
});

test("saving progress on a published holiday keeps its live background unchanged", async (t) => {
  const published = { title: "Live title", status: "published", bodyDesignId: designId, theme, rsvpResponses: ["retained"] };
  const data = await save(t, snapshot, published);
  assert.equal(data.pageBackground, undefined);
  assert.deepEqual(data.theme, theme);
  assert.equal(data.title, published.title);
  assert.deepEqual(data.rsvpResponses, published.rsvpResponses);
  assert.deepEqual(data.manualEditor.snapshot.data.pageBackground, snapshot.data.pageBackground);
});

test("legacy and cross-occasion draft choices retain the saved literal background", async (t) => {
  const legacy = { ...snapshot, data: { ...snapshot.data, pageBackground: undefined } };
  const legacyData = await save(t, legacy);
  assert.equal(legacyData.pageBackground, undefined);
  assert.deepEqual(legacyData.theme, theme);
  const christmas = getHolidayBackgrounds("christmas")[0];
  assert.ok(christmas);
  const crossOccasion = { ...legacy, data: { ...legacy.data, pageBackground: getHolidayBackgroundChoice(christmas.id) } };
  const crossData = await save(t, crossOccasion);
  assert.equal(crossData.pageBackground, undefined);
  assert.deepEqual(crossData.theme, theme);
});
