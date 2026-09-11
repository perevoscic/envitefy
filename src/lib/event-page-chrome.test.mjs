import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_PAGE_COLOR_ATTRIBUTE, EVENT_PAGE_COLOR_PROPERTY, normalizeEventPageColor, registerEventPageColor } from "./event-page-chrome.ts";
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

test("saved gymnastics designs supply the event paper color before the preview loads", () => {
  assert.equal(resolveEventPageBackgroundColor({ category: "sport_gymnastics", pageTemplateId: "airborne-atlas", backgroundColor: "#F3EEFF" }), "#f6f1e7");
  assert.equal(resolveEventPageBackgroundColor({ templateEditor: { category: "gymnastics", templateId: "neon-runway" } }), "#101321");
  assert.equal(resolveEventPageBackgroundColor({ category: "sport_gymnastics", pageTemplateId: "retired-design" }), "#f6f1e7");
  assert.equal(resolveEventPageBackgroundColor({ category: "wedding", pageBackgroundColor: "#fff6ed" }), "#fff6ed");
});
