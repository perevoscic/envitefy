const assert = require("node:assert/strict");
const assertSharedGalleryBackground = require("./lib/assert-shared-gallery-background.cjs");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
const loadTs = require("./lib/event-messages-test-loader.cjs");
compiled.init();

const output = path.resolve("output/baby-shower-template-gallery");
const publicRoot = path.resolve("public");
const base = "http://baby-shower-gallery.test";
const { BABY_SHOWER_DESIGNS: catalog } = loadTs("src/lib/baby-shower-designs.ts");
const { templateEditorHref } = loadTs("src/lib/template-categories.ts");
const byId = new Map(catalog.map((design) => [design.id, design]));
const featuredIds = ["alpine-fawn", "cloud-nine-airmail", "peony-parasol"];
let building;

function buildFixture() {
  return building ||= (async () => {
    fs.mkdirSync(output, { recursive: true });
    const navigation = path.resolve("scripts/fixtures/wedding-template-gallery-navigation.tsx");
    const infrastructure = path.resolve("scripts/fixtures/wedding-template-gallery-infrastructure.tsx");
    await new Promise((resolve, reject) => {
      const compiler = compiled.webpack({
        mode: "development", target: "web", devtool: false, cache: false,
        entry: path.resolve("scripts/fixtures/baby-shower-template-gallery.tsx"),
        output: { path: output, filename: "fixture.js", chunkFilename: "chunk-[id].js", publicPath: "/" },
        resolve: {
          extensions: [".tsx", ".ts", ".js", ".json"],
          alias: {
            "next/link": navigation, "next/navigation": navigation, "next-auth/react": navigation,
            "next/dynamic": path.resolve("scripts/fixtures/wedding-template-gallery-dynamic.tsx"),
            "next/image": path.resolve("scripts/fixtures/landing-product/image.tsx"),
            "@/contexts/MenuContext": navigation, "@": path.resolve("src"),
          },
        },
        plugins: [
          new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) }),
          new compiled.webpack.NormalModuleReplacementPlugin(
            /(?:^|[/\\])(?:SignedOutPageChrome|EventCustomThemeDialog|SignupGalleryThemeDialog|AuthModal)(?:\.tsx)?$/,
            (resource) => { resource.request = infrastructure; },
          ),
        ],
        module: { rules: [
          { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
          { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        ] },
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
        "../components/MainContentWrapper.tsx", "../components/ui/gradient-backgrounds.tsx", "../components/templates", "../components/events", "../components/marketing", "../components/birthdays", "../components/baby-showers",
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
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === "images.unsplash.com" && request.resourceType() === "image") return route.abort();
    if (url.origin !== base || request.method() !== "GET") {
      unexpected.push(`${request.method()} ${url.href}`);
      return route.abort();
    }
    if (url.pathname === "/baby-showers/templates") return route.fulfill({
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

async function authoredAppearance(page) {
  return page.locator("[data-baby-shower-hero-template]").evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node.querySelector('[data-appearance-scope="authored"]') || node);
    return {
      id: node.dataset.babyShowerHeroTemplate,
      color: style.color, background: style.backgroundColor,
      images: [...node.querySelectorAll("img")].map((image) => image.getAttribute("src")),
      text: [...node.querySelectorAll('[data-appearance-scope="authored"] p')].map((paragraph) => ({
        content: paragraph.textContent, color: getComputedStyle(paragraph).color,
        background: getComputedStyle(paragraph).backgroundColor,
      })),
    };
  }));
}

async function appearance(page) {
  return page.evaluate(() => {
    const hero = document.querySelector("[data-baby-shower-template-hero]");
    const controls = document.querySelector("[data-public-gallery-controls]");
    const nodes = {
      page: document.querySelector("[data-marketing-page]"),
      header: document.querySelector("[data-public-landing-header]"),
      headerSignIn: document.querySelector("[data-public-landing-header] [data-header-join]"),
      layout: document.querySelector("[data-category-gallery-page]"),
      gallery: document.querySelector("[data-baby-shower-template-gallery]"),
      hero, title: hero.querySelector("h1"),
      description: hero.querySelector("h1").nextElementSibling,
      eyebrow: hero.querySelector("p"),
      generate: hero.querySelector("[data-custom-design-create]"),
      search: controls.querySelector("input"),
    };
    [...controls.querySelectorAll("select")].forEach((node, index) => { nodes[`filter${index}`] = node; });
    return {
      preference: document.documentElement.dataset.appearancePreference,
      dark: document.documentElement.classList.contains("dark"),
      samples: Object.fromEntries(Object.entries(nodes).filter(([, node]) => node).map(([key, node]) => {
        const style = getComputedStyle(node), backgrounds = [];
        for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) backgrounds.unshift(getComputedStyle(ancestor).backgroundColor);
        const { x, y, width, height } = node.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        const textBoxes = [...range.getClientRects()].filter((box) => box.width > 0 && box.height > 0).map(({ x, y, width, height }) => ({ x, y, width, height }));
        return [key, { color: style.color, background: style.backgroundColor, backgrounds,
          colorScheme: style.colorScheme, box: { x, y, width, height }, textBoxes }];
      })),
      filters: [...controls.querySelectorAll("input, select")].map((node) => ({
        value: node.value, label: node.getAttribute("aria-label") || node.closest("label")?.innerText,
      })),
      cards: [...document.querySelectorAll("[data-template-masonry-card]")].map((node) => node.dataset.templateMasonryCard),
    };
  });
}

function rgb(color) {
  const values = color.match(/[\d.]+/g)?.map(Number);
  assert.ok(values?.length >= 3, `computed RGB color: ${color}`);
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

function assertContrast(state, theme, width) {
  for (const key of ["title", "description", "eyebrow", "generate", "search", "headerSignIn", ...Object.keys(state.samples).filter((key) => key.startsWith("filter"))]) {
    const sample = state.samples[key];
    assert.ok(sample, `${key} exists at ${width}px`);
    const paper = sample.backgrounds.reduce((back, front) => composite(rgb(front), back), [255, 255, 255, 1]);
    const ink = luminance(composite(rgb(sample.color), paper)), background = luminance(paper);
    const ratio = (Math.max(ink, background) + 0.05) / (Math.min(ink, background) + 0.05);
    assert.ok(ratio >= 4.5, `${theme} ${key} contrast ${ratio.toFixed(2)}:1 at ${width}px`);
  }
}

test("baby-shower gallery hero and controls fit desktop, tablet and narrow phones in light and dark appearance", { timeout: 240000 }, async () => {
  await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    for (const width of [1440, 768, 390, 320]) {
      const unexpected = [], errors = [];
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      await serve(context, unexpected);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/baby-showers/templates?theme=light`);
      const hero = page.locator("[data-baby-shower-template-hero]");
      const cards = page.locator("[data-template-masonry-card]");
      await hero.waitFor();
      await cards.first().locator("[data-template-thumbnail-preview]").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await hero.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      await page.screenshot({ path: path.join(output, `baby-shower-hero-initial-${width}.png`) });
      assert.equal(await page.locator("[data-baby-shower-template-gallery]").count(), 1);
      assert.equal(await hero.getByRole("heading", { level: 1 }).count(), 1);
      assert.equal((await hero.getByRole("heading", { level: 1 }).innerText()).replace(/\s+/g, " ").trim(), "A sweet welcome for your little one.");
      assert.ok((await hero.innerText()).replace(/\s+/g, " ").includes("Share your theme, favorite colors, and special details. Generate a baby shower page made for this happy beginning."));
      assert.equal(await hero.getByRole("link", { name: "Explore templates" }).count(), 0);
      assert.equal(await hero.getByRole("button", { name: "Generate with Envitefy", exact: true }).count(), 1);
      assert.equal(await hero.getByRole("button", { name: "Create with Envitefy", exact: true }).count(), 0);
      assert.equal(await hero.getByRole("button", { name: "Upload event information", exact: true }).count(), 0);
      assert.equal(await hero.getByRole("button").count(), 1, "hero keeps one generation action");
      const previews = hero.locator("[data-baby-shower-hero-template]");
      assert.deepEqual(await previews.evaluateAll((nodes) => nodes.map((node) => node.dataset.babyShowerHeroTemplate)), featuredIds);
      for (let index = 0; index < featuredIds.length; index++) {
        const id = featuredIds[index], preview = previews.nth(index);
        assert.ok(byId.has(id), `${id} is a real baby-shower design`);
        assert.equal(await preview.getAttribute("href"), templateEditorHref("baby-showers", id));
        assert.equal(await preview.getAttribute("aria-label"), `Customize ${byId.get(id).name}`);
        assert.equal(await preview.locator('[data-appearance-scope="authored"]').count(), 1, `${id} marks its authored colors`);
        assert.ok((await preview.locator("img").evaluateAll((images) => images.map((image) => image.getAttribute("src")))).includes(byId.get(id).heroImage), `${id} keeps its original catalog artwork`);
      }
      assert.ok(await cards.count() >= 12, "full gallery retains at least its initial twelve designs after progressive loading");
      const mosaic = await cards.evaluateAll((nodes) => nodes.slice(0, 12).map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      }));
      const columns = width >= 1024 ? 4 : 2;
      assert.equal(new Set(mosaic.slice(0, columns).map((box) => Math.round(box.x))).size, columns, `shared mosaic columns at ${width}px`);
      for (let index = 0; index < mosaic.length; index++) for (let next = index + 1; next < mosaic.length; next++) {
        const a = mosaic[index], b = mosaic[next];
        assert.ok(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1,
          `catalog cards ${index + 1} and ${next + 1} do not overlap at ${width}px`);
      }
      const authored = await authoredAppearance(page), themes = {};
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => window.__setBabyShowerGalleryAppearance(value), theme);
        const state = themes[theme] = await appearance(page);
        assert.equal(state.preference, theme, "real appearance setter applies selected preference");
        assert.equal(state.dark, theme === "dark");
        const backdrop = await hero.locator(":scope > img").evaluateAll((images) => images.filter((image) => getComputedStyle(image).visibility === "visible").map((image) => image.getAttribute("src")));
        assert.equal(backdrop.length, 1, `${theme} has one visible theme backdrop`);
        assert.ok(backdrop[0].endsWith(`baby-shower-still-life-${theme}.webp`), `${theme} uses its matching local still life`);
        assertContrast(state, theme, width);
        await assertSharedGalleryBackground(page, state.samples, theme, width);
        assert.deepEqual(await authoredAppearance(page), authored, `${theme} preserves authored ink, paper and images`);
        for (const key of ["hero", "search", "header"]) {
          const brightness = luminance(rgb(state.samples[key].background));
          assert.ok(theme === "light" ? brightness > 0.7 : brightness < 0.12, `${theme} ${key} surface at ${width}px`);
        }
        assert.equal(state.samples.search.colorScheme, theme, "native search follows appearance");
        const clippedLabels = await page.locator("[data-public-gallery-controls] select").evaluateAll((selects) => {
          const measure = document.createElement("canvas").getContext("2d");
          return selects.flatMap((select) => {
            const style = getComputedStyle(select);
            measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const label = select.selectedOptions[0]?.textContent || "";
            const available = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 18;
            return measure.measureText(label).width > available ? [label] : [];
          });
        });
        assert.deepEqual(clippedLabels, [], `${theme} selected filter labels fit at ${width}px`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${theme} has no horizontal overflow at ${width}px`);
        const boxes = await previews.evaluateAll((nodes) => nodes.map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y, width, height };
        }));
        assert.ok(boxes.every((box) => box.width > 0 && box.x >= -1 && box.x + box.width <= width + 1), `all preview links fit ${width}px: ${JSON.stringify(boxes)}`);
        for (const key of ["title", "description", "generate"]) for (const [index, preview] of boxes.entries()) {
          const copyBoxes = key === "generate" ? [state.samples[key].box] : state.samples[key].textBoxes;
          for (const copy of copyBoxes) {
            assert.ok(copy.x + copy.width <= preview.x + 1 || preview.x + preview.width <= copy.x + 1 || copy.y + copy.height <= preview.y + 1 || preview.y + preview.height <= copy.y + 1,
              `${theme} ${key} and invitation ${index + 1} stay separate at ${width}px: ${JSON.stringify({ copy, preview })}`);
          }
        }
        const controlBox = await page.locator("[data-public-gallery-controls]").boundingBox();
        assert.ok(controlBox.y >= state.samples.hero.box.y + state.samples.hero.box.height - 1, `${theme} filters follow the hero at ${width}px`);
        const firstCardBox = await cards.first().boundingBox();
        assert.ok(firstCardBox.y >= controlBox.y + controlBox.height - 1, `${theme} gallery follows the controls at ${width}px`);
        await page.screenshot({ path: path.join(output, `baby-shower-hero-${theme}-${width}.png`),
          clip: { x: 0, y: state.samples.hero.box.y, width,
            height: Math.ceil(controlBox.y + controlBox.height + 24 - state.samples.hero.box.y) } });
      }
      for (const key of Object.keys(themes.light.samples)) {
        assert.deepEqual(themes.dark.samples[key].box, themes.light.samples[key].box, `${key} keeps geometry through appearance at ${width}px`);
      }
      assert.notEqual(themes.light.samples.title.color, themes.dark.samples.title.color, "hero ink follows appearance");
      assert.notEqual(themes.light.samples.search.background, themes.dark.samples.search.background, "search paper follows appearance");
      assert.notEqual(themes.light.samples.header.background, themes.dark.samples.header.background, "header paper follows appearance");
      const generate = hero.getByRole("button", { name: "Generate with Envitefy", exact: true });
      await generate.focus();
      const focus = await generate.evaluate((node) => ({ active: node === document.activeElement,
        width: getComputedStyle(node).outlineWidth, style: getComputedStyle(node).outlineStyle,
        height: node.getBoundingClientRect().height }));
      assert.ok(focus.active && parseFloat(focus.width) > 0 && focus.style !== "none", "generation action has visible keyboard focus");
      assert.ok(focus.height >= 44, "generation action remains touch accessible");

      const search = page.getByRole("searchbox");
      await search.fill("zzzz-no-matching-baby-shower-design");
      await page.waitForFunction(() => !document.querySelector("[data-template-masonry-card]"));
      assert.match(await page.locator("[data-baby-shower-template-gallery]").innerText(), /No templates match/);
      await search.fill("");
      await cards.first().waitFor();
      const design = byId.get("pear-orchard-cradle");
      await page.getByRole("combobox", { name: "Style", exact: true }).selectOption(design.style);
      await search.fill(design.name);
      await page.waitForFunction((id) => {
        const cards = [...document.querySelectorAll("[data-template-masonry-card]")];
        return cards.length === 1 && cards[0].dataset.templateMasonryCard === id;
      }, design.id);
      assert.equal(await cards.first().getByRole("link").getAttribute("href"), templateEditorHref("baby-showers", design.id));
      await page.evaluate(() => scrollTo(0, 0));
      const selectedDark = await appearance(page);
      await page.evaluate(() => window.__setBabyShowerGalleryAppearance("light"));
      const selectedLight = await appearance(page);
      assert.deepEqual(selectedLight.filters, selectedDark.filters, "search and style survive appearance change");
      assert.deepEqual(selectedLight.cards, [design.id]);
      assert.deepEqual(await authoredAppearance(page), authored);
      assert.deepEqual(errors, [], `no browser runtime errors at ${width}px`);
      assert.deepEqual(unexpected, [], `browsing and filtering make no network writes at ${width}px`);
      await context.close();
    }
  } finally { await browser.close(); }
});

test("baby-shower generation preserves authentication and the eight-card featured collection", { timeout: 240000 }, async () => {
  await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    for (const width of [1440, 390]) {
      const unexpected = [], errors = [];
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      await serve(context, unexpected);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/baby-showers/templates`);
      const hero = page.locator("[data-baby-shower-template-hero]");
      await hero.waitFor();
      const generate = hero.getByRole("button", { name: "Generate with Envitefy", exact: true });
      await generate.focus();
      await page.keyboard.press("Enter");
      await page.locator("[data-fixture-auth-modal]").waitFor();
      assert.equal(await page.locator("[data-fixture-custom-dialog]").count(), 0, "signed-out generation requires authentication");
      await page.getByRole("button", { name: "Close account dialog" }).click();
      await page.goto(`${base}/baby-showers/templates?authenticated`);
      await generate.click();
      await page.locator('[data-fixture-custom-dialog="baby-showers"]').waitFor();
      assert.equal(await page.locator("[data-fixture-auth-modal]").count(), 0);
      await page.getByRole("button", { name: "Close design dialog" }).click();
      assert.equal(await generate.isEnabled(), true);
      await page.goto(`${base}/baby-showers/templates?featured`);
      const cards = page.locator("[data-template-masonry-card]");
      await cards.first().waitFor();
      assert.equal(await hero.count(), 0, "landing featured section retains its compact introduction");
      assert.equal(await page.getByRole("heading", { name: "Make it yours", exact: true }).count(), 1);
      assert.equal(await cards.count(), 8);
      assert.deepEqual(await cards.evaluateAll((nodes) => nodes.map((node) => node.dataset.templateMasonryCard)), catalog.slice(0, 8).map((design) => design.id));
      assert.equal(await page.getByRole("link", { name: "Browse all templates" }).getAttribute("href"), "/baby-showers/templates");
      assert.equal(await page.locator("[data-public-gallery-controls]").count(), 0);
      for (let index = 0; index < 8; index++) {
        assert.equal(await cards.nth(index).getByRole("link").getAttribute("href"), templateEditorHref("baby-showers", catalog[index].id));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, [], `generation entrypoints have no runtime errors at ${width}px`);
      assert.deepEqual(unexpected, [], "opening authentication and generation dialogs never generates or saves implicitly");
      await context.close();
    }
  } finally { await browser.close(); }
});

test("baby-shower gallery retains browser draft recovery and the complete catalog", { timeout: 240000 }, async () => {
  await buildFixture();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    const unexpected = [], errors = [];
    const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, reducedMotion: "reduce" });
    await serve(context, unexpected);
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/baby-showers/templates?draft&theme=light`);
    const resume = page.getByRole("link", { name: "Continue your browser draft" });
    await resume.waitFor();
    const href = `${templateEditorHref("baby-showers", catalog[0].id)}?draft=baby-gallery-draft`;
    assert.equal(await resume.getAttribute("href"), href);
    await page.evaluate(() => window.__setBabyShowerGalleryAppearance("dark"));
    assert.equal(await resume.getAttribute("href"), href, "theme changes retain the explicit draft destination");
    await page.reload();
    await resume.waitFor();
    assert.equal(await resume.getAttribute("href"), href, "draft recovery survives reloads");
    const cards = page.locator("[data-template-masonry-card]");
    await cards.first().waitFor();
    for (let count = await cards.count(), attempt = 0; count < catalog.length && attempt < 20; attempt++) {
      await page.locator("[data-template-autoload]").scrollIntoViewIfNeeded();
      await page.waitForFunction((previous) => document.querySelectorAll("[data-template-masonry-card]").length > previous, count);
      count = await cards.count();
    }
    assert.equal(await cards.count(), catalog.length, "progressive loading retains every released baby shower design");
    assert.deepEqual(new Set(await cards.evaluateAll((nodes) => nodes.map((node) => node.dataset.templateMasonryCard))), new Set(catalog.map((design) => design.id)));
    assert.deepEqual(errors, [], "draft recovery and progressive loading have no browser runtime errors");
    assert.deepEqual(unexpected, [], "draft recovery and catalog loading make no network writes");
    await context.close();
  } finally { await browser.close(); }
});

