import assert from "node:assert/strict";
import test from "node:test";
import {
  createEventPreviewBackgroundController,
  readEventPreviewBackground,
} from "./event-preview-background.ts";

// A small document fixture models computed styles with the controller's stylesheet enabled/disabled.
function pageFixture({ generated = true, backgroundImage = "none" } = {}) {
  const styles = [];
  const plainStyle = {
    backgroundColor: "transparent",
    backgroundImage: "none",
    backgroundSize: "cover",
    backgroundPosition: "50% 50%",
    backgroundRepeat: "no-repeat",
    color: "#242424",
    visibility: "visible",
    position: "relative",
  };
  const doc = {
    createElement(tag) {
      const attrs = new Map();
      const element = {
        tag,
        children: [],
        parentElement: null,
        css: { ...plainStyle },
        disabled: false,
        get isConnected() {
          return Boolean(this.parentElement);
        },
        getAttribute: (name) => attrs.get(name) ?? null,
        setAttribute: (name, value) => attrs.set(name, value),
        removeAttribute: (name) => attrs.delete(name),
        matches(selector) {
          return selector.split(", ").includes(tag);
        },
        getBoundingClientRect: () => ({ width: doc.documentElement.clientWidth, height: 1400 }),
        append(child) {
          child.parentElement = this;
          this.children.push(child);
        },
        remove() {
          if (this.parentElement)
            this.parentElement.children = this.parentElement.children.filter(
              (child) => child !== this,
            );
          this.parentElement = null;
        },
        querySelector(selector) {
          const nodes = [...this.children];
          for (const node of nodes) {
            if (
              (selector === "div" && node.tag === "div") ||
              (selector === '[data-scan-artwork="ready"]' &&
                node.getAttribute("data-scan-artwork") === "ready")
            )
              return node;
            nodes.push(...node.children);
          }
          return null;
        },
      };
      if (tag === "style") styles.push(element);
      return element;
    },
    defaultView: {
      innerHeight: 900,
      getComputedStyle(element) {
        const css = { ...element.css };
        if (styles.some((style) => style.isConnected && !style.disabled)) {
          if (element.getAttribute("data-event-preview-background-surface") !== null) {
            css.backgroundColor = "transparent";
            css.backgroundImage = "none";
          }
          if (element.getAttribute("data-event-preview-background-artwork") !== null)
            css.visibility = "hidden";
        }
        return css;
      },
    },
  };
  doc.documentElement = doc.createElement("html");
  doc.documentElement.clientWidth = 1440;
  doc.documentElement.scrollHeight = 1400;
  doc.head = doc.createElement("head");
  doc.body = doc.createElement("body");
  doc.documentElement.append(doc.head);
  doc.documentElement.append(doc.body);
  const content = doc.createElement("div");
  const surface = doc.createElement("main");
  const hero = doc.createElement("img");
  const tile = doc.createElement("div");
  doc.body.append(content);
  content.append(surface);
  surface.append(hero);
  surface.append(tile);
  content.css.backgroundColor = "#eee";
  surface.css.backgroundColor = "#faf9f0";
  surface.css.backgroundImage = backgroundImage;
  tile.css.backgroundColor = "white";
  doc.querySelector = () => content;
  let artwork;
  if (generated) {
    artwork = doc.createElement("div");
    artwork.setAttribute("data-scan-artwork", "ready");
    artwork.css.backgroundImage = 'url("/birthday.webp")';
    artwork.css.position = "fixed";
    const tint = doc.createElement("div");
    tint.css.backgroundColor = "rgba(255, 255, 255, 0.22)";
    artwork.append(tint);
    surface.append(artwork);
  }
  return { doc, content, surface, artwork, hero, tile, css: doc.defaultView.getComputedStyle };
}

test("generated artwork paints once while the hero and detail tiles remain visible", () => {
  const page = pageFixture();
  const original = readEventPreviewBackground(page.doc);
  const controller = createEventPreviewBackgroundController(page.doc);
  const background = controller.read();
  assert.deepEqual(background, original);
  assert.equal(
    background.backgroundImage,
    'linear-gradient(rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.22)), url("/birthday.webp")',
  );
  assert.equal(page.css(page.artwork).visibility, "hidden");
  for (const node of [page.surface, page.content, page.doc.body, page.doc.documentElement]) {
    assert.equal(page.css(node).backgroundColor, "transparent");
  }
  assert.equal(page.css(page.hero).visibility, "visible");
  assert.equal(page.css(page.tile).backgroundColor, "white");
  assert.deepEqual(controller.read(), original, "subsequent reads use the authored background");
  controller.dispose();
  assert.deepEqual(readEventPreviewBackground(page.doc), original);
  assert.equal(page.css(page.artwork).visibility, "visible");
  assert.equal(page.doc.head.children.length, 0);
});

test("device and artwork changes refresh the single canvas and failed artwork restores the page", () => {
  const page = pageFixture();
  const controller = createEventPreviewBackgroundController(page.doc);
  controller.read();
  page.doc.documentElement.clientWidth = 390;
  page.artwork.css.backgroundImage = 'url("/new-art.webp")';
  assert.match(controller.read().backgroundImage, /new-art.webp/);
  page.artwork.remove();
  assert.equal(controller.read().backgroundImage, "none");
  assert.equal(page.css(page.surface).backgroundColor, "#faf9f0");
  assert.equal(page.artwork.getAttribute("data-event-preview-background-artwork"), null);
  controller.dispose();
});

test("page gradients move to the canvas and disposal restores pre-existing attributes", () => {
  const page = pageFixture({ generated: false, backgroundImage: "linear-gradient(red, blue)" });
  page.surface.setAttribute("data-event-preview-background-surface", "existing");
  const controller = createEventPreviewBackgroundController(page.doc);
  assert.equal(controller.read().backgroundImage, "linear-gradient(red, blue)");
  assert.equal(page.css(page.surface).backgroundImage, "none");
  controller.dispose();
  controller.dispose();
  assert.equal(page.surface.getAttribute("data-event-preview-background-surface"), "existing");
  assert.equal(page.css(page.surface).backgroundImage, "linear-gradient(red, blue)");
});
