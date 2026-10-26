import assert from "node:assert/strict";
import test from "node:test";
import loadTs from "../../scripts/lib/event-messages-test-loader.cjs";

const cache = new Map();
const load = (file) => loadTs(file, {}, cache);
const { getTemplates } = load("src/lib/public-template-catalogs/signup-forms.ts");
const { createSignupTemplateForm, createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts");
const { resolveSignupThemeStyle, signupContrast } = load("src/lib/signup-themes.ts");
const { HOLIDAY_SIGNUP_DESIGNS } = load("src/lib/signup-designs.ts");
const { getHolidayBackground, getHolidayBackgrounds, getHolidayBackgroundChoice } = load("src/lib/holiday-backgrounds.ts");
const { applySignupCustomTheme, SIGNUP_CUSTOM_THEME_BOARDS } = load("src/lib/signup-custom-theme.ts");
const { sanitizeSignupForm } = load("src/utils/signup.ts");
const catalog = getTemplates();

// Resolve the authored sRGB mixtures as browser pixels, independently of the
// resolver's choice of how much muted ink to use.
function renderedColor(value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const match = value.match(/^color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, (#[0-9a-f]{6})\)$/i);
  assert.ok(match, `Unexpected authored color: ${value}`);
  const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const first = rgb(match[1]), second = rgb(match[3]), weight = Number(match[2]) / 100;
  return `#${first.map((channel, index) => Math.round(channel * weight + second[index] * (1 - weight)).toString(16).padStart(2, "0")).join("")}`;
}

function assertReadable(form, id) {
  const style = resolveSignupThemeStyle(form);
  for (const ink of ["text", "muted", "accent-text", "success-text", "error-text", "warning-text", "info-text"]) {
    for (const paper of ["page", "surface", "soft"]) {
      const ratio = signupContrast(renderedColor(style[`--signup-${ink}`]), renderedColor(style[`--signup-${paper}`]));
      assert.ok(ratio >= 4.5, `${id}: ${ink} on ${paper} is ${ratio.toFixed(3)}:1`);
    }
  }
  assert.ok(signupContrast(style["--signup-accent"], style["--signup-on-accent"]) >= 4.5, `${id}: primary action text`);
  return style;
}

test("every signup template retains readable copy and actions on original, soft and ink paper", () => {
  assert.ok(catalog.length >= 1300);
  for (const template of catalog) {
    for (const palette of ["original", "soft", "ink"]) {
      const form = createSignupTemplateForm(template);
      form.appearance.palette = palette;
      const original = structuredClone(form);
      assertReadable(form, `${template.id}:${palette}`);
      assert.deepEqual(form, original, "contrast resolution does not change the saved design or event");
    }
  }
});

test("all 880 holiday backgrounds retain readable signup surfaces, selected slots and status copy", () => {
  const occasions = new Map(HOLIDAY_SIGNUP_DESIGNS.map((design) => [getHolidayBackground(design.id).occasion, design]));
  let count = 0;
  for (const [occasion, design] of occasions) {
    const template = catalog.find((item) => item.id === design.id);
    assert.ok(template, design.id);
    for (const background of getHolidayBackgrounds(occasion)) {
      const form = createSignupTemplateForm(template);
      form.appearance.pageBackground = getHolidayBackgroundChoice(background.id);
      const style = assertReadable(form, background.id);
      assert.equal(style["--signup-color-scheme"], "light", "holiday controls retain their light signup paper");
      assert.equal(style["--signup-canvas-page"], background.page);
      count++;
    }
  }
  assert.equal(count, 880);
});

test("custom boards keep dark or light native controls and readable text through explicit save roundtrips", () => {
  for (const dark of [false, true]) {
    for (const board of SIGNUP_CUSTOM_THEME_BOARDS) {
      const recipe = {
        version: 1, name: "Community gathering", description: "An authored signup design.",
        composition: "botanical", board, motif: "sprig", reverse: false, fontPair: "friendly",
        colors: dark
          ? { page: "#101010", surface: "#191919", soft: "#222222", ink: "#8C8C8C", accent: "#354B72", secondary: "#69806D" }
          : { page: "#F3F2EE", surface: "#FFFFFF", soft: "#E8ECF2", ink: "#222D40", accent: "#354B72", secondary: "#91A889" },
      };
      const form = applySignupCustomTheme(createEmptySignupTemplateForm(), recipe);
      for (const palette of ["original", "soft", "ink"]) {
        form.appearance.palette = palette;
        const before = assertReadable(form, `${dark ? "dark" : "light"}:${board}:${palette}`);
        assert.equal(before["--signup-color-scheme"], dark ? "dark" : "light");
        const saved = sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
        assert.deepEqual(resolveSignupThemeStyle(saved), before);
        assert.deepEqual(saved.appearance.customTheme.colors, recipe.colors);
      }
    }
  }
});
