import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_PAGE_COLOR_ATTRIBUTE, EVENT_PAGE_COLOR_PROPERTY, EVENT_PAGE_TONE_ATTRIBUTE, isDarkEventPageColor, normalizeEventPageColor, registerEventPageColor } from "./event-page-chrome.ts";
import { resolveEventPageBackgroundColor } from "./theme-color.ts";

function rootFixture() {
  const attributes = new Map();
  const properties = new Map();
  return {
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    style: {
      getPropertyValue: (name) => properties.get(name) || "",
      setProperty: (name, value) => properties.set(name, value),
      removeProperty: (name) => properties.delete(name),
    },
  };
}

test("the event and editor retain the real paper color through overlapping route cleanup", () => {
  const root = rootFixture();
  const owner = registerEventPageColor(root, "#f6f1e7");
  const editor = registerEventPageColor(root, "rgb(246, 241, 231)");
  owner.dispose();
  assert.equal(root.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE), "rgb(246, 241, 231)");
  editor.update("#101321");
  const returningOwner = registerEventPageColor(root, "#101321");
  editor.dispose();
  editor.dispose();
  assert.equal(root.style.getPropertyValue(EVENT_PAGE_COLOR_PROPERTY), "#101321");
  returningOwner.dispose();
  assert.equal(root.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE), null);
  assert.equal(root.style.getPropertyValue(EVENT_PAGE_COLOR_PROPERTY), "");
});

test("an editor can finish loading its color after the old event unmounts", () => {
  const root = rootFixture();
  root.style.setProperty(EVENT_PAGE_COLOR_PROPERTY, "#fff");
  const owner = registerEventPageColor(root, "#f6f1e7");
  const editor = registerEventPageColor(root);
  owner.dispose();
  editor.update("#101321");
  assert.equal(root.getAttribute(EVENT_PAGE_COLOR_ATTRIBUTE), "#101321");
  editor.dispose();
  assert.equal(root.style.getPropertyValue(EVENT_PAGE_COLOR_PROPERTY), "#fff");
});

test("URL color hints accept solid colors and reject CSS declarations or images", () => {
  assert.equal(normalizeEventPageColor(" #f6f1e7 "), "#f6f1e7");
  assert.equal(normalizeEventPageColor("rgb(246, 241, 231)"), "rgb(246, 241, 231)");
  for (const value of ["red;display:none", "url(https://example.com/image)", "linear-gradient(red, blue)", "transparent", null]) {
    assert.equal(normalizeEventPageColor(value), null);
  }
});

test("sidebar frost recognizes dark colors in the formats used by templates and computed styles", () => {
  for (const color of ["#321c24", "#101321", "#123", "rgb(50, 28, 36)", "rgb(20% 11% 14%)", "rgba(50, 28, 36, 1)", "hsl(338 28% 15%)", "hsla(338, 28%, 15%, 100%)"]) {
    assert.equal(isDarkEventPageColor(color), true, color);
  }
  for (const color of ["#fff", "#f6f1e7", "rgb(246, 241, 231)", "hsl(47, 45%, 94%)", "rgb(100% 100% 100%)", "rgba(0, 0, 0, 0)", "rgb(0 0 0 / 10%)", "transparent", "url(image.webp)"]) {
    assert.equal(isDarkEventPageColor(color), false, color);
  }
});

test("sidebar frost follows design changes and overlapping editor cleanup, then restores app chrome", () => {
  const root = rootFixture();
  const owner = registerEventPageColor(root, "#321c24");
  assert.equal(root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE), "dark");
  const editor = registerEventPageColor(root, "#f6f1e7");
  assert.equal(root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE), "light");
  owner.dispose();
  assert.equal(root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE), "light");
  editor.update("rgb(16, 19, 33)");
  assert.equal(root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE), "dark");
  const returningOwner = registerEventPageColor(root, "#f6f1e7");
  editor.dispose();
  editor.update("#000");
  assert.equal(root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE), "light");
  returningOwner.dispose();
  assert.equal(root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE), null);

  root.setAttribute(EVENT_PAGE_TONE_ATTRIBUTE, "light");
  const preview = registerEventPageColor(root, "#000");
  preview.dispose();
  assert.equal(root.getAttribute(EVENT_PAGE_TONE_ATTRIBUTE), "light");
});

test("saved gymnastics designs supply the event paper color before the preview loads", () => {
  assert.equal(resolveEventPageBackgroundColor({ category: "sport_gymnastics", pageTemplateId: "airborne-atlas", backgroundColor: "#F3EEFF" }), "#f6f1e7");
  assert.equal(resolveEventPageBackgroundColor({ templateEditor: { category: "gymnastics", templateId: "neon-runway" } }), "#101321");
  assert.equal(resolveEventPageBackgroundColor({ category: "sport_gymnastics", pageTemplateId: "retired-design" }), "#f6f1e7");
  assert.equal(resolveEventPageBackgroundColor({ category: "wedding", pageBackgroundColor: "#fff6ed" }), "#fff6ed");
});
