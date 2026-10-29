import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const script = ts.transpileModule(readFileSync(new URL("./AppleCalendarConnection.tsx", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const settle = () => new Promise((resolve) => setImmediate(resolve));
const disconnected = { ready: false, connected: false };
const prepared = { ready: true, connected: false };

// Run the component's hooks and handlers with controlled focus, timers and network responses.
function harness(fetchResponse = async (_url, options) => Response.json(options.method === "POST"
  ? { feedUrl: "https://example.com/feed", subscribeUrl: "webcal://example.com/feed", connected: false }
  : prepared)) {
  const slots = [];
  const effects = [];
  const focusListeners = new Set();
  const timers = new Map();
  const requests = [];
  const changes = [];
  const document = { visibilityState: "visible" };
  let cursor = 0;
  let dirty = false;
  let timerId = 0;
  let tree;
  let props = {
    accountKey: "owner-a",
    status: disconnected,
    onStatusChange(status) { changes.push(status); props.status = status; dirty = true; },
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: initial };
      return [slots[index].value, (next) => {
        const value = typeof next === "function" ? next(slots[index].value) : next;
        if (!Object.is(slots[index].value, value)) { slots[index].value = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useEffect(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return;
      effects.push(() => {
        previous?.cleanup?.();
        slots[index] = { deps, callback, cleanup: callback() };
      });
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(script, {
    module, exports: module.exports, AbortController, document,
    window: {
      addEventListener: (_name, listener) => focusListeners.add(listener),
      removeEventListener: (_name, listener) => focusListeners.delete(listener),
      setInterval: (callback) => { timers.set(++timerId, callback); return timerId; },
      clearInterval: (id) => timers.delete(id),
    },
    fetch: (url, options) => { requests.push({ url, options }); return fetchResponse(url, options); },
    require: (name) => {
      if (name === "react") return react;
      if (name === "@radix-ui/react-dialog") return Object.fromEntries(
        ["Root", "Trigger", "Portal", "Overlay", "Content", "Close", "Title", "Description"].map(key => [key, `Dialog.${key}`]),
      );
      if (name === "lucide-react") return {};
      return require(name);
    },
  });
  function render(next = {}) {
    props = { ...props, ...next };
    let passes = 0;
    do {
      assert.ok(passes++ < 20, "component effects should settle");
      dirty = false;
      cursor = 0;
      tree = module.exports.default(props);
      for (const effect of effects.splice(0)) effect();
    } while (dirty);
    return tree;
  }
  function find(predicate, node = tree) {
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const result = child == null ? null : find(predicate, child);
      if (result) return result;
    }
    return null;
  }
  return {
    requests, changes, timers, document, render, find,
    focus() { for (const listener of focusListeners) listener(); },
    tick() { for (const callback of timers.values()) callback(); },
    open(value) { find(node => node.type === "Dialog.Root").props.onOpenChange(value); render(); },
    click(label) {
      const button = find(node => node.type === "button" && [node.props.children].flat().includes(label));
      assert.ok(button, `button ${label} should exist`);
      button.props.onClick();
      render();
    },
    replayEffects() { for (const slot of slots) if (slot?.callback) { slot.cleanup?.(); slot.cleanup = slot.callback(); } },
    dispose() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

test("disconnected Settings stays idle across mount, effect replay, focus and parent refresh", () => {
  const h = harness();
  h.render();
  h.replayEffects();
  h.focus();
  h.tick();
  h.render({ status: { ...disconnected } });
  h.open(true); // Opening the explanation alone must not create or check a subscription.
  h.focus();
  assert.equal(h.requests.length, 0);
  assert.equal(h.timers.size, 0);
  h.dispose();
});

test("saved subscriptions make no Apple requests when setup is opened, focused or left open", () => {
  const h = harness();
  for (const status of [prepared, { ready: true, connected: true }]) {
    h.render({ status });
    h.open(true);
    h.focus();
    h.tick();
    h.tick();
    h.open(false);
  }
  assert.equal(h.requests.length, 0);
  assert.equal(h.timers.size, 0);
  h.dispose();
});

test("explicit setup makes one POST and uses the parent's manually refreshed status", async () => {
  const h = harness();
  h.render();
  h.open(true);
  h.click("Continue");
  await settle();
  h.render();
  assert.deepEqual(h.requests.map(({ options }) => options.method), ["POST"]);
  assert.equal(h.requests[0].options.credentials, "include");
  assert.equal(h.changes.at(-1).ready, true);
  assert.equal(h.changes.at(-1).connected, false);
  assert.equal(h.find(node => node.type === "a").props.href, "webcal://example.com/feed");
  h.focus();
  h.tick();
  h.tick();
  assert.equal(h.requests.length, 1);
  assert.equal(h.timers.size, 0);
  h.render({ status: { ready: true, connected: true } });
  assert.equal(h.find(node => node.props?.role === "status").props.children,
    "Your calendar subscription is connected.");
  assert.ok(h.find(node => node.props?.["aria-label"] === "Manage Apple Calendar"));
  h.focus();
  h.tick();
  assert.equal(h.requests.length, 1);
  h.dispose();
});

test("setup failures stay available for an explicit retry without focus or timer requests", async () => {
  let failing = true;
  const h = harness(async () => failing
    ? Response.json({ error: "Setup unavailable" }, { status: 503 })
    : Response.json({ feedUrl: "https://example.com/feed", subscribeUrl: "webcal://example.com/feed" }));
  h.render();
  h.open(true);
  h.click("Continue");
  await settle();
  h.render();
  assert.equal(h.find(node => node.props?.role === "alert").props.children, "Setup unavailable");
  h.focus();
  h.tick();
  assert.equal(h.requests.length, 1);
  assert.equal(h.changes.length, 0);
  failing = false;
  h.click("Continue");
  await settle();
  h.render();
  assert.deepEqual(h.requests.map(({ options }) => options.method), ["POST", "POST"]);
  assert.equal(h.find(node => node.props?.role === "alert"), null);
  assert.equal(h.changes.at(-1).ready, true);
  h.dispose();
});

test("account changes discard a pending setup response and its private subscription link", async () => {
  let finish;
  const h = harness(() => new Promise(resolve => { finish = resolve; }));
  h.render();
  h.open(true);
  h.click("Continue");
  h.render({ accountKey: "owner-b", status: disconnected });
  assert.equal(h.find(node => node.type === "Dialog.Root").props.open, false);
  finish(Response.json({ feedUrl: "https://example.com/private-a", subscribeUrl: "webcal://example.com/private-a", connected: true }));
  await settle();
  h.render();
  h.open(true);
  h.focus();
  h.tick();
  assert.equal(h.find(node => node.type === "a"), null);
  assert.equal(h.changes.length, 0);
  assert.equal(h.requests.length, 1);
  h.dispose();
});

test("a pending setup cannot reconnect a different account after its explicit disconnect", async () => {
  let finish;
  const h = harness((_url, options) => options.method === "DELETE"
    ? Promise.resolve(Response.json({ ok: true }))
    : new Promise(resolve => { finish = resolve; }));
  h.render();
  h.open(true);
  h.click("Continue");
  h.render({ accountKey: "owner-b", status: prepared });
  h.open(true);
  h.click("Disconnect Apple Calendar");
  await settle();
  h.render();
  finish(Response.json({ feedUrl: "https://example.com/private-a", subscribeUrl: "webcal://example.com/private-a", connected: true }));
  await settle();
  h.render();
  h.focus();
  h.tick();
  assert.deepEqual(h.requests.map(({ options }) => options.method), ["POST", "DELETE"]);
  assert.equal(h.changes.length, 1);
  assert.equal(h.changes[0].ready, false);
  assert.equal(h.changes[0].connected, false);
  assert.equal(h.find(node => node.type === "a"), null);
  assert.equal(h.find(node => node.type === "Dialog.Root").props.open, false);
  h.dispose();
});

test("disconnect responses cannot change a newly selected account", async () => {
  let finish;
  const h = harness(() => new Promise(resolve => { finish = resolve; }));
  h.render({ status: prepared });
  h.open(true);
  h.click("Disconnect Apple Calendar");
  h.render({ accountKey: "owner-b", status: { ready: true, connected: true } });
  finish(Response.json({ ok: true }));
  await settle();
  h.render();
  assert.equal(h.changes.length, 0);
  assert.ok(h.find(node => node.props?.["aria-label"] === "Manage Apple Calendar"));
  assert.deepEqual(h.requests.map(({ options }) => options.method), ["DELETE"]);
  h.dispose();
});

test("unmounting discards a pending setup result without a status callback", async () => {
  let finish;
  const h = harness(() => new Promise(resolve => { finish = resolve; }));
  h.render();
  h.open(true);
  h.click("Continue");
  h.dispose();
  finish(Response.json({ feedUrl: "https://example.com/feed", subscribeUrl: "webcal://example.com/feed", connected: true }));
  await settle();
  h.focus();
  h.tick();
  assert.equal(h.changes.length, 0);
  assert.equal(h.requests.length, 1);
});
