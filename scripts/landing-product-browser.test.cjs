const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const {
  assertArrowFillCta,
  assertArrowFillInteraction,
  assertArrowFillReducedMotion,
} = require("./lib/landing-arrow-fill-assertions.cjs");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const output = path.resolve("output/landing-product");
const fixture = path.resolve("scripts/fixtures/landing-product");
const publicRoot = path.resolve("public");
const base = "http://landing-product.test";

async function buildFixture(entry = "entry.tsx") {
  fs.mkdirSync(output, { recursive: true });
  const navigation = path.join(fixture, "navigation.tsx");
  const login = path.join(fixture, "LoginForm.tsx");
  const signup = path.join(fixture, "SignupForm.tsx");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      cache: false,
      entry: path.join(fixture, entry),
      output: {
        path: output,
        filename: "fixture.js",
        chunkFilename: "[id].js",
        publicPath: "/bundles/",
      },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("development"),
          "process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID": JSON.stringify(""),
        }),
      ],
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/navigation": navigation,
          "next/link": navigation,
          "next-auth/react": navigation,
          "next/image": path.join(fixture, "image.tsx"),
          "next/dynamic": path.join(fixture, "dynamic.tsx"),
          "@/app/sidebar-context": navigation,
          "@/lib/pwa/install-state": navigation,
          "@/components/auth/LoginForm": login,
          "@/components/auth/SignupForm": signup,
          "./LoginForm$": login,
          "./SignupForm$": signup,
          "@/components/landing/LandingLiveCardShowcase": path.join(fixture, "Showcase.tsx"),
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
      performance: { hints: false },
    });
    compiler.run((error, stats) =>
      compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ),
    );
  });
  const sourcePaths = [
    "../app/landing/LandingExperience.tsx",
    "../app/landing/sections/ProductLandingHero.tsx",
    "../components/auth/AuthModal.tsx",
    "../components/branding/EnvitefyWordmark.tsx",
    "../components/branding/EnvitefySocialLinks.tsx",
    "../components/ConditionalFooter.tsx",
    "../components/navigation/ConciergeLauncher.tsx",
    "../components/navigation/MenuBottomSheet.tsx",
    "../components/navigation/ConciergeSheet.tsx",
    "../components/AppearanceSelector.tsx",
  ];
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n' +
        sourcePaths.map((sourcePath) => `@source "${sourcePath}";`).join("\n"),
    );
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  fs.writeFileSync(path.join(output, "global.css"), css);
  return css;
}

function browserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fs.existsSync(chromium.executablePath())) return chromium.executablePath();
  const chrome = path.join(
    process.env.PROGRAMFILES || "C:\\Program Files",
    "Google",
    "Chrome",
    "Application",
    "chrome.exe",
  );
  return fs.existsSync(chrome) ? chrome : undefined;
}

function contentType(filename) {
  return (
    {
      ".js": "text/javascript",
      ".css": "text/css",
      ".webp": "image/webp",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".ttf": "font/ttf",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    }[path.extname(filename)] || "application/octet-stream"
  );
}

async function serveContext(context, css, unexpected) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== base || request.method() !== "GET") {
      unexpected.push(`${request.method()} ${url.href}`);
      return route.abort();
    }
    if (url.pathname === "/global.css")
      return route.fulfill({ contentType: "text/css", body: css });
    if (url.pathname.startsWith("/bundles/")) {
      const filename = path.resolve(
        output,
        decodeURIComponent(url.pathname.slice("/bundles/".length)),
      );
      if (filename.startsWith(output + path.sep) && fs.existsSync(filename)) {
        return route.fulfill({
          contentType: contentType(filename),
          body: fs.readFileSync(filename),
        });
      }
    }
    const filename = path.resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
    if (
      filename.startsWith(publicRoot + path.sep) &&
      fs.existsSync(filename) &&
      fs.statSync(filename).isFile()
    ) {
      return route.fulfill({ contentType: contentType(filename), body: fs.readFileSync(filename) });
    }
    if (url.pathname === "/")
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"></head><body class="font-vars"><div id="root"></div><script src="/bundles/fixture.js"></script></body></html>',
      });
    if (url.pathname === "/baby-showers/templates")
      return route.fulfill({
        contentType: "text/html",
        // Match client routing: update history before mounting the destination.
        // A native page load or hash assignment would also set CSS :target.
        body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"></head><body class="font-vars"><div id="root"><a href="/#categories">All categories</a></div><script>
          document.querySelector('a').addEventListener('click', (event) => {
            event.preventDefault();
            history.pushState(null, '', event.currentTarget.href);
            const script = document.createElement('script');
            script.src = '/bundles/fixture.js';
            document.body.append(script);
          });
        </script></body></html>`,
      });
    unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  });
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
    `${label}: horizontal overflow ${JSON.stringify(dimensions)}`,
  );
}

async function assertGatheringShrink(page, width) {
  const scene = page.locator("#gathering-note");
  const stage = page.locator("[data-gathering-stage]");
  await page.locator('#gathering-note[data-gathering-ready="true"]').waitFor();
  await page.waitForFunction(() => {
    const scene = document.querySelector("#gathering-note");
    const stage = scene.querySelector("[data-gathering-stage]");
    const copy = scene.querySelector("[data-gathering-copy]");
    const clearance = Math.max(
      0,
      scene.offsetHeight - stage.offsetTop - copy.offsetTop - copy.offsetHeight,
    );
    return Math.abs(Number(scene.dataset.motionExitStart) - (1 + clearance / innerHeight)) < 0.0001;
  });
  const geometry = await scene.evaluate((node) => {
    const stage = node.querySelector("[data-gathering-stage]");
    const copy = node.querySelector("[data-gathering-copy]");
    const top = node.getBoundingClientRect().top + scrollY;
    return {
      start: top + stage.offsetTop + copy.offsetTop + copy.offsetHeight - innerHeight,
      distance: innerHeight * 0.75,
      height: node.getBoundingClientRect().height,
      viewport: innerHeight,
    };
  });
  const snapshot = () =>
    stage.evaluate((node) => ({
      scale: Number(getComputedStyle(node).scale),
      width: node.getBoundingClientRect().width / node.offsetWidth,
      height: node.getBoundingClientRect().height / node.offsetHeight,
      radius: Number.parseFloat(getComputedStyle(node).borderTopLeftRadius),
      copyBottom: node.querySelector("[data-gathering-copy]").getBoundingClientRect().bottom,
    }));
  const move = async (progress) => {
    await page.evaluate(
      (top) => window.scrollTo({ top, behavior: "instant" }),
      geometry.start + geometry.distance * progress,
    );
    await page.waitForFunction(
      (expected) =>
        Math.abs(
          Number(
            document.querySelector("#gathering-note").style.getPropertyValue("--scene-progress"),
          ) - expected,
        ) < 0.002,
      Math.max(0, Math.min(1, progress)),
    );
  };
  await move(-0.03);
  const before = await snapshot();
  assert.equal(
    before.scale,
    1,
    "The whole plum section stays full size before the text reaches the bottom",
  );
  assert.ok(
    before.copyBottom > geometry.viewport,
    "The final text/link has not reached the viewport bottom",
  );
  await move(0);
  const start = await snapshot();
  assert.ok(
    Math.abs(start.scale - 1) < 0.0002,
    "Shrinking starts at the text bottom without a jump",
  );
  assert.ok(
    Math.abs(start.copyBottom - geometry.viewport) < 2,
    "The trigger follows the copy rather than the padded section bottom",
  );
  await move(0.5);
  const middle = await snapshot();
  assert.ok(
    middle.scale > 0.94 && middle.scale < 0.96,
    "Native scrolling gradually shrinks the plum section",
  );
  assert.ok(
    Math.abs(middle.width - middle.scale) < 0.001 && Math.abs(middle.height - middle.scale) < 0.001,
    "The entire section scales together in both dimensions",
  );
  assert.ok(middle.radius > 0, "The shrinking section gains rounded corners");
  assert.ok(
    Math.abs(
      (await scene.evaluate((node) => node.getBoundingClientRect().height)) - geometry.height,
    ) < 1,
    "Shrinking preserves the section's natural-flow footprint",
  );
  await page.screenshot({ path: path.join(output, `gathering-shrink-${width}.png`) });
  await move(1);
  assert.ok(
    Math.abs((await snapshot()).scale - 0.9) < 0.0002,
    "The section finishes at ninety percent of its full size",
  );
  await move(-0.03);
  assert.equal((await snapshot()).scale, 1, "Scrolling upward restores the complete plum section");
  await move(0.5);
  await page.keyboard.press("Tab");
  await page.evaluate(() =>
    document.querySelector("[data-gathering-copy] a").focus({ preventScroll: true }),
  );
  await page.keyboard.press("ArrowRight");
  assert.equal((await snapshot()).scale, 1, "Keyboard focus restores the section to full size");
  await page.evaluate(() => document.activeElement.blur());
}

async function showHeaderBelowWordmark(page) {
  await page.waitForFunction(
    () =>
      document.body.style.position !== "fixed" &&
      document.documentElement.style.overflow !== "hidden",
  );
  await page.evaluate(() => document.activeElement?.blur());
  const top = await page
    .locator("[data-landing-wordmark]")
    .evaluate((node) => Math.ceil(node.getBoundingClientRect().bottom + scrollY) + 128);
  await page.evaluate((top) => window.scrollTo({ top: top + 32, behavior: "instant" }), top);
  await page.waitForFunction((top) => Math.abs(scrollY - top - 32) < 1, top);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), top);
  await page.waitForFunction((top) => Math.abs(scrollY - top) < 1, top);
  await page.waitForFunction(
    () => document.querySelector("header[data-scroll-hidden]")?.dataset.scrollHidden === "false",
  );
  await page
    .waitForFunction(
      () => document.querySelector("header[data-scroll-hidden]").getBoundingClientRect().top >= -1,
    )
    .catch(async (error) => {
      const state = await page.evaluate(() => ({
        scroll: scrollY,
        hidden: document.querySelector("header[data-scroll-hidden]")?.dataset.scrollHidden,
        header: document
          .querySelector("header[data-scroll-hidden]")
          ?.getBoundingClientRect()
          .toJSON(),
        wordmark: document
          .querySelector("[data-landing-wordmark]")
          ?.getBoundingClientRect()
          .toJSON(),
        bodyPosition: document.body.style.position,
        focused: document.activeElement?.outerHTML.slice(0, 160),
      }));
      throw new Error(`Header pointer action state: ${JSON.stringify(state)}`, { cause: error });
    });
}

async function assertCategoryMotion(page) {
  const collection = page.locator("[data-category-collection]");
  const stage = page.locator("[data-category-stage]");
  const cards = page.locator("[data-category]");
  const snapshot = () =>
    cards.evaluateAll((links) =>
      links.map((link) => {
        const arch = link.querySelector("[data-category-arch]");
        const frame = arch.getBoundingClientRect();
        const window = arch.parentElement.getBoundingClientRect();
        const cover = link.querySelector("[data-category-cover]").getBoundingClientRect();
        return {
          rise: (frame.top - window.top) / window.height,
          wipe: (cover.top - frame.top) / frame.height,
          zoom: Number(getComputedStyle(arch.querySelector("img")).scale),
          label: Number(getComputedStyle(link.lastElementChild).opacity),
          color: getComputedStyle(link.querySelector("[data-category-cover]")).backgroundColor,
          bottom: window.bottom,
        };
      }),
    );
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await collection.locator("[data-category-arch]").first().waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-category-collection]").getAttribute("data-motion-ready") ===
      "true",
  );
  const geometry = await collection.evaluate((node) => ({
    top: node.getBoundingClientRect().top + scrollY,
    distance: node.getBoundingClientRect().height - innerHeight,
  }));
  const move = async (progress) => {
    await page.evaluate(
      (top) => window.scrollTo({ top, behavior: "instant" }),
      geometry.top + geometry.distance * progress,
    );
    await page.waitForFunction(
      (expected) =>
        Math.abs(
          Number(
            document
              .querySelector("[data-category-collection]")
              .style.getPropertyValue("--scene-progress"),
          ) - expected,
        ) < 0.01,
      progress,
    );
  };
  await move(0);
  assert.equal(
    await stage.evaluate((node) => getComputedStyle(node).position),
    "sticky",
    "The desktop category row stays in view during its sequence",
  );
  const start = await snapshot();
  assert.equal(start.length, 8);
  assert.equal(
    new Set(start.map((card) => card.color)).size,
    8,
    "All eight colored arches have their own palette color",
  );
  assert.ok(
    start.every(
      (card) => card.rise > 0.4 && card.wipe < 0.01 && card.zoom > 1.19 && card.label < 0.01,
    ),
    "The sequence begins with lowered colored arches",
  );
  await page.screenshot({ path: path.join(output, "category-arches-start.png") });
  await move(0.5);
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-category] img")].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  const middle = await snapshot();
  assert.ok(
    middle[0].rise < 0.01 && middle[7].rise > 0.25,
    "Arches rise from left to right with overlapping starts",
  );
  assert.ok(
    middle[0].wipe > 0.99 && middle[7].wipe < 0.05,
    "Leading images uncover before the final color cover moves",
  );
  assert.ok(
    middle[0].zoom < 1.01 && middle[7].zoom > 1.15,
    "Images settle from a zoom as they uncover",
  );
  assert.ok(
    middle[0].label > 0.99 && middle[7].label < 0.1,
    "Labels follow their own image reveal",
  );
  assert.ok(
    Math.abs(await stage.evaluate((node) => node.getBoundingClientRect().top)) < 1,
    "The category composition remains pinned at the viewport top",
  );
  await assertNoOverflow(page, "Desktop category sequence");
  await page.screenshot({ path: path.join(output, "category-arches-middle.png") });
  await cards.last().focus();
  await page.keyboard.press("ArrowRight");
  const focused = (await snapshot())[7];
  assert.ok(
    focused.wipe > 0.99 && focused.label > 0.99,
    "Keyboard focus immediately opens its category artwork and text",
  );
  await page.evaluate(() => document.activeElement.blur());
  await move(1);
  const end = await snapshot();
  assert.ok(
    end.every(
      (card) =>
        Math.abs(card.rise) < 0.01 && card.wipe > 0.99 && card.zoom < 1.01 && card.label > 0.99,
    ),
    "All eight categories finish fully open",
  );
  assert.ok(
    Math.max(...end.map((card) => card.bottom)) - Math.min(...end.map((card) => card.bottom)) < 1,
    "Final arches share the same baseline",
  );
  const fit = await stage.evaluate((node) => ({
    top: node.getBoundingClientRect().top,
    bottom: node.lastElementChild.getBoundingClientRect().bottom,
    viewport: innerHeight,
  }));
  assert.ok(
    fit.top >= -1 && fit.bottom <= fit.viewport + 1,
    "The complete desktop row fits the viewport",
  );
  await page.screenshot({ path: path.join(output, "category-arches-end.png") });
  await move(0);
  assert.ok(
    (await snapshot()).every((card) => card.wipe < 0.01 && card.rise > 0.4),
    "Reverse scrolling restores the colored arches",
  );
  for (const width of [1280, 1920]) {
    await page.setViewportSize({ width, height: 700 });
    const finish = await collection.evaluate(
      (node) => node.getBoundingClientRect().bottom + scrollY - innerHeight,
    );
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), finish);
    await page.waitForFunction(
      () =>
        Number(
          document
            .querySelector("[data-category-collection]")
            .style.getPropertyValue("--scene-progress"),
        ) > 0.99,
    );
    const compactFit = await stage.evaluate((node) => ({
      top: node.getBoundingClientRect().top,
      contentTop: node.firstElementChild.getBoundingClientRect().top,
      contentBottom: node.lastElementChild.getBoundingClientRect().bottom,
      viewport: innerHeight,
    }));
    assert.ok(
      compactFit.contentTop >= -1 && compactFit.contentBottom <= compactFit.viewport + 1,
      `All category labels fit the compact pinned layout at ${width}px: ${JSON.stringify(compactFit)}`,
    );
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  assert.equal(
    await stage.evaluate((node) => getComputedStyle(node).position),
    "static",
    "Phone categories remain in natural page flow",
  );
  const readingCardIndex = 3;
  const readingCard = cards.nth(readingCardIndex);
  const original = await readingCard.evaluate((node) => ({
    href: node.getAttribute("href"),
    artwork: node.querySelector("img").getAttribute("src"),
  }));
  const placeRowCenter = async (fraction) => {
    const top = await readingCard.evaluate((node, fraction) => {
      const rect = node.getBoundingClientRect();
      return scrollY + rect.top + rect.height / 2 - innerHeight * fraction;
    }, fraction);
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), top);
    await page.waitForFunction(
      ({ index, fraction }) => {
        const node = document.querySelectorAll("[data-category]")[index];
        const rect = node.getBoundingClientRect();
        return Math.abs(rect.top + rect.height / 2 - innerHeight * fraction) < 1;
      },
      { index: readingCardIndex, fraction },
    );
  };
  const waitForReadingState = (complete) =>
    page.waitForFunction(
      ({ index, complete }) => {
        const node = document.querySelectorAll("[data-category]")[index];
        const label = Number(getComputedStyle(node.lastElementChild).opacity);
        return complete ? label > 0.99 : label < 0.01;
      },
      { index: readingCardIndex, complete },
    );
  await placeRowCenter(0.85);
  await waitForReadingState(false);
  const entering = (await snapshot())[readingCardIndex];
  assert.ok(
    entering.wipe < 0.99 && entering.label < 0.01,
    "A mobile row near the bottom still shows its colored reveal instead of finishing immediately",
  );
  await placeRowCenter(0.67);
  await waitForReadingState(true);
  const phone = await snapshot();
  const reading = phone[readingCardIndex];
  assert.ok(
    Math.abs(reading.rise) < 0.01 &&
      reading.wipe > 0.99 &&
      reading.zoom < 1.01 &&
      reading.label > 0.99,
    `Mobile artwork and copy finish one third up from the viewport bottom: ${JSON.stringify(reading)}`,
  );
  assert.ok(
    reading.wipe > phone[7].wipe && reading.label > phone[7].label,
    "Later phone rows retain their own reveal timing",
  );
  assert.deepEqual(
    await readingCard.evaluate((node) => ({
      href: node.getAttribute("href"),
      artwork: node.querySelector("img").getAttribute("src"),
    })),
    original,
    "The earlier reveal preserves the original artwork and gallery destination",
  );
  await placeRowCenter(0.85);
  await waitForReadingState(false);
  const reversed = (await snapshot())[readingCardIndex];
  assert.ok(
    reversed.wipe < 0.99 && reversed.label < 0.01,
    "Reverse scrolling restores the phone row's colored cover and hides its label",
  );
  await placeRowCenter(0.67);
  await waitForReadingState(true);
  await assertNoOverflow(page, "Phone category reveals");
  await page.screenshot({ path: path.join(output, "category-arches-phone.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => !document.querySelector("[data-category-collection]").hasAttribute("data-motion-ready"),
  );
  assert.ok(
    (await snapshot()).every(
      (card) => Math.abs(card.rise) < 0.01 && card.wipe > 0.99 && card.label > 0.99,
    ),
    "Live reduced motion immediately opens every category",
  );
  await page.setViewportSize({ width: 1920, height: 900 });
  assert.equal(await stage.evaluate((node) => getComputedStyle(node).position), "static");
  assert.ok(
    await collection.evaluate((node) => node.getBoundingClientRect().height < innerHeight * 1.5),
    "Reduced motion removes the long desktop scroll space",
  );
  await page.setViewportSize({ width: 1920, height: 650 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() =>
    document.querySelector("[data-category-collection]").hasAttribute("data-motion-ready"),
  );
  assert.equal(
    await stage.evaluate((node) => getComputedStyle(node).position),
    "static",
    "Short desktop windows use the fully open flowing layout",
  );
  assert.ok((await snapshot()).every((card) => card.wipe > 0.99 && card.label > 0.99));
}

async function mosaicSnapshot(page) {
  return page.locator("[data-art-mosaic]").evaluate((section) => {
    const grid = section.querySelector("[data-mosaic-grid]");
    const board = grid.getBoundingClientRect();
    return {
      columns: getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length,
      board: { left: board.left, right: board.right, top: board.top, bottom: board.bottom },
      tiles: [...grid.querySelectorAll("[data-mosaic-tile]")].map((tile) => {
        const content = tile.firstElementChild;
        const bounds = content.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height,
          opacity: Number(getComputedStyle(tile).opacity),
          contentOpacity: Number(getComputedStyle(content).opacity),
          typeText: content.matches("a")
            ? null
            : {
                area: tile.dataset.mosaicTile,
                scrollWidth: content.scrollWidth,
                clientWidth: content.clientWidth,
                blocks: [...content.querySelectorAll("p, span")].map((block) => {
                  const textBounds = block.getBoundingClientRect();
                  return {
                    text: block.textContent.trim(),
                    tag: block.tagName.toLowerCase(),
                    left: textBounds.left,
                    right: textBounds.right,
                    top: textBounds.top,
                    bottom: textBounds.bottom,
                    scrollWidth: block.scrollWidth,
                    clientWidth: block.clientWidth,
                  };
                }),
              },
        };
      }),
    };
  });
}

async function assertMosaicLayout(page, width, label) {
  const mosaic = page.locator("[data-art-mosaic]");
  assert.equal(await mosaic.locator("[data-mosaic-tile]").count(), 12);
  const links = mosaic.locator("[data-collage-card]");
  assert.equal(await links.count(), 7, `${label}: every occasion remains available`);
  assert.deepEqual(
    (await links.evaluateAll((cards) => cards.map((card) => card.getAttribute("href")))).sort(),
    [
      "/birthdays/templates",
      "/baby-showers/templates",
      "/bridal-showers/templates",
      "/weddings/templates",
      "/sport-events/templates",
      "/gender-reveal/templates",
      "/signup-forms/templates",
    ].sort(),
  );
  for (const link of await links.all())
    assert.equal(await link.isVisible(), true, `${label}: no artwork link is hidden`);
  const layout = await mosaicSnapshot(page);
  assert.equal(layout.columns, width >= 1100 ? 6 : width >= 600 ? 3 : 2, label);
  for (const [index, tile] of layout.tiles.entries()) {
    assert.ok(
      tile.width >= 44 &&
        tile.height >= 44 &&
        tile.left >= layout.board.left - 1 &&
        tile.right <= layout.board.right + 1 &&
        tile.top >= layout.board.top - 1 &&
        tile.bottom <= layout.board.bottom + 1 &&
        tile.opacity > 0.99 &&
        tile.contentOpacity > 0.99,
      `${label}: tile ${index + 1} is complete inside the grid: ${JSON.stringify(tile)}`,
    );
    if (tile.typeText) {
      assert.ok(
        tile.typeText.scrollWidth <= tile.typeText.clientWidth + 1,
        `${label}: ${tile.typeText.area} typography does not overflow its card horizontally`,
      );
      assert.ok(tile.typeText.blocks.length > 0, "Typography cards retain visible semantic text");
      for (const block of tile.typeText.blocks) {
        // Serif glyphs can overhang their own line box. They must still fit
        // inside the enclosing tile, including its available padding.
        const horizontalOverhang = Math.max(0, block.scrollWidth - block.clientWidth);
        assert.ok(
          block.left - horizontalOverhang >= tile.left - 1 &&
            block.right + horizontalOverhang <= tile.right + 1 &&
            block.top >= tile.top - 1 &&
            block.bottom <= tile.bottom + 1,
          `${label}: ${tile.typeText.area} text fits within its tile: ${JSON.stringify(block)}`,
        );
      }
    }
    for (const [otherIndex, other] of layout.tiles.entries()) {
      if (otherIndex <= index) continue;
      const overlapX = Math.min(tile.right, other.right) - Math.max(tile.left, other.left);
      const overlapY = Math.min(tile.bottom, other.bottom) - Math.max(tile.top, other.top);
      assert.ok(
        overlapX <= 1 || overlapY <= 1,
        `${label}: final tiles ${index + 1} and ${otherIndex + 1} do not overlap`,
      );
    }
  }
  await assertNoOverflow(page, label);
  return layout;
}

async function assertMosaicMotion(page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  const mosaic = page.locator("[data-art-mosaic]");
  await page.waitForFunction(
    () => document.querySelector("[data-art-mosaic]")?.dataset.motionReady === "true",
  );
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector("[data-art-mosaic]").style.getPropertyValue("--scene-progress"),
      ) < 0.01,
  );
  const initial = await mosaicSnapshot(page);
  const geometry = await mosaic.evaluate((section) => ({
    top: section.getBoundingClientRect().top + scrollY,
    travel: section.getBoundingClientRect().height - innerHeight,
  }));
  assert.ok(geometry.travel > 0, "The desktop mosaic reserves assembly scroll travel");
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    geometry.top + geometry.travel,
  );
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector("[data-art-mosaic]").style.getPropertyValue("--scene-progress"),
      ) > 0.99,
  );
  const final = await assertMosaicLayout(page, 1920, "Desktop mosaic assembly");
  const centerSpread = (tiles) => {
    const centers = tiles.map((tile) => (tile.left + tile.right) / 2);
    return Math.max(...centers) - Math.min(...centers);
  };
  assert.ok(
    centerSpread(initial.tiles) < centerSpread(final.tiles) * 0.6,
    "Desktop tiles assemble from a compact central stack into the full mosaic",
  );
  await page.screenshot({ path: path.join(output, "mosaic-desktop-final.png") });
  await page.setViewportSize({ width: 1920, height: 700 });
  const compactFinish = await mosaic.evaluate(
    (section) => section.getBoundingClientRect().bottom + scrollY - innerHeight,
  );
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), compactFinish);
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector("[data-art-mosaic]").style.getPropertyValue("--scene-progress"),
      ) > 0.99,
  );
  const compact = await assertMosaicLayout(page, 1920, "1920 by 700 desktop mosaic");
  assert.ok(
    compact.board.top >= -1 && compact.board.bottom <= 701,
    "The completed mosaic fits the compact desktop viewport",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => !document.querySelector("[data-art-mosaic]").hasAttribute("data-motion-ready"),
  );
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 768, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.fonts.ready);
    await assertMosaicLayout(
      page,
      viewport.width,
      `${viewport.width} by ${viewport.height} reduced-motion mosaic`,
    );
    assert.equal(
      await page.locator("[data-mosaic-stage]").evaluate((node) => getComputedStyle(node).position),
      "static",
      "Reduced-motion phones and tablets retain natural-flow mosaic content",
    );
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.reload();
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => document.querySelector("[data-marketing-page]")?.dataset.motionEnhanced === "true",
  );
  assert.equal(
    await page.locator("[data-mosaic-stage]").evaluate((node) => getComputedStyle(node).position),
    "static",
    "The phone mosaic stays in natural page flow",
  );
  for (const tile of await mosaic.locator("[data-mosaic-tile]").all()) {
    const top = await tile.evaluate((node) => node.getBoundingClientRect().top + scrollY);
    await page.evaluate(
      (top) => window.scrollTo({ top: Math.max(0, top - innerHeight * 0.45), behavior: "instant" }),
      top,
    );
    await tile.waitFor({ state: "visible" });
  }
  await page.waitForFunction(() =>
    [...document.querySelectorAll("[data-mosaic-tile]")].every(
      (tile) =>
        Number(getComputedStyle(tile).opacity) > 0.99 &&
        Number(getComputedStyle(tile.firstElementChild).opacity) > 0.99,
    ),
  );
  await assertMosaicLayout(page, 375, "Phone mosaic reveal");
  await mosaic.screenshot({ path: path.join(output, "mosaic-phone-final.png") });
}

async function assertPageReady(page, scheme, width) {
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.waitForFunction(
    (expected) => document.documentElement.dataset.theme === `general-${expected}`,
    scheme,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => document.querySelector("header[data-scroll-hidden]")?.dataset.scrollHidden === "false",
  );
  await page.waitForFunction(
    () => document.querySelector("header[data-scroll-hidden]").getBoundingClientRect().top >= 0,
  );
  const brand = page.locator("header [data-logo-hidden]");
  assert.equal(
    await brand.getAttribute("data-logo-hidden"),
    "true",
    "Only the small logo starts hidden",
  );
  assert.equal(await brand.evaluate((node) => getComputedStyle(node).opacity), "0");
  await page.waitForFunction(() =>
    [...document.querySelectorAll("#root img")].every(
      (image) =>
        (image.loading === "lazy" && image.getBoundingClientRect().top > innerHeight + 200) ||
        (image.complete && image.naturalWidth > 0),
    ),
  );
  const styles = await page.locator("#landing-hero").evaluate((hero) => ({
    ink: getComputedStyle(hero).color,
    width: hero.getBoundingClientRect().width,
    padding: parseFloat(getComputedStyle(hero).paddingLeft),
    titleSize: parseFloat(getComputedStyle(hero.querySelector("h1")).fontSize),
  }));
  assert.equal(styles.width, width, "The delivered hero fills the viewport width");
  assert.ok(
    styles.padding >= 16 && styles.titleSize >= 30,
    `Hero module CSS loaded: ${JSON.stringify(styles)}`,
  );
  const channels = styles.ink.match(/[\d.]+/g).map(Number);
  assert.equal(channels[0] > 200, scheme === "dark", `Hero ink follows the ${scheme} appearance`);
  assert.ok(
    await page
      .locator("#gathering-note")
      .evaluate((node) => node.getBoundingClientRect().height >= innerHeight - 1),
    `The gathering section fills the ${scheme} ${width}px viewport`,
  );
  assert.equal(
    await page.locator("[data-gathering-stage]").evaluate((node) => getComputedStyle(node).scale),
    "none",
    "Reduced motion presents the complete gathering section without shrinking",
  );
  const headerLogo = page.locator("header").getByRole("img", { name: "Envitefy", exact: true });
  assert.equal(await headerLogo.count(), 1, "The approved logo retains its accessible name");
  const logos = await headerLogo.locator("img").evaluateAll((images) =>
    images.map((image) => ({
      src: image.getAttribute("src"),
      visible: getComputedStyle(image).display !== "none",
      loaded: image.naturalWidth > 0,
    })),
  );
  assert.ok(
    logos.every((logo) => logo.loaded),
    "Both approved wordmark assets actually decode",
  );
  assert.equal(
    logos.filter((logo) => logo.visible).length,
    1,
    `Exactly one approved wordmark layer is visible in ${scheme} appearance`,
  );
  assert.ok(
    logos
      .find((logo) => logo.visible)
      .src.includes(scheme === "dark" ? "wordmark-white.webp" : "wordmark.webp"),
  );
  const eventPaper = await page
    .locator("#landing-guest-preview [data-appearance-scope=authored]")
    .evaluate((card) => ({
      background: getComputedStyle(card).backgroundColor,
      colorScheme: getComputedStyle(card).colorScheme,
    }));
  assert.equal(
    eventPaper.colorScheme,
    "light",
    "The sample invitation keeps its authored appearance",
  );
  assert.equal(eventPaper.background, "rgb(255, 252, 247)");
  assert.equal(await page.locator("[data-category]").count(), 8);
  assert.equal(
    await page.getByRole("button", { name: "Install", exact: true }).count(),
    0,
    "First-time landing content stays free of the install prompt",
  );
  for (const id of [
    "landing-hero",
    "how-it-works",
    "examples",
    "categories",
    "guest-flow",
    "showcase",
    "creation-paths",
  ]) {
    assert.equal(
      await page.locator(`[id="${id}"]`).count(),
      1,
      `The ${id} anchor exists before deferred content opens`,
    );
  }
  const createTarget = await page
    .locator("#landing-hero")
    .getByRole("button", { name: "Create your event", exact: true })
    .boundingBox();
  assert.ok(
    createTarget.height >= 44 && createTarget.width >= 44,
    `Create retains a 44px target at ${width}px`,
  );
  await assertNoOverflow(page, `${scheme} ${width}px initial`);
}

async function assertLandingCtas(page, scheme, width) {
  const actions = [
    ["#landing-hero", "button", "Create your event"],
    ["#landing-hero", "link", "See an example", "#showcase"],
    ["#gathering-note", "link", "Find your kind of gathering", "#examples"],
    ["#landing-guest-preview", "link", "See how it comes together", "#how-it-works"],
    ['nav[aria-label="Find your event type"]', "link", "Explore all", "#examples"],
    ["#how-it-works", "link", "See an example", "#showcase"],
    ["#guest-flow", "link", "Explore the guest experience", "#showcase"],
    ["[data-landing-faq]", "button", "Ask Concierge"],
    ["[data-landing-faq]", "link", "Visit our FAQ", "/faq"],
    ["#creation-paths", "button", "Create your event"],
  ];
  for (const [scope, role, label, href] of actions) {
    await assertArrowFillCta(page.locator(scope).getByRole(role, { name: label, exact: true }), {
      label,
      href,
      description: `Homepage ${scheme} ${width}px ${scope} ${label}`,
    });
  }
  const hero = page.locator("#landing-hero");
  assert.equal(
    await hero.locator("[data-arrow-fill-button]").count(),
    2,
    "The homepage hero applies the login effect to both original actions",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [role, label] of [
    ["button", "Create your event"],
    ["link", "See an example"],
  ]) {
    const cta = hero.getByRole(role, { name: label, exact: true });
    await assertArrowFillInteraction(page, cta, `Homepage ${scheme} ${width}px ${label}`);
    await assertArrowFillReducedMotion(page, cta, `Homepage ${scheme} ${width}px ${label}`);
    await hero.screenshot({
      path: path.join(
        output,
        `cta-${scheme}-${width === 375 ? "mobile" : "desktop"}-${role === "button" ? "create" : "example"}-hover.png`,
      ),
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await hero.getByRole("button", { name: "Create your event", exact: true }).focus();
  await hero.screenshot({
    path: path.join(output, `cta-${scheme}-${width === 375 ? "mobile" : "desktop"}-hero.png`),
  });
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.mouse.move(0, 0);
}

async function assertGuestBenefits(page, scheme, width) {
  const section = page.locator("#guest-flow");
  const cards = section.locator("article[data-guest-benefit]");
  assert.equal(await cards.count(), 4, "All four guest benefits remain available");
  assert.deepEqual(await cards.getByRole("heading", { level: 3 }).allTextContents(), [
    "Know who’s coming.",
    "Everyone brings something.",
    "Get everyone there.",
    "Share the planning.",
  ]);
  const heading = await section.locator("h2 strong").evaluate((node) => ({
    text: node.textContent,
    weight: Number(getComputedStyle(node).fontWeight),
    style: getComputedStyle(node).fontStyle,
  }));
  assert.deepEqual(heading, { text: "More celebrating.", weight: 700, style: "normal" });
  const layout = await cards.evaluateAll((articles) => ({
    columns: getComputedStyle(articles[0].parentElement).gridTemplateColumns.split(/\s+/).length,
    cards: articles.map((article) => {
      const tile = article.firstElementChild;
      const bounds = tile.getBoundingClientRect();
      const style = getComputedStyle(tile);
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        color: style.backgroundColor,
        opacity: Number(getComputedStyle(article).opacity),
        rotate: style.rotate,
        scale: style.scale,
        transitions: style.transitionDuration,
        fits: tile.scrollWidth <= tile.clientWidth + 1,
      };
    }),
  }));
  assert.equal(layout.columns, width >= 1100 ? 4 : 1);
  assert.equal(
    new Set(layout.cards.map((card) => card.color)).size,
    4,
    "Each benefit has its own color",
  );
  assert.ok(
    layout.cards.every((card) => card.left >= -1 && card.right <= width + 1 && card.fits),
    `Benefit artwork and copy fit the ${scheme} ${width}px viewport: ${JSON.stringify(layout)}`,
  );
  if (width >= 1100) {
    assert.ok(Math.abs(layout.cards[0].top - layout.cards[2].top) < 1);
    assert.ok(Math.abs(layout.cards[1].top - layout.cards[3].top) < 1);
    assert.ok(
      layout.cards[1].top - layout.cards[0].top >= 32,
      "Alternating desktop cards sit lower",
    );
    assert.ok(
      layout.cards.every((card, index) => index === 0 || card.left > layout.cards[index - 1].right),
      "Desktop cards keep their four-column reading order",
    );
  } else {
    assert.ok(
      layout.cards.every(
        (card, index) => index === 0 || card.top >= layout.cards[index - 1].bottom,
      ),
      "Phone cards follow the same content order in a single column",
    );
  }
  assert.ok(
    layout.cards.every(
      (card) => card.opacity === 1 && card.rotate === "none" && card.scale === "none",
    ),
    "Reduced motion shows every benefit immediately without rotated or scaled cards",
  );
  assert.ok(
    layout.cards.every((card) =>
      card.transitions.split(",").every((value) => Number.parseFloat(value) === 0),
    ),
  );
  await assertNoOverflow(page, `${scheme} ${width}px guest benefits`);
}

async function exerciseQuestions(page, scheme, width) {
  const section = page.locator("[data-landing-faq]");
  const questions = section.locator("details");
  const summaries = questions.locator("summary");
  assert.equal(await questions.count(), 12, "Twelve practical questions remain native disclosures");
  const heading = await section.locator("#faq-heading strong").evaluate((node) => ({
    text: node.textContent,
    weight: Number(getComputedStyle(node).fontWeight),
    style: getComputedStyle(node).fontStyle,
  }));
  assert.deepEqual(heading, { text: "questions.", weight: 700, style: "normal" });
  const toggleState = (summary) =>
    summary.evaluate((node) => {
      const toggle =
        node.querySelector("[data-faq-toggle]") || node.querySelector('[aria-hidden="true"]');
      if (!toggle) throw new Error("Question disclosure has no visible plus/minus indicator");
      const bounds = toggle.getBoundingClientRect();
      const before = getComputedStyle(toggle, "::before");
      const after = getComputedStyle(toggle, "::after");
      return {
        width: bounds.width,
        height: bounds.height,
        before: [before.transform, before.rotate, before.scale, before.opacity, before.content],
        after: [after.transform, after.rotate, after.scale, after.opacity, after.content],
      };
    });
  for (let index = 0; index < (await questions.count()); index++) {
    const summary = summaries.nth(index);
    const detail = questions.nth(index);
    await summary.scrollIntoViewIfNeeded();
    await summary.focus();
    const closed = await toggleState(summary);
    assert.ok(
      closed.width >= 44 && closed.height >= 44,
      `Question ${index + 1} has a 44px disclosure indicator at ${width}px`,
    );
    assert.equal(await detail.getAttribute("open"), null);
    await page.keyboard.press("Space");
    assert.equal(await detail.getAttribute("open"), "", "Space opens the native answer");
    assert.equal(await detail.locator("p").isVisible(), true);
    const opened = await toggleState(summary);
    assert.notDeepEqual(
      [opened.before, opened.after],
      [closed.before, closed.after],
      "The plus changes into a minus when the answer opens",
    );
    await page.keyboard.press("Enter");
    assert.equal(await detail.getAttribute("open"), null, "Enter closes the native answer");
    assert.equal(await detail.locator("p").isVisible(), false);
  }
  assert.equal(await section.getByRole("link", { name: /FAQ/ }).getAttribute("href"), "/faq");
  await section.getByRole("button", { name: /Ask Concierge/ }).click();
  const concierge = page.getByRole("dialog", { name: "Envitefy Concierge", exact: true });
  await concierge.waitFor();
  await concierge.getByRole("button", { name: "Close Envitefy Concierge", exact: true }).click();
  await concierge.waitFor({ state: "hidden" });
  await assertNoOverflow(page, `${scheme} ${width}px questions and answers`);
}

async function exerciseFeedback(page, scheme, width) {
  const section = page.locator("[data-landing-testimonials]");
  const track = section.locator("[data-feedback-track]");
  const cards = track.locator("[data-feedback-card]");
  const previous = section.getByRole("button", { name: "Previous feedback", exact: true });
  const next = section.getByRole("button", { name: "Next feedback", exact: true });
  assert.equal(await cards.count(), 24, "All 24 existing guest and host voices remain available");
  assert.equal(
    await section.locator("img").count(),
    0,
    "Feedback uses its original written attributions",
  );
  assert.equal(
    await track.getAttribute("tabindex"),
    "0",
    "The native scroller accepts keyboard focus",
  );
  assert.equal(
    await section.evaluate((node) => {
      const questions = document.querySelector("[data-landing-faq]");
      return Boolean(questions?.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
    }),
    true,
    "Practical questions appear before the editorial feedback section",
  );
  for (const name of ["number", "ribbon"]) {
    const decoration = section.locator(`[data-feedback-${name}]`);
    assert.ok(await decoration.count(), `The editorial feedback keeps its decorative ${name}`);
    assert.equal(
      await decoration.evaluateAll((nodes) =>
        nodes.every((node) => node.getAttribute("aria-hidden") === "true"),
      ),
      true,
      `The decorative ${name} does not repeat content to assistive technology`,
    );
  }
  await track.scrollIntoViewIfNeeded();
  const layout = await track.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const cards = [...node.querySelectorAll("[data-feedback-card]")].map((card) => {
      const rect = card.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        fits:
          card.scrollWidth <= card.clientWidth + 1 && card.scrollHeight <= card.clientHeight + 1,
        quote: card.querySelector("blockquote")?.textContent.trim(),
      };
    });
    return {
      left: bounds.left,
      right: bounds.right,
      scroll: node.scrollLeft,
      overflow: style.overflowX,
      snap: style.scrollSnapType,
      behavior: style.scrollBehavior,
      cards,
    };
  });
  assert.equal(layout.overflow, "auto", "The feedback list uses native horizontal scrolling");
  assert.match(layout.snap, /^x /, "Cards settle into native horizontal snap positions");
  assert.equal(layout.behavior, "auto", "Reduced motion keeps manual movement immediate");
  assert.equal(
    layout.cards.filter((card) => card.left >= layout.left - 1 && card.right <= layout.right + 1)
      .length,
    1,
    `The ${width}px editorial feedback track shows one complete quote`,
  );
  assert.ok(
    layout.cards.every((card) => card.fits && card.quote),
    "Every quote fits its card without clipping",
  );
  assert.equal(
    new Set(layout.cards.map((card) => card.quote)).size,
    24,
    "The scroller contains no repeated filler quotes",
  );
  for (const button of [previous, next]) {
    const bounds = await button.boundingBox();
    assert.ok(bounds.width >= 44 && bounds.height >= 44, "Feedback arrows retain 44px targets");
  }
  const readout = section.locator("[data-feedback-position]");
  const firstReadout = await readout.textContent();
  assert.equal(await previous.isDisabled(), true);
  await next.click();
  await page.waitForFunction(() => document.querySelector("[data-feedback-track]").scrollLeft > 1);
  await page.waitForFunction(
    (first) => document.querySelector("[data-feedback-position]").textContent !== first,
    firstReadout,
  );
  assert.equal(await previous.isEnabled(), true);
  await previous.click();
  await page.waitForFunction(() => document.querySelector("[data-feedback-track]").scrollLeft < 1);
  await track.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.querySelector("[data-feedback-track]").scrollLeft > 1);
  await page.keyboard.press("End");
  await page.waitForFunction(() => {
    const node = document.querySelector("[data-feedback-track]");
    return node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
  });
  await page.waitForFunction(() => document.querySelector('[aria-label="Next feedback"]').disabled);
  assert.equal(await next.isDisabled(), true, "The last quote has a clear end state");
  const last = await cards.last().boundingBox();
  const bounds = await track.boundingBox();
  assert.ok(last.x >= bounds.x - 1 && last.x + last.width <= bounds.x + bounds.width + 1);
  await page.keyboard.press("Home");
  await page.waitForFunction(() => document.querySelector("[data-feedback-track]").scrollLeft < 1);
  await page.waitForFunction(
    () => document.querySelector("[data-feedback-position]").textContent.trim() === "01 / 24",
  );
  await track.evaluate((node) => node.scrollTo({ left: node.scrollWidth, behavior: "instant" }));
  await page.waitForFunction(() => {
    const node = document.querySelector("[data-feedback-track]");
    return node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
  });
  await page.waitForFunction(() => document.querySelector('[aria-label="Next feedback"]').disabled);
  assert.equal(await next.isDisabled(), true, "Manual scrolling synchronizes the arrow state");
  await track.evaluate((node) => node.scrollTo({ left: 0, behavior: "instant" }));
  await page.waitForFunction(() => document.querySelector("[data-feedback-track]").scrollLeft < 1);

  const waitForFeedback = async (index, description) => {
    await page.waitForFunction((expected) => {
      const node = document.querySelector("[data-feedback-track]");
      const card = node?.querySelectorAll("[data-feedback-card]")[expected];
      const position = document.querySelector("[data-feedback-position]")?.textContent.trim();
      const number = document.querySelector("[data-feedback-number]")?.textContent.trim();
      return (
        card &&
        Math.abs(card.getBoundingClientRect().left - node.getBoundingClientRect().left) < 1 &&
        position === `${String(expected + 1).padStart(2, "0")} / 24` &&
        number === String(expected + 1).padStart(2, "0")
      );
    }, index);
    assert.equal(
      (await readout.textContent()).trim(),
      `${String(index + 1).padStart(2, "0")} / 24`,
      description,
    );
  };
  const clickQuickly = async (button, count) => {
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    for (let index = 0; index < count; index += 1) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(65);
    }
  };
  await page.emulateMedia({ reducedMotion: "no-preference" });
  try {
    await waitForFeedback(0, "Smooth-motion navigation starts on the first quote");
    await clickQuickly(next, 4);
    await waitForFeedback(4, "Four rapid Next clicks advance four quotes during smooth scrolling");
    await track.focus();
    await page.keyboard.press("Home");
    await waitForFeedback(0, "Home returns the smooth-motion carousel to its first quote");
    for (let index = 0; index < 4; index += 1) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(65);
    }
    await waitForFeedback(4, "Four rapid ArrowRight presses advance four quotes");
    await page.keyboard.press("Home");
    await waitForFeedback(0, "Direction-reversal coverage starts on the first quote");
    await clickQuickly(next, 4);
    await clickQuickly(previous, 2);
    await waitForFeedback(2, "Two rapid Previous clicks reverse a pending four-quote advance");

    await track.hover({ position: { x: 24, y: 24 } });
    const quoteStep = await track.evaluate((node) => {
      const items = node.querySelectorAll("[data-feedback-card]");
      return items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
    });
    await page.mouse.wheel(quoteStep, 0);
    await waitForFeedback(3, "A native horizontal wheel gesture synchronizes the active quote");
    await next.click();
    await waitForFeedback(4, "Next advances from the manually scrolled quote");
  } finally {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await track.focus();
    await page.keyboard.press("Home");
    await waitForFeedback(
      0,
      "Reduced motion and the first quote are restored after navigation checks",
    );
  }
  await assertNoOverflow(page, `${scheme} ${width}px feedback scroller`);
}

async function exerciseSample(page) {
  const hero = page.locator("#landing-guest-preview");
  const rsvp = hero.getByRole("button", { name: "RSVP to the brunch", exact: true });
  await rsvp.click();
  assert.equal(await rsvp.getAttribute("aria-expanded"), "true");
  await hero.getByRole("button", { name: "Going", exact: true }).click();
  assert.equal(
    await hero.getByRole("button", { name: "Going", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  assert.match(
    await hero.getByRole("status").textContent(),
    /Sample reply: Going\. Nothing has been sent\./,
  );
  await hero.getByRole("button", { name: "Close sample details", exact: true }).click();
  assert.equal(await page.locator("#landing-sample-action").isVisible(), false);
  await hero.getByRole("button", { name: "Directions", exact: true }).click();
  assert.match(
    await page.locator("#landing-sample-action").textContent(),
    /sample venue is illustrative/,
  );
  await hero.getByRole("button", { name: "Close sample details", exact: true }).click();
  await hero.getByRole("button", { name: "Add to calendar", exact: true }).click();
  assert.match(
    await page.locator("#landing-sample-action").textContent(),
    /date, time and location to their calendar/,
  );
  await hero.getByRole("button", { name: "Close sample details", exact: true }).click();
}

async function exerciseAuthentication(page) {
  await page
    .locator("#landing-hero")
    .getByRole("button", { name: "Create your event", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Create an account", exact: true });
  await dialog.waitFor();
  assert.equal(
    await page.locator("header[data-scroll-hidden]").getAttribute("data-scroll-hidden"),
    "false",
    "The account dialog keeps navigation available over the hero",
  );
  assert.equal(await dialog.locator("form").getAttribute("data-auth-redirect"), "/create");
  await dialog.getByRole("button", { name: "Create account", exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.__landingProductAuth), [
    { mode: "signup", redirect: "/create" },
  ]);
  await dialog.getByRole("button", { name: "Switch to login", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Log in", exact: true });
  assert.equal(
    await dialog.locator("form").getAttribute("data-auth-redirect"),
    "/create",
    "The creation destination survives a mode switch",
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await showHeaderBelowWordmark(page);
  const headerCreate = page
    .locator("header")
    .getByRole("button", { name: "Let's create", exact: true });
  if (await headerCreate.isVisible()) {
    await headerCreate.click();
  } else {
    await page
      .locator("#creation-paths")
      .getByRole("button", { name: "Create your event", exact: true })
      .click();
  }
  dialog = page.getByRole("dialog", { name: "Create an account", exact: true });
  assert.equal(
    await dialog.locator("form").getAttribute("data-auth-redirect"),
    "/create",
    "The desktop header or phone closing creation action opens signup with the creation destination",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
}

async function exerciseConcierge(page, scheme, width) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const launcher = page.getByRole("button", { name: "Open Envitefy Concierge", exact: true });
  assert.equal(await launcher.isVisible(), true, "Concierge is available directly on the hero");
  assert.equal(
    await page.locator("[data-mobile-bottom-nav]").count(),
    0,
    "the retired bottom bar is absent",
  );
  await launcher.screenshot({
    path: path.join(output, `${scheme}-${width}-concierge-launcher.png`),
  });
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Envitefy Concierge", exact: true });
  await dialog.waitFor();
  assert.equal(
    await page.locator("header[data-scroll-hidden]").getAttribute("data-scroll-hidden"),
    "false",
    "The open Concierge keeps navigation available while the display wordmark is visible",
  );
  const bounds = await dialog.boundingBox();
  if (width >= 768) {
    assert.equal(bounds.width, 384, "Desktop Concierge retains its compact width");
    assert.equal(width - bounds.x - bounds.width, 24, "Desktop Concierge opens at the right edge");
    assert.ok(bounds.height <= 620, "Desktop Concierge stays within its corner panel height");
  }
  if (scheme === "dark") {
    const colors = await dialog.evaluate((node) => {
      const color = (element) => getComputedStyle(element).backgroundColor;
      return {
        panel: color(node),
        messages: color(node.querySelector('[aria-live="polite"]')),
        starter: color(
          [...node.querySelectorAll("button")].find((button) =>
            button.textContent.includes("What can I make"),
          ),
        ),
        composer: color(node.querySelector("form")),
      };
    });
    assert.equal(
      colors.panel,
      "rgb(37, 31, 45)",
      "The entire Concierge panel follows dark appearance",
    );
    assert.equal(colors.messages, "rgb(37, 31, 45)");
    assert.equal(colors.starter, "rgb(48, 39, 56)");
    assert.equal(colors.composer, "rgb(56, 45, 66)");
  }
  const title = await dialog
    .getByRole("heading", { name: "Envitefy Concierge" })
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        size: parseFloat(style.fontSize),
        height: node.getBoundingClientRect().height,
        width: node.clientWidth,
        scrollWidth: node.scrollWidth,
        headerHeight: node.closest("header").getBoundingClientRect().height,
      };
    });
  assert.ok(
    title.size <= 16 && title.height <= 24,
    `Concierge title stays compact under landing typography: ${JSON.stringify(title)}`,
  );
  assert.ok(title.scrollWidth <= title.width, "The complete Concierge title fits without clipping");
  assert.ok(title.headerHeight <= 76, "The Concierge header leaves room for the conversation");
  const close = dialog.getByRole("button", { name: "Close Envitefy Concierge", exact: true });
  const target = await close.boundingBox();
  assert.ok(
    target.width >= 44 && target.height >= 44,
    "The compact header keeps a 44px close target",
  );
  await dialog.screenshot({ path: path.join(output, `${scheme}-${width}-concierge.png`) });
  await close.click();
  await dialog.waitFor({ state: "hidden" });
  await launcher.click();
  await dialog.waitFor();
  await page.mouse.click(24, 20);
  await dialog.waitFor({ state: "hidden" });
}

async function assertFooterClearance(page, scheme, width) {
  const footer = page.locator('[data-app-footer="marketing"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Open Envitefy Concierge", exact: true }).waitFor();
  const initialPadding = await footer.evaluate((node) =>
    parseFloat(getComputedStyle(node).paddingBottom),
  );
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(
    () => Math.abs(innerHeight + scrollY - document.documentElement.scrollHeight) <= 1,
  );
  const result = await footer.evaluate((node) => {
    const launcher = document.querySelector("[data-concierge-launcher]");
    const launcherBounds = launcher.querySelector("button").getBoundingClientRect();
    const utility = node.querySelector(":scope > div > div:last-child");
    const controls = [...utility.querySelectorAll("a, button")].map((control) => {
      const rect = control.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        label: control.textContent.trim(),
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        receivesPointer: hit === control || control.contains(hit),
        overlapsLauncher:
          rect.left < launcherBounds.right &&
          rect.right > launcherBounds.left &&
          rect.top < launcherBounds.bottom &&
          rect.bottom > launcherBounds.top,
      };
    });
    const padding = parseFloat(getComputedStyle(node).paddingBottom);
    const marker = launcher.getAttribute("data-concierge-launcher");
    launcher.removeAttribute("data-concierge-launcher");
    const paddingWithoutLauncher = parseFloat(getComputedStyle(node).paddingBottom);
    launcher.setAttribute("data-concierge-launcher", marker);
    return { controls, padding, paddingWithoutLauncher, viewportHeight: innerHeight };
  });
  assert.equal(result.padding, initialPadding, "Hero visibility does not change footer clearance");
  assert.equal(
    result.paddingWithoutLauncher,
    0,
    "Pages without the Concierge launcher have no extra footer clearance",
  );
  assert.equal(
    result.padding,
    0,
    "The retired bottom navigation leaves no extra strip below the copyright links",
  );
  assert.equal(
    result.controls.length,
    7,
    "All footer utility links and privacy choices are checked",
  );
  for (const control of result.controls) {
    assert.ok(
      control.width > 0 &&
        control.height > 0 &&
        control.top >= 0 &&
        control.bottom <= result.viewportHeight &&
        !control.overlapsLauncher,
      `${scheme} ${width}px footer control clears the Concierge launcher: ${JSON.stringify(control)}`,
    );
    assert.ok(
      control.receivesPointer,
      `${scheme} ${width}px footer control receives its center pointer: ${control.label}`,
    );
  }
  await footer.screenshot({ path: path.join(output, `${scheme}-${width}-footer.png`) });
}

test("shared RSVP glow follows one canvas across cards and gaps while preserving touch scrolling", {
  timeout: 60000,
}, async () => {
  const css = await buildFixture("benefits-entry.tsx");
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  try {
    for (const scheme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        colorScheme: scheme,
        reducedMotion: "no-preference",
      });
      const unexpected = [];
      await serveContext(context, css, unexpected);
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(base);
        const canvas = page.locator("[data-benefit-canvas]");
        const cards = canvas.locator("[data-benefit-card]");
        await canvas.scrollIntoViewIfNeeded();
        await page.waitForFunction(
          () => document.querySelector("[data-benefit-canvas]").dataset.glowMode === "pointer",
        );
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() =>
          [...document.querySelectorAll("[data-benefit-card]")].every(
            (card) =>
              card.parentElement.dataset.motionVisible !== "false" &&
              [...card.getAnimations(), ...card.parentElement.getAnimations()].every(
                (animation) => animation.playState !== "running",
              ),
          ),
        );
        const bounds = await cards.evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
          }),
        );
        const y = Math.max(bounds[0].top, bounds[1].top) + 120;
        for (const x of [
          bounds[0].right - 40,
          (bounds[0].right + bounds[1].left) / 2,
          bounds[1].left + 80,
        ]) {
          await page.mouse.move(x, y);
          await page.waitForFunction(
            ({ x, y }) => {
              const canvas = document.querySelector("[data-benefit-canvas]");
              const rect = canvas.getBoundingClientRect();
              return (
                canvas.dataset.glowActive === "true" &&
                Math.abs(parseFloat(canvas.style.getPropertyValue("--glow-x")) + rect.left - x) <
                  1 &&
                Math.abs(parseFloat(canvas.style.getPropertyValue("--glow-y")) + rect.top - y) < 1
              );
            },
            { x, y },
          );
          const centers = await cards.evaluateAll((nodes) =>
            nodes.map((node) => {
              const rect = node.getBoundingClientRect();
              const style = getComputedStyle(node, "::before");
              const center = style.backgroundImage.match(/at (-?[\d.]+)px (-?[\d.]+)px/);
              return {
                x: center ? rect.left + Number(center[1]) : null,
                y: center ? rect.top + Number(center[2]) : null,
                pointerEvents: style.pointerEvents,
                ownActive: node.hasAttribute("data-glow-active"),
              };
            }),
          );
          assert.ok(
            centers.every(
              (center) =>
                center.x !== null &&
                center.y !== null &&
                Math.abs(center.x - x) < 1 &&
                Math.abs(center.y - y) < 1,
            ),
            `All four cards sample the same light center in ${scheme}: ${JSON.stringify(centers)}`,
          );
          assert.ok(
            centers.every((center) => center.pointerEvents === "none" && !center.ownActive),
          );
        }
        await page.waitForFunction(
          () =>
            getComputedStyle(document.querySelector("[data-benefit-card]"), "::before").opacity ===
            "1",
        );
        await canvas.screenshot({ path: path.join(output, `${scheme}-shared-rsvp-glow.png`) });
        const planningCard = cards.nth(3);
        const planningBounds = await planningCard.boundingBox();
        await planningCard.hover({
          position: { x: planningBounds.width * 0.55, y: planningBounds.height - 6 },
        });
        await page.waitForFunction(
          () => document.querySelector("[data-benefit-canvas]").dataset.glowActive === "true",
        );
        const planningRim = await planningCard.evaluate(
          (node) => getComputedStyle(node, "::after").backgroundImage,
        );
        assert.match(planningRim, /rgba?\(72,\s*43,\s*62/);
        assert.match(planningRim, /rgba?\(133,\s*54,\s*82/);
        assert.doesNotMatch(planningRim, /255,\s*246,\s*244/);
        await planningCard.screenshot({
          path: path.join(output, `${scheme}-shared-rsvp-planning-rim.png`),
        });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(
          () => !document.querySelector("[data-benefit-canvas]").hasAttribute("data-glow-active"),
        );
        assert.equal(await canvas.getAttribute("data-glow-mode"), null);
        await page.mouse.move(bounds[1].left + 100, y);
        assert.equal(await canvas.getAttribute("data-glow-active"), null);
        assert.equal(
          await cards.first().evaluate((node) => getComputedStyle(node, "::before").opacity),
          "0",
        );
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        await cards.nth(1).hover({ position: { x: 120, y: 120 } });
        await page.waitForFunction(
          () => document.querySelector("[data-benefit-canvas]").dataset.glowActive === "true",
        );
        await page.mouse.move(1, 1);
        await page.waitForFunction(
          () => !document.querySelector("[data-benefit-canvas]").hasAttribute("data-glow-active"),
        );
        assert.equal(await canvas.evaluate((node) => node.style.getPropertyValue("--glow-x")), "");
        assert.deepEqual(errors, []);
        assert.deepEqual(unexpected, []);
      } finally {
        await context.close();
      }
    }

    for (const scheme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width: 375, height: 850 },
        colorScheme: scheme,
        isMobile: true,
        hasTouch: true,
        reducedMotion: "no-preference",
      });
      try {
        const unexpected = [];
        await serveContext(context, css, unexpected);
        const page = await context.newPage();
        page.setDefaultTimeout(7000);
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(base);
        const canvas = page.locator("[data-benefit-canvas]");
        const card = canvas.locator("[data-benefit-card]").first();
        await card.scrollIntoViewIfNeeded();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => {
          const canvas = document.querySelector("[data-benefit-canvas]");
          return (
            canvas.dataset.glowMode === "scroll" &&
            canvas.dataset.glowActive === "true" &&
            Math.abs(
              parseFloat(canvas.style.getPropertyValue("--glow-y")) +
                canvas.getBoundingClientRect().top -
                innerHeight * 0.58,
            ) < 1
          );
        });
        const initial = await canvas.evaluate((node) => ({
          scroll: scrollY,
          x: parseFloat(node.style.getPropertyValue("--glow-x")),
          y: parseFloat(node.style.getPropertyValue("--glow-y")),
        }));
        const box = await card.boundingBox();
        const startY = Math.min(750, box.y + box.height - 40);
        const session = await context.newCDPSession(page);
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: 187, y: startY }],
        });
        for (let step = 1; step <= 6; step++) {
          await session.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: 187, y: startY - step * 30 }],
          });
        }
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.waitForFunction((initial) => scrollY > initial + 40, initial.scroll);
        await page.waitForFunction((initial) => {
          const canvas = document.querySelector("[data-benefit-canvas]");
          return (
            canvas.dataset.glowActive === "true" &&
            parseFloat(canvas.style.getPropertyValue("--glow-y")) > initial.y + 40 &&
            Math.abs(parseFloat(canvas.style.getPropertyValue("--glow-x")) - initial.x) > 0.1
          );
        }, initial);
        const sharedCenters = await canvas.evaluate((canvas) => {
          const bounds = canvas.getBoundingClientRect();
          const x = parseFloat(canvas.style.getPropertyValue("--glow-x")) + bounds.left;
          const y = parseFloat(canvas.style.getPropertyValue("--glow-y")) + bounds.top;
          return [...canvas.querySelectorAll("[data-benefit-card]")]
            .filter((node) => {
              const rect = node.getBoundingClientRect();
              return rect.bottom > 0 && rect.top < innerHeight;
            })
            .map((node) => {
              const rect = node.getBoundingClientRect();
              const style = getComputedStyle(node, "::before");
              const center = style.backgroundImage.match(/at (-?[\d.]+)px (-?[\d.]+)px/);
              return {
                deltaX: center ? rect.left + Number(center[1]) - x : null,
                deltaY: center ? rect.top + Number(center[2]) - y : null,
                pointerEvents: style.pointerEvents,
              };
            });
        });
        assert.ok(sharedCenters.length > 0);
        assert.ok(
          sharedCenters.every(
            (center) =>
              center.deltaX !== null &&
              center.deltaY !== null &&
              Math.abs(center.deltaX) < 1 &&
              Math.abs(center.deltaY) < 1 &&
              center.pointerEvents === "none",
          ),
          `Visible phone cards sample one shared ${scheme} light field: ${JSON.stringify(sharedCenters)}`,
        );
        assert.equal(await card.evaluate((node) => getComputedStyle(node).touchAction), "auto");
        await page.screenshot({ path: path.join(output, `${scheme}-phone-shared-rsvp-glow.png`) });

        const beforeReverse = await canvas.evaluate((node) => ({
          scroll: scrollY,
          x: parseFloat(node.style.getPropertyValue("--glow-x")),
          y: parseFloat(node.style.getPropertyValue("--glow-y")),
        }));
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: 187, y: 300 }],
        });
        for (let step = 1; step <= 6; step++) {
          await session.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: 187, y: 300 + step * 30 }],
          });
        }
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.waitForFunction((previous) => {
          const canvas = document.querySelector("[data-benefit-canvas]");
          return (
            scrollY < previous.scroll - 40 &&
            parseFloat(canvas.style.getPropertyValue("--glow-y")) < previous.y - 40 &&
            parseFloat(canvas.style.getPropertyValue("--glow-x")) < previous.x - 0.1 &&
            Math.abs(
              parseFloat(canvas.style.getPropertyValue("--glow-y")) +
                canvas.getBoundingClientRect().top -
                innerHeight * 0.58,
            ) < 1
          );
        }, beforeReverse);

        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(() => {
          return (
            matchMedia("(prefers-reduced-motion: reduce)").matches &&
            getComputedStyle(document.querySelector("[data-benefit-card]"), "::after").opacity ===
              "0"
          );
        });
        // Mobile Chromium emulation can update CSS without delivering MQL change events.
        // Native scroll must also clear the inactive field without relying on that event.
        await page.evaluate(() => window.scrollBy({ top: 100, behavior: "instant" }));
        await page.waitForFunction(() => {
          const canvas = document.querySelector("[data-benefit-canvas]");
          return !canvas.hasAttribute("data-glow-mode") && !canvas.hasAttribute("data-glow-active");
        });
        assert.equal(await canvas.getAttribute("data-glow-active"), null);
        assert.equal(await canvas.evaluate((node) => node.style.getPropertyValue("--glow-y")), "");
        assert.equal(await card.evaluate((node) => getComputedStyle(node, "::after").opacity), "0");
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.evaluate(() => window.scrollBy({ top: -30, behavior: "instant" }));
        await page.waitForFunction(() => {
          const canvas = document.querySelector("[data-benefit-canvas]");
          return canvas.dataset.glowMode === "scroll" && canvas.dataset.glowActive === "true";
        });
        assert.deepEqual(errors, []);
        assert.deepEqual(unexpected, []);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("category fragment navigation aligns the section at the top and opens every artwork and label", {
  timeout: 60000,
}, async () => {
  const css = await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 900 },
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  const errors = [],
    unexpected = [];
  try {
    await serveContext(context, css, unexpected);
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on("pageerror", (error) => errors.push(error.message));
    const waitForOpenCategories = async (fragment) => {
      await page.waitForFunction((fragment) => {
        const cards = [...document.querySelectorAll("[data-category]")];
        return (
          location.hash === fragment &&
          cards.length === 8 &&
          cards.every((card) => {
            const arch = card.querySelector("[data-category-arch]");
            const cover = card.querySelector("[data-category-cover]");
            const frame = arch.getBoundingClientRect();
            const window = arch.parentElement.getBoundingClientRect();
            return (
              Math.abs(frame.top - window.top) < 1 &&
              cover.getBoundingClientRect().top - frame.top > frame.height * 0.99 &&
              Number(getComputedStyle(arch.querySelector("img")).scale) < 1.01 &&
              Number(getComputedStyle(card.lastElementChild).opacity) > 0.99
            );
          })
        );
      }, fragment);
    };
    const waitForAnchorArrival = (fragment) =>
      page.waitForFunction((fragment) => {
        const anchor = document.querySelector(fragment);
        const collection = document.querySelector("[data-category-collection]");
        const eyebrow = collection.querySelector("p");
        const header = document.querySelector("header");
        const eyebrowTop = eyebrow.getBoundingClientRect().top;
        return (
          Math.abs(anchor.getBoundingClientRect().top) < 2 &&
          Math.abs(collection.getBoundingClientRect().top) < 2 &&
          eyebrowTop >= header.offsetHeight &&
          eyebrowTop < header.offsetHeight + 32
        );
      }, fragment);
    for (const width of [1920, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/baby-showers/templates`);
      await page.getByRole("link", { name: "All categories", exact: true }).click();
      await page.locator('[data-marketing-page][data-motion-enhanced="true"]').waitFor();
      await page.evaluate(() =>
        document.getElementById("categories").scrollIntoView({
          block: "start",
          behavior: "instant",
        }),
      );
      assert.equal(
        await page.locator(":target").count(),
        0,
        "Client navigation does not set the browser's native fragment target",
      );
      await waitForOpenCategories("#categories");
      await waitForAnchorArrival("#categories");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await waitForOpenCategories("#categories");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await waitForOpenCategories("#categories");
      await page.waitForFunction(() =>
        [...document.querySelectorAll("[data-category] img")].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      await page.screenshot({ path: path.join(output, `all-categories-client-${width}.png`) });
      await assertNoOverflow(page, `All categories client navigation at ${width}px`);
      await page.evaluate(() => {
        location.hash = "#how-it-works";
      });
      await page.waitForFunction(
        () =>
          !document
            .querySelector("[data-category-collection]")
            .hasAttribute("data-category-targeted"),
      );
      await page.goBack();
      await waitForOpenCategories("#categories");
      await page.waitForFunction(
        () =>
          document.querySelector("[data-category-collection]").dataset.categoryTargeted === "true",
      );
    }
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto(base);
    await page.locator('[data-marketing-page][data-motion-enhanced="true"]').waitFor();
    const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
    assert.equal(await navigation.getByRole("link", { name: "Templates", exact: true }).count(), 0);
    for (const [label, fragment] of [["Categories", "#categories"]]) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      const link = navigation.getByRole("link", { name: label, exact: true });
      assert.equal(await link.getAttribute("href"), fragment);
      await link.click();
      await waitForOpenCategories(fragment);
      await waitForAnchorArrival(fragment);
      if (label === "Categories") {
        await page.waitForFunction(() =>
          [...document.querySelectorAll("[data-category] img")].every(
            (image) => image.complete && image.naturalWidth > 0,
          ),
        );
        await page.screenshot({ path: path.join(output, "category-fragment-desktop.png") });
      }
      await page.evaluate(() => document.activeElement?.blur());
      await link.focus();
      await page.keyboard.press("Enter");
      await waitForOpenCategories(fragment);
      await waitForAnchorArrival(fragment);
      assert.equal(
        await page.locator(":target").getAttribute("id"),
        fragment.slice(1),
        `${label} remains fully expanded when activated again with the keyboard`,
      );
    }
    await page.goto(`${base}/#categories`);
    await page.locator('[data-marketing-page][data-motion-enhanced="true"]').waitFor();
    await waitForOpenCategories("#categories");
    await waitForAnchorArrival("#categories");
    await page.setViewportSize({ width: 1280, height: 700 });
    await waitForOpenCategories("#categories");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => !document.querySelector("[data-category-collection]").hasAttribute("data-motion-ready"),
    );
    await waitForOpenCategories("#categories");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(() =>
      document.querySelector("[data-category-collection]").hasAttribute("data-motion-ready"),
    );
    await waitForOpenCategories("#categories");
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`${base}/#categories`);
    await page.locator('[data-marketing-page][data-motion-enhanced="true"]').waitFor();
    await waitForOpenCategories("#categories");
    await waitForAnchorArrival("#categories");
    await assertNoOverflow(page, "Phone category fragment navigation");

    // Existing shared links to #examples still open the same complete collection.
    await page.goto(`${base}/#examples`);
    await page.locator('[data-marketing-page][data-motion-enhanced="true"]').waitFor();
    await waitForOpenCategories("#examples");
    await waitForAnchorArrival("#examples");

    // A fresh, untargeted page retains the original reversible desktop and phone sequence.
    await page.goto(base);
    assert.equal(await page.evaluate(() => location.hash), "");
    await page.locator('[data-marketing-page][data-motion-enhanced="true"]').waitFor();
    await assertCategoryMotion(page);
    assert.deepEqual(errors, [], "Category fragment navigation has no browser exceptions");
    assert.deepEqual(unexpected, [], "Category fragment navigation makes no external requests");
  } finally {
    await context.close();
    await browser.close();
  }
});

test("gathering section shrinks from its text bottom and restores full size for reverse scroll, focus and reduced motion", {
  timeout: 60000,
}, async () => {
  const css = await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  try {
    for (const width of [1920, 375]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: "light",
        reducedMotion: "no-preference",
      });
      try {
        const errors = [],
          unexpected = [];
        await serveContext(context, css, unexpected);
        const page = await context.newPage();
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(base);
        await page.locator('[data-marketing-page][data-motion-enhanced="true"]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await assertGatheringShrink(page, width);
        await assertNoOverflow(page, `Gathering shrink ${width}px`);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(
          () => !document.querySelector("#gathering-note").hasAttribute("data-motion-ready"),
        );
        assert.equal(
          await page
            .locator("[data-gathering-stage]")
            .evaluate((node) => getComputedStyle(node).scale),
          "none",
          "Live reduced motion removes the shrink immediately",
        );
        assert.equal(
          await page
            .getByRole("heading", {
              name: "The best part of any plan is the people.",
              exact: true,
            })
            .count(),
          1,
          "The full gathering message remains available",
        );
        assert.deepEqual(errors, [], "The gathering motion has no browser exceptions");
        assert.deepEqual(unexpected, [], "The gathering motion makes no external requests");
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("testimonial motion rotates quotes, travels left and follows the pointer with accessible fallbacks", {
  timeout: 60000,
}, async () => {
  const css = await buildFixture("testimonials-entry.tsx");
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  try {
    for (const width of [1280, 375]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: "light",
        reducedMotion: "no-preference",
      });
      const errors = [],
        unexpected = [];
      await serveContext(context, css, unexpected);
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.clock.install();
        await page.goto(base);
        const section = page.locator("[data-landing-testimonials]");
        const track = section.locator("[data-feedback-track]");
        const ribbon = section.locator("[data-feedback-ribbon-track]");
        const drift = section.locator("[data-feedback-parallax]");
        const position = section.locator("[data-feedback-position]");
        const waitForPosition = async (number) =>
          page.waitForFunction((number) => {
            const track = document.querySelector("[data-feedback-track]");
            const card = track.querySelectorAll("[data-feedback-card]")[number - 1];
            return (
              document.querySelector("[data-feedback-position]").textContent.trim() ===
                `${String(number).padStart(2, "0")} / 24` &&
              Math.abs(card.getBoundingClientRect().left - track.getBoundingClientRect().left) < 1
            );
          }, number);
        const waitForAutoplay = async (running) =>
          page.waitForFunction(
            (running) =>
              document.querySelector("[data-landing-testimonials]").dataset.feedbackAutoplay ===
              String(running),
            running,
          );
        const expose = async () =>
          page.evaluate(() =>
            window.scrollTo({
              top: document.querySelector("[data-landing-testimonials]").offsetTop - 40,
              behavior: "instant",
            }),
          );
        const leave = async () => {
          await track.evaluate((node) => node.blur());
          await page.mouse.move(0, 0);
        };
        await expose();
        await leave();
        await waitForAutoplay(true);
        assert.equal(
          await section.getByRole("button").count(),
          2,
          "Only the original arrows appear",
        );
        assert.equal(await track.locator("[data-feedback-card]").count(), 24);
        assert.equal(
          await position.getAttribute("aria-live"),
          "off",
          "Automatic changes are quiet",
        );
        const groups = await ribbon.locator(":scope > span").allTextContents();
        assert.equal(groups.length, 2);
        assert.equal(groups[0], groups[1], "Identical occasion groups make a seamless loop");
        const ribbonX = () =>
          ribbon.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
        const before = await ribbonX();
        await page.waitForTimeout(200);
        assert.ok((await ribbonX()) < before - 1, "The occasion ribbon travels right to left");
        await page.clock.fastForward(6100);
        await waitForPosition(2);
        await page.waitForTimeout(1000);
        await section.screenshot({ path: path.join(output, `testimonial-motion-${width}.png`) });

        await track.hover({ position: { x: 24, y: 24 } });
        await waitForAutoplay(true);
        assert.equal(
          await ribbon.evaluate((node) => getComputedStyle(node).animationPlayState),
          "running",
          "Hover leaves the reference motion running",
        );
        const composition = section.locator(":scope > div").first();
        const box = await composition.boundingBox();
        await page.mouse.move(box.x + box.width - 12, Math.max(60, box.y + 25));
        await page.waitForFunction(
          () =>
            parseFloat(
              document
                .querySelector("[data-feedback-parallax]")
                .style.getPropertyValue("--feedback-number-x"),
            ) > 0,
        );
        const pointer = await drift.evaluate((node) => ({
          x: parseFloat(node.style.getPropertyValue("--feedback-number-x")),
          y: parseFloat(node.style.getPropertyValue("--feedback-number-y")),
        }));
        assert.ok(
          Math.abs(pointer.x) <= 20 && Math.abs(pointer.y) <= 10,
          "Number drift stays bounded",
        );
        await leave();
        await waitForAutoplay(true);
        assert.equal(
          await drift.evaluate((node) => node.style.getPropertyValue("--feedback-number-x")),
          "",
          "Exit resets the number",
        );
        await track.focus();
        await waitForAutoplay(false);
        assert.equal(
          await ribbon.evaluate((node) => getComputedStyle(node).animationPlayState),
          "paused",
        );
        const pausedPosition = await position.textContent();
        await page.clock.fastForward(6500);
        assert.equal(
          await position.textContent(),
          pausedPosition,
          "Keyboard focus pauses automatic rotation",
        );
        await page.keyboard.press("End");
        await waitForPosition(24);
        await leave();
        await waitForAutoplay(true);
        await page.clock.fastForward(6100);
        await waitForPosition(1);

        await page.emulateMedia({ reducedMotion: "reduce" });
        await waitForAutoplay(false);
        assert.equal(await ribbon.evaluate((node) => getComputedStyle(node).animationName), "none");
        await page.clock.fastForward(6500);
        await waitForPosition(1);
        await track.focus();
        await page.keyboard.press("ArrowRight");
        await waitForPosition(2);
        assert.equal(
          await position.getAttribute("aria-live"),
          "polite",
          "Manual feedback remains announced",
        );
        await leave();
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await waitForAutoplay(true);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await waitForAutoplay(false);
        await page.clock.fastForward(6500);
        await waitForPosition(2);
        await assertNoOverflow(page, `${width}px testimonial motion`);
        assert.deepEqual(errors, []);
        assert.deepEqual(unexpected, []);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("product landing delivers light and dark layouts, sample actions and explicit creation across phone and desktop", {
  timeout: 120000,
}, async () => {
  const css = await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
  const results = [];
  try {
    for (const scheme of ["light", "dark"]) {
      for (const width of [1280, 375]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          colorScheme: scheme,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(7000);
        const errors = [],
          unexpected = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await serveContext(context, css, unexpected);
        try {
          await page.goto(base);
          await assertPageReady(page, scheme, width);
          if (scheme === "light" && width === 1280) {
            await page.waitForTimeout(2200);
            assert.equal(
              await page.getByText("Install Envitefy", { exact: true }).count(),
              0,
              "An eligible install prompt stays hidden after its normal reveal timer on the signed-out homepage",
            );
          }
          const device = width === 375 ? "mobile" : "desktop";
          await page.screenshot({ path: path.join(output, `${scheme}-${device}.png`) });
          await page
            .locator("#landing-hero")
            .screenshot({ path: path.join(output, `${scheme}-${device}-hero.png`) });
          await assertLandingCtas(page, scheme, width);
          await assertGuestBenefits(page, scheme, width);
          await assertMosaicLayout(page, width, `${scheme} ${width}px reduced-motion mosaic`);
          await exerciseFeedback(page, scheme, width);
          await exerciseQuestions(page, scheme, width);
          await exerciseSample(page);
          await exerciseAuthentication(page);
          await showHeaderBelowWordmark(page);
          const menuToggle = page
            .locator("header")
            .getByRole("button", { name: "Open navigation", exact: true });
          assert.equal(
            await menuToggle.isVisible(),
            width < 1024,
            "Only phones/tablets show the menu toggle",
          );
          if (width < 1024) {
            await menuToggle.click();
            const menu = page.getByRole("dialog", { name: "Menu", exact: true });
            await menu.waitFor();
            assert.equal(
              await menu
                .getByRole("navigation", { name: "Signed-out mobile menu", exact: true })
                .count(),
              1,
            );
            assert.equal(
              await menu.getByRole("link", { name: "Birthdays", exact: true }).getAttribute("href"),
              "/birthdays",
            );
            assert.equal(
              await menu.getByRole("switch", { name: "Dark mode", exact: true }).isVisible(),
              true,
            );
            await page.keyboard.press("Escape");
            await menu.waitFor({ state: "hidden" });
          } else {
            assert.equal(
              await page
                .getByRole("navigation", { name: "Main navigation", exact: true })
                .isVisible(),
              true,
            );
          }
          if (width === 1280) {
            await page
              .getByRole("navigation", { name: "Main navigation", exact: true })
              .getByRole("link", { name: "Categories", exact: true })
              .click();
            assert.equal(await page.evaluate(() => location.hash), "#categories");
          } else {
            await page
              .locator("#landing-hero")
              .getByRole("button", { name: "Create your event", exact: true })
              .click();
            const dialog = page.getByRole("dialog", { name: "Create an account", exact: true });
            assert.equal(
              await dialog.locator("form").getAttribute("data-auth-redirect"),
              "/create",
            );
            await page.keyboard.press("Escape");
          }
          await exerciseConcierge(page, scheme, width);
          await assertFooterClearance(page, scheme, width);
          await assertNoOverflow(page, `${scheme} ${width}px after sample actions and accordion`);
          assert.deepEqual(errors, [], "The page has no browser exceptions");
          assert.deepEqual(unexpected, [], "The landing sample sends no API or external requests");
          results.push({ scheme, width, result: "passed" });
        } finally {
          await context.close();
        }
      }
    }
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 900 },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    try {
      const unexpected = [];
      await serveContext(tabletContext, css, unexpected);
      const page = await tabletContext.newPage();
      page.setDefaultTimeout(7000);
      await page.goto(base);
      await page.locator("[data-feedback-position]").waitFor();
      await exerciseFeedback(page, "light", 768);
      await exerciseQuestions(page, "light", 768);
      assert.deepEqual(unexpected, [], "Tablet feedback and questions make no external requests");
      results.push({ scheme: "light", width: 768, feedbackAndQuestions: "passed" });
    } finally {
      await tabletContext.close();
    }
    const motionContext = await browser.newContext({
      viewport: { width: 768, height: 900 },
      colorScheme: "light",
      reducedMotion: "no-preference",
    });
    try {
      await serveContext(motionContext, css, []);
      const page = await motionContext.newPage();
      await page.goto(base);
      await page.locator("[data-marketing-page][data-motion-enhanced=true]").waitFor();
      await showHeaderBelowWordmark(page);
      await page
        .locator("header")
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await page.getByRole("dialog", { name: "Menu", exact: true }).waitFor({ state: "visible" });
      await page.setViewportSize({ width: 1024, height: 900 });
      await page.getByRole("dialog", { name: "Menu", exact: true }).waitFor({ state: "hidden" });
      assert.notEqual(
        await page.evaluate(() => getComputedStyle(document.body).overflow),
        "hidden",
        "Desktop resize releases the tablet menu scroll lock",
      );
      for (const width of [1024, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page
            .locator("header")
            .getByRole("button", { name: "Open navigation", exact: true })
            .isVisible(),
          false,
        );
        assert.equal(
          await page
            .locator("header")
            .evaluate((node) => Math.round(node.getBoundingClientRect().width)),
          width,
        );
        await assertNoOverflow(page, `Desktop header ${width}px`);
      }
      const opening = page.locator("[data-landing-opening]");
      for (const width of [719, 720, 734]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForFunction((desktop) => {
          const node = document.querySelector("[data-landing-opening]");
          return desktop
            ? Number(node.dataset.motionExitStart) >= 0.85
            : node.dataset.motionExitStart === "1" && node.dataset.motionExitEnd === "0.3";
        }, width >= 720);
        assert.equal(
          await opening.evaluate((node) =>
            Number.parseFloat(node.style.getPropertyValue("--opening-dome-height")),
          ),
          900 * (width >= 720 ? 0.58 : 0.44),
          "Opening geometry and CSS share the viewport breakpoint, including scrollbar widths",
        );
      }
      const arch = page.locator("[data-opening-arch]");
      const visibleArch = () =>
        arch.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const clip = getComputedStyle(node).clipPath;
          const edges = clip.slice(6).split("round")[0].trim().split(/\s+/).map(Number.parseFloat);
          const [top, right = top, bottom = top, left = right] = edges;
          return {
            x: rect.left + left,
            y: rect.top + top,
            width: rect.width - right - left,
            height: rect.height - top - bottom,
            clip,
          };
        });
      for (const width of [1920, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForFunction(() => {
          const node = document.querySelector("[data-landing-opening]");
          return (
            node.getAttribute("data-opening-ready") === "true" &&
            Number(node.style.getPropertyValue("--scene-progress")) === 0
          );
        });
        await page.locator("#landing-hero").evaluate((node) =>
          Promise.all(
            node
              .getAnimations({ subtree: true })
              .filter((animation) => animation.effect.getComputedTiming().endTime !== Infinity)
              .map((animation) => animation.finished),
          ),
        );
        const range = await page.locator("#landing-hero").evaluate((node) => {
          const bottom = node.getBoundingClientRect().bottom + scrollY;
          const seedBottom =
            node.querySelector("[data-opening-seed]").getBoundingClientRect().bottom + scrollY;
          const desktop = innerWidth >= 720;
          const start = desktop ? seedBottom - innerHeight * 0.85 : bottom - innerHeight;
          const end = bottom - (desktop ? Math.max(innerHeight * 0.1, 96) : innerHeight * 0.3);
          return { start, distance: end - start, oldEnd: bottom - innerHeight * 0.3 };
        });
        const triggerStart = range.start;
        const seedBox = await page.locator("[data-opening-seed]").boundingBox();
        const initialBox = await visibleArch();
        if (width < 600) {
          const portrait = await page
            .locator("img[alt='A flower-filled garden table, ready for everyone to arrive']")
            .boundingBox();
          const heroBox = await page.locator("#landing-hero").boundingBox();
          assert.ok(
            Math.abs(portrait.x + portrait.width / 2 - (heroBox.x + heroBox.width / 2)) < 1,
            "The phone portrait is centered above the arches",
          );
          assert.ok(
            seedBox.y > portrait.y + portrait.height,
            "Phone arches sit below the portrait instead of beside it",
          );
          assert.ok(
            Math.abs(seedBox.x + seedBox.width / 2 - (heroBox.x + heroBox.width / 2)) < 1,
            "The phone expansion starts from the centered seed",
          );
        }
        assert.notEqual(initialBox.clip, "none", "The arch has a valid rounded mask");
        for (const key of ["x", "y", "width", "height"]) {
          assert.ok(
            Math.abs(initialBox[key] - seedBox[key]) < 1,
            `The arch begins at the middle seed: ${width}px ${key}`,
          );
        }
        await page.evaluate(
          (top) => window.scrollTo({ top, behavior: "instant" }),
          Math.max(0, triggerStart - 20),
        );
        assert.equal(
          await opening.evaluate((node) => Number(node.style.getPropertyValue("--scene-progress"))),
          0,
          width >= 720
            ? "Desktop waits until the middle seed reaches 85% of the viewport"
            : "Phone timing still starts at the hero bottom entering the viewport",
        );
        await page.evaluate(
          (top) => window.scrollTo({ top, behavior: "instant" }),
          triggerStart + 120,
        );
        await page.waitForFunction(
          (expected) =>
            Number(
              document
                .querySelector("[data-landing-opening]")
                .style.getPropertyValue("--scene-progress"),
            ) >
            expected - 0.01,
          120 / range.distance,
        );
        const earlyBox = await visibleArch();
        assert.ok(earlyBox.width > initialBox.width * 1.5, "The arch starts growing from its seed");
        assert.ok(
          earlyBox.height < 900 * 0.3,
          "Early growth stays low instead of covering the hero",
        );
        assert.ok(
          (await page
            .locator("#landing-product-title")
            .evaluate((node) => Number(getComputedStyle(node.parentElement).opacity))) > 0.9,
          "The hero remains readable in the early transition",
        );
        const heroBefore = await page.locator("#landing-hero").boundingBox();
        await page.evaluate(
          (top) => window.scrollTo({ top, behavior: "instant" }),
          triggerStart + range.distance * 0.5,
        );
        await page.waitForFunction(
          () =>
            Math.abs(
              Number(
                document
                  .querySelector("[data-landing-opening]")
                  .style.getPropertyValue("--scene-progress"),
              ) - 0.5,
            ) < 0.01,
        );
        const heroAfter = await page.locator("#landing-hero").boundingBox();
        assert.ok(
          Math.abs(heroBefore.y - heroAfter.y - (range.distance * 0.5 - 120)) < 2,
          "The hero scrolls away without pinning",
        );
        const fades = await page.locator("#landing-hero").evaluate((hero) => ({
          copy: Number(getComputedStyle(hero.querySelector("h1").parentElement).opacity),
          portrait: Number(
            getComputedStyle(
              hero.querySelector(
                "img[alt='A flower-filled garden table, ready for everyone to arrive']",
              ).parentElement,
            ).opacity,
          ),
          seeds: [...hero.querySelector("[data-opening-seed]").parentElement.children]
            .filter((node) => !node.hasAttribute("data-opening-seed"))
            .map((node) => Number(getComputedStyle(node).opacity)),
        }));
        assert.ok(
          width >= 720 ? fades.copy > 0.9 && fades.copy < 1 : fades.copy < 0.6,
          `Desktop keeps the hero readable longer; phone retains its fade: ${fades.copy}`,
        );
        assert.ok(
          fades.portrait > 0.99,
          `The portrait keeps its color and opacity: ${fades.portrait}`,
        );
        assert.equal(fades.seeds.length, 6);
        assert.ok(
          fades.seeds.every((opacity) => opacity < (width >= 720 ? 0.9 : 0.8)),
          "All surrounding seeds dissolve",
        );
        await assertNoOverflow(page, `Opening transition ${width}px`);
        await page.screenshot({ path: path.join(output, `arch-transition-${width}.png`) });
        if (width >= 720) {
          await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), range.oldEnd);
          await page.waitForFunction(
            (expected) =>
              Math.abs(
                Number(
                  document
                    .querySelector("[data-landing-opening]")
                    .style.getPropertyValue("--scene-progress"),
                ) - expected,
              ) < 0.01,
            (range.oldEnd - range.start) / range.distance,
          );
          const heroWidth = await page
            .locator("#landing-hero")
            .evaluate((node) => node.clientWidth);
          assert.ok(
            (await visibleArch()).width < heroWidth * 0.8,
            "At the former completion point, desktop still has space beside the bubble",
          );
          assert.ok(
            await page
              .locator("#landing-product-title")
              .evaluate((node) => Number(getComputedStyle(node.parentElement).opacity) > 0.5),
            "The hero remains readable when the previous transition was already complete",
          );
          await page.screenshot({ path: path.join(output, "arch-desktop-later-growth.png") });
        }
        await page.evaluate(
          (top) => window.scrollTo({ top, behavior: "instant" }),
          triggerStart + range.distance + 5,
        );
        await page.waitForFunction(
          () =>
            Number(
              document
                .querySelector("[data-landing-opening]")
                .style.getPropertyValue("--scene-progress"),
            ) === 1,
        );
        assert.equal(
          await page
            .locator("#gathering-note > div > div")
            .evaluate((node) => Number(getComputedStyle(node).opacity)),
          1,
        );
        assert.equal(
          await page
            .getByRole("link", { name: "Find your kind of gathering", exact: true })
            .isVisible(),
          true,
        );
        const heroWidth = await page
          .locator("#landing-hero")
          .evaluate((node) => node.getBoundingClientRect().width);
        assert.ok(
          Math.abs((await visibleArch()).width - heroWidth) < 1,
          "The dome reaches the full desktop or phone content width",
        );
        await page.locator("#landing-hero button").focus();
        await page.keyboard.press("ArrowRight");
        assert.ok(
          (await page
            .locator("#landing-product-title")
            .evaluate((node) => Number(getComputedStyle(node.parentElement).opacity))) > 0.99,
          "Keyboard focus restores visible hero actions",
        );
        await page.evaluate(() => document.activeElement.blur());
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForFunction(
          () =>
            Number(
              document
                .querySelector("[data-landing-opening]")
                .style.getPropertyValue("--scene-progress"),
            ) === 0,
        );
        assert.equal(
          await page
            .locator("[data-opening-seed]")
            .evaluate((node) => Number(getComputedStyle(node.previousElementSibling).opacity)),
          1,
          "Scrolling back restores the seeds",
        );
        await page.evaluate(() => {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          window.location.hash = "gathering-note";
        });
        await page.waitForFunction(
          () =>
            Number(
              document
                .querySelector("[data-landing-opening]")
                .style.getPropertyValue("--scene-progress"),
            ) === 1,
        );
        assert.equal(
          await page
            .locator("#gathering-note > div > div")
            .evaluate((node) => Number(getComputedStyle(node).opacity)),
          1,
          "The native gathering anchor lands on its visible message",
        );
        await page.waitForFunction(() => {
          const note = document.querySelector("#gathering-note");
          return (
            Math.abs(
              note.getBoundingClientRect().top -
                Number.parseFloat(getComputedStyle(note).scrollMarginTop),
            ) < 2
          );
        });
        await page.evaluate(() => document.fonts.ready);
        const heading = page.locator("#gathering-title");
        const wordStyles = () =>
          page.locator("[data-gathering-word]").evaluateAll((words) =>
            words.map((word) => {
              const stage = word.closest("[data-gathering-stage]");
              const scale = stage.getBoundingClientRect().width / stage.offsetWidth;
              return {
                weight: Number(getComputedStyle(word).fontWeight),
                color: getComputedStyle(word).color,
                style: getComputedStyle(word).fontStyle,
                stroke: Number.parseFloat(getComputedStyle(word).webkitTextStrokeWidth),
                width: word.parentElement.getBoundingClientRect().width / scale,
                height: word.parentElement.getBoundingClientRect().height / scale,
              };
            }),
          );
        const scrollRead = async (progress) => {
          // Parent shrinking changes the rendered heading position, while its
          // unscaled line layout stays fixed. Aim using the current rendered
          // bounds and allow the native scene driver to settle after scrolling.
          for (let attempt = 0; attempt < 5; attempt++) {
            const adjustment = await heading.evaluate((node, expected) => {
              const rect = node.getBoundingClientRect();
              const desiredTop = innerHeight * 0.8 - expected * (rect.height + innerHeight * 0.35);
              return rect.top - desiredTop;
            }, progress);
            if (Math.abs(adjustment) < 0.75) break;
            await page.evaluate(
              (delta) => window.scrollBy({ top: delta, behavior: "instant" }),
              adjustment,
            );
            await page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve)),
                ),
            );
          }
          await page
            .waitForFunction(
              (expected) =>
                Math.abs(
                  Number(
                    document
                      .querySelector("#gathering-title")
                      .style.getPropertyValue("--scene-progress"),
                  ) - expected,
                ) < 0.01,
              Math.max(0, Math.min(1, progress)),
              { timeout: 5000 },
            )
            .catch(async (error) => {
              const state = await heading.evaluate((node) => ({
                top: node.getBoundingClientRect().top,
                height: node.getBoundingClientRect().height,
                scroll: scrollY,
                progress: node.style.getPropertyValue("--scene-progress"),
                opening: document
                  .querySelector("[data-landing-opening]")
                  .style.getPropertyValue("--scene-progress"),
              }));
              throw new Error(
                `Reading position ${progress} at ${width}px: ${JSON.stringify(state)}`,
                { cause: error },
              );
            });
          const actual = await heading.evaluate((node) => {
            const rect = node.getBoundingClientRect();
            const expected = Math.max(
              0,
              Math.min(1, (innerHeight * 0.8 - rect.top) / (rect.height + innerHeight * 0.35)),
            );
            return { expected, progress: Number(node.style.getPropertyValue("--scene-progress")) };
          });
          assert.ok(
            Math.abs(actual.expected - actual.progress) < 0.01,
            `Heading reading progress follows its rendered bounds: ${JSON.stringify(actual)}`,
          );
        };
        await scrollRead(-0.01);
        const plainWords = await wordStyles();
        assert.deepEqual(
          plainWords.map((word) => word.weight),
          [300, 300],
          "The phrase starts with light strokes",
        );
        assert.deepEqual(
          plainWords.map((word) => word.stroke),
          [0, 0],
        );
        const headingHeight = await heading.evaluate((node) => node.offsetHeight);
        await scrollRead(0.5);
        const middleWords = await wordStyles();
        assert.ok(
          middleWords[0].weight > 500 && middleWords[0].weight < 700,
          "The first word gains genuine intermediate font weight",
        );
        assert.ok(
          middleWords[1].weight > 300 && middleWords[1].weight < middleWords[0].weight,
          "The second word follows with a gentle stagger",
        );
        assert.notEqual(
          middleWords[0].color,
          plainWords[0].color,
          "The color changes with the weight",
        );
        await scrollRead(1.01);
        const boldWords = await wordStyles();
        assert.deepEqual(
          boldWords.map((word) => word.weight),
          [700, 700],
          "Both words finish bold",
        );
        assert.equal(boldWords[0].stroke, 0, "The word the keeps its original strokes");
        assert.ok(boldWords[1].stroke > 0.5, "People gains extra visible stroke weight");
        assert.ok(
          middleWords[1].stroke > 0 && middleWords[1].stroke < boldWords[1].stroke,
          "Extra people emphasis grows with the existing scroll effect",
        );
        assert.equal(boldWords[0].color, boldWords[1].color, "Both words finish in the same pink");
        assert.notEqual(boldWords[0].color, plainWords[0].color);
        assert.ok(
          boldWords.every((word) => word.style === "normal"),
          "The final emphasis is upright like the reference",
        );
        for (let index = 0; index < boldWords.length; index++) {
          assert.ok(
            Math.abs(boldWords[index].width - plainWords[index].width) < 0.5 &&
              Math.abs(boldWords[index].height - plainWords[index].height) < 0.5,
            "Reserved bold text dimensions prevent line movement",
          );
        }
        assert.equal(
          await heading.evaluate((node) => node.offsetHeight),
          headingHeight,
          "The heading keeps the same line arrangement through the effect",
        );
        assert.equal(
          await page
            .getByRole("heading", { name: "The best part of any plan is the people.", exact: true })
            .count(),
          1,
          "The heading exposes one complete accessible phrase",
        );
        await assertNoOverflow(page, `Bold gathering message ${width}px`);
        await page.screenshot({ path: path.join(output, `people-emphasis-${width}.png`) });
        await scrollRead(0.25);
        const reverseWords = await wordStyles();
        assert.ok(
          reverseWords.every((word) => word.weight < 500),
          "Scrolling back reverses the text emphasis",
        );
        assert.ok(reverseWords[1].stroke < boldWords[1].stroke);
        const gatheringTop = await page
          .locator("#gathering-note")
          .evaluate((node) => node.getBoundingClientRect().top + scrollY);
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), gatheringTop);
        await page.waitForFunction(
          () => Math.abs(document.querySelector("#gathering-note").getBoundingClientRect().top) < 1,
        );
        const fullPage = await page.locator("#gathering-note").evaluate((node) => ({
          height: node.getBoundingClientRect().height,
          viewport: innerHeight,
          nextTop: node.parentElement.nextElementSibling.getBoundingClientRect().top,
        }));
        assert.ok(
          fullPage.height >= fullPage.viewport - 1,
          "The gathering message occupies a full screen",
        );
        assert.ok(
          fullPage.nextTop >= fullPage.viewport - 1,
          "Occasion links remain below the full-screen message",
        );
        await page.screenshot({ path: path.join(output, `gathering-full-page-${width}.png`) });
        await page.evaluate(
          (top) => window.scrollTo({ top, behavior: "instant" }),
          gatheringTop + 120,
        );
        await page.waitForFunction(
          () => document.querySelector("#gathering-note").getBoundingClientRect().top < -119,
        );
        assert.ok(
          Math.abs(
            (await page
              .locator("#gathering-note")
              .evaluate(
                (node) => node.parentElement.nextElementSibling.getBoundingClientRect().top,
              )) -
              (fullPage.nextTop - 120),
          ) < 1,
          "The message and following links scroll naturally together",
        );
        await assertGatheringShrink(page, width);
      }
      for (const viewport of [
        { width: 375, height: 667 },
        { width: 844, height: 390 },
      ]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => document.fonts.ready);
        const fit = await page.locator("#gathering-note").evaluate((node) => ({
          height: node.getBoundingClientRect().height,
          contentBottom: node.querySelector("a").getBoundingClientRect().bottom,
          sectionBottom: node.getBoundingClientRect().bottom,
          position: getComputedStyle(node.firstElementChild).position,
          viewport: innerHeight,
        }));
        assert.ok(
          fit.height >= fit.viewport - 1 && fit.contentBottom < fit.sectionBottom,
          `The full-page message grows to fit short screens: ${JSON.stringify(viewport)}`,
        );
        assert.equal(fit.position, "relative", "Full-screen sizing keeps ordinary page scrolling");
      }
      await assertCategoryMotion(page);
      await assertMosaicMotion(page);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(
        () => !document.querySelector("[data-landing-opening]").hasAttribute("data-motion-ready"),
      );
      assert.equal(
        await page
          .locator("[data-opening-hero]")
          .evaluate((node) => getComputedStyle(node).position),
        "relative",
        "Reduced motion retains natural section flow",
      );
      assert.deepEqual(
        await page
          .locator("[data-gathering-word]")
          .evaluateAll((words) => words.map((word) => Number(getComputedStyle(word).fontWeight))),
        [700, 700],
        "Live reduced motion immediately shows the final bold phrase",
      );
      assert.equal(
        await page
          .locator("[data-gathering-stage]")
          .evaluate((node) => getComputedStyle(node).scale),
        "none",
        "Live reduced motion immediately removes gathering shrink",
      );
      assert.equal(await page.locator("[data-collage-card]").count(), 7);
      for (const card of await page.locator("[data-collage-card]").all())
        assert.equal(await card.isVisible(), true);
      results.push({
        result: "passed",
        scenario:
          "Tablet menu resize, 1024/1920 desktop width, native arch scroll and live reduced motion",
      });
    } finally {
      await motionContext.close();
    }
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    try {
      await serveContext(context, css, []);
      const page = await context.newPage();
      await page.goto(`${base}/?authenticated=1`);
      await page
        .locator("#landing-hero")
        .getByRole("button", { name: "Create your event", exact: true })
        .click();
      assert.deepEqual(
        await page.evaluate(() => window.__landingProductNavigation),
        ["/create"],
        "An authenticated host goes directly to Create",
      );
      assert.equal(await page.getByRole("dialog").count(), 0);
    } finally {
      await context.close();
    }
    fs.writeFileSync(
      path.join(output, "verification.json"),
      `${JSON.stringify(
        {
          results,
          screenshots:
            "Fresh isolated browser contexts; auth forms/router and lower showcase mocked.",
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await browser.close();
  }
});
