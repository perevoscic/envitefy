import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(
  readFileSync(new URL("./useGymnasticsHeroEntrance.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

class Target {
  listeners = new Map();
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) {
    this.listeners.get(name)?.delete(callback);
  }
  dispatch(name) {
    for (const callback of [...(this.listeners.get(name) ?? [])]) callback();
  }
  contains(node) {
    return node === this;
  }
  listenerCount() {
    return [...this.listeners.values()].reduce((total, entries) => total + entries.size, 0);
  }
}

function harness({ cached = false, reduced = false } = {}) {
  const slots = [];
  const effects = [];
  const timers = new Map();
  const frames = new Map();
  const transitions = [];
  const image = Object.assign(new Target(), { complete: cached, naturalWidth: cached ? 1086 : 0 });
  const preference = Object.assign(new Target(), { matches: reduced });
  const hero = Object.assign(new Target(), { querySelector: () => image });
  const navigation = new Target();
  let cursor = 0;
  let nextId = 0;
  let now = 0;
  let decodeCalls = 0;
  let resolveDecode;
  let rejectDecode;
  const decoded = new Promise((resolve, reject) => {
    resolveDecode = resolve;
    rejectDecode = reject;
  });
  image.decode = () => {
    decodeCalls++;
    return decoded;
  };
  const react = {
    useRef(value) {
      const index = cursor++;
      slots[index] ??= { current: value };
      return slots[index];
    },
    useState(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = value;
      return [
        slots[index],
        (next) => {
          if (slots[index] !== next) transitions.push(next);
          slots[index] = next;
        },
      ];
    },
    useEffect(callback) {
      const index = cursor++;
      if (slots[index]) return;
      slots[index] = true;
      effects.push({ callback });
    },
  };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: () => react,
    document: { activeElement: null },
    window: {
      matchMedia: () => preference,
      requestAnimationFrame(callback) {
        const id = ++nextId;
        frames.set(id, callback);
        return id;
      },
      cancelAnimationFrame: (id) => frames.delete(id),
      setTimeout(callback, duration) {
        const id = ++nextId;
        timers.set(id, { callback, due: now + duration });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  });
  function render() {
    cursor = 0;
    const result = exports.default();
    result.heroRef.current = hero;
    result.navigationRef.current = navigation;
    for (const effect of effects) {
      if (!effect.mounted) {
        effect.mounted = true;
        effect.cleanup = effect.callback();
      }
    }
    return result;
  }
  render();
  return {
    image,
    hero,
    navigation,
    preference,
    transitions,
    render,
    frames,
    timers,
    resolveDecode,
    rejectDecode,
    decodeCalls: () => decodeCalls,
    load() {
      image.complete = true;
      image.naturalWidth = 1086;
      image.dispatch("load");
    },
    reduce(value) {
      preference.matches = value;
      preference.dispatch("change");
    },
    frame() {
      const callbacks = [...frames.values()];
      frames.clear();
      for (const callback of callbacks) callback();
    },
    advance(duration) {
      const end = now + duration;
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.due <= end)
          .sort((a, b) => a[1].due - b[1].due)[0];
        if (!next) break;
        now = next[1].due;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = end;
    },
    replayEffects() {
      for (const effect of effects) {
        effect.cleanup?.();
        effect.cleanup = effect.callback();
      }
    },
    unmount() {
      for (const effect of effects) effect.cleanup?.();
    },
    resources() {
      return (
        frames.size +
        timers.size +
        [image, hero, navigation, preference].reduce(
          (total, target) => total + target.listenerCount(),
          0,
        )
      );
    },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("a cached portrait waits for decoding, enters on a frame and completes once", async () => {
  const h = harness({ cached: true });
  assert.equal(h.render().motion, "idle");
  assert.equal(h.decodeCalls(), 1);
  h.resolveDecode();
  await settle();
  assert.equal(h.render().motion, "idle");
  h.frame();
  assert.equal(h.render().motion, "entering");
  h.advance(1899);
  assert.equal(h.render().motion, "entering");
  h.advance(1);
  assert.equal(h.render().motion, "complete");
  assert.equal(h.resources(), 0);
  h.replayEffects();
  assert.equal(h.resources(), 0);
  assert.deepEqual(h.transitions, ["entering", "complete"]);
});

test("a downloading portrait cannot begin the entrance before load and decode", async () => {
  const h = harness();
  assert.equal(h.decodeCalls(), 0);
  h.frame();
  assert.equal(h.render().motion, "idle");
  h.load();
  assert.equal(h.decodeCalls(), 1);
  h.frame();
  assert.equal(h.render().motion, "idle");
  h.resolveDecode();
  await settle();
  h.frame();
  assert.equal(h.render().motion, "entering");
  h.unmount();
  assert.equal(h.resources(), 0);
});

for (const stage of ["download", "decode"]) {
  test(`a stalled portrait ${stage} completes after 2.5 seconds and rejects late readiness`, async () => {
    const h = harness({ cached: stage === "decode" });
    h.advance(2500);
    assert.equal(h.render().motion, "complete");
    assert.equal(h.resources(), 0);
    h.load();
    h.resolveDecode();
    await settle();
    h.frame();
    assert.deepEqual(h.transitions, ["complete"]);
  });
}

test("image download and decode failures leave content complete", async () => {
  const download = harness();
  download.image.dispatch("error");
  assert.equal(download.render().motion, "complete");
  assert.equal(download.resources(), 0);
  const decode = harness({ cached: true });
  decode.rejectDecode(new Error("Decode unavailable"));
  await settle();
  assert.equal(decode.render().motion, "complete");
  assert.equal(decode.resources(), 0);
});

test("initial and live reduced motion complete permanently", async () => {
  const initial = harness({ reduced: true, cached: true });
  assert.equal(initial.render().motion, "complete");
  assert.equal(initial.decodeCalls(), 0);
  assert.equal(initial.resources(), 0);
  initial.reduce(false);
  assert.equal(initial.render().motion, "complete");

  const live = harness({ cached: true });
  live.resolveDecode();
  await settle();
  live.frame();
  assert.equal(live.render().motion, "entering");
  live.reduce(true);
  live.reduce(false);
  assert.equal(live.render().motion, "complete");
  assert.equal(live.resources(), 0);
  assert.deepEqual(live.transitions, ["entering", "complete"]);
});

for (const target of ["hero", "navigation"]) {
  for (const event of ["focusin", "pointerdown"]) {
    test(`${target} ${event} reveals every action immediately and cancels pending entry`, async () => {
      const h = harness({ cached: true });
      h[target].dispatch(event);
      assert.equal(h.render().motion, "complete");
      h.resolveDecode();
      await settle();
      h.frame();
      assert.equal(h.resources(), 0);
      assert.deepEqual(h.transitions, ["complete"]);
    });
  }
}

test("Strict Mode effect replay and unmount cancel listeners, frames and late decode work", async () => {
  const h = harness({ cached: true });
  h.replayEffects();
  assert.equal(h.image.listenerCount(), 1, "only decode failure monitoring remains after load");
  assert.equal(h.hero.listenerCount(), 2);
  assert.equal(h.navigation.listenerCount(), 2);
  assert.equal(h.preference.listenerCount(), 1);
  h.resolveDecode();
  await settle();
  assert.equal(h.frames.size, 1);
  h.unmount();
  h.frame();
  h.advance(5000);
  assert.equal(h.resources(), 0);
  assert.deepEqual(h.transitions, []);

  const decoding = harness({ cached: true });
  decoding.unmount();
  decoding.resolveDecode();
  await settle();
  assert.equal(decoding.resources(), 0);
  assert.deepEqual(decoding.transitions, []);
});
