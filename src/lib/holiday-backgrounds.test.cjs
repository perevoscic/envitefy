const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { HOLIDAY_COLLECTIONS } = load("src/lib/holiday-collections.ts");
const {
  HOLIDAY_BACKGROUND_MOTIFS,
  HOLIDAY_BACKGROUND_TREATMENTS,
  HOLIDAY_BACKGROUND_MATERIALS,
  getHolidayBackgrounds,
  getHolidayBackground,
  getHolidayBackgroundChoice,
  normalizeHolidayBackgroundChoice,
} = load("src/lib/holiday-backgrounds.ts");

const allPresets = HOLIDAY_COLLECTIONS.flatMap(({ id }) => getHolidayBackgrounds(id));
const designs = HOLIDAY_COLLECTIONS.flatMap((collection) => collection.designs.map((design) => ({
  id: `holidays--${collection.id}--${design.slug}`,
  occasion: collection.id,
})));

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

test("all 44 occasions and 2640 planned designs have authored backgrounds and plain alternatives", () => {
  assert.equal(HOLIDAY_COLLECTIONS.length, 44);
  assert.equal(designs.length, 2640);
  assert.equal(allPresets.length, 880);
  assert.equal(new Set(allPresets.map(({ id }) => id)).size, allPresets.length);
  for (const collection of HOLIDAY_COLLECTIONS) {
    const presets = getHolidayBackgrounds(collection.id);
    assert.equal(presets.length, 20, `${collection.id}: twenty curated choices`);
    assert.equal(new Set(presets.map(({ name }) => name)).size, 20, `${collection.id}: distinct named concepts`);
    assert.ok(new Set(presets.map(({ motif, treatment, material }) => `${motif}/${treatment}/${material || "plain"}`)).size >= 12,
      `${collection.id}: varied motifs, compositions and materials`);
    assert.ok(presets.some(({ motif, treatment }) => motif === "none" && treatment === "plain"), `${collection.id}: plain paper`);
    assert.ok(presets.some(({ page }) => luminance(page) < 0.1), `${collection.id}: dark option`);
    assert.ok(presets.some(({ page }) => luminance(page) > 0.7), `${collection.id}: light option`);
    for (const preset of presets) {
      assert.equal(preset.occasion, collection.id);
      assert.match(preset.id, new RegExp(`^${collection.id}--[a-z0-9-]+$`));
      assert.ok(preset.name);
      assert.ok(HOLIDAY_BACKGROUND_MOTIFS.includes(preset.motif));
      assert.ok(HOLIDAY_BACKGROUND_TREATMENTS.includes(preset.treatment));
      assert.ok(!preset.material || HOLIDAY_BACKGROUND_MATERIALS.includes(preset.material));
      for (const role of ["page", "ink", "accent", "surface", "secondary"]) {
        assert.match(preset[role], /^#[0-9A-F]{6}$/, `${preset.id}: literal ${role} color`);
      }
    }
  }
  for (const design of designs) {
    const preset = getHolidayBackground(design.id);
    assert.ok(preset, `${design.id}: explicit default`);
    assert.equal(preset.occasion, design.occasion);
    assert.ok(getHolidayBackgrounds(design.occasion).some(({ id }) => id === preset.id));
  }
});

test("every background keeps normal text and accents readable on page and content surfaces", () => {
  for (const preset of allPresets) {
    for (const foreground of ["ink", "accent"]) {
      for (const background of ["page", "surface"]) {
        const ratio = contrast(preset[foreground], preset[background]);
        assert.ok(ratio >= 4.5, `${preset.id}: ${foreground} on ${background} contrast ${ratio.toFixed(2)}`);
      }
    }
  }
});

test("all 880 choices survive normalization and resolve independently of the selected template default", () => {
  for (const collection of HOLIDAY_COLLECTIONS) {
    const designId = `holidays--${collection.id}--${collection.designs[0].slug}`;
    for (const preset of getHolidayBackgrounds(collection.id)) {
      const choice = getHolidayBackgroundChoice(preset.id);
      assert.deepEqual(normalizeHolidayBackgroundChoice(JSON.parse(JSON.stringify(choice))), choice);
      assert.equal(getHolidayBackground(designId, choice).id, preset.id);
    }
  }
});

test("stable preset IDs and all explicit defaults cannot change with gallery or calendar order", () => {
  const legacyDesigns = HOLIDAY_COLLECTIONS.flatMap((collection) => collection.designs.slice(0, 10).map((design) => ({
    id: `holidays--${collection.id}--${design.slug}`,
  })));
  const defaults = legacyDesigns.map(({ id }) => `${id}=${getHolidayBackground(id).id}`).sort();
  const presetIds = HOLIDAY_COLLECTIONS.flatMap(({ id }) => getHolidayBackgrounds(id)
    .slice(0, id === "halloween" ? 4 : 3).map(({ id: presetId }) => presetId)).sort();
  const hash = (values) => createHash("sha256").update(values.join("\n")).digest("hex");
  assert.equal(hash(defaults), "7314c2dc6850720b8f3d6b0a1e1dc6b9ab8efac3632126ae4b59b96701fbd3ce");
  assert.equal(hash(presetIds), "2403358f1e83984324cc09b01c1ca08a7412d1cde36eb511444f1afa5300732c");
  for (const { id } of [...legacyDesigns].reverse()) assert.ok(defaults.includes(`${id}=${getHolidayBackground(id).id}`));
  const first = getHolidayBackgrounds("halloween");
  first.reverse();
  assert.equal(getHolidayBackgrounds("halloween")[0].id, "halloween--ghost-cream", "consumers cannot reorder the registry");
});

test("Friendly Ghosts defaults to ghostly cream with orange accents and charcoal ink", () => {
  const preset = getHolidayBackground("holidays--halloween--friendly-ghosts");
  assert.equal(preset.id, "halloween--ghost-cream");
  assert.equal(preset.page, "#FFF3DC");
  assert.equal(preset.ink, "#30241C");
  assert.equal(preset.accent, "#9B3C13");
  assert.equal(preset.motif, "ghosts");
  assert.equal(getHolidayBackground("holidays--halloween--pumpkin-porch").motif, "pumpkins");
  assert.ok(getHolidayBackgrounds("yom-kippur").every(({ motif }) => motif === "none"), "solemn reflection retains quiet surfaces");
});

test("versioned choices retain template/custom provenance and reject malformed payloads", () => {
  const custom = { version: 1, presetId: "halloween--midnight-ghosts", source: "custom" };
  const template = { version: 1, presetId: "halloween--ghost-cream", source: "template" };
  assert.deepEqual(getHolidayBackgroundChoice(custom.presetId), custom);
  assert.deepEqual(getHolidayBackgroundChoice(template.presetId, "template"), template);
  assert.deepEqual(normalizeHolidayBackgroundChoice(custom), custom);
  assert.deepEqual(normalizeHolidayBackgroundChoice(template), template);
  assert.deepEqual(normalizeHolidayBackgroundChoice({ version: 1, presetId: custom.presetId }), { version: 1, presetId: custom.presetId });
  assert.deepEqual(normalizeHolidayBackgroundChoice({ ...custom, page: "url(untrusted)" }), custom, "only the canonical selection survives");
  for (const value of [undefined, null, false, [], "halloween--ghost-cream", {}, { version: 2, presetId: custom.presetId }, { version: 1, presetId: "unknown" }, { version: 1, presetId: 4 }, { ...custom, source: "unknown" }, { ...custom, source: null }]) {
    assert.equal(normalizeHolidayBackgroundChoice(value), undefined, JSON.stringify(value));
  }
  assert.equal(getHolidayBackgroundChoice("unknown"), undefined);
});

test("backgrounds stay within their occasion and invalid design IDs cannot gain a background", () => {
  const designId = "holidays--halloween--friendly-ghosts";
  const choice = getHolidayBackgroundChoice("halloween--midnight-ghosts");
  assert.equal(getHolidayBackground(designId, choice).id, choice.presetId);
  const christmas = getHolidayBackgroundChoice("christmas--christmas-evergreen");
  assert.equal(getHolidayBackground(designId, christmas).id, "halloween--ghost-cream");
  for (const id of [null, undefined, "", "unknown", "coffee-conversation", "holidays--halloween--unknown", "holidays--halloween--friendly-ghosts--extra"]) {
    assert.equal(getHolidayBackground(id, choice), undefined);
  }
  assert.deepEqual(getHolidayBackgrounds("unknown"), []);
  assert.deepEqual(getHolidayBackgrounds(), []);
});
