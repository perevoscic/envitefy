const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("Event Page layouts keep readable widths and respond to the canvas in editors and guest pages", {
  timeout: 120000,
}, async () => {
  const output = path.resolve(".qa/event-section-layout-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-section-layout.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: { "@": path.resolve("src") } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/events/EventEditorFields.tsx";',
    { from: path.resolve("scripts/event-section-layout-fixture.css") },
  )).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(10000);
  const errors = [];
  const failures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => new URL(route.request().url()).pathname === "/fixture.js"
    ? route.fulfill({ contentType: "text/javascript", body: script })
    : route.fulfill({ contentType: "text/html", body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;background:#f6f0e5;font-family:system-ui,sans-serif}*{box-sizing:border-box}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>` }));
  try {
    for (const screen of [
      { name: "wide-desktop", viewport: { width: 1440, height: 1000 }, width: 1240 },
      { name: "narrow-desktop", viewport: { width: 1440, height: 1000 }, width: 620 },
      { name: "phone", viewport: { width: 390, height: 844 }, width: 1240 },
    ]) {
      await page.setViewportSize(screen.viewport);
      for (const design of ["airborne-atlas", "citrus-springboard", "desert-dismount"]) {
        for (const editing of [true, false]) {
          for (const layout of ["template", "split", "banner", "poster", "editorial", "spotlight", "minimal", "cards"]) {
            const context = `${design}/${screen.name}/${editing ? "editing" : "guest"}/${layout}`;
            await page.goto(`http://localhost:43139/?layout=${layout}&design=${design}&width=${screen.width}${editing ? "&editing" : ""}`);
            await page.getByRole("heading", { name: "Meet Details", exact: true }).waitFor();
            const canvas = page.locator('[data-fixture-body] [class*="gymnastics_program_module_css_chapters"]');
            if (editing && ["poster", "minimal"].includes(layout))
              await page.screenshot({ path: path.join(output, `${design === "airborne-atlas" ? "" : `${design}-`}${screen.name}-${layout}.png`), fullPage: true });
            const geometry = await canvas.evaluate((element) => {
              const bounds = (node) => {
                const box = node.getBoundingClientRect();
                return { x: box.x, y: box.y, width: box.width, right: box.right, bottom: box.bottom };
              };
              const canvas = bounds(element);
              const parent = bounds(element.parentElement);
              const style = getComputedStyle(element);
              const parentStyle = getComputedStyle(element.parentElement);
              const paddingLeft = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
              const paddingRight = parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth);
              const navigation = element.previousElementSibling;
              const availableX = navigation && parentStyle.gridTemplateColumns.split(" ").length > 1
                ? bounds(navigation).right + (parseFloat(parentStyle.columnGap) || 0) : parent.x;
              return {
                canvas,
                parent,
                available: { x: availableX, width: parent.right - availableX },
                content: { x: canvas.x + paddingLeft, width: canvas.width - paddingLeft - paddingRight },
                columnGap: parseFloat(style.columnGap) || 0,
                rows: [...element.querySelectorAll(":scope > [data-section-row], :scope > [data-section-group]")].map(bounds),
                sections: [...element.querySelectorAll("[data-editable-section]")].map((section) => ({
                  box: bounds(section),
                  overflow: section.scrollWidth - section.clientWidth,
                  buttons: [...section.querySelectorAll("button")].filter((button) => button.getBoundingClientRect().width).map(bounds),
                })),
                documentOverflow: document.documentElement.scrollWidth - innerWidth,
              };
            });
            try {
              assert.ok(geometry.canvas.width >= Math.min(geometry.parent.width * 0.6, 600), `${context}: canvas must use its available reading width: ${JSON.stringify(geometry.canvas)}`);
              assert.ok(geometry.canvas.right <= geometry.parent.right + 1, `${context}: canvas stays inside its parent`);
              assert.ok(geometry.documentOverflow <= 1, `${context}: page has no horizontal overflow`);
              if (["poster", "minimal"].includes(layout)) {
                const expectedWidth = Math.min(geometry.available.width, layout === "poster" ? 960 : 800);
                const expectedX = geometry.available.x + (geometry.available.width - expectedWidth) / 2;
                assert.ok(Math.abs(geometry.canvas.width - expectedWidth) <= 1, `${context}: canvas uses its full capped reading width`);
                assert.ok(Math.abs(geometry.canvas.x - expectedX) <= 1, `${context}: canvas centers within its available program column`);
              }
              for (const section of geometry.sections) {
                assert.ok(section.overflow <= 1, `${context}: section contents stay inside their card`);
                for (const button of section.buttons)
                  assert.ok(button.x >= section.box.x - 1 && button.right <= section.box.right + 1, `${context}: section controls fit their card`);
              }
              if (["split", "cards"].includes(layout)) {
                assert.equal(geometry.rows.length, 3, `${context}: all sections render`);
                const [first, second] = geometry.rows;
                if (screen.name === "wide-desktop") {
                  assert.ok(Math.abs(first.y - second.y) <= 1, `${context}: wide canvas places sections in two columns`);
                  assert.ok(second.x >= first.right, `${context}: columns do not overlap`);
                  const halfWidth = (geometry.content.width - geometry.columnGap) / 2;
                  assert.ok(Math.abs(first.width - halfWidth) <= 1 && Math.abs(second.width - halfWidth) <= 1,
                    `${context}: both columns use half the available canvas, independent of the native template`);
                } else {
                  assert.ok(second.y >= first.bottom, `${context}: narrow canvas stacks sections`);
                  assert.ok(Math.abs(first.width - geometry.content.width) <= 1, `${context}: narrow sections use the full canvas`);
                }
              }
              if (layout === "editorial" && screen.name !== "wide-desktop") {
                for (const row of geometry.rows) {
                  assert.ok(Math.abs(row.x - geometry.content.x) <= 1, `${context}: narrow editorial sections have no staggered indent`);
                  assert.ok(Math.abs(row.width - geometry.content.width) <= 1, `${context}: narrow editorial sections use the full canvas`);
                }
              }
              if (!editing) assert.equal(await canvas.getByRole("button").count(), 0, `${context}: guest view omits editor controls`);
            } catch (error) {
              failures.push(error.message);
            }
          }
        }
      }
    }
    assert.deepEqual(errors, [], "fixture has no browser errors");
    assert.equal(failures.length, 0, failures.join("\n"));
  } finally {
    await browser.close();
  }
});
