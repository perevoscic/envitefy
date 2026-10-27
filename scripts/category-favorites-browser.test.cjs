const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const gymOnly = {
  policy: "restricted",
  allowedProducts: ["event_page"],
  allowedCategories: ["gymnastics"],
};
const preferences = (ids) => ({
  visibleTemplateKeys: [],
  ...(ids === undefined ? {} : { pinnedCategoryIds: ids }),
});
const contrastRatio = (foreground, background) => {
  const luminance = (color) =>
    color
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number)
      .map((value) => value / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
};

test("category favorites persist shortcuts without changing event permissions or crossing accounts", {
  timeout: 90000,
}, async (t) => {
  const output = path.resolve(".qa/category-favorites-browser");
  const entry = path.resolve("scripts/fixtures/category-favorites.tsx");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry,
      output: { path: output, filename: "fixture.js" },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env": JSON.stringify({ NODE_ENV: "development" }),
        }),
      ],
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: { "next-auth/react": entry, "next/link$": entry, "@": path.resolve("src") },
      },
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: path.resolve("scripts/lib/create-guest-ts-loader.cjs"),
          },
          { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        ],
      },
    });
    compiler.run((error, stats) =>
      compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ),
    );
  });
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(
      '@import "tailwindcss" source(none); @source "../src/components/navigation/SidebarCategoryFavorites.tsx"; @source "../src/components/ui/sidebar.tsx";',
      { from: path.resolve("scripts/category-favorites-fixture.css") },
    )
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const errors = [];
  async function fixture({
    configuration = {},
    records = { "first-host": preferences([]) },
    put,
    get,
  } = {}) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const writes = [];
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => errors.push(error.stack || error.message));
    await page.addInitScript((value) => {
      window.categoryFavoritesConfiguration = value;
    }, configuration);
    await page.route("**/*", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.pathname === "/fixture.js")
        return route.fulfill({ contentType: "text/javascript", body: script });
      if (["/icons/sidebar-gymnastics.png", "/icons/sidebar-football.png"].includes(url.pathname)) {
        return route.fulfill({
          contentType: "image/png",
          body: fs.readFileSync(path.join("public", url.pathname)),
        });
      }
      if (url.pathname === "/api/user/feature-visibility") {
        const account = request.headers()["x-fixture-account"];
        if (request.method() === "PUT") {
          const payload = request.postDataJSON();
          const write = { account, payload };
          writes.push(write);
          const response = await put?.(write);
          if (response?.status && response.status !== 200)
            return route
              .fulfill({ status: response.status, json: { error: "Could not save preferences" } })
              .catch(() => {});
          if (response?.json) {
            if (response.json.featureVisibility) records[account] = response.json.featureVisibility;
            return route.fulfill({ json: response.json }).catch(() => {});
          }
          records[account] = {
            ...(records[account] || preferences([])),
            pinnedCategoryIds: payload.pinnedCategoryIds,
          };
          return route
            .fulfill({ json: { ok: true, featureVisibility: records[account] } })
            .catch(() => {});
        }
        const response = await get?.({ account });
        if (response?.status)
          return route.fulfill({
            status: response.status,
            json: { error: "Could not load preferences" },
          });
        return route.fulfill({ json: records[account] || preferences([]) });
      }
      if (url.origin === "http://category-favorites.test")
        return route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;font:16px/1.5 Arial;background:#f8f5ff;color:#51416e}.fixture-create{display:flex;min-height:48px;align-items:center;padding:0 12px}html.dark body{background:#251f2d;color:#f2c6de}nav{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`,
        });
      return route.abort();
    });
    await page.goto("http://category-favorites.test/");
    await page.waitForFunction(
      () =>
        window.categoryFavoritesFixture?.current &&
        !window.categoryFavoritesFixture.current.loading,
    );
    return { page, writes, records };
  }
  const favorites = (page) =>
    page.getByRole("region", { name: "Favorite event types", exact: true });
  const editButton = (page) =>
    page.getByRole("button", { name: "Edit favorite categories", exact: true });
  const editor = (page) => page.locator("[data-category-favorites-editor]");
  const openEditor = async (page) => {
    await editButton(page).click();
  };
  const waitForIds = (page, ids) =>
    page.waitForFunction(
      (expected) =>
        JSON.stringify(window.categoryFavoritesFixture.current.favorites) ===
          JSON.stringify(expected) && !window.categoryFavoritesFixture.current.saving,
      ids,
    );
  try {
    await t.test(
      "desktop and phone keyboard pinning persists after reload and keeps Create event available",
      async () => {
        const { page, writes } = await fixture();
        try {
          const pencil = editButton(page);
          assert.equal(await pencil.getAttribute("aria-expanded"), "false");
          assert.equal(await editor(page).count(), 0, "normal navigation shows only pinned rows");
          const caption = favorites(page).getByText("Favorites", { exact: true });
          const captionStyle = await caption.evaluate((element) => ({
            size: getComputedStyle(element).fontSize,
            weight: getComputedStyle(element).fontWeight,
            transform: getComputedStyle(element).textTransform,
            tracking: getComputedStyle(element).letterSpacing,
          }));
          assert.deepEqual(
            captionStyle,
            { size: "10px", weight: "600", transform: "uppercase", tracking: "1.6px" },
            "Favorites uses the Create caption style",
          );
          await pencil.focus();
          await page.keyboard.press("Enter");
          assert.equal(await pencil.getAttribute("aria-expanded"), "true");
          assert.equal(
            await editor(page).getAttribute("id"),
            await pencil.getAttribute("aria-controls"),
          );
          const pin = page.getByRole("button", { name: "Pin Birthdays", exact: true });
          await pin.focus();
          await page.keyboard.press("Space");
          await waitForIds(page, ["birthdays"]);
          assert.deepEqual(
            writes.map((write) => write.payload),
            [{ pinnedCategoryIds: ["birthdays"] }],
          );
          assert.equal(
            await page
              .getByRole("button", { name: "Unpin Birthdays" })
              .getAttribute("aria-pressed"),
            "true",
          );
          assert.equal(
            await page
              .getByRole("link", { name: "Create event", exact: true })
              .getAttribute("href"),
            "/create",
          );
          const historyLength = await page.evaluate(() => history.length);
          await page.getByRole("button", { name: "Birthdays", exact: true }).click();
          assert.equal(
            await page.evaluate(() => history.length),
            historyLength + 1,
            "one shortcut press creates one navigation entry",
          );
          assert.equal(
            await page
              .getByRole("button", { name: "Birthdays", exact: true })
              .getAttribute("aria-current"),
            "page",
          );
          await page.reload();
          await waitForIds(page, ["birthdays"]);
          await page.screenshot({
            path: path.join(output, "favorites-desktop-default.png"),
            fullPage: true,
          });
          await page.setViewportSize({ width: 390, height: 844 });
          await page.screenshot({
            path: path.join(output, "favorites-phone-default.png"),
            fullPage: true,
          });
          await openEditor(page);
          assert.ok((await page.getByRole("button", { name: /^Pin / }).count()) > 20);
          const dimensions = await page
            .locator(
              '[aria-label="Edit favorite categories"], [data-category-favorites-editor] button',
            )
            .evaluateAll((elements) =>
              elements.map((element) => ({
                height: element.getBoundingClientRect().height,
                width: element.getBoundingClientRect().width,
              })),
            );
          assert.ok(
            dimensions.every((size) => size.height >= 44 && size.width >= 44),
            "the pencil and every option have a 44px target",
          );
          const available = page.getByRole("region", {
            name: "Available favorite event types",
            exact: true,
          });
          const scrolling = await available.evaluate((element) => ({
            height: element.getBoundingClientRect().height,
            client: element.clientHeight,
            content: element.scrollHeight,
          }));
          assert.ok(
            scrolling.height <= Math.min(844 * 0.5, 384) + 1 &&
              scrolling.content > scrolling.client,
            "the inline picker remains bounded with native overflow",
          );
          await available.focus();
          await page.keyboard.press("End");
          await page.waitForFunction(
            () =>
              document.querySelector('[aria-label="Available favorite event types"]').scrollTop > 0,
          );
          assert.ok(
            await available.evaluate((element) => element.scrollTop > 0),
            "keyboard users can scroll through every category",
          );
          await page.keyboard.press("Home");
          await page.waitForFunction(
            () =>
              document.querySelector('[aria-label="Available favorite event types"]').scrollTop ===
              0,
          );
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
          );
          assert.equal(
            await favorites(page).locator("a button, button a, button button").count(),
            0,
            "interactive controls are never nested",
          );
          const colors = await caption.evaluate((element) => ({
            text: getComputedStyle(element).color,
            background: getComputedStyle(document.body).backgroundColor,
          }));
          assert.ok(
            contrastRatio(colors.text, colors.background) >= 4.5,
            "light Favorites caption meets 4.5:1 contrast",
          );
          assert.doesNotMatch(
            await favorites(page).innerText(),
            /Edit favorites|Favorites are shortcuts|All available event types stay in Create event/,
          );
          await page.screenshot({ path: path.join(output, "favorites-phone.png"), fullPage: true });
        } finally {
          await page.close();
        }
      },
    );
    await t.test(
      "signup defaults stay under Create while absent, empty and custom favorites persist independently",
      async () => {
        for (const initial of [undefined, [], ["school"], ["gymnastics", "school"]]) {
          const { page, records, writes } = await fixture({
            configuration: { signupSource: "gymnastics" },
            records: { "first-host": preferences(initial) },
          });
          try {
            const explicit = (initial || []).filter((id) => id !== "gymnastics");
            await waitForIds(page, explicit);
            assert.equal(
              await page.evaluate(() => window.categoryFavoritesFixture.current.defaultCategory),
              "gymnastics",
            );
            assert.equal(
              await page
                .locator("[data-fixture-default-category]")
                .getByRole("button", { name: "Gymnastics", exact: true })
                .count(),
              1,
            );
            assert.equal(
              await favorites(page)
                .getByRole("button", { name: "Gymnastics", exact: true })
                .count(),
              0,
              "signup context never implicitly adds a favorite",
            );
            assert.equal(writes.length, 0, "loading a signup default never saves favorites");
            await openEditor(page);
            assert.equal(
              await page.getByRole("button", { name: "Pin Gymnastics", exact: true }).count(),
              0,
              "the current default is omitted from duplicate favorite choices",
            );
            await page.getByRole("button", { name: "Pin Birthdays", exact: true }).click();
            await waitForIds(page, [...explicit, "birthdays"]);
            assert.deepEqual(
              writes[0].payload.pinnedCategoryIds,
              [...(initial || []), "birthdays"],
              "saving another favorite preserves explicit stored identities",
            );
            await page.reload();
            await waitForIds(page, [...explicit, "birthdays"]);
            await openEditor(page);
            await page.getByRole("button", { name: "Unpin Birthdays", exact: true }).click();
            await waitForIds(page, explicit);
            if (explicit.includes("school")) {
              await page
                .getByRole("button", { name: "Unpin School & classroom", exact: true })
                .click();
              await waitForIds(page, []);
            }
            assert.deepEqual(
              records["first-host"].pinnedCategoryIds,
              (initial || []).filter((id) => id === "gymnastics"),
            );
            await page.reload();
            await waitForIds(page, []);
            assert.equal(
              await page.evaluate(() => window.categoryFavoritesFixture.current.defaultCategory),
              "gymnastics",
              "clearing favorites does not remove the signup default",
            );
            assert.equal(
              await page
                .locator("[data-fixture-default-category]")
                .getByRole("button", { name: "Gymnastics", exact: true })
                .count(),
              1,
            );
            await page.setViewportSize({ width: 390, height: 844 });
            await page.screenshot({
              path: path.join(output, "favorites-default-gymnastics-phone.png"),
              fullPage: true,
            });
          } finally {
            await page.close();
          }
        }
      },
    );
    await t.test(
      "exhausted initial preference reads expose an explicit retry that restores favorites",
      async () => {
        let fail = true;
        const { page, writes } = await fixture({
          records: { "first-host": preferences(["gymnastics"]) },
          get: () => (fail ? { status: 503 } : null),
        });
        try {
          await page
            .getByRole("alert")
            .filter({ hasText: "Could not load your workspace preferences" })
            .waitFor();
          assert.equal(
            await page.getByRole("button", { name: "Gymnastics", exact: true }).count(),
            0,
          );
          fail = false;
          const retry = page.getByRole("button", { name: "Retry favorites", exact: true });
          await retry.focus();
          await page.keyboard.press("Enter");
          await waitForIds(page, ["gymnastics"]);
          assert.equal(await page.getByRole("alert").count(), 0);
          assert.equal(writes.length, 0);
        } finally {
          await page.close();
        }
      },
    );
    await t.test(
      "restricted accounts see only granted options and product revocation removes shortcuts",
      async () => {
        const { page, writes } = await fixture({
          configuration: { access: gymOnly },
          records: { "first-host": preferences(["gymnastics", "birthdays"]) },
        });
        try {
          await waitForIds(page, ["gymnastics"]);
          await openEditor(page);
          assert.equal(await editor(page).getByRole("button").count(), 1);
          await page.evaluate(() => window.categoryFavoritesFixture.toggle("birthdays"));
          assert.equal(writes.length, 0);
          await page.evaluate((access) => window.categoryFavoritesFixture.setAccess(access), {
            ...gymOnly,
            allowedProducts: [],
          });
          await waitForIds(page, []);
          assert.equal(await editor(page).getByRole("button").count(), 0);
          assert.equal(
            await page.getByRole("link", { name: "Create event", exact: true }).count(),
            1,
          );
        } finally {
          await page.close();
        }
        const formsOnly = {
          policy: "restricted",
          allowedProducts: ["signup_form"],
          allowedCategories: [],
        };
        const forms = await fixture({
          configuration: { access: formsOnly },
          records: { "first-host": preferences([]) },
        });
        try {
          await openEditor(forms.page);
          assert.equal(
            await editor(forms.page).getByRole("button").count(),
            1,
            "a forms-only account needs no Event Page product grant",
          );
          await forms.page.getByRole("button", { name: "Pin Sign-up Form", exact: true }).click();
          await waitForIds(forms.page, ["signup-forms"]);
          assert.deepEqual(forms.writes[0].payload, { pinnedCategoryIds: ["signup-forms"] });
          await forms.page.reload();
          await waitForIds(forms.page, ["signup-forms"]);
          const shortcut = favorites(forms.page).getByRole("button", {
            name: "Sign-up Form",
            exact: true,
          });
          await shortcut.click();
          assert.equal(new URL(forms.page.url()).pathname, "/signup-forms/templates");
          assert.equal(await forms.page.locator("[data-fixture-default-category]").count(), 0);
        } finally {
          await forms.page.close();
        }
      },
    );
    await t.test("failed saves retain the confirmed shortcut and a retry can commit", async () => {
      let fail = true;
      const { page, writes } = await fixture({
        records: { "first-host": preferences(["gymnastics"]) },
        put: () => (fail ? { status: 503 } : null),
      });
      try {
        await openEditor(page);
        await page.getByRole("button", { name: "Unpin Gymnastics", exact: true }).click();
        await page
          .getByRole("alert")
          .filter({ hasText: "Could not save your favorites" })
          .waitFor();
        await waitForIds(page, ["gymnastics"]);
        assert.equal(
          await page
            .getByRole("button", { name: "Unpin Gymnastics", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        fail = false;
        await page.getByRole("button", { name: "Unpin Gymnastics", exact: true }).click();
        await waitForIds(page, []);
        assert.equal(writes.length, 2);
        assert.equal(await page.getByRole("alert").count(), 0);
      } finally {
        await page.close();
      }
    });
    await t.test(
      "pending writes disable controls and duplicate toggles share no extra mutation",
      async () => {
        const gate = deferred();
        const { page, writes } = await fixture({ put: () => gate.promise });
        try {
          await openEditor(page);
          await page.evaluate(() => {
            void window.categoryFavoritesFixture.toggle("birthdays");
            void window.categoryFavoritesFixture.toggle("gymnastics");
          });
          await page.getByRole("status").filter({ hasText: "Saving favorites" }).waitFor();
          assert.equal(writes.length, 1);
          assert.equal(
            await page.getByRole("button", { name: "Birthdays", exact: true }).count(),
            0,
            "a pending save has not been counted as saved",
          );
          assert.equal(await editor(page).locator("button:not(:disabled)").count(), 0);
          gate.resolve();
          await waitForIds(page, ["birthdays"]);
        } finally {
          gate.resolve();
          await page.close();
        }
      },
    );
    await t.test(
      "a stalled save reaches its ten-second deadline, retains pins and allows retry",
      async () => {
        const gate = deferred();
        let first = true;
        const { page, writes } = await fixture({
          records: { "first-host": preferences(["gymnastics"]) },
          put: () => {
            if (first) {
              first = false;
              return gate.promise;
            }
            return null;
          },
        });
        try {
          await page.clock.install();
          await openEditor(page);
          await page.getByRole("button", { name: "Unpin Gymnastics", exact: true }).click();
          await page.getByRole("status").filter({ hasText: "Saving favorites" }).waitFor();
          await page.clock.runFor(10_001);
          await page
            .getByRole("alert")
            .filter({ hasText: "Saving your favorites took too long" })
            .waitFor();
          await waitForIds(page, ["gymnastics"]);
          assert.equal(
            await page.getByRole("button", { name: "Unpin Gymnastics", exact: true }).isEnabled(),
            true,
          );
          await page.getByRole("button", { name: "Unpin Gymnastics", exact: true }).click();
          await waitForIds(page, []);
          assert.equal(writes.length, 2);
        } finally {
          gate.resolve();
          await page.close();
        }
      },
    );
    await t.test(
      "server-filtered saved IDs are authoritative and malformed confirmations preserve prior pins",
      async () => {
        let malformed = false;
        const { page } = await fixture({
          records: { "first-host": preferences(["gymnastics"]) },
          put: () => ({
            json: malformed
              ? { ok: true }
              : { ok: true, featureVisibility: preferences(["gymnastics"]) },
          }),
        });
        try {
          await openEditor(page);
          await page.getByRole("button", { name: "Pin School & classroom", exact: true }).click();
          await waitForIds(page, ["gymnastics"]);
          assert.equal(
            await page.getByRole("button", { name: "School & classroom", exact: true }).count(),
            0,
            "server grant filtering is honored",
          );
          malformed = true;
          await page.getByRole("button", { name: "Unpin Gymnastics", exact: true }).click();
          await page
            .getByRole("alert")
            .filter({ hasText: "Could not save your favorites" })
            .waitFor();
          await waitForIds(page, ["gymnastics"]);
        } finally {
          await page.close();
        }
      },
    );
    await t.test("account switching hides old favorites and rejects late save state", async () => {
      const gate = deferred();
      const { page, writes } = await fixture({
        configuration: { signupSource: "gymnastics" },
        records: {
          "first-host": preferences(["gymnastics"]),
          "second-host": preferences(["birthdays"]),
        },
        put: (write) => (write.account === "first-host" ? gate.promise : null),
      });
      try {
        assert.equal(
          await page.evaluate(() => window.categoryFavoritesFixture.current.defaultCategory),
          "gymnastics",
        );
        await openEditor(page);
        await page.getByRole("button", { name: "Pin School & classroom", exact: true }).click();
        await page.getByRole("status").filter({ hasText: "Saving favorites" }).waitFor();
        await page.evaluate(() => window.categoryFavoritesFixture.setAccount("second-host"));
        const immediate = await page.evaluate(() =>
          window.categoryFavoritesFixture.renders.filter(
            (state) => state.account === "second-host",
          ),
        );
        assert.ok(
          immediate.length > 0 &&
            immediate.every(
              (state) =>
                !state.favorites.includes("gymnastics") &&
                state.defaultCategory === null &&
                !state.saving &&
                !state.error,
            ),
        );
        await waitForIds(page, ["birthdays"]);
        gate.resolve();
        await page.getByRole("button", { name: "Pin Gymnastics", exact: true }).click();
        await waitForIds(page, ["birthdays", "gymnastics"]);
        assert.deepEqual(
          writes.map((write) => write.account),
          ["first-host", "second-host"],
        );
        const later = await page.evaluate(() =>
          window.categoryFavoritesFixture.renders.filter(
            (state) => state.account === "second-host",
          ),
        );
        assert.ok(
          later.every((state) => !state.favorites.includes("school") && !state.error),
          "the old account's late response cannot commit its shortcut",
        );
        await page.evaluate(() =>
          window.categoryFavoritesFixture.setAccount("second-host", "unauthenticated"),
        );
        await waitForIds(page, []);
        assert.equal(await editor(page).getByRole("button").count(), 0);
      } finally {
        gate.resolve();
        await page.close();
      }
    });
    await t.test(
      "dark appearance keeps selected options readable and supports keyboard pencil toggling",
      async () => {
        const { page } = await fixture({
          configuration: { dark: true },
          records: { "first-host": preferences(["gymnastics"]) },
        });
        try {
          await page.screenshot({
            path: path.join(output, "favorites-dark-desktop-default.png"),
            fullPage: true,
          });
          await openEditor(page);
          const selected = page.getByRole("button", { name: "Unpin Gymnastics", exact: true });
          const colors = await selected.evaluate((element) => ({
            text: getComputedStyle(element).color,
            background: getComputedStyle(element).backgroundColor,
          }));
          assert.notEqual(colors.text, colors.background);
          assert.ok(
            contrastRatio(colors.text, colors.background) >= 4.5,
            "dark selected option meets 4.5:1 text contrast",
          );
          assert.notEqual(
            colors.background,
            "rgba(255, 255, 255, 0.75)",
            "selected option uses the shared dark sidebar surface",
          );
          await page.screenshot({
            path: path.join(output, "favorites-dark-desktop.png"),
            fullPage: true,
          });
          const pencil = editButton(page);
          await pencil.focus();
          await page.keyboard.press("Enter");
          assert.equal(await pencil.getAttribute("aria-expanded"), "false");
          assert.equal(await editor(page).count(), 0);
        } finally {
          await page.close();
        }
      },
    );
    assert.deepEqual(
      errors,
      [],
      "the actual hooks and component produce no browser runtime errors",
    );
  } finally {
    await browser.close();
  }
});
