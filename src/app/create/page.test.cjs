const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// The shared backend loader accepts .ts; this page needs JSX compilation too.
function loadTs(relative, stubs, globals = {}) {
  const filename = path.resolve(relative);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  const localRequire = (name) => {
    assert.equal(Object.hasOwn(stubs, name), true, `Unexpected page dependency: ${name}`);
    return stubs[name];
  };
  new Function("exports", "require", "console", ...Object.keys(globals), code)(
    exports, localRequire, { warn() {}, error() {} }, ...Object.values(globals),
  );
  return exports;
}

function pageHarness(options = {}) {
  const session = Object.hasOwn(options, "session") ? options.session : { user: { email: "host@example.com" } };
  const access = options.access || { policy: "restricted", allowedCategories: ["gymnastics"], allowedProducts: ["event_page"] };
  const calls = { session: [], resolve: [], access: [], redirects: [] };
  const redirectError = new Error("Next redirect");
  const Client = () => {};
  const element = (type, props) => ({ type, props });
  const page = loadTs("src/app/create/page.tsx", {
    "react/jsx-runtime": { jsx: element, jsxs: element },
    react: { Suspense: Symbol("Suspense") },
    "next/navigation": { redirect: (destination) => { calls.redirects.push(destination); throw redirectError; } },
    "next-auth": { getServerSession: async (options) => { calls.session.push(options); return session; } },
    "@/lib/auth": {
      authOptions: { marker: "auth-options" },
      resolveSessionUserId: async (value) => {
        calls.resolve.push(value);
        if (options.resolveError) throw options.resolveError;
        return Object.hasOwn(options, "userId") ? options.userId : "account-id";
      },
    },
    "@/lib/creation-access-server": {
      getCreationAccess: async (userId) => {
        calls.access.push(userId);
        if (options.accessError) throw options.accessError;
        return options.accessPromise || access;
      },
    },
    "./CreatePageClient": { __esModule: true, default: Client },
  }, options.globals);
  async function render() {
    const workspace = await page.default();
    const client = workspace.props.children;
    assert.equal(client.type, Client, "the creation workspace stays mounted");
    return client.props;
  }
  return { page, render, calls, session, access, redirectError };
}

for (const policy of ["restricted", "standard"]) {
  test(`Create preloads the authenticated account's ${policy} grants into the client`, async () => {
    const access = { policy, allowedCategories: ["gymnastics"], allowedProducts: ["event_page"] };
    const harness = pageHarness({ access });
    const props = await harness.render();
    assert.deepEqual(harness.calls.resolve, [harness.session]);
    assert.deepEqual(harness.calls.access, ["account-id"]);
    assert.equal(props.initialCreationAccess.identity, "host@example.com");
    assert.equal(props.initialCreationAccess.access, access, "only the server's actual grant snapshot is supplied");
    assert.deepEqual(harness.calls.redirects, []);
  });
}

test("Create redirects signed-out visitors before resolving an account or reading grants", async () => {
  for (const session of [null, {}, { user: null }]) {
    const harness = pageHarness({ session });
    await assert.rejects(harness.page.default(), (error) => error === harness.redirectError);
    assert.deepEqual(harness.calls.redirects, ["/"]);
    assert.deepEqual(harness.calls.resolve, []);
    assert.deepEqual(harness.calls.access, []);
  }
});

test("Create supplies no grants when the authenticated session cannot resolve an account", async () => {
  const harness = pageHarness({ userId: null });
  const props = await harness.render();
  assert.equal(props.initialCreationAccess == null, true);
  assert.deepEqual(harness.calls.resolve, [harness.session]);
  assert.deepEqual(harness.calls.access, []);
});

test("Create skips preload without an email to bind the snapshot to the current account", async () => {
  const harness = pageHarness({ session: { user: { id: "account-id" } } });
  const props = await harness.render();
  assert.equal(props.initialCreationAccess == null, true);
  assert.deepEqual(harness.calls.resolve, []);
  assert.deepEqual(harness.calls.access, []);
});

test("Create keeps client access loading available when account resolution fails", async () => {
  const harness = pageHarness({ resolveError: new Error("Account lookup unavailable") });
  const props = await harness.render();
  assert.equal(props.initialCreationAccess == null, true, "a failed lookup cannot become standard access");
  assert.deepEqual(harness.calls.access, []);
});

test("Create keeps client access loading available when server grant lookup fails", async () => {
  const harness = pageHarness({ accessError: new Error("Database unavailable") });
  const props = await harness.render();
  assert.equal(props.initialCreationAccess == null, true, "a failed grant read cannot become standard access");
  assert.deepEqual(harness.calls.access, ["account-id"]);
});

test("Create stops waiting for a slow server grant lookup and lets the client retry", async () => {
  const timers = [];
  const cleared = [];
  const harness = pageHarness({
    accessPromise: new Promise(() => {}),
    globals: {
      setTimeout: (callback, delay) => {
        const timer = { callback, delay };
        timers.push(timer);
        return timer;
      },
      clearTimeout: (timer) => { cleared.push(timer); },
    },
  });
  const rendering = harness.render();
  await new Promise(setImmediate);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay > 0 && timers[0].delay <= 1500, true, "server preload has a short bounded wait");
  assert.deepEqual(harness.calls.access, ["account-id"]);
  timers[0].callback();
  const props = await rendering;
  assert.equal(props.initialCreationAccess == null, true, "timing out never fabricates grants");
  assert.deepEqual(cleared, [timers[0]]);
});
