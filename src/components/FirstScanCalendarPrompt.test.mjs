import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { readCalendarSyncState } from "../lib/calendar-sync-state.ts";

const require = createRequire(import.meta.url);
const script = ts.transpileModule(readFileSync(new URL("./FirstScanCalendarPrompt.tsx", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const settle = () => new Promise(resolve => setImmediate(resolve));
const synced = { status: "synced", provider: "microsoft", updatedAt: "2026-09-10T12:00:00Z" };

// Exercise actual component effects and visible notices across separate page mounts.
function harness({
  storage = new Map(), states = [synced], navigationType = "navigate", navigationUrl,
  href = "https://envitefy.example/event/example?created=true&tab=dashboard#details",
  props: extraProps = {}, storageBlocked = false,
} = {}) {
  const slots = [];
  const effects = [];
  const timers = new Map();
  const requests = [];
  const historyState = { preserved: true };
  const replacements = [];
  let location = new URL(href);
  let cursor = 0;
  let dirty = false;
  let timerId = 0;
  let tree;
  const props = {
    userId: "owner-a", eventId: "event-a", returnPath: "/event/example",
    backgroundSync: true, announceSyncCompletion: true, ...extraProps,
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: initial };
      return [slots[index].value, next => {
        const value = typeof next === "function" ? next(slots[index].value) : next;
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((dep, i) => !Object.is(dep, slots[index].deps[i]))) {
        slots[index] = { deps, value: callback() };
      }
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
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
  const setTimeout = (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; };
  const clearTimeout = id => timers.delete(id);
  const module = { exports: {} };
  vm.runInNewContext(script, {
    module, exports: module.exports, URL, URLSearchParams, AbortController, AbortSignal,
    setTimeout, clearTimeout,
    window: {
      get location() { return location; },
      performance: { getEntriesByType: () => [{ type: navigationType, name: navigationUrl || href }] },
      history: {
        state: historyState,
        replaceState(state, _unused, url) {
          replacements.push({ state, url });
          location = new URL(url, location);
        },
      },
      localStorage: {
        getItem(key) { if (storageBlocked) throw new Error("Unavailable"); return storage.get(key) ?? null; },
        setItem(key, value) { if (storageBlocked) throw new Error("Unavailable"); storage.set(key, value); },
      },
      setTimeout, clearTimeout,
    },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return Response.json(states[Math.min(requests.length - 1, states.length - 1)]);
    },
    require: name => {
      if (name === "react") return react;
      if (name === "next/link") return "a";
      if (name === "@/config/calendar-sync") return { CONNECTED_CALENDAR_SYNC_ENABLED: true };
      if (name === "@/utils/calendar-open") return {};
      if (name === "@/lib/calendar-sync-state") return { readCalendarSyncState };
      if (name === "@radix-ui/react-dialog" || name === "lucide-react") return {};
      return require(name);
    },
  });
  function render() {
    let passes = 0;
    do {
      assert.ok(passes++ < 20, "effects should settle");
      dirty = false;
      cursor = 0;
      tree = module.exports.default(props);
      for (const effect of effects.splice(0)) effect();
    } while (dirty);
  }
  function descendants(node = tree) {
    if (!node || typeof node !== "object") return [];
    return [node, ...[node.props?.children].flat(Infinity).filter(child => child && typeof child === "object").flatMap(descendants)];
  }
  function textContent(node) {
    if (typeof node === "string") return node;
    return [node?.props?.children].flat(Infinity).filter(child => child != null).map(textContent).join("");
  }
  return {
    storage, requests, replacements, historyState, render,
    get url() { return location.href; },
    notices: () => descendants().filter(node => node.type === "aside").map(textContent),
    dismiss() {
      descendants().find(node => node.type?.name === "NoticeCloseButton").props.onDismiss();
      render();
    },
    async flush() { await settle(); render(); },
    async tick(delay) {
      for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.callback(); }
      await settle(); render();
    },
    replayEffects() { for (const slot of slots) if (slot?.callback) { slot.cleanup?.(); slot.cleanup = slot.callback(); } },
    dispose() { for (const slot of slots) slot?.cleanup?.(); },
  };
}

test("initial creation confirms a fast sync once and consumes only the creation flag", async () => {
  const h = harness();
  h.render();
  assert.deepEqual(h.notices(), [], "a stored success must not flash an Adding notice");
  await h.flush();
  assert.deepEqual(h.notices(), ["Added to Outlook."]);
  assert.equal(h.url, "https://envitefy.example/event/example?tab=dashboard#details");
  assert.equal(h.replacements[0].state, h.historyState);
  assert.equal(h.requests[0].options.method, undefined, "status monitoring must not insert events");
  await h.tick(5000);
  assert.deepEqual(h.notices(), []);
  h.dispose();
});

test("reloads and browser history visits with an old creation flag stay quiet even without a prior receipt", async () => {
  for (const navigationType of ["reload", "back_forward"]) {
    const h = harness({ navigationType });
    h.render();
    assert.deepEqual(h.notices(), []);
    await h.flush();
    assert.deepEqual(h.notices(), []);
    assert.equal(h.requests.length, 1);
    h.dispose();
  }
});

test("confirmations cannot replay through a stale creation link, with or without dismissal", async () => {
  for (const dismiss of [false, true]) {
    const first = harness();
    first.render();
    await first.flush();
    if (dismiss) {
      first.dismiss();
      assert.deepEqual(first.notices(), []);
    }
    first.dispose();
    const reopened = harness({ storage: first.storage });
    reopened.render();
    await reopened.flush();
    assert.deepEqual(reopened.notices(), []);
    reopened.dispose();
  }
});

test("pending work still shows progress on reload and announces its new completion", async () => {
  const h = harness({ navigationType: "reload", states: [{ status: "pending" }, { status: "syncing" }, synced] });
  h.render();
  await h.flush();
  assert.match(h.notices().join(""), /Adding this event/);
  await h.tick(3000);
  await h.tick(3000);
  assert.deepEqual(h.notices(), ["Added to Outlook."]);
  assert.equal(h.requests.length, 3);
  h.dispose();
});

test("completion receipts isolate accounts and events, and permit a later sync completion", async () => {
  const first = harness();
  first.render();
  await first.flush();
  first.dispose();
  for (const options of [
    { props: { userId: "owner-b" } },
    { props: { eventId: "event-b" } },
    { states: [{ ...synced, updatedAt: "2026-09-11T12:00:00Z" }] },
  ]) {
    const h = harness({ storage: first.storage, ...options });
    h.render();
    await h.flush();
    assert.deepEqual(h.notices(), ["Added to Outlook."]);
    h.dispose();
  }
});

test("blocked browser storage does not replay a reload or block a real completion", async () => {
  const h = harness({ storageBlocked: true });
  h.render();
  await h.flush();
  assert.deepEqual(h.notices(), ["Added to Outlook."]);
  const reloadUrl = h.url;
  h.dispose();
  const reloaded = harness({ storageBlocked: true, href: reloadUrl, navigationType: "reload", props: { announceSyncCompletion: false } });
  reloaded.render();
  await reloaded.flush();
  assert.deepEqual(reloaded.notices(), []);
  reloaded.dispose();
});

test("a new client navigation from a previously reloaded dashboard still confirms creation", async () => {
  const h = harness({ navigationType: "reload", navigationUrl: "https://envitefy.example/" });
  h.render();
  await h.flush();
  assert.deepEqual(h.notices(), ["Added to Outlook."]);
  h.dispose();
});

test("effect replay cannot duplicate completion feedback or retain aborted requests", async () => {
  const h = harness();
  h.render();
  h.replayEffects();
  await h.flush();
  assert.equal(h.requests[0].options.signal.aborted, true);
  assert.deepEqual(h.notices(), ["Added to Outlook."]);
  assert.equal(h.storage.size, 1);
  h.dispose();
});

test("reconnect and failure notices remain visible when revisiting an event", async () => {
  for (const status of ["needs_reconnect", "failed"]) {
    const h = harness({ navigationType: "reload", states: [{ ...synced, status }] });
    h.render();
    await h.flush();
    assert.match(h.notices().join(""), status === "failed" ? /not updated/ : /Outlook needs to be reconnected/);
    h.dispose();
  }
});
