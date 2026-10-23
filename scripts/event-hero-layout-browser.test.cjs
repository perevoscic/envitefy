const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("premade hero thumbnails rearrange artwork and title while native sections stay stacked and save explicitly", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/event-hero-layout-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-hero-layout.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: { "@": path.resolve("src") } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    for (const screen of [
      { name: "desktop", viewport: { width: 1440, height: 1000 }, width: 1180 },
      { name: "narrow-canvas", viewport: { width: 1440, height: 1000 }, width: 620 },
      { name: "phone", viewport: { width: 390, height: 844 }, width: 1180 },
    ]) {
      const page = await browser.newPage({ viewport: screen.viewport, reducedMotion: "reduce" });
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", (route) => new URL(route.request().url()).pathname === "/fixture.js"
        ? route.fulfill({ contentType: "text/javascript", body: script })
        : route.fulfill({ contentType: "text/html", body: '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font:16px Arial,sans-serif;background:#f6f0e5}h1{font-size:38px}section{padding:16px;border:1px solid #aaa}article{container-type:normal}#root [data-original-hero] img{display:block;width:100%;height:250px;object-fit:cover}button{min-height:44px}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>' }));
      await page.goto(`http://localhost:43140/?width=${screen.width}`);
      await page.locator("[data-original-hero]").waitFor();
      assert.equal(await page.getByText("Template layout", { exact: true }).count(), 0);
      assert.equal(await page.getByText("Keep this design’s original section arrangement.", { exact: true }).count(), 0);
      const controls = page.getByRole("complementary", { name: "Layout controls", exact: true });
      assert.equal(await controls.getByRole("combobox").count(), 0, "hero choices do not expose dropdowns");
      assert.equal(await controls.getByRole("slider").count(), 0, "hero choices do not expose sliders");
      assert.equal(await controls.locator("input,select,textarea").count(), 0, "hero layout is a thumbnail gallery");
      assert.equal(await controls.getByRole("button", { name: "Reset", exact: true }).count(), 0, "Reset stays hidden until a hero layout is selected");
      const presets = [
        { label: "Wide banner", imagePosition: "top", imageShape: "landscape", titlePosition: "below", titleAlign: "center" },
        { label: "Title first", imagePosition: "top", imageShape: "landscape", titlePosition: "above", titleAlign: "center" },
        { label: "Image left", imagePosition: "left", imageShape: "square", titlePosition: "below", titleAlign: "left" },
        { label: "Image right", imagePosition: "right", imageShape: "square", titlePosition: "below", titleAlign: "left" },
        { label: "Circle portrait", imagePosition: "left", imageShape: "circle", titlePosition: "below", titleAlign: "left" },
        { label: "Arch portrait", imagePosition: "top", imageShape: "arch", titlePosition: "below", titleAlign: "center" },
        { label: "Square portrait", imagePosition: "top", imageShape: "square", titlePosition: "below", titleAlign: "center" },
        { label: "Tall portrait", imagePosition: "top", imageShape: "portrait", titlePosition: "below", titleAlign: "center" },
        { label: "Centered circle", imagePosition: "top", imageShape: "circle", titlePosition: "below", titleAlign: "center" },
        { label: "Circle right", imagePosition: "right", imageShape: "circle", titlePosition: "below", titleAlign: "left" },
        { label: "Arch left", imagePosition: "left", imageShape: "arch", titlePosition: "below", titleAlign: "left" },
        { label: "Arch right", imagePosition: "right", imageShape: "arch", titlePosition: "below", titleAlign: "left" },
      ];
      assert.equal(await controls.getByRole("button", { name: /^Choose .* hero layout$/ }).count(), presets.length);
      const bodyGeometry = async () => page.locator("[data-fixture-body]").evaluate((body) => {
        const origin = body.getBoundingClientRect();
        return [...body.querySelectorAll("section")].map((section) => {
          const box = section.getBoundingClientRect();
          return { id: section.id, x: box.x - origin.x, y: box.y - origin.y, width: box.width, height: box.height, text: section.textContent };
        });
      });
      const baseline = await bodyGeometry();
      for (const { label, imagePosition, imageShape, titlePosition, titleAlign } of presets) {
          const button = controls.getByRole("button", { name: `Choose ${label} hero layout`, exact: true });
          assert.equal(await button.locator("img").count(), 1, `${label}: thumbnail contains the event artwork`);
          const bounds = await button.boundingBox();
          assert.ok(bounds.height >= 44 && bounds.width >= 44, `${label}: thumbnail retains a 44px target`);
          if (label === "Wide banner") {
            await button.focus();
            await page.keyboard.press("Enter");
          } else {
            await button.click();
          }
          assert.equal(await button.getAttribute("aria-pressed"), "true", `${label}: chosen thumbnail is identified`);
          assert.equal(await controls.locator('button[aria-pressed="true"]').count(), 1, "one hero preset is selected");
          assert.equal(await page.locator("[data-event-hero]").getAttribute("data-image-position"), imagePosition);
          assert.equal(await page.locator("[data-event-hero]").getAttribute("data-image-shape"), imageShape);
          assert.equal(await page.locator("[data-event-hero]").getAttribute("data-title-position"), titlePosition);
          assert.equal(await page.locator("[data-event-hero-copy] h1").evaluate((node) => getComputedStyle(node).textAlign), titleAlign);
          const geometry = await page.locator("[data-event-hero]").evaluate((hero) => {
            const box = (element) => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }; };
            const artwork = hero.querySelector("[data-event-hero-artwork]");
            return { hero: box(hero), artwork: box(artwork), copy: box(hero.querySelector("[data-event-hero-copy]")), radius: getComputedStyle(artwork).borderRadius, overflow: document.documentElement.scrollWidth - innerWidth };
          });
          const context = `${screen.name}/${label}`;
          assert.ok(geometry.overflow <= 1, `${context}: no horizontal overflow`);
          const expectedRatio = imageShape === "landscape" ? 16 / 9 : ["arch", "portrait"].includes(imageShape) ? 3 / 4 : 1;
          assert.ok(Math.abs(geometry.artwork.width / geometry.artwork.height - expectedRatio) < 0.02, `${context}: artwork uses the chosen frame ratio`);
          if (imageShape === "circle") assert.match(geometry.radius, /50%/);
          if (imageShape === "arch") assert.match(geometry.radius, /50%.*0/);
          if (screen.name === "desktop" && imagePosition !== "top") {
            const left = imagePosition === "left" ? geometry.artwork : geometry.copy;
            const right = imagePosition === "left" ? geometry.copy : geometry.artwork;
            assert.ok(right.x >= left.right - 1, `${context}: artwork and title sit beside each other in the selected order`);
          } else {
            assert.ok(geometry.copy.y >= geometry.artwork.bottom - 1 || geometry.artwork.y >= geometry.copy.bottom - 1, `${context}: a narrow canvas stacks the header without overlap`);
          }
          if (imagePosition === "top") assert.equal(geometry.copy.y < geometry.artwork.y, titlePosition === "above", `${context}: title position is visible`);
          assert.deepEqual(await bodyGeometry(), baseline, `${context}: hero changes retain body widths, order and text`);
          assert.equal(await page.evaluate(() => localStorage.getItem("hero-layout")), null, `${context}: choices do not save automatically`);
      }
      const reset = controls.getByRole("button", { name: "Reset", exact: true });
      const heading = controls.getByRole("heading", { name: "Layout", exact: true });
      assert.equal(await reset.evaluate((node) => node.parentElement === node.parentElement.querySelector("h2")?.parentElement), true, "Reset shares the Layout heading row");
      const resetBox = await reset.boundingBox();
      const headingBox = await heading.boundingBox();
      assert.ok(resetBox.x >= headingBox.x + headingBox.width - 1, "Reset is placed to the right of Layout");
      assert.ok(Math.abs(resetBox.y + resetBox.height / 2 - headingBox.y - headingBox.height / 2) < 1, "Reset aligns vertically with Layout");
      const selectedPreset = controls.getByRole("button", { name: "Choose Arch right hero layout", exact: true });
      await selectedPreset.click();
      await page.locator("[data-original-hero]").waitFor();
      assert.equal(await selectedPreset.getAttribute("aria-pressed"), "false", "clicking the selected thumbnail deselects it");
      assert.equal(await reset.count(), 0, "deselection hides Reset");
      assert.deepEqual(await bodyGeometry(), baseline, "deselection preserves body sections");
      const keyboardPreset = controls.getByRole("button", { name: "Choose Title first hero layout", exact: true });
      await keyboardPreset.focus();
      await page.keyboard.press("Enter");
      assert.equal(await keyboardPreset.getAttribute("aria-pressed"), "true", "keyboard activates the thumbnail");
      await page.keyboard.press("Space");
      await page.locator("[data-original-hero]").waitFor();
      assert.equal(await keyboardPreset.getAttribute("aria-pressed"), "false", "keyboard activation also deselects the current thumbnail");
      await selectedPreset.click();
      await page.getByRole("button", { name: "Save draft", exact: true }).click();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("hero-layout")));
      assert.equal(saved.hero.imageShape, "arch");
      assert.equal(saved.hero.titleAlign, "left");
      assert.equal(saved.hero.imagePositionY, 50);
      assert.equal(saved.layout, undefined, "new hero choices do not create body columns");
      await page.reload();
      await page.locator('[data-event-hero][data-image-shape="arch"]').waitFor();
      assert.equal(await page.getByRole("button", { name: "Choose Arch right hero layout", exact: true }).getAttribute("aria-pressed"), "true");
      assert.deepEqual(await bodyGeometry(), baseline, "saved hero keeps section content and geometry after reload");
      await page.screenshot({ path: path.join(output, `${screen.name}.png`), fullPage: true });
      await controls.screenshot({ path: path.join(output, `picker-${screen.name}.png`) });
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await page.locator("[data-original-hero]").waitFor();
      assert.equal(await page.locator("[data-event-hero]").count(), 0, "reset restores the authored header");
      assert.deepEqual(await bodyGeometry(), baseline, "reset retains the section content and geometry");
      await page.goto(`http://localhost:43140/?width=${screen.width}&placeholder=1`);
      await controls.getByRole("button", { name: "Choose Wide banner hero layout", exact: true }).waitFor();
      assert.equal(await controls.getByText("Event title", { exact: true }).count(), 12, "empty event titles use the requested thumbnail placeholder");
      assert.equal(await controls.getByText("Your event", { exact: true }).count(), 0);
      assert.deepEqual(errors, [], `${screen.name}: no browser errors`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
