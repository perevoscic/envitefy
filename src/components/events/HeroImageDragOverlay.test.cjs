const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function load(file, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", "window", "ResizeObserver", source)(
    (name) =>
      name in mocks
        ? mocks[name]
        : name.startsWith("@/")
          ? load(path.resolve("src", `${name.slice(2)}.ts`))
          : require(name),
    module,
    module.exports,
    { addEventListener() {}, removeEventListener() {} },
    undefined,
  );
  return module.exports;
}
const { heroImageVerticalOverflow, heroImagePositionAfterDrag } = load(
  path.resolve("src/lib/hero-image-drag.ts"),
);

function harness({ width = 600, height = 400, naturalWidth = 600, naturalHeight = 1000 } = {}) {
  const values = [];
  const refs = [];
  let stateIndex = 0,
    refIndex = 0;
  let measured = false;
  let effect;
  let positionY = 50;
  let captured = null;
  const changes = [];
  const imageRef = {
    current: {
      naturalWidth,
      naturalHeight,
      getBoundingClientRect: () => ({ width, height }),
      addEventListener() {},
      removeEventListener() {},
    },
  };
  const hooks = {
    useId: () => "drag-help",
    useRef: (initial) => (refs[refIndex++] ||= { current: initial }),
    useState: (initial) => {
      const index = stateIndex++;
      if (!(index in values)) values[index] = initial;
      return [
        values[index],
        (value) => {
          values[index] = value;
        },
      ];
    },
    useEffect: (callback) => {
      if (!measured) effect = callback;
    },
  };
  const Overlay = load(path.resolve(__dirname, "HeroImageDragOverlay.tsx"), {
    react: hooks,
  }).default;
  const target = {
    focus() {},
    setPointerCapture: (id) => {
      captured = id;
    },
    releasePointerCapture: () => {
      captured = null;
    },
  };
  const render = () => {
    stateIndex = 0;
    refIndex = 0;
    return Overlay({
      imageRef,
      imageSrc: "/portrait.webp",
      positionY,
      onChange: (value) => {
        positionY = value;
        changes.push(value);
      },
    });
  };
  render();
  effect();
  measured = true;
  return {
    render,
    changes,
    captured: () => captured,
    pointer: (clientY, extra = {}) => ({
      isPrimary: true,
      button: 0,
      pointerId: 1,
      clientY,
      currentTarget: target,
      preventDefault() {},
      ...extra,
    }),
  };
}

test("dragging follows screen pixels and stops at the crop edges, including scaled previews", () => {
  assert.equal(heroImageVerticalOverflow(600, 400, 600, 1000), 600);
  assert.equal(heroImagePositionAfterDrag(50, 60, 600), 40);
  assert.equal(heroImagePositionAfterDrag(50, -60, 600), 60);
  assert.equal(
    heroImagePositionAfterDrag(50, 30, heroImageVerticalOverflow(300, 200, 600, 1000)),
    40,
  );
  assert.equal(heroImagePositionAfterDrag(50, 1000, 600), 0);
  assert.equal(heroImagePositionAfterDrag(50, -1000, 600), 100);
  assert.equal(heroImageVerticalOverflow(600, 400, 0, 0), 0);
});

test("mouse and touch drags update the crop directly and release pointer capture", () => {
  for (const pointerType of ["mouse", "touch"]) {
    const h = harness();
    h.render().props.onPointerDown(h.pointer(200, { pointerType }));
    assert.equal(h.captured(), 1);
    h.render().props.onPointerMove(h.pointer(260, { pointerType }));
    assert.equal(h.render().props["aria-valuenow"], 40);
    h.render().props.onPointerUp(h.pointer(260, { pointerType }));
    assert.equal(h.captured(), null);
    assert.deepEqual(h.changes, [40]);
  }
});

test("a canceled drag restores the starting crop and ignores secondary pointers", () => {
  const h = harness();
  h.render().props.onPointerDown(h.pointer(200, { button: 2 }));
  assert.equal(h.captured(), null);
  h.render().props.onPointerDown(h.pointer(200));
  h.render().props.onPointerMove(h.pointer(100, { pointerId: 2 }));
  assert.deepEqual(h.changes, []);
  h.render().props.onPointerMove(h.pointer(260));
  h.render().props.onPointerCancel();
  assert.equal(h.render().props["aria-valuenow"], 50);
});

test("the image supports keyboard repositioning without a separate adjustment window", () => {
  const h = harness();
  const key = (value) => h.render().props.onKeyDown({ key: value, preventDefault() {} });
  key("ArrowUp");
  assert.equal(h.render().props["aria-valuenow"], 55);
  key("ArrowDown");
  assert.equal(h.render().props["aria-valuenow"], 50);
  key("Home");
  assert.equal(h.render().props["aria-valuenow"], 0);
  key("End");
  assert.equal(h.render().props["aria-valuenow"], 100);
});

test("uncropped and unloaded images do not intercept scrolling with a drag surface", () => {
  assert.equal(harness({ naturalWidth: 600, naturalHeight: 400 }).render(), null);
  assert.equal(harness({ naturalWidth: 0, naturalHeight: 0 }).render(), null);
});
