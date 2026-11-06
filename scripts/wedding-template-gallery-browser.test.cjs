const assert = require("node:assert/strict");
const assertSharedGalleryBackground = require("./lib/assert-shared-gallery-background.cjs");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const loadTs = require("./lib/event-messages-test-loader.cjs");
compiled.init();

const output = path.resolve("output/wedding-template-gallery");
const publicRoot = path.resolve("public");
const base = "http://wedding-gallery.test";
const { weddingDesignCatalog } = loadTs("src/lib/wedding-designs.ts");
const { templateEditorHref } = loadTs("src/lib/template-categories.ts");
const weddingById = new Map(weddingDesignCatalog.map((template) => [template.id, template]));
let building;

function buildFixture() {
  return building ||= (async () => {
    fs.mkdirSync(output, { recursive: true });
    const navigation = path.resolve("scripts/fixtures/wedding-template-gallery-navigation.tsx");
    const infrastructure = path.resolve("scripts/fixtures/wedding-template-gallery-infrastructure.tsx");
    await new Promise((resolve, reject) => {
      const compiler = compiled.webpack({
        mode: "development",
        target: "web",
        devtool: false,
        cache: false,
        entry: path.resolve("scripts/fixtures/wedding-template-gallery.tsx"),
        output: { path: output, filename: "fixture.js", chunkFilename: "chunk-[id].js", publicPath: "/" },
        resolve: {
          extensions: [".tsx", ".ts", ".js", ".json"],
          alias: {
            "next/link": navigation,
            "next/navigation": navigation,
            "next-auth/react": navigation,
            "next/dynamic": path.resolve("scripts/fixtures/wedding-template-gallery-dynamic.tsx"),
            "next/image": path.resolve("scripts/fixtures/landing-product/image.tsx"),
            "@/contexts/MenuContext": navigation,
            "@": path.resolve("src"),
          },
        },
        plugins: [
          new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) }),
          new compiled.webpack.NormalModuleReplacementPlugin(
            /(?:^|[/\\])(?:SignedOutPageChrome|EventCustomThemeDialog|SignupGalleryThemeDialog|AuthModal)(?:\.tsx)?$/,
            (resource) => { resource.request = infrastructure; },
          ),
        ],
        module: {
          rules: [
            { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
            { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
          ],
        },
        performance: { hints: false },
      });
      compiler.run((error, stats) => compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ));
    });
    const source = fs.readFileSync("src/app/globals.css", "utf8").replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n' + [
        "../components/MainContentWrapper.tsx", "../components/ui/gradient-backgrounds.tsx", "../components/templates", "../components/events", "../components/marketing", "../components/birthdays",
      ].map((entry) => `@source "${entry}";`).join("\n"),
    );
    const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })).css;
    fs.writeFileSync(path.join(output, "global.css"), css);
  })();
}

async function serve(context, unexpected) {
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    // Existing gallery backdrops include remote Unsplash fallbacks. This fixture
    // stays offline; all new hero photographs are local and decoded below.
    if (url.hostname === "images.unsplash.com" && request.resourceType() === "image") return route.abort();
    if (url.origin !== base || request.method() !== "GET") {
      unexpected.push(`${request.method()} ${url.href}`);
      return route.abort();
    }
    if (url.pathname === "/weddings/templates" || url.pathname === "/birthdays/templates") return route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"></head><body class="font-vars antialiased"><div id="root"></div><script src="/fixture.js"></script></body></html>',
    });
    const generated = path.resolve(output, `.${decodeURIComponent(url.pathname)}`);
    const asset = path.resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
    const filename = [generated, asset].find((candidate) =>
      (candidate.startsWith(output + path.sep) || candidate.startsWith(publicRoot + path.sep)) &&
      fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    );
    if (filename) return route.fulfill({
      contentType: ({
        ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ttf": "font/ttf",
      })[path.extname(filename)] || "application/octet-stream",
      body: fs.readFileSync(filename),
    });
    unexpected.push(`${request.method()} ${url.href}`);
    return route.abort();
  });
}

async function sampleHeroPalette(page) {
  return page.locator("[data-wedding-hero-template]").evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node.querySelector('[data-appearance-scope="authored"]') || node);
    return { id: node.dataset.weddingHeroTemplate, color: style.color, background: style.backgroundColor,
      artwork: [...node.querySelectorAll("img")].map((image) => image.getAttribute("src")) };
  }));
}

function rgb(color) {
  const values = color.match(/[\d.]+/g)?.map(Number);
  assert.ok(values?.length >= 3, `browser returns an RGB color: ${color}`);
  return [...values.slice(0, 3), values[3] ?? 1];
}

function composite(front, back) {
  const alpha = front[3] + back[3] * (1 - front[3]);
  return [0, 1, 2].map((index) => (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / alpha).concat(alpha);
}

function luminance(color) {
  const linear = color.slice(0, 3).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(ink, paper) {
  const foreground = luminance(composite(rgb(ink), paper));
  const background = luminance(paper);
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

async function sampleAppearance(page) {
  return page.evaluate(() => {
    const hero = document.querySelector("[data-wedding-template-hero]");
    const controls = document.querySelector("[data-public-gallery-controls]");
    const description = hero.querySelector("h1").nextElementSibling;
    const nodes = {
      page: document.querySelector("[data-marketing-page]"),
      layout: document.querySelector("[data-category-gallery-page]"),
      gallery: document.querySelector("[data-wedding-template-gallery]"),
      header: document.querySelector("[data-public-landing-header]"),
      hero,
      title: hero.querySelector("h1"),
      description,
      eyebrow: hero.querySelector("p"),
      primary: hero.querySelector("[data-wedding-create]"),
      search: controls.querySelector("input"),
      order: controls.querySelector('select[aria-label="Template order"]') || controls.querySelector("select"),
      status: document.querySelector('[data-template-autoload] [role="status"]'),
      headerJoin: document.querySelector("[data-header-join]"),
      headerPrimary: document.querySelector("[data-header-primary]"),
    };
    [...controls.querySelectorAll("select")].forEach((node, index) => { nodes[`filter${index + 1}`] = node; });
    const samples = Object.fromEntries(Object.entries(nodes).filter(([, node]) => node).map(([key, node]) => {
      const style = getComputedStyle(node);
      const backgrounds = [];
      for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) backgrounds.unshift(getComputedStyle(ancestor).backgroundColor);
      const { x, y, width, height } = node.getBoundingClientRect();
      return [key, { color: style.color, background: style.backgroundColor, backgrounds, colorScheme: style.colorScheme,
        placeholder: key === "search" ? getComputedStyle(node, "::placeholder").color : undefined,
        box: { x, y, width, height } }];
    }));
    return {
      preference: document.documentElement.dataset.appearancePreference,
      dark: document.documentElement.classList.contains("dark"),
      samples,
      backdrop: { opacity: getComputedStyle(hero.querySelector("img")).opacity, scrim: getComputedStyle(hero, "::before").backgroundImage },
      logos: [...document.querySelectorAll('[data-public-landing-header] a[aria-label="Envitefy home"] img')].map((node) => ({
        source: node.getAttribute("src"), display: getComputedStyle(node).display, filter: getComputedStyle(node).filter,
      })),
      filters: [...controls.querySelectorAll("input, select")].map((node) => ({ value: node.value, label: node.getAttribute("aria-label") || node.closest("label")?.innerText })),
      cards: [...document.querySelectorAll("[data-template-masonry-card]")].map((node) => node.dataset.templateMasonryCard),
      boxes: [...document.querySelectorAll("[data-wedding-hero-template], [data-public-gallery-controls] input, [data-public-gallery-controls] select")].map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      }),
    };
  });
}

function assertAppearanceContrast(appearance, theme, width) {
  for (const key of ["title", "description", "eyebrow", "primary", "search", "order", "status", "headerJoin", "headerPrimary", ...Object.keys(appearance.samples).filter((key) => key.startsWith("filter"))]) {
    const sample = appearance.samples[key];
    assert.ok(sample, `${key} exists for ${theme} at ${width}px`);
    // Resolve translucent action surfaces through their actual ancestor papers.
    // The hero base paper represents its copy area; the decorative photograph
    // and scrim receive separate desktop/phone screenshot inspection.
    const paper = sample.backgrounds.reduce((back, front) => composite(rgb(front), back), [255, 255, 255, 1]);
    const ratio = contrast(sample.color, paper);
    assert.ok(ratio >= 4.5, `${theme} ${key} computed ink/paper contrast is ${ratio.toFixed(2)}:1 at ${width}px`);
    if (sample.placeholder) {
      const placeholderRatio = contrast(sample.placeholder, paper);
      assert.ok(placeholderRatio >= 4.5, `${theme} search placeholder contrast is ${placeholderRatio.toFixed(2)}:1 at ${width}px`);
    }
  }
}

function assertNoThemeLayoutShift(before, after, label) {
  for (const key of Object.keys(before.samples)) {
    assert.deepEqual(after.samples[key].box, before.samples[key].box, `${label}: ${key} keeps its position and dimensions`);
  }
  assert.deepEqual(after.boxes, before.boxes, `${label}: preview cards and all native filters keep their geometry`);
}

test("wedding gallery hero keeps real designs, native controls and responsive keyboard actions", { timeout: 240000 }, async () => {
  await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    for (const width of [1440, 768, 390, 320]) {
      const unexpected = [];
      const errors = [];
      const context = await browser.newContext({ viewport: { width, height: width >= 1000 ? 1000 : 900 }, reducedMotion: "reduce" });
      await serve(context, unexpected);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/weddings/templates`);
      assert.deepEqual(errors, [], "gallery browser module initializes");
      const hero = page.locator("[data-wedding-template-hero]");
      const cards = page.locator("[data-template-masonry-card]");
      await hero.waitFor();
      await cards.first().waitFor();
      await cards.first().locator("[data-template-thumbnail-preview]").waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("[data-wedding-template-gallery]").count(), 1);
      assert.equal(await hero.getByRole("heading", { level: 1 }).count(), 1);
      assert.match(await hero.getByRole("heading", { level: 1 }).innerText(), /your love story\s+starts here/i);
      const previews = hero.locator("[data-wedding-hero-template]");
      assert.equal(await previews.count(), 3, `three selectable wedding designs at ${width}px`);
      for (let index = 0; index < 3; index++) {
        const preview = previews.nth(index);
        const id = await preview.getAttribute("data-wedding-hero-template");
        assert.ok(weddingById.has(id), `${id} exists in the wedding catalog`);
        assert.equal(await preview.getAttribute("href"), templateEditorHref("weddings", id));
        assert.equal(await preview.getAttribute("aria-label"), `Customize ${weddingById.get(id).name}`);
      }
      await hero.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      await page.locator("[data-template-masonry-grid] img").evaluateAll((images) => Promise.all(images.filter((image) => {
        const box = image.getBoundingClientRect();
        return image.src.startsWith(location.origin) && box.top < innerHeight && box.bottom > 0;
      }).map((image) => image.decode().catch((error) => { throw new Error(`${image.currentSrc || image.src}: ${error.message}`); }))));
      await page.screenshot({ path: path.join(output, `wedding-hero-${width}.png`), fullPage: false });
      const boxes = await cards.evaluateAll((nodes) => nodes.slice(0, 12).map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      }));
      assert.equal(boxes.length, 12, "initial catalog designs remain visible");
      for (let index = 0; index < boxes.length; index++) for (let next = index + 1; next < boxes.length; next++) {
        const a = boxes[index], b = boxes[next];
        assert.ok(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1,
          `wedding mosaic cards ${index + 1} and ${next + 1} do not overlap at ${width}px`);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no horizontal overflow at ${width}px`);
      const dark = await sampleHeroPalette(page);
      await page.evaluate(() => window.__setWeddingGalleryAppearance("light"));
      assert.deepEqual(await sampleHeroPalette(page), dark, "authored wedding paper, ink and artwork survive appearance changes");
      await page.evaluate(() => window.__setWeddingGalleryAppearance("dark"));

      const generate = hero.getByRole("button", { name: "Generate with Envitefy", exact: true });
      assert.equal(await hero.getByRole("button").count(), 1, "wedding hero has one generation action");
      assert.equal(await generate.count(), 1);
      assert.equal(await hero.getByRole("link", { name: "Explore templates" }).count(), 0);
      assert.equal(await hero.getByRole("button", { name: "Upload event information", exact: true }).count(), 0);
      await page.keyboard.press("Tab");
      await generate.focus();
      assert.equal(await generate.evaluate((node) => node === document.activeElement), true);
      const focus = await generate.evaluate((node) => ({ width: getComputedStyle(node).outlineWidth, style: getComputedStyle(node).outlineStyle }));
      assert.ok(parseFloat(focus.width) > 0 && focus.style !== "none", "keyboard primary action has a visible focus indicator");
      await page.keyboard.press("Enter");
      await page.locator("[data-fixture-auth-modal]").waitFor();
      await page.getByRole("button", { name: "Close account dialog" }).click();
      const controls = page.locator("#wedding-template-designs");
      assert.equal(await controls.getAttribute("data-public-gallery-controls"), "true");

      const search = page.getByRole("searchbox");
      await search.fill("zzzz-no-matching-wedding-design");
      await page.waitForFunction(() => !document.querySelector("[data-template-masonry-card]"));
      assert.match(await page.locator("[data-wedding-template-gallery]").innerText(), /No templates match/);
      await search.fill("");
      await cards.first().waitFor();
      await page.getByRole("combobox", { name: "Template order" }).selectOption("original");
      const style = page.getByRole("combobox", { name: "Style", exact: true });
      const firstStyle = weddingDesignCatalog[0].style;
      await style.selectOption(firstStyle);
      await page.waitForFunction((ids) => [...document.querySelectorAll("[data-template-masonry-card]")].every((node) => ids.includes(node.dataset.templateMasonryCard)),
        weddingDesignCatalog.filter((item) => item.style === firstStyle).map((item) => item.id));
      assert.ok(await cards.count() > 0, "style filtering keeps matching designs");
      await style.selectOption("");
      await page.getByRole("combobox", { name: "Color", exact: true }).selectOption(weddingDesignCatalog[0].color);
      await page.waitForFunction((ids) => [...document.querySelectorAll("[data-template-masonry-card]")].every((node) => ids.includes(node.dataset.templateMasonryCard)),
        weddingDesignCatalog.filter((item) => item.color === weddingDesignCatalog[0].color).map((item) => item.id));
      assert.ok(await cards.count() > 0, "color filtering keeps matching designs");
      await page.getByRole("combobox", { name: "Color", exact: true }).selectOption("");
      await page.getByRole("combobox", { name: "Template order" }).selectOption("seasonal");
      await hero.getByRole("heading", { level: 1 }).click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(() => scrollY === 0);
      await cards.first().locator("[data-template-thumbnail-preview]").waitFor();
      await page.locator("[data-template-masonry-grid] img").evaluateAll((images) => Promise.all(images.filter((image) => {
        const box = image.getBoundingClientRect();
        return image.src.startsWith(location.origin) && box.top < innerHeight && box.bottom > 0;
      }).map((image) => image.decode())));
      await page.screenshot({ path: path.join(output, `wedding-hero-${width}.png`), fullPage: false });
      if (width === 1440) {
        const heroBox = await hero.boundingBox();
        const controlsBox = await controls.boundingBox();
        await page.screenshot({
          path: path.join(output, "wedding-hero-preview.png"),
          clip: { x: 0, y: heroBox.y, width, height: controlsBox.y + controlsBox.height + 20 - heroBox.y },
        });
      }
      assert.deepEqual(errors, [], `no browser runtime errors at ${width}px`);
      assert.deepEqual(unexpected, [], `all fixture requests use local app resources at ${width}px`);
      await context.close();
    }
  } finally { await browser.close(); }
});

test("wedding redesign retains account actions and leaves featured and birthday galleries intact", { timeout: 240000 }, async () => {
  await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    const unexpected = [];
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await serve(context, unexpected);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/weddings/templates`);
    assert.deepEqual(errors, [], "gallery browser module initializes");
    const hero = page.locator("[data-wedding-template-hero]");
    await hero.waitFor();
    assert.equal(await hero.getByRole("button", { name: "Upload event information", exact: true }).count(), 0);
    await hero.getByRole("button", { name: "Generate with Envitefy", exact: true }).click();
    await page.locator("[data-fixture-auth-modal]").waitFor();
    await page.getByRole("button", { name: "Close account dialog" }).click();
    await page.goto(`${base}/weddings/templates?authenticated`);
    await hero.getByRole("button", { name: "Generate with Envitefy", exact: true }).click();
    await page.locator('[data-fixture-custom-dialog="weddings"]').waitFor();
    await page.getByRole("button", { name: "Close design dialog" }).click();
    assert.equal(await hero.getByRole("button", { name: "Generate with Envitefy", exact: true }).isEnabled(), true);
    await page.goto(`${base}/weddings/templates?featured`);
    await page.locator("[data-template-masonry-card]").first().waitFor();
    assert.equal(await hero.count(), 0, "landing featured section keeps its compact heading");
    assert.equal(await page.locator("[data-template-masonry-card]").count(), 8);
    assert.equal(await page.getByRole("heading", { name: "Make it yours" }).count(), 1);
    assert.equal(await page.getByRole("link", { name: "Browse all templates" }).getAttribute("href"), "/weddings/templates");
    assert.equal(await page.locator("[data-public-gallery-controls]").count(), 0);
    await page.goto(`${base}/birthdays/templates`);
    await page.locator("[data-template-masonry-card]").first().waitFor();
    assert.equal(await hero.count(), 0, "other categories retain their current gallery header");
    assert.equal(await page.getByRole("heading", { level: 1, name: "Every birthday deserves a little magic." }).count(), 1);
    assert.equal(await page.locator("[data-public-gallery-controls]").count(), 1);
    assert.ok(await page.locator("[data-template-masonry-card]").count() >= 12);
    const birthdayGallery = page.locator("[data-category-gallery-page]");
    assert.equal(await birthdayGallery.getByRole("button", { name: "Generate with Envitefy", exact: true }).count(), 1, "birthday hero exposes its generation action");
    assert.equal(await birthdayGallery.getByRole("button", { name: "Upload event information", exact: true }).count(), 0, "birthday hero keeps its single generation action");
    await context.close();
    assert.deepEqual(unexpected, []);
  } finally { await browser.close(); }
});

test("wedding light and dark appearance pair readable app surfaces without changing artwork, layout or filter state", { timeout: 240000 }, async () => {
  await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    for (const width of [1440, 390]) {
      const unexpected = [], errors = [];
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      await serve(context, unexpected);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/weddings/templates?theme=light`);
      const hero = page.locator("[data-wedding-template-hero]");
      const controls = page.locator("[data-public-gallery-controls]");
      await hero.waitFor();
      await page.locator("[data-template-masonry-card]").first().locator("[data-template-thumbnail-preview]").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await hero.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      await page.locator('[data-public-landing-header] img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      const authored = await sampleHeroPalette(page);
      const themes = {};
      for (const theme of ["light", "dark"]) {
        await page.evaluate((appearance) => window.__setWeddingGalleryAppearance(appearance), theme);
        const appearance = themes[theme] = await sampleAppearance(page);
        assert.equal(appearance.preference, theme, "the real appearance setter applies the requested preference");
        assert.equal(appearance.dark, theme === "dark");
        assertAppearanceContrast(appearance, theme, width);
        await assertSharedGalleryBackground(page, appearance.samples, theme, width);
        assert.deepEqual(await sampleHeroPalette(page), authored, `${theme} retains all three authored wedding papers, inks and photographs`);
        for (const key of ["header", "hero", "search", "order"]) {
          const brightness = luminance(rgb(appearance.samples[key].background));
          assert.ok(theme === "light" ? brightness > 0.7 : brightness < 0.12,
            `${theme} ${key} has an appropriately ${theme === "light" ? "pale" : "dark"} surface at ${width}px (${brightness.toFixed(3)})`);
        }
        assert.equal(appearance.samples.search.colorScheme, theme, "native search uses the selected color scheme");
        assert.equal(appearance.samples.order.colorScheme, theme, "native select popups use the selected color scheme");
        const visibleLogos = appearance.logos.filter((logo) => logo.display !== "none");
        assert.equal(visibleLogos.length, 1, `${theme} header displays one prepared logo`);
        assert.equal(visibleLogos[0].source, theme === "dark" ? "/brand/wordmark-v2/envitefy-wordmark-white.webp" : "/brand/wordmark-v2/envitefy-wordmark.webp");
        assert.equal(visibleLogos[0].filter, "none", "light branding is not forced through the former white filter");
        const controlsBox = await controls.boundingBox();
        await page.screenshot({
          path: path.join(output, `wedding-hero-${theme}-${width}.png`),
          clip: { x: 0, y: 0, width, height: Math.ceil(controlsBox.y + controlsBox.height + 20) },
        });
      }
      for (const key of ["header", "hero", "gallery", "search", "order"]) {
        assert.notEqual(themes.light.samples[key].color, themes.dark.samples[key].color, `${key} ink changes with appearance`);
        if (key !== "gallery") assert.notEqual(themes.light.samples[key].background, themes.dark.samples[key].background, `${key} paper changes with appearance`);
      }
      assert.notDeepEqual(themes.light.backdrop, themes.dark.backdrop, "the decorative photograph and scrim adapt to the light hero");
      assertNoThemeLayoutShift(themes.light, themes.dark, `${width}px light-to-dark`);

      // Changing appearance must retain meaningful search/order/style/color/season
      // values and the matching catalog selection, including a dark-to-light return.
      await page.getByRole("searchbox").fill(weddingDesignCatalog[0].name);
      await page.getByRole("combobox", { name: "Template order" }).selectOption("original");
      await page.getByRole("combobox", { name: "Style", exact: true }).selectOption(weddingDesignCatalog[0].style);
      await page.getByRole("combobox", { name: "Color", exact: true }).selectOption(weddingDesignCatalog[0].color);
      await page.waitForFunction((id) => document.querySelector('[data-template-masonry-card]')?.dataset.templateMasonryCard === id, weddingDesignCatalog[0].id);
      await page.evaluate(() => scrollTo(0, 0));
      const selectedDark = await sampleAppearance(page);
      await page.evaluate(() => window.__setWeddingGalleryAppearance("light"));
      const selectedLight = await sampleAppearance(page);
      assert.deepEqual(selectedLight.filters, selectedDark.filters, "search and every filter retain their selected values on appearance change");
      assert.deepEqual(selectedLight.cards, selectedDark.cards, "matching catalog designs stay selected after appearance change");
      assertNoThemeLayoutShift(selectedDark, selectedLight, `${width}px dark-to-light with selected filters`);
      assert.deepEqual(await sampleHeroPalette(page), authored, "returning to light does not recolor authored preview designs");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `light has no horizontal overflow at ${width}px`);
      assert.deepEqual(errors, [], `theme changes have no browser runtime errors at ${width}px`);
      assert.deepEqual(unexpected, [], `theme appearance fixture stays local at ${width}px`);
      await context.close();
    }
  } finally { await browser.close(); }
});
