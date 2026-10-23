import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import loadTs from "../../scripts/lib/event-messages-test-loader.cjs";

const cache = new Map();
const load = (file, mocks = {}) => loadTs(file, mocks, cache);
const backgrounds = load("src/lib/holiday-backgrounds.ts");
const themes = load("src/lib/signup-themes.ts");
const { HOLIDAY_SIGNUP_DESIGNS, SIGNUP_DESIGN_PALETTES } = load("src/lib/signup-designs.ts");
const { createDefaultSignupForm, sanitizeSignupForm } = load("src/utils/signup.ts");
const makeForm = (design) => ({
  ...createDefaultSignupForm(),
  title: "Our holiday gathering",
  appearance: themes.createSignupAppearance("celebrate-together", design.id),
});

test("every available holiday signup starts with its coordinated versioned background", () => {
  assert.ok(HOLIDAY_SIGNUP_DESIGNS.length >= 400);
  for (const design of HOLIDAY_SIGNUP_DESIGNS) {
    const form = makeForm(design);
    const background = backgrounds.getHolidayBackground(design.id);
    assert.ok(background, design.id);
    assert.deepEqual(form.appearance.pageBackground, {
      version: 1, presetId: background.id, source: "template",
    });
    const roundtrip = sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
    assert.deepEqual(roundtrip.appearance.pageBackground, form.appearance.pageBackground);
    assert.equal(themes.resolveSignupHolidayBackground(roundtrip.appearance).id, background.id);
    assert.equal(themes.resolveSignupThemeStyle(roundtrip)["--signup-canvas-page"], background.page);
  }
});

test("all holiday choices retain readable signup fields and button text, including dark page paper", () => {
  let dark = 0;
  const occasions = new Map(HOLIDAY_SIGNUP_DESIGNS.map((design) => [backgrounds.getHolidayBackground(design.id).occasion, design]));
  for (const [occasion, design] of occasions) for (const background of backgrounds.getHolidayBackgrounds(occasion)) {
    const form = makeForm(design);
    form.appearance.pageBackground = backgrounds.getHolidayBackgroundChoice(background.id);
    const style = themes.resolveSignupThemeStyle(form);
    assert.equal(style["--signup-canvas-page"], background.page);
    assert.equal(style["--signup-page"], style["--signup-surface"]);
    assert.ok(themes.signupContrast(style["--signup-surface"], "#000000") >= 4.5, background.id);
    assert.ok(themes.signupContrast(style["--signup-text"], style["--signup-surface"]) >= 4.5, background.id);
    assert.ok(themes.signupContrast(style["--signup-accent-text"], style["--signup-surface"]) >= 4.5, background.id);
    assert.ok(themes.signupContrast(style["--signup-accent"], style["--signup-on-accent"]) >= 4.5, background.id);
    if (themes.signupContrast(background.page, "#FFFFFF") > themes.signupContrast(background.page, "#000000")) dark++;
  }
  assert.ok(dark > 0, "dark page choices are covered");
});

test("saved holiday forms without a background keep the original palette through normalization and saving", () => {
  for (const design of HOLIDAY_SIGNUP_DESIGNS) {
    const form = makeForm(design);
    delete form.appearance.pageBackground;
    const palette = SIGNUP_DESIGN_PALETTES[design.palette];
    for (const colorMode of ["original", "soft", "ink"]) {
      form.appearance.palette = colorMode;
      const saved = sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
      assert.equal(Object.hasOwn(saved.appearance, "pageBackground"), false);
      assert.equal(themes.resolveSignupHolidayBackground(saved.appearance), undefined);
      const style = themes.resolveSignupThemeStyle(saved);
      assert.equal(style["--signup-page"], colorMode === "soft" ? palette.soft : palette.page, design.id);
      assert.equal(style["--signup-text"], palette.ink, design.id);
    }
  }
});

test("invalid background data cannot add CSS or opt an old form into new colors", () => {
  const form = makeForm(HOLIDAY_SIGNUP_DESIGNS[0]);
  const presetId = form.appearance.pageBackground.presetId;
  const unrelatedPreset = backgrounds.getHolidayBackgrounds("halloween")[0].id;
  for (const choice of ["url(https://example.test/image)", { version: 1, presetId: "missing" }, { version: 2, presetId }, { version: 1, presetId: unrelatedPreset }]) {
    form.appearance.pageBackground = choice;
    assert.equal(themes.resolveSignupHolidayBackground(form.appearance), undefined);
    const appearance = themes.normalizeSignupAppearance(form.appearance);
    assert.equal(appearance.pageBackground, undefined);
    assert.equal(themes.resolveSignupHolidayBackground(appearance), undefined);
  }
});

test("explicit signup draft and publish writes preserve background source and existing responses", () => {
  const { createSignupThemeForm } = load("src/lib/signup-starters.ts");
  const { buildTemplateDraftPayload } = load("src/lib/template-draft-payload.ts");
  const { updateSignupDefinition, mutateSignupReservation, readStoredSignup } = load("src/lib/signup-mutations.ts");
  const { projectSignupForm } = load("src/lib/signup-projection.ts");
  const design = HOLIDAY_SIGNUP_DESIGNS.find((design) => design.id.includes("--halloween--friendly-ghosts"));
  const initial = createSignupThemeForm("harvest-table");
  initial.appearance = themes.createSignupAppearance("harvest-table", design.id);
  const current = mutateSignupReservation(initial, {
    action: "reserve", slots: [{ sectionId: initial.sections[0].id, slotId: initial.sections[0].slots[0].id, quantity: 1 }],
  }, { userId: "guest", name: "Guest", email: "guest@example.test", isOwner: false }).form;
  const choice = backgrounds.getHolidayBackgroundChoice(backgrounds.getHolidayBackgrounds("halloween")[1].id);
  const incoming = { ...initial, appearance: { ...initial.appearance, pageBackground: choice } };
  const payload = buildTemplateDraftPayload({ form: incoming }, "signup-forms", "America/Chicago");
  assert.deepEqual(payload.data.signupForm.appearance.pageBackground, choice);
  const draft = updateSignupDefinition(current, JSON.parse(JSON.stringify(payload.data.signupForm)), true);
  assert.deepEqual(draft.appearance.pageBackground, choice);
  assert.deepEqual(draft.responses, current.responses);
  const published = updateSignupDefinition(draft, { ...draft, enabled: true });
  for (const value of [readStoredSignup(JSON.parse(JSON.stringify(published))), projectSignupForm(published)]) {
    assert.deepEqual(value.appearance.pageBackground, choice);
    assert.equal(themes.resolveSignupHolidayBackground(value.appearance).id, choice.presetId);
  }
});

test("signup background controls update only pending appearance and reset to the current design", () => {
  const design = HOLIDAY_SIGNUP_DESIGNS.find((design) => design.id.includes("--halloween--friendly-ghosts"));
  assert.ok(design);
  const form = makeForm(design);
  form.responses = [{ id: "kept-response", status: "cancelled", slots: [] }];
  const original = structuredClone(form);
  let changed;
  const Panel = loadTs("src/components/smart-signup-form/SignupDesignPanel.tsx", {
    react: { ...React, useState: (value) => [value, () => {}] },
    "lucide-react": { Sparkles: () => null },
    "@/components/design-panel/FontPairingSelect": { FontPairingSelect: () => null },
    "./SignupCustomThemeDialog": { __esModule: true, default: () => null },
  }).default;
  const visit = (node) => {
    if (!node || typeof node !== "object") return [];
    return [node, ...React.Children.toArray(node.props?.children).flatMap(visit)];
  };
  const picker = visit(Panel({ form, onChange: (value) => { changed = value; }, onUseTheme() {} }))
    .find((node) => node.props?.designId === design.id && typeof node.props.onChange === "function");
  assert.ok(picker);
  const option = backgrounds.getHolidayBackgrounds("halloween").find((item) => item.id !== form.appearance.pageBackground.presetId);
  picker.props.onChange(backgrounds.getHolidayBackgroundChoice(option.id));
  assert.deepEqual(changed.appearance.pageBackground, { version: 1, presetId: option.id, source: "custom" });
  assert.equal(changed.header, form.header);
  assert.equal(changed.sections, form.sections);
  assert.equal(changed.responses, form.responses);
  assert.equal(changed.title, form.title);
  assert.deepEqual(form, original);
  picker.props.onChange(undefined);
  assert.deepEqual(changed.appearance.pageBackground, form.appearance.pageBackground);
});

test("signup thumbnails and guest pages render the same coordinated background identity", () => {
  const design = HOLIDAY_SIGNUP_DESIGNS.find((design) => design.id.includes("--halloween--friendly-ghosts"));
  const form = makeForm(design);
  const background = themes.resolveSignupHolidayBackground(form.appearance);
  const mocks = {
    "./SignupTemplateHeader": { __esModule: true, default: () => null },
    "./SignupViewer": { __esModule: true, default: () => null },
    "./SignupFormFooter": { __esModule: true, default: () => null },
    "@/components/event-templates/EventGuestActions": { __esModule: true, default: () => null },
    "@/components/events/TemplateThumbnail": { TemplateThumbnailPreview: ({ children }) => React.createElement("div", {}, children) },
  };
  const Page = loadTs("src/components/smart-signup-form/SignupPageRenderer.tsx", mocks).default;
  const Thumbnail = loadTs("src/components/smart-signup-form/SignupTemplatePreview.tsx", mocks).default;
  for (const html of [
    renderToStaticMarkup(React.createElement(Page, { form })),
    renderToStaticMarkup(React.createElement(Thumbnail, { template: { id: design.id, name: design.name, heroImage: design.artwork } })),
  ]) {
    assert.ok(html.includes(`data-holiday-background="${background.id}"`));
    assert.ok(html.includes(background.page));
  }
});
