import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("./useVisualViewportInsets.ts", import.meta.url), "utf8");
const compiled = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS });

function mount({ visual = true, fit = true } = {}) {
  const properties = new Map();
  const root = { style: { overflow: "auto", setProperty: (key, value) => properties.set(key, value), removeProperty: key => properties.delete(key) } };
  const body = { style: { overflow: "visible" } };
  const window = new EventTarget();
  window.innerHeight = 844;
  if (visual) window.visualViewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0, scale: 1 });
  let unmount;
  const exports = {};
  new Function("require", "exports", "window", "document", compiled)(() => ({ useEffect: effect => { unmount = effect(); } }), exports, window, { documentElement: root, body });
  exports.useVisualViewportInsets({ fitVisualViewport: fit, lockPageScroll: true });
  return {
    root, body, properties, window, unmount,
    resize(height, offsetTop = 0, scale = 1) {
      Object.assign(window.visualViewport, { height, offsetTop, scale });
      window.visualViewport.dispatchEvent(new Event("resize"));
    },
  };
}

test("fitted chat follows keyboard size and viewport panning, then restores full height", () => {
  const h = mount();
  assert.equal(h.properties.get("--envitefy-layout-height"), "844px");
  assert.equal(h.root.style.overflow, "hidden");
  h.resize(400);
  assert.equal(h.properties.get("--envitefy-layout-height"), "400px");
  h.resize(350, 35);
  assert.equal(h.properties.get("--envitefy-layout-height"), "350px");
  assert.equal(h.properties.get("--envitefy-layout-top"), "35px");
  h.resize(844);
  assert.equal(h.properties.get("--envitefy-layout-height"), "844px");
  assert.equal(h.properties.get("--envitefy-layout-top"), "0px");
  h.unmount();
  assert.equal(h.properties.size, 0);
  assert.equal(h.root.style.overflow, "auto");
  assert.equal(h.body.style.overflow, "visible");
  h.resize(400);
  assert.equal(h.properties.size, 0, "listeners removed on navigation");
});

test("pinch zoom magnifies without shrinking and reflowing the chat", () => {
  const h = mount();
  h.resize(422, 60, 2);
  assert.equal(h.properties.get("--envitefy-layout-height"), "844px");
  assert.equal(h.properties.get("--envitefy-layout-top"), "0px");
  h.unmount();
});

test("desktop and browsers without VisualViewport still follow window resizing", () => {
  const h = mount({ visual: false });
  h.window.innerHeight = 600;
  h.window.dispatchEvent(new Event("resize"));
  assert.equal(h.properties.get("--envitefy-layout-height"), "600px");
  assert.equal(h.properties.get("--envitefy-keyboard-inset"), "0px");
  h.unmount();
});

test("existing inset mode keeps layout height and exposes keyboard padding", () => {
  const h = mount({ fit: false });
  h.resize(400, 20);
  assert.equal(h.properties.get("--envitefy-layout-height"), "844px");
  assert.equal(h.properties.get("--envitefy-keyboard-inset"), "424px");
  assert.equal(h.properties.get("--envitefy-layout-top"), "0px");
  h.unmount();
});
