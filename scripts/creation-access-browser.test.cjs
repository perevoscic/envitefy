const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const access = categories => ({ policy: "standard", allowedProducts: ["event_page"], allowedCategories: categories });
const unavailable = { status: 503, json: { error: "Temporarily unavailable" } };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test("creation access survives transient outages without exposing another account's grants", { timeout: 120000 }, async t => {
  const output = path.resolve(".qa/creation-access-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/creation-access.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next-auth/react": path.resolve("scripts/fixtures/creation-access.tsx"),
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
    if (options.configuration) await page.addInitScript(configuration => {
      window.creationAccessConfiguration = configuration;
    }, options.configuration);
    const requests = [];
    await page.exposeFunction("creationAccessObservedRequests", () => requests.length);
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
      if (url.pathname === "/api/user/creation-access") {
        const request = { account: route.request().headers()["x-fixture-account"], number: requests.length + 1 };
        requests.push(request);
        assert.equal(url.searchParams.get("summary"), "1", "the fixture uses the lightweight verified grants response");
        const response = await handler(request);
        return route.fulfill({ status: response.status || 200, contentType: "application/json", body: JSON.stringify(response.json) }).catch(() => {});
      }
      if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: '<!doctype html><html><body><main id="root"></main><script src="/fixture.js"></script></body></html>' });
      return route.abort();
    });
    await page.goto("http://creation-access.test/");
    await page.waitForFunction(() => Boolean(window.creationAccessFixture?.current.B));
    return { page, requests };
  }
  async function waitLoaded(page, categories) {
    await page.waitForFunction(expected => Object.values(window.creationAccessFixture.current).every(state =>
      state.access && !state.loading && !state.error && JSON.stringify(state.access.allowedCategories) === JSON.stringify(expected)), categories);
  }
  async function waitBlocked(page) {
    await page.waitForFunction(() => Object.values(window.creationAccessFixture.current).every(state => !state.loading && state.error && !state.access));
  }
  async function waitRequests(page, count) {
    // A fetch call can precede Playwright's route callback. Let the transport
    // observe the attempt before advancing the fake clock to its next timeout.
    await page.waitForFunction(async expected => (await window.creationAccessObservedRequests()) >= expected, count);
  }
  async function settleRender(page) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  try {
    await t.test("a verified initial snapshot survives session hydration and is adopted immediately for its account", async () => {
      const refresh = deferred();
      const { page } = await fixture(async () => {
        await refresh.promise;
        return { json: { access: access(["birthdays"]) } };
      }, { configuration: { status: "loading", initialCreationAccess: { identity: "first-host@test.com", access: access(["birthdays"]) } } });
      try {
        await page.evaluate(() => window.creationAccessFixture.setSession("first-host"));
        const authenticated = await page.evaluate(() => window.creationAccessFixture.renders.filter(state => state.status === "authenticated"));
        assert.ok(authenticated.length >= 2, "both consumers render the authenticated account");
        assert.ok(authenticated.every(state => state.access?.allowedCategories.join() === "birthdays" && !state.error), "the matching account immediately receives its server-verified grants while revalidation is pending");
        await waitRequests(page, 1);
        refresh.resolve();
        await waitLoaded(page, ["birthdays"]);
      } finally { refresh.resolve(); await page.close(); }
    });

    await t.test("one transient initial failure retries automatically and concurrent consumers share both attempts", async () => {
      const { page, requests } = await fixture(request => request.number === 1 ? unavailable : { json: { access: access(["birthdays"]) } }, { clock: true });
      try {
        await waitRequests(page, 1);
        await page.clock.runFor(301);
        await waitLoaded(page, ["birthdays"]);
        assert.equal(requests.length, 2, "two consumers share the initial request and its retry");
        const renders = await page.evaluate(() => window.creationAccessFixture.renders);
        assert.ok(renders.every(state => !state.error), "a recoverable first failure never flashes the blocking error");
      } finally { await page.close(); }
    });

    for (const signal of ["online", "focus", "visibilitychange"]) {
      await t.test(`an initial failure recovers when ${signal} signals the visitor has returned`, async () => {
        let fail = true;
        const { page } = await fixture(() => fail ? unavailable : { json: { access: access(["general"]) } }, { clock: true });
        try {
          await waitRequests(page, 1);
          await page.clock.runFor(301);
          await waitBlocked(page);
          fail = false;
          await page.evaluate(name => {
            if (name === "visibilitychange") document.dispatchEvent(new Event(name));
            else window.dispatchEvent(new Event(name));
          }, signal);
          await waitLoaded(page, ["general"]);
        } finally { await page.close(); }
      });
    }

    await t.test("failed background updates keep the current account's snapshot usable", async () => {
      let fail = false;
      const { page, requests } = await fixture(() => fail ? unavailable : { json: { access: access(["weddings"]) } }, { clock: true });
      try {
        await waitLoaded(page, ["weddings"]);
        fail = true;
        await page.getByRole("button", { name: "Access changed", exact: true }).click();
        await waitRequests(page, 2);
        await page.clock.runFor(301);
        await waitLoaded(page, ["weddings"]);
        assert.equal(requests.length, 3, "the background read gets one bounded retry");
        const loaded = await page.evaluate(() => window.creationAccessFixture.renders.filter(state => state.access));
        assert.ok(loaded.every(state => !state.error && state.access.allowedCategories.join() === "weddings"), "background errors never block the loaded account");
      } finally { await page.close(); }
    });

    await t.test("a stalled first attempt retries early enough to recover inside the total deadline", async () => {
      const stalled = deferred();
      const { page, requests } = await fixture(async request => {
        if (request.number === 1) await stalled.promise;
        return { json: { access: access(["birthdays"]) } };
      }, { clock: true });
      try {
        await waitRequests(page, 1);
        await page.clock.runFor(4_301);
        await waitLoaded(page, ["birthdays"]);
        assert.equal(requests.length, 2, "the stalled first attempt does not consume the whole deadline");
        const renders = await page.evaluate(() => window.creationAccessFixture.renders);
        assert.ok(renders.every(state => !state.error), "successful retry avoids the timeout error");
      } finally { stalled.resolve(); await page.close(); }
    });

    await t.test("two stalled attempts stop at the total deadline and explicit retry starts a new read", async () => {
      const stalled = deferred();
      const { page, requests } = await fixture(async request => {
        if (request.number <= 2) await stalled.promise;
        return { json: { access: access(["birthdays"]) } };
      }, { clock: true });
      try {
        await waitRequests(page, 1);
        await page.clock.runFor(4_301);
        await waitRequests(page, 2);
        await page.clock.runFor(5_700);
        await waitBlocked(page);
        assert.equal(requests.length, 2, "both attempts fit under the shared ten-second deadline");
        const state = await page.evaluate(() => window.creationAccessFixture.current.A);
        assert.match(state.error, /took too long/i);
        await page.getByRole("button", { name: "Access changed", exact: true }).click();
        await waitLoaded(page, ["birthdays"]);
        assert.equal(requests.length, 3, "timed-out work is removed from the shared request cache");
      } finally { stalled.resolve(); await page.close(); }
    });

    await t.test("a timed-out background refresh retains the current account's snapshot without an error", async () => {
      const stalled = deferred();
      const { page, requests } = await fixture(async request => {
        if (request.number > 1) await stalled.promise;
        return { json: { access: access(["weddings"]) } };
      }, { clock: true });
      try {
        await waitLoaded(page, ["weddings"]);
        await page.getByRole("button", { name: "Access changed", exact: true }).click();
        await waitRequests(page, 2);
        await page.clock.runFor(4_301);
        await waitRequests(page, 3);
        await page.clock.runFor(5_700);
        await waitLoaded(page, ["weddings"]);
        assert.equal(requests.length, 3, "background timeout also uses the bounded retry");
        const loaded = await page.evaluate(() => window.creationAccessFixture.renders.filter(state => state.access));
        assert.ok(loaded.every(state => !state.error && state.access.allowedCategories.join() === "weddings"));
      } finally { stalled.resolve(); await page.close(); }
    });

    await t.test("an account change hides access on its first render and ignores the prior response", async () => {
      const stale = deferred(), next = deferred();
      let firstReads = 0;
      const { page, requests } = await fixture(async request => {
        if (request.account === "first-host") {
          if (++firstReads === 1) return { json: { access: access(["birthdays"]) } };
          await stale.promise;
          return { json: { access: access(["weddings"]) } };
        }
        await next.promise;
        return { json: { access: access(["general"]) } };
      });
      try {
        await waitLoaded(page, ["birthdays"]);
        await page.getByRole("button", { name: "Refresh A", exact: true }).click();
        await waitRequests(page, 2);
        await page.evaluate(() => window.creationAccessFixture.setSession("second-host"));
        const immediate = await page.evaluate(() => window.creationAccessFixture.renders.filter(state => state.account === "second-host"));
        assert.ok(immediate.length >= 2, "both consumers rendered the new session");
        assert.ok(immediate.every(state => !state.access && !state.error), "the first render cannot expose the preceding account's grants or errors");
        stale.resolve();
        await settleRender(page);
        const pending = await page.evaluate(() => Object.values(window.creationAccessFixture.current));
        assert.ok(pending.every(state => state.account === "second-host" && !state.access));
        next.resolve();
        await waitLoaded(page, ["general"]);
        assert.equal(requests.filter(request => request.account === "second-host").length, 1, "the new account gets one shared independent request");
        const switched = await page.evaluate(() => window.creationAccessFixture.renders.filter(state => state.account === "second-host"));
        assert.ok(switched.every(state => !state.access || state.access.allowedCategories.join() === "general"));
      } finally { stale.resolve(); next.resolve(); await page.close(); }
    });

    await t.test("an account change clears the prior account's error on its first render", async () => {
      const next = deferred();
      const { page } = await fixture(async request => {
        if (request.account === "first-host") return unavailable;
        await next.promise;
        return { json: { access: access(["general"]) } };
      }, { clock: true });
      try {
        await waitRequests(page, 1);
        await page.clock.runFor(301);
        await waitBlocked(page);
        await page.evaluate(() => window.creationAccessFixture.setSession("second-host"));
        const immediate = await page.evaluate(() => window.creationAccessFixture.renders.filter(state => state.account === "second-host"));
        assert.ok(immediate.length >= 2);
        assert.ok(immediate.every(state => !state.access && !state.error), "an old account's failure is hidden before effects run");
        next.resolve();
        await waitLoaded(page, ["general"]);
      } finally { next.resolve(); await page.close(); }
    });

    await t.test("switching back to an account does not revive a request from its previous session", async () => {
      const stale = deferred(), other = deferred();
      let firstReads = 0;
      const { page, requests } = await fixture(async request => {
        if (request.account === "second-host") {
          await other.promise;
          return { json: { access: access(["football"]) } };
        }
        firstReads += 1;
        if (firstReads === 1) return { json: { access: access(["birthdays"]) } };
        if (firstReads === 2) {
          await stale.promise;
          return { json: { access: access(["weddings"]) } };
        }
        return { json: { access: access(["general"]) } };
      });
      try {
        await waitLoaded(page, ["birthdays"]);
        await page.getByRole("button", { name: "Refresh A", exact: true }).click();
        await waitRequests(page, 2);
        await page.evaluate(() => window.creationAccessFixture.setSession("second-host"));
        await waitRequests(page, 3);
        await page.evaluate(() => window.creationAccessFixture.setSession("first-host"));
        await waitLoaded(page, ["general"]);
        assert.equal(requests.filter(request => request.account === "first-host").length, 3, "returning starts a fresh read instead of joining obsolete account work");
        stale.resolve(); other.resolve();
        await settleRender(page);
        await waitLoaded(page, ["general"]);
        const renders = await page.evaluate(() => window.creationAccessFixture.renders);
        assert.ok(renders.every(state => !state.access?.allowedCategories.includes("weddings")), "the stale request never becomes renderable after returning");
      } finally { stale.resolve(); other.resolve(); await page.close(); }
    });
    assert.deepEqual(errors, [], "fixture has no browser runtime errors");
  } finally { await browser.close(); }
});
