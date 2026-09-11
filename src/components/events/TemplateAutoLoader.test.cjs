const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function mount({
  visibleCount = 12,
  totalCount = 60,
  batchSize = 12,
  supported = true,
  root = null,
} = {}) {
  let effect;
  let observer;
  let updates = 0;
  let count = visibleCount;
  const target = {};
  class Observer {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      observer = this;
    }
    observe(element) {
      this.target = element;
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  const module = { exports: {} };
  const file = path.join(__dirname, "TemplateAutoLoader.tsx");
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    window: supported ? { IntersectionObserver: Observer } : {},
    IntersectionObserver: Observer,
    require: (name) =>
      name === "./TemplateScrollToTop"
        ? () => null
        : name === "react"
          ? {
              useRef: () => ({ current: target }),
              useEffect: (callback) => {
                effect = callback;
              },
            }
          : require(name),
  });
  module.exports.default({
    visibleCount,
    totalCount,
    batchSize,
    scrollRoot: root ? { current: root } : undefined,
    setVisibleCount: (next) => {
      count = typeof next === "function" ? next(count) : next;
      updates++;
    },
  });
  const cleanup = effect();
  return {
    get count() {
      return count;
    },
    get updates() {
      return updates;
    },
    observer,
    cleanup,
    target,
  };
}

test("approaching the end reveals exactly one batch and ignores repeated observer callbacks", () => {
  const list = mount();
  assert.equal(list.observer.target, list.target);
  list.observer.callback([{ isIntersecting: false }]);
  assert.equal(list.count, 12);
  list.observer.callback([{ isIntersecting: true }]);
  list.observer.callback([{ isIntersecting: true }]);
  assert.equal(list.count, 24);
  assert.equal(list.updates, 1);
  assert.equal(list.observer.disconnected, true);
});

test("the final partial batch stops at the catalog size", () => {
  const list = mount({ visibleCount: 24, totalCount: 30 });
  list.observer.callback([{ isIntersecting: true }]);
  assert.equal(list.count, 30);
  assert.equal(mount({ visibleCount: 30, totalCount: 30 }).observer, undefined);
  assert.equal(mount({ totalCount: 0 }).observer, undefined);
});

test("filter resets and navigation retire queued callbacks from the previous list", () => {
  const list = mount();
  list.cleanup();
  list.observer.callback([{ isIntersecting: true }]);
  assert.equal(list.count, 12);
  assert.equal(list.updates, 0);
});

test("nested pickers observe their scroll panel and birthday batches retain their size", () => {
  const root = {};
  const list = mount({ root, batchSize: 24, visibleCount: 24 });
  assert.equal(list.observer.options.root, root);
  list.observer.callback([{ isIntersecting: true }]);
  assert.equal(list.count, 48);
});

test("unsupported observation exposes every design without requiring a missing button", () => {
  const list = mount({ supported: false });
  assert.equal(list.count, 60);
  assert.equal(list.observer, undefined);
});
