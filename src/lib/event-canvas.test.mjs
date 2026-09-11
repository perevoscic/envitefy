import assert from "node:assert/strict";
import test from "node:test";
import { readEventCanvasColor } from "./event-canvas.ts";

function fixture(width = 1440) {
  const doc = { defaultView: { getComputedStyle: (element) => element.style } };
  const element = (color = "transparent", options = {}) => ({
    ownerDocument: doc,
    clientWidth: options.width ?? width,
    children: options.children || [],
    style: {
      display: "block",
      visibility: "visible",
      position: "relative",
      backgroundColor: color,
      ...options.style,
    },
    classList: { contains: (name) => options.className === name },
    matches: (selector) => selector.startsWith("div") || Boolean(options.ignored),
    getBoundingClientRect: () => ({ width: options.width ?? width, height: options.height ?? 800 }),
  });
  return { element };
}

test("the event paper wins over the old page gradient and individual cards", () => {
  const { element } = fixture();
  const card = element("rgb(255, 255, 255)");
  const paper = element("rgb(249, 234, 213)", { children: [card], width: 1024 });
  const oldPage = element("rgb(248, 250, 252)", {
    className: "event-modern-page",
    children: [element("transparent", { children: [paper] })],
  });
  assert.equal(
    readEventCanvasColor(element("rgb(240, 242, 245)", { children: [oldPage] })),
    "rgb(249, 234, 213)",
  );
});

test("changing a design updates the source color while ignoring dialogs and decorative layers", () => {
  const { element } = fixture();
  const paper = element("rgb(249, 234, 213)");
  const canvas = element("transparent", {
    children: [
      element("rgb(255, 0, 0)", { ignored: true }),
      element("rgb(255, 0, 0)", { style: { position: "fixed" } }),
      element("rgb(255, 255, 255)", { height: 44 }),
      paper,
    ],
  });
  assert.equal(readEventCanvasColor(canvas), "rgb(249, 234, 213)");
  paper.style.backgroundColor = "rgb(16, 19, 33)";
  assert.equal(readEventCanvasColor(canvas), "rgb(16, 19, 33)");
});

test("bounded event pages still supply the canvas color on wide monitors", () => {
  const { element } = fixture(3000);
  const paper = element("rgb(234, 239, 229)", { width: 1024 });
  assert.equal(
    readEventCanvasColor(element("transparent", { children: [paper] })),
    "rgb(234, 239, 229)",
  );
});

test("loading content does not replace the last known event color", () => {
  const { element } = fixture();
  assert.equal(
    readEventCanvasColor(
      element("transparent", { children: [element("transparent", { height: 40 })] }),
    ),
    null,
  );
});
