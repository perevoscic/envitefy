const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const preferences = (categoryOnboarding, pinnedCategoryIds) => ({
  visibleTemplateKeys: [],
  ...(categoryOnboarding === undefined ? {} : { categoryOnboarding }),
  ...(pinnedCategoryIds === undefined ? {} : { pinnedCategoryIds }),
});
const standardAccess = {
  policy: "standard",
  allowedProducts: ["event_page", "signup_form", "snap", "live_card"],
  allowedCategories: [
    "general",
    "birthdays",
    "weddings",
    "anniversaries",
    "baby-showers",
    "bridal-showers",
    "gender-reveal",
    "gymnastics",
    "football",
    "sport-events",
    "soccer",
    "cheerleading",
    "dance-ballet",
  ],
};
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const sameMembers = (actual, expected, message) =>
  assert.deepEqual([...actual].sort(), [...expected].sort(), message);

async function assertTextContrast(scope) {
  const results = await scope.locator("h2,p,label,summary,button").evaluateAll((elements) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    const rgba = (color) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].map((value, index) =>
        index === 3 ? value / 255 : value,
      );
    };
    const blend = (top, bottom) =>
      top.slice(0, 3).map((value, index) => value * top[3] + bottom[index] * (1 - top[3]));
    const luminance = (channels) =>
      channels
        .map((value) => value / 255)
        .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    return elements
      .filter((element) => element.checkVisibility())
      .map((element) => {
        const ancestors = [];
        for (let current = element; current; current = current.parentElement)
          ancestors.unshift(current);
        const background = ancestors.reduce(
          (color, current) => blend(rgba(getComputedStyle(current).backgroundColor), color),
          [255, 255, 255],
        );
        const light = luminance(background),
          foreground = luminance(blend(rgba(getComputedStyle(element).color), background));
        return {
          name: element.textContent.trim(),
          ratio: (Math.max(light, foreground) + 0.05) / (Math.min(light, foreground) + 0.05),
        };
      });
  });
  assert.ok(results.length > 0);
  for (const result of results)
    assert.ok(result.ratio >= 4.5, `${result.name} contrast is ${result.ratio.toFixed(2)}:1`);
}

async function assertFullscreenBounds(page, scope) {
  const viewport = page.viewportSize();
  const bounds = await scope.boundingBox();
  assert.ok(bounds);
  assert.ok(
    Math.abs(bounds.x) <= 1 && Math.abs(bounds.y) <= 1,
    "onboarding starts at the viewport edges",
  );
  assert.ok(Math.abs(bounds.width - viewport.width) <= 1, "onboarding fills the viewport width");
  assert.ok(Math.abs(bounds.height - viewport.height) <= 1, "onboarding fills the viewport height");
}

async function assertWholeLabelWords(scope) {
  const broken = await scope.locator("label").evaluateAll((labels) => {
    const result = [];
    for (const label of labels) {
      const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const match of node.textContent.matchAll(/[\p{L}\p{N}]+/gu)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          if (new Set([...range.getClientRects()].map((rect) => Math.round(rect.y))).size > 1)
            result.push(match[0]);
        }
      }
    }
    return result;
  });
  assert.deepEqual(broken, [], "category labels wrap between complete words");
}

test("homepage interest onboarding saves chosen events and sports as editable account favorites", {
  timeout: 120_000,
}, async (t) => {
  const output = path.resolve(".qa/category-onboarding-browser");
  const entry = path.resolve("scripts/fixtures/category-onboarding.tsx");
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
        alias: {
          "next-auth/react": entry,
          "next/navigation": entry,
          "next/link$": entry,
          "@": path.resolve("src"),
        },
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
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n' +
        [
          "../components/account/CategoryInterestOnboarding.tsx",
          "../components/account/CategoryInterestPicker.tsx",
          "../components/account/CategoryFavoritesSettings.tsx",
          "../components/navigation/SidebarCategoryFavorites.tsx",
          "../components/ui/sidebar.tsx",
        ]
          .map((entry) => `@source "${entry}";`)
          .join("\n"),
    );
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const errors = [];
  async function fixture({
    configuration = {},
    records = { "first-host": preferences("pending") },
    access = standardAccess,
    pathname = "/",
    put,
  } = {}) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const writes = [];
    page.setDefaultTimeout(10_000);
    page.on("pageerror", (error) => errors.push(error.stack || error.message));
    await page.addInitScript((value) => {
      window.categoryOnboardingConfiguration = value;
    }, configuration);
    await page.route("**/*", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (url.pathname === "/fixture.js")
        return route.fulfill({ contentType: "text/javascript", body: script });
      if (url.pathname.startsWith("/fonts/")) {
        const fontPath = path.resolve("public", url.pathname.slice(1));
        if (!fs.existsSync(fontPath)) return route.abort();
        return route.fulfill({
          contentType: fontPath.endsWith(".woff2") ? "font/woff2" : "font/ttf",
          body: fs.readFileSync(fontPath),
        });
      }
      if (url.pathname === "/api/user/creation-access") return route.fulfill({ json: { access } });
      if (url.pathname === "/api/user/feature-visibility") {
        const account = request.headers()["x-fixture-account"];
        if (request.method() === "PUT") {
          const payload = request.postDataJSON(),
            write = { account, payload };
          writes.push(write);
          const result = await put?.(write, writes.length);
          if (result?.status && result.status !== 200)
            return route
              .fulfill({ status: result.status, json: { error: "Could not save preferences" } })
              .catch(() => {});
          if (result?.json) return route.fulfill({ json: result.json }).catch(() => {});
          records[account] = { ...(records[account] || preferences(undefined)), ...payload };
          return route
            .fulfill({ json: { ok: true, featureVisibility: records[account] } })
            .catch(() => {});
        }
        return route.fulfill({ json: records[account] || preferences(undefined) });
      }
      if (["/icons/sidebar-gymnastics.png", "/icons/sidebar-football.png"].includes(url.pathname))
        return route.fulfill({
          contentType: "image/png",
          body: fs.readFileSync(path.join("public", url.pathname)),
        });
      if (url.origin === "http://category-onboarding.test")
        return route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}
          body{margin:0;background:var(--background);color:var(--foreground)}
          .fixture-navigation{box-sizing:border-box;width:min(320px,100%);padding:12px}
          .fixture-navigation>a{display:flex;min-height:44px;align-items:center;padding:0 12px}
          .fixture-main{width:min(800px,100%);box-sizing:border-box;padding:24px}
        </style></head><body class="font-vars"><div id="root"></div><script src="/fixture.js"></script></body></html>`,
        });
      return route.abort();
    });
    await page.goto(`http://category-onboarding.test${pathname}`);
    await page.waitForFunction(
      () =>
        window.categoryOnboardingFixture?.current &&
        !window.categoryOnboardingFixture.current.loading,
    );
    await page.evaluate(() => document.fonts.ready);
    return { page, writes, records };
  }
  const dialog = (page) =>
    page.getByRole("dialog", { name: "What do you like to plan?", exact: true });
  const favorites = (page) =>
    page.getByRole("region", { name: "Favorite event types", exact: true });
  const checkbox = (scope, name) => scope.getByRole("checkbox", { name, exact: true });
  const sports = async (scope) => {
    const disclosure = scope.locator("details");
    if (!(await disclosure.evaluate((element) => element.open)))
      await disclosure.locator("summary").click();
  };
  const waitFavorites = (page, expected) =>
    page.waitForFunction(
      (ids) =>
        JSON.stringify([...window.categoryOnboardingFixture.current.favorites].sort()) ===
        JSON.stringify([...ids].sort()),
      expected,
    );
  const saveAndWait = async (page, expected) => {
    await dialog(page).getByRole("button", { name: "Continue", exact: true }).click();
    await dialog(page).waitFor({ state: "hidden" });
    await waitFavorites(page, expected);
  };

  try {
    await t.test(
      "fresh homepage accounts get removable Birthday and Holiday defaults and every event type",
      async () => {
        const { page, writes, records } = await fixture();
        try {
          const prompt = dialog(page);
          await prompt.waitFor();
          assert.match(
            await prompt.innerText(),
            /Your selections will be added to Favorites\. You can add or change these later in Settings\./,
          );
          assert.equal(await checkbox(prompt, "Birthdays").isChecked(), true);
          assert.equal(await checkbox(prompt, "Holidays & seasonal").isChecked(), true);
          for (const label of [
            "Weddings",
            "Anniversaries",
            "Baby showers",
            "Bridal showers",
            "Gender reveals",
            "School & classroom",
            "Graduations",
            "Housewarming",
            "Open house",
            "Religious celebrations",
            "General events",
            "Sign-up Form",
          ])
            assert.equal(
              await checkbox(prompt, label).isChecked(),
              false,
              `${label} is a selectable event interest`,
            );
          assert.deepEqual(
            await page.evaluate(() => window.categoryOnboardingFixture.current.favorites),
            [],
          );
          assert.equal(writes.length, 0, "suggested defaults do not pin before explicit Continue");
          await assertTextContrast(prompt);
          await assertFullscreenBounds(page, prompt);
          await assertWholeLabelWords(prompt);
          await page.screenshot({
            path: path.join(output, "onboarding-desktop-light.png"),
            fullPage: true,
          });
          await page.setViewportSize({ width: 375, height: 844 });
          await assertFullscreenBounds(page, prompt);
          await assertWholeLabelWords(prompt);
          await prompt.evaluate((element) => {
            for (const child of element.querySelectorAll("*")) {
              if (getComputedStyle(child).overflowY === "auto") child.scrollTop = 0;
            }
          });
          await page.screenshot({
            path: path.join(output, "onboarding-phone-light-initial.png"),
            fullPage: true,
          });
          await page.setViewportSize({ width: 1440, height: 1000 });
          await checkbox(prompt, "Holidays & seasonal").uncheck();
          await saveAndWait(page, ["birthdays"]);
          assert.equal(records["first-host"].categoryOnboarding, "completed");
          assert.deepEqual(records["first-host"].pinnedCategoryIds, ["birthdays"]);
          assert.equal(writes.length, 1);
          assert.equal(
            await favorites(page).getByRole("button", { name: "Birthdays", exact: true }).count(),
            1,
          );
          await page.reload();
          await waitFavorites(page, ["birthdays"]);
          assert.equal(
            await dialog(page).count(),
            0,
            "completed onboarding stays dismissed after reload",
          );
        } finally {
          await page.close();
        }
      },
    );

    await t.test(
      "Weddings and several sports become favorites and can be changed later in Settings",
      async () => {
        const { page, writes, records } = await fixture();
        try {
          const prompt = dialog(page);
          await prompt.waitFor();
          await checkbox(prompt, "Weddings").check();
          await sports(prompt);
          await checkbox(prompt, "Soccer").check();
          await checkbox(prompt, "Basketball").check();
          await checkbox(prompt, "Dance / ballet").check();
          await saveAndWait(page, [
            "birthdays",
            "holidays-seasonal",
            "weddings",
            "soccer",
            "basketball",
            "dance-ballet",
          ]);
          sameMembers(records["first-host"].sportPreferences.enabledSports, [
            "soccer",
            "basketball",
            "dance",
          ]);
          assert.equal(records["first-host"].sportPreferences.setupCompleted, true);
          assert.ok(
            ["soccer", "basketball"].includes(records["first-host"].sportPreferences.primarySport),
          );
          assert.equal(
            await favorites(page).getByRole("button", { name: "Weddings", exact: true }).count(),
            1,
          );
          assert.equal(
            await favorites(page).getByRole("button", { name: "Soccer", exact: true }).count(),
            1,
          );
          await page.getByRole("link", { name: "Settings", exact: true }).click();
          const settings = page.locator("#favorites");
          await settings.getByRole("heading", { name: "Favorites", exact: true }).waitFor();
          assert.equal(await dialog(page).count(), 0);
          assert.equal(await checkbox(settings, "Weddings").isChecked(), true);
          await checkbox(settings, "Anniversaries").check();
          await sports(settings);
          await checkbox(settings, "Soccer").uncheck();
          await settings.getByRole("button", { name: "Save favorites", exact: true }).click();
          await waitFavorites(page, [
            "birthdays",
            "holidays-seasonal",
            "weddings",
            "anniversaries",
            "basketball",
            "dance-ballet",
          ]);
          assert.equal(writes.length, 2);
          assert.equal(records["first-host"].categoryOnboarding, "completed");
          await page.reload();
          await waitFavorites(page, [
            "birthdays",
            "holidays-seasonal",
            "weddings",
            "anniversaries",
            "basketball",
            "dance-ballet",
          ]);
          assert.equal(
            await checkbox(page.locator("#favorites"), "Anniversaries").isChecked(),
            true,
          );
        } finally {
          await page.close();
        }
      },
    );

    await t.test(
      "Skip dismisses onboarding without pinning suggestions and Settings remains available",
      async () => {
        const { page, writes, records } = await fixture();
        try {
          await dialog(page).getByRole("button", { name: "Skip for now", exact: true }).click();
          await dialog(page).waitFor({ state: "hidden" });
          assert.equal(writes.length, 1);
          assert.equal(writes[0].payload.categoryOnboarding, "skipped");
          assert.ok(
            !Object.hasOwn(writes[0].payload, "pinnedCategoryIds"),
            "Skip never saves suggested pins",
          );
          assert.equal(records["first-host"].pinnedCategoryIds, undefined);
          await page.reload();
          await page.waitForFunction(
            () => window.categoryOnboardingFixture.current.hasLoadedPreferences,
          );
          assert.equal(await dialog(page).count(), 0);
          await waitFavorites(page, []);
          await page.getByRole("link", { name: "Settings", exact: true }).click();
          const settings = page.locator("#favorites");
          assert.equal(await checkbox(settings, "Birthdays").isChecked(), false);
          await checkbox(settings, "Weddings").check();
          await settings.getByRole("button", { name: "Save favorites", exact: true }).click();
          await waitFavorites(page, ["weddings"]);
        } finally {
          await page.close();
        }
      },
    );

    await t.test(
      "existing accounts, signed-out visitors and template editors do not receive the prompt",
      async () => {
        for (const categoryOnboarding of [undefined, null, "completed", "skipped"]) {
          const { page, writes } = await fixture({
            records: { "first-host": preferences(categoryOnboarding, ["weddings"]) },
          });
          try {
            await waitFavorites(page, ["weddings"]);
            assert.equal(
              await dialog(page).count(),
              0,
              `${categoryOnboarding} is not a pending signup`,
            );
            assert.equal(writes.length, 0);
          } finally {
            await page.close();
          }
        }
        for (const pathname of ["/event/weddings/customize", "/settings"]) {
          const { page, writes } = await fixture({ pathname });
          try {
            assert.equal(await dialog(page).count(), 0, `${pathname} is not interrupted`);
            assert.equal(writes.length, 0);
          } finally {
            await page.close();
          }
        }
        const visitor = await fixture({ configuration: { status: "unauthenticated" } });
        try {
          assert.equal(await dialog(visitor.page).count(), 0);
          assert.equal(visitor.writes.length, 0);
        } finally {
          await visitor.page.close();
        }
        const create = await fixture({ pathname: "/create" });
        try {
          await dialog(create.page).waitFor();
        } finally {
          await create.page.close();
        }
      },
    );

    await t.test(
      "a failed save retains chosen events and sports for an explicit retry",
      async () => {
        const { page, writes, records } = await fixture({
          put: (_write, number) => (number === 1 ? { status: 503 } : null),
        });
        try {
          const prompt = dialog(page);
          await checkbox(prompt, "Weddings").check();
          await sports(prompt);
          await checkbox(prompt, "Football").check();
          await prompt.getByRole("button", { name: "Continue", exact: true }).click();
          await prompt.getByRole("alert").waitFor();
          assert.equal(await checkbox(prompt, "Weddings").isChecked(), true);
          assert.equal(await checkbox(prompt, "Football").isChecked(), true);
          assert.equal(records["first-host"].categoryOnboarding, "pending");
          assert.equal(records["first-host"].pinnedCategoryIds, undefined);
          await saveAndWait(page, ["birthdays", "holidays-seasonal", "weddings", "football"]);
          assert.equal(writes.length, 2);
          assert.deepEqual(
            writes[0].payload,
            writes[1].payload,
            "retry sends the same complete choice",
          );
        } finally {
          await page.close();
        }
      },
    );

    await t.test(
      "phone dark mode supports keyboard selection, native scrolling and reachable actions",
      async () => {
        const { page } = await fixture({ configuration: { dark: true } });
        try {
          const prompt = dialog(page);
          await prompt.waitFor();
          await assertFullscreenBounds(page, prompt);
          await assertTextContrast(prompt);
          await page.screenshot({
            path: path.join(output, "onboarding-desktop-dark.png"),
            fullPage: true,
          });
          await page.setViewportSize({ width: 375, height: 844 });
          await assertFullscreenBounds(page, prompt);
          await assertWholeLabelWords(prompt);
          await prompt.evaluate((element) => {
            for (const child of element.querySelectorAll("*")) {
              if (getComputedStyle(child).overflowY === "auto") child.scrollTop = 0;
            }
          });
          await page.screenshot({
            path: path.join(output, "onboarding-phone-dark-initial.png"),
            fullPage: true,
          });
          await checkbox(prompt, "Birthdays").focus();
          await page.keyboard.press("Space");
          assert.equal(await checkbox(prompt, "Birthdays").isChecked(), false);
          await sports(prompt);
          const football = checkbox(prompt, "Football");
          await football.focus();
          await page.keyboard.press("Space");
          assert.equal(await football.isChecked(), true);
          await page.keyboard.press("Space");
          assert.equal(await football.isChecked(), false);
          assert.equal(
            await prompt.locator("details").evaluate((element) => element.open),
            true,
            "unchecking the last sport retains the open picker",
          );
          assert.equal(
            await football.evaluate((element) => document.activeElement === element),
            true,
            "unchecking the last sport retains keyboard focus",
          );
          await page.keyboard.press("Space");
          const sizes = await prompt.locator("label").evaluateAll((elements) =>
            elements
              .filter(
                (element) =>
                  element.querySelector("input[type=checkbox]") && element.checkVisibility(),
              )
              .map((element) => ({
                width: element.getBoundingClientRect().width,
                height: element.getBoundingClientRect().height,
              })),
          );
          assert.ok(sizes.length > 20);
          assert.ok(
            sizes.every((size) => size.width >= 44 && size.height >= 44),
            "every checkbox label retains a 44px target",
          );
          await assertWholeLabelWords(prompt);
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
          );
          const continueButton = prompt.getByRole("button", { name: "Continue", exact: true });
          await continueButton.focus();
          await assertFullscreenBounds(page, prompt);
          const rect = await continueButton.boundingBox();
          assert.ok(
            rect.y >= 0 && rect.y + rect.height <= 844,
            "keyboard focus brings Continue into the phone viewport",
          );
          const colors = await prompt.evaluate((element) => {
            const style = getComputedStyle(element);
            return { text: style.color, background: style.backgroundColor };
          });
          assert.notEqual(
            colors.text,
            colors.background,
            "dark prompt pairs foreground and surface colors",
          );
          assert.equal(
            await page.evaluate(() => document.documentElement.dataset.theme),
            "general-dark",
            "the actual appearance setter supplies dark tokens",
          );
          await assertTextContrast(prompt);
          await page.screenshot({
            path: path.join(output, "onboarding-phone-dark.png"),
            fullPage: true,
          });
          await page.evaluate(() => {
            document.documentElement.style.fontSize = "200%";
          });
          await continueButton.focus();
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
            "200% text stays within the phone viewport",
          );
          const categoryScrollHeight = await prompt.evaluate((element) =>
            Math.max(
              0,
              ...[...element.querySelectorAll("*")]
                .filter(
                  (child) =>
                    child.querySelector("label") &&
                    ["auto", "scroll"].includes(getComputedStyle(child).overflowY),
                )
                .map((child) => child.clientHeight),
            ),
          );
          assert.ok(
            categoryScrollHeight >= 104,
            `200% text retains a usable category scroller (${categoryScrollHeight}px)`,
          );
          const firstCard = prompt.locator("label").first();
          await firstCard.scrollIntoViewIfNeeded();
          const enlargedCard = await firstCard.boundingBox();
          const enlarged = await continueButton.boundingBox();
          assert.ok(
            enlarged.y >= 0 && enlarged.y + enlarged.height <= 844,
            "Continue remains visible at 200% text",
          );
          for (const action of [
            prompt.getByRole("button", { name: "Skip for now", exact: true }),
            continueButton,
          ]) {
            const bounds = await action.boundingBox();
            assert.ok(
              bounds.x >= 0 && bounds.x + bounds.width <= 375,
              `${await action.innerText()} remains within the phone width at 200% text`,
            );
            assert.ok(
              bounds.y >= 0 && bounds.y + bounds.height <= 844,
              `${await action.innerText()} remains within the phone height at 200% text`,
            );
          }
          assert.ok(
            enlargedCard.y >= 0 && enlargedCard.y + enlargedCard.height <= enlarged.y,
            "a complete category card can scroll into view above the actions at 200% text",
          );
          assert.equal(
            await prompt
              .locator("label")
              .first()
              .evaluate((element) => element.getBoundingClientRect().width > 250),
            true,
            "200% text switches phone choices to one column",
          );
          await page.screenshot({
            path: path.join(output, "onboarding-phone-dark-large-text.png"),
            fullPage: true,
          });
          await page.evaluate(() => {
            document.documentElement.style.fontSize = "";
          });
          await page.setViewportSize({ width: 844, height: 390 });
          await continueButton.focus();
          await assertFullscreenBounds(page, prompt);
          const landscape = await prompt.boundingBox();
          const landscapeAction = await continueButton.boundingBox();
          assert.ok(
            landscape.y >= 0 && landscape.y + landscape.height <= 390,
            "landscape modal fits the viewport",
          );
          assert.ok(
            landscapeAction.y >= 0 && landscapeAction.y + landscapeAction.height <= 390,
            "landscape footer remains reachable",
          );
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
          );
          await prompt.evaluate((element) => {
            for (const child of element.querySelectorAll("*")) {
              if (getComputedStyle(child).overflowY === "auto") child.scrollTop = 0;
            }
          });
          await page.screenshot({
            path: path.join(output, "onboarding-landscape-dark.png"),
            fullPage: true,
          });
          await page.setViewportSize({ width: 375, height: 844 });
          await continueButton.focus();
          await page.keyboard.press("Enter");
          await prompt.waitFor({ state: "hidden" });
          await waitFavorites(page, ["holidays-seasonal", "football"]);
        } finally {
          await page.close();
        }
      },
    );

    await t.test(
      "restricted accounts see only granted categories and product-specific favorites",
      async () => {
        for (const access of [
          {
            policy: "restricted",
            allowedProducts: ["event_page"],
            allowedCategories: ["gymnastics"],
          },
          { policy: "restricted", allowedProducts: ["signup_form"], allowedCategories: [] },
        ]) {
          const { page, writes } = await fixture({ access });
          try {
            const prompt = dialog(page);
            await prompt.waitFor();
            if (access.allowedProducts.includes("event_page")) await sports(prompt);
            const label = access.allowedProducts.includes("event_page")
              ? "Gymnastics"
              : "Sign-up Form";
            assert.equal(await prompt.getByRole("checkbox").count(), 1);
            assert.equal(
              await checkbox(prompt, label).isChecked(),
              false,
              "default suggestions respect category grants",
            );
            await checkbox(prompt, label).check();
            await saveAndWait(page, [label === "Gymnastics" ? "gymnastics" : "signup-forms"]);
            assert.ok(
              writes.every(
                (write) =>
                  !Object.hasOwn(write.payload, "access") &&
                  !Object.hasOwn(write.payload, "allowedCategories"),
              ),
              "preference writes never expand creation access",
            );
          } finally {
            await page.close();
          }
        }
      },
    );

    await t.test(
      "a save from the previous account cannot dismiss or populate the next account's onboarding",
      async () => {
        const stale = deferred();
        const { page, writes } = await fixture({
          records: { "first-host": preferences("pending"), "second-host": preferences("pending") },
          put: async ({ account }) => {
            if (account === "first-host") await stale.promise;
          },
        });
        try {
          await checkbox(dialog(page), "Weddings").check();
          await dialog(page).getByRole("button", { name: "Continue", exact: true }).click();
          await page.waitForFunction(
            () => document.querySelector('[role="dialog"] button')?.disabled,
          );
          await page.evaluate(() => window.categoryOnboardingFixture.setAccount("second-host"));
          await page.waitForFunction(
            () =>
              window.categoryOnboardingFixture.current.account === "second-host" &&
              window.categoryOnboardingFixture.current.hasLoadedPreferences &&
              !window.categoryOnboardingFixture.current.loading,
          );
          await dialog(page).waitFor();
          assert.equal(await checkbox(dialog(page), "Weddings").isChecked(), false);
          stale.resolve();
          await page.evaluate(
            () =>
              new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          );
          assert.equal(await dialog(page).isVisible(), true);
          assert.equal(await checkbox(dialog(page), "Weddings").isChecked(), false);
          assert.deepEqual(
            await page.evaluate(() => window.categoryOnboardingFixture.current.favorites),
            [],
          );
          assert.equal(
            writes.length,
            1,
            "switching accounts does not replay an old save for the new account",
          );
          assert.equal(writes[0].account, "first-host");
        } finally {
          stale.resolve();
          await page.close();
        }
      },
    );

    assert.deepEqual(
      errors,
      [],
      "the actual account hooks and components produce no browser runtime errors",
    );
  } finally {
    await browser.close();
  }
});
