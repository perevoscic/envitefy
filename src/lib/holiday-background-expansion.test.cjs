const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { HOLIDAY_COLLECTIONS } = load("src/lib/holiday-collections.ts");
const { getHolidayBackgrounds, getHolidayBackground, getHolidayBackgroundChoice } = load("src/lib/holiday-backgrounds.ts");
const { collections: expansion } = JSON.parse(fs.readFileSync(path.join(__dirname, "../../scripts/data/holiday-expansion-scenes.json"), "utf8"));
const hash = (values) => createHash("sha256").update(values.join("\n")).digest("hex");

test("all 2,200 new holiday artwork scenes have stable occasion-specific background defaults", () => {
  assert.equal(Object.keys(expansion).length, 44);
  const defaults = [];
  for (const collection of HOLIDAY_COLLECTIONS) {
    const scenes = expansion[collection.id];
    assert.equal(scenes.length, 50, `${collection.id}: fifty additions`);
    const choices = getHolidayBackgrounds(collection.id);
    const choiceIds = new Set(choices.map(({ id }) => id));
    const slugs = new Set();
    for (const scene of scenes) {
      assert.ok(!slugs.has(scene.slug), `${collection.id}: unique ${scene.slug}`);
      slugs.add(scene.slug);
      const designId = `holidays--${collection.id}--${scene.slug}`;
      const preset = getHolidayBackground(designId);
      assert.ok(preset, `${designId}: authored default`);
      assert.equal(preset.occasion, collection.id);
      assert.ok(choiceIds.has(preset.id), `${designId}: default belongs to the occasion`);
      defaults.push([designId, preset.id]);
    }
  }
  assert.equal(defaults.length, 2200);
  assert.equal(hash(defaults.map(([designId, presetId]) => `${designId}=${presetId}`).sort()), "3c7dec41999911cc4a54313c979c849ebf0dc5fc792f9aa13ec773f3490f5aba");
  for (const [designId, presetId] of defaults.reverse()) {
    assert.equal(getHolidayBackground(designId).id, presetId, `${designId}: independent of lookup order`);
  }
});

test("new artwork preserves all 440 legacy defaults and all 133 saved preset identities", () => {
  const originals = HOLIDAY_COLLECTIONS.flatMap((collection) => {
    const newSlugs = new Set(expansion[collection.id].map(({ slug }) => slug));
    return collection.designs.filter(({ slug }) => !newSlugs.has(slug)).map(({ slug }) => {
      const id = `holidays--${collection.id}--${slug}`;
      return `${id}=${getHolidayBackground(id).id}`;
    });
  }).sort();
  assert.equal(originals.length, 440);
  assert.equal(hash(originals), "7314c2dc6850720b8f3d6b0a1e1dc6b9ab8efac3632126ae4b59b96701fbd3ce");
  const presetIds = HOLIDAY_COLLECTIONS.flatMap(({ id }) => getHolidayBackgrounds(id)
    .slice(0, id === "halloween" ? 4 : 3).map((preset) => preset.id)).sort();
  assert.equal(presetIds.length, 133);
  assert.equal(hash(presetIds), "2403358f1e83984324cc09b01c1ca08a7412d1cde36eb511444f1afa5300732c");
});

test("new designs preserve custom choices while rejecting another occasion's background", () => {
  for (const collection of HOLIDAY_COLLECTIONS) {
    const designId = `holidays--${collection.id}--${expansion[collection.id][0].slug}`;
    const defaultId = getHolidayBackground(designId).id;
    const different = getHolidayBackgrounds(collection.id).find(({ id }) => id !== defaultId);
    const custom = getHolidayBackgroundChoice(different.id);
    assert.equal(getHolidayBackground(designId, custom).id, different.id);
    const otherOccasion = HOLIDAY_COLLECTIONS.find(({ id }) => id !== collection.id).id;
    const otherChoice = getHolidayBackgroundChoice(getHolidayBackgrounds(otherOccasion)[0].id);
    assert.equal(getHolidayBackground(designId, otherChoice).id, defaultId);
    assert.equal(getHolidayBackground(designId, { version: 2, presetId: different.id }).id, defaultId);
  }
});
