import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setImmediate } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const compiled = ts.transpileModule(
  readFileSync(new URL("./useRecaptcha.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function createHarness() {
  const scripts = [];
  const timers = new Map();
  const window = { ___grecaptcha_cfg: { render: ["public-test-key"] } };
  const errors = [];
  let active;
  let timerId = 0;
  class Script extends EventTarget {
    remove() {
      const index = scripts.indexOf(this);
      if (index !== -1) scripts.splice(index, 1);
    }
  }
  const react = {
    useState(initial) {
      const instance = active;
      const index = instance.cursor++;
      if (!(index in instance.values)) instance.values[index] = initial;
      return [instance.values[index], (value) => {
        instance.values[index] = typeof value === "function" ? value(instance.values[index]) : value;
      }];
    },
    useCallback(callback) {
      return callback;
    },
    useEffect(callback, dependencies) {
      const previous = active.dependencies;
      if (previous && dependencies.every((value, index) => Object.is(value, previous[index]))) return;
      active.dependencies = dependencies;
      active.pendingEffect = callback;
    },
  };
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      assert.equal(name, "react");
      return react;
    },
    process: { env: { NODE_ENV: "production", NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "public-test-key" } },
    window,
    document: {
      querySelectorAll: () => scripts.slice(),
      createElement: () => new Script(),
      head: { appendChild: (script) => scripts.push(script) },
    },
    URL,
    Error,
    console: { error: (...args) => errors.push(args), warn: (...args) => errors.push(args) },
    setTimeout(callback, duration) {
      assert.ok(duration > 0 && duration <= 60_000);
      const id = ++timerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  return {
    scripts,
    window,
    errors,
    expire() {
      for (const callback of Array.from(timers.values())) callback();
    },
    mount() {
      const instance = { values: [], cursor: 0 };
      const render = () => {
        active = instance;
        instance.cursor = 0;
        const result = exports.useRecaptcha();
        if (instance.pendingEffect) {
          instance.cleanup?.();
          instance.cleanup = instance.pendingEffect();
          instance.pendingEffect = undefined;
        }
        return result;
      };
      return { render, unmount: () => instance.cleanup?.() };
    },
    load(client) {
      window.grecaptcha = client;
      scripts[0].dispatchEvent(new Event("load"));
    },
  };
}

test("a consumed Google render queue does not reject readiness or execute before signup", async () => {
  const harness = createHarness();
  const hook = harness.mount();
  const executions = [];
  assert.equal(hook.render().recaptchaReady, false);
  harness.load({
    ready(callback) {
      harness.window.___grecaptcha_cfg.render = [];
      callback();
    },
    async execute(key, options) {
      executions.push({ key, action: options.action });
      return "test-token";
    },
  });
  await setImmediate();
  const ready = hook.render();
  assert.equal(ready.recaptchaReady, true);
  assert.equal(ready.recaptchaError, null);
  assert.deepEqual(executions, []);
  assert.equal(await ready.executeRecaptcha("signup"), "test-token");
  assert.deepEqual(executions, [{ key: "public-test-key", action: "signup" }]);
  assert.deepEqual(harness.errors, []);
});

test("a script failure blocks production signup and retry starts a fresh load", async () => {
  const harness = createHarness();
  const hook = harness.mount();
  hook.render();
  harness.scripts[0].dispatchEvent(new Event("error"));
  await setImmediate();
  const failed = hook.render();
  assert.equal(failed.recaptchaReady, false);
  assert.match(failed.recaptchaError, /couldn't load/);
  assert.equal(harness.scripts.length, 0);
  failed.retryRecaptcha();
  hook.render();
  assert.equal(hook.render().recaptchaError, null);
  assert.equal(harness.scripts.length, 1);
  harness.load({ ready: (callback) => callback(), execute: async () => "retry-token" });
  await setImmediate();
  assert.equal(hook.render().recaptchaReady, true);
});

for (const stage of ["script download", "Google ready callback"]) {
  test(`${stage} timeout becomes a recoverable error instead of permanent loading`, async () => {
    const harness = createHarness();
    const hook = harness.mount();
    hook.render();
    let lateReady;
    if (stage === "Google ready callback") {
      harness.load({ ready: (callback) => { lateReady = callback; } });
    }
    harness.expire();
    await setImmediate();
    assert.equal(hook.render().recaptchaReady, false);
    assert.match(hook.render().recaptchaError, /couldn't load/);
    assert.equal(harness.scripts.length, 0);
    lateReady?.();
    await setImmediate();
    assert.equal(hook.render().recaptchaReady, false);
    hook.render().retryRecaptcha();
    hook.render();
    harness.load({ ready: (callback) => callback() });
    await setImmediate();
    assert.equal(hook.render().recaptchaReady, true);
  });
}

test("Google execution errors remain failures in production", async () => {
  const harness = createHarness();
  const hook = harness.mount();
  hook.render();
  harness.load({
    ready: (callback) => callback(),
    execute: async () => { throw new Error("Invalid site key"); },
  });
  await setImmediate();
  await assert.rejects(hook.render().executeRecaptcha("signup"), /Invalid site key/);
});

test("concurrent forms share readiness and an unmounted form ignores completion", async () => {
  const harness = createHarness();
  const first = harness.mount();
  const second = harness.mount();
  first.render();
  second.render();
  assert.equal(harness.scripts.length, 1);
  first.unmount();
  harness.load({ ready: (callback) => callback() });
  await setImmediate();
  assert.equal(first.render().recaptchaReady, false);
  assert.equal(second.render().recaptchaReady, true);
});
