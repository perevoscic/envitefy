const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const preferences = keys => ({ visibleTemplateKeys: keys, quickAccess: ["upload"] });
const unavailable = { status: 503, json: { error: "Temporarily unavailable" } };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test("workspace preferences recover without blocking the current account or exposing stale preferences", { timeout: 120000 }, async t => {
  const output = path.resolve(".qa/feature-visibility-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/feature-visibility.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next-auth/react": path.resolve("scripts/fixtures/feature-visibility.tsx"),
        "@": path.resolve("src"),
      } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const errors = [];
  async function fixture(handler, options = {}) {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", error => errors.push(error.stack || error.message));
    if (options.clock) await page.clock.install();
    const requests = [];
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
      if (url.pathname === "/api/user/feature-visibility") {
        const request = { account: route.request().headers()["x-fixture-account"], number: requests.length + 1 };
        requests.push(request);
        const response = await handler(request);
        return route.fulfill({ status: response.status || 200, contentType: "application/json", body: JSON.stringify(response.json) }).catch(() => {});
      }
      if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: '<!doctype html><html><body><main id="root"></main><script src="/fixture.js"></script></body></html>' });
      return route.abort();
    });
    await page.goto("http://feature-visibility.test/");
    await page.waitForFunction(() => Boolean(window.featureVisibilityFixture?.current.A));
    return { page, requests };
  }
  async function waitLoaded(page, keys) {
    await page.waitForFunction(expected => Object.values(window.featureVisibilityFixture.current).every(state =>
      state.hasLoadedPreferences && !state.loading && !state.error && JSON.stringify(state.visibleTemplateKeys) === JSON.stringify(expected)), keys);
  }
  try {
    await t.test("one transient initial failure retries automatically and concurrent consumers share the read", async () => {
      const { page, requests } = await fixture(request => request.number === 1 ? unavailable : { json: preferences(["birthdays"]) });
      try {
        await waitLoaded(page, ["birthdays"]);
        assert.equal(requests.length, 2, "two consumers share the initial request and its single retry");
        const renders = await page.evaluate(() => window.featureVisibilityFixture.renders);
        assert.ok(renders.every(state => !state.error), "a recoverable first failure does not flash the blocking error");
      } finally { await page.close(); }
    });

    await t.test("failed background updates keep the last successful preferences usable", async () => {
      let fail = false;
      const { page, requests } = await fixture(() => fail ? unavailable : { json: preferences(["weddings"]) });
      try {
        await waitLoaded(page, ["weddings"]);
        fail = true;
        await page.getByRole("button", { name: "Preferences changed", exact: true }).click();
        await page.waitForFunction(() => Object.values(window.featureVisibilityFixture.current).every(state => !state.loading));
        await waitLoaded(page, ["weddings"]);
        assert.ok(requests.length >= 2, "the invalidation actually attempts a new read");
        const renders = await page.evaluate(() => window.featureVisibilityFixture.renders.filter(state => state.hasLoadedPreferences));
        assert.ok(renders.every(state => !state.error && state.visibleTemplateKeys.join() === "weddings"), "background failure never discards the loaded account preferences");
      } finally { await page.close(); }
    });

    for (const event of ["online", "focus", "visibilitychange"]) {
      await t.test(`a failed initial load recovers when ${event} signals the visitor has returned`, async () => {
        let fail = true;
        const { page } = await fixture(() => fail ? unavailable : { json: preferences(["general"]) });
        try {
          await page.waitForFunction(() => Object.values(window.featureVisibilityFixture.current).every(state => !state.loading && state.error && !state.hasLoadedPreferences));
          fail = false;
          await page.evaluate(name => {
            if (name === "visibilitychange") document.dispatchEvent(new Event(name));
            else window.dispatchEvent(new Event(name));
          }, event);
          await waitLoaded(page, ["general"]);
        } finally { await page.close(); }
      });
    }

    await t.test("a stalled preference read stops loading after ten seconds and can be retried", async () => {
      const stalled = deferred();
      const { page, requests } = await fixture(async request => {
        if (request.number === 1) await stalled.promise;
        return { json: preferences(["birthdays"]) };
      }, { clock: true });
      try {
        await page.clock.runFor(10_001);
        await page.waitForFunction(() => Object.values(window.featureVisibilityFixture.current).every(state => !state.loading && state.error && !state.hasLoadedPreferences));
        assert.equal(requests.length, 1, "the deadline ends the stalled read");
        await page.getByRole("button", { name: "Preferences changed", exact: true }).click();
        await waitLoaded(page, ["birthdays"]);
        assert.equal(requests.length, 2, "a timed-out read does not remain stuck in the shared request cache");
      } finally { stalled.resolve(); await page.close(); }
    });

    await t.test("an older refresh cannot overwrite a newer preferences update", async () => {
      const stale = deferred();
      const { page } = await fixture(async request => {
        if (request.number === 1) return { json: preferences(["birthdays"]) };
        if (request.number === 2) {
          await stale.promise;
          return { json: preferences(["weddings"]) };
        }
        return { json: preferences(["general"]) };
      });
      try {
        await waitLoaded(page, ["birthdays"]);
        await page.getByRole("button", { name: "Refresh A", exact: true }).click();
        await page.waitForFunction(() => window.featureVisibilityFixture.current.A.loading);
        await page.getByRole("button", { name: "Preferences changed", exact: true }).click();
        await waitLoaded(page, ["general"]);
        const obsoleteResponse = page.waitForResponse(async response =>
          new URL(response.url()).pathname === "/api/user/feature-visibility" &&
          (await response.json()).visibleTemplateKeys?.includes("weddings"));
        stale.resolve();
        await obsoleteResponse;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const renders = await page.evaluate(() => window.featureVisibilityFixture.renders);
        assert.ok(renders.every(state => !state.visibleTemplateKeys.includes("weddings")), "the obsolete response never becomes renderable");
        await waitLoaded(page, ["general"]);
      } finally { stale.resolve(); await page.close(); }
    });

    await t.test("an account change hides old preferences on its first render and ignores an older response", async () => {
      const stale = deferred(), next = deferred();
      let firstReads = 0;
      const { page, requests } = await fixture(async request => {
        if (request.account === "first-host") {
          if (++firstReads === 1) return { json: preferences(["birthdays"]) };
          await stale.promise;
          return { json: preferences(["weddings"]) };
        }
        await next.promise;
        return { json: preferences(["general"]) };
      });
      try {
        await waitLoaded(page, ["birthdays"]);
        await page.getByRole("button", { name: "Refresh A", exact: true }).click();
        await page.waitForFunction(() => window.featureVisibilityFixture.current.A.loading);
        await page.evaluate(() => window.featureVisibilityFixture.setAccount("second-host"));
        const immediate = await page.evaluate(() => window.featureVisibilityFixture.renders.filter(state => state.account === "second-host"));
        assert.ok(immediate.length >= 2, "both consumers rendered the new session");
        assert.ok(immediate.every(state => !state.hasLoadedPreferences && state.visibleTemplateKeys.length === 0), "the first new-account render cannot reuse the previous account's state");
        stale.resolve();
        await page.waitForFunction(() => Object.values(window.featureVisibilityFixture.current).every(state => state.account === "second-host" && !state.hasLoadedPreferences));
        next.resolve();
        await waitLoaded(page, ["general"]);
        assert.equal(requests.filter(request => request.account === "second-host").length, 1, "the new account gets one shared independent request");
        const switched = await page.evaluate(() => window.featureVisibilityFixture.renders.filter(state => state.account === "second-host"));
        assert.ok(switched.every(state => state.visibleTemplateKeys.every(key => key === "general")), "an obsolete response cannot replace the new account's preferences");
      } finally { stale.resolve(); next.resolve(); await page.close(); }
    });
    assert.deepEqual(errors, [], "fixture has no browser runtime errors");
  } finally { await browser.close(); }
});
