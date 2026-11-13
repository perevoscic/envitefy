const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { transform } = require("lightningcss");
const { chromium } = require("playwright");
const load = require("./lib/event-messages-test-loader.cjs");
const { resolveThemeCssVariables } = load("src/themes/registry.ts");

test("the image dropzone renders from public route CSS alone on light and dark phones and desktop", { timeout: 30000 }, async () => {
  const { stylesheetDependencies } = await import("./lib/stylesheet-dependencies.mjs");
  const { Upload } = await import("lucide-react");
  const dropzoneFile = path.resolve("src/components/events/image-upload-dropzone.module.css");
  const moduleStyles = transform({ filename: dropzoneFile, code: fs.readFileSync(dropzoneFile), cssModules: true });
  const classNames = Object.fromEntries(Object.entries(moduleStyles.exports).map(([name, value]) => [name, value.name]));
  const Dropzone = load("src/components/events/ImageUploadDropzone.tsx", {
    "./image-upload-dropzone.module.css": classNames,
    "lucide-react": { Upload },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Dropzone, { label: "Upload image", busy: false, onBrowse() {}, async onFile() {} }));
  const css = stylesheetDependencies("src/components/templates/PublicTemplateEditor.tsx", { includeDynamic: false })
    .map(file => file.endsWith(".module.css")
      ? transform({ filename: path.resolve(file), code: fs.readFileSync(file), cssModules: true }).code.toString()
      : fs.readFileSync(file, "utf8")).join("\n");
  const output = path.resolve(".qa/image-upload-dropzone");
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    for (const width of [320, 390, 1280]) for (const dark of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 650 }, reducedMotion: "no-preference" });
      const variables = Object.entries(resolveThemeCssVariables("general", dark ? "dark" : "light"))
        .map(([name, value]) => `${name}:${value}`).join(";");
      await page.setContent(`<html class="${dark ? "dark" : ""}"><head><style>${css}:root{${variables}}*{box-sizing:border-box}body{margin:0;background:var(--surface);color:var(--foreground)}main{max-width:400px;padding:24px 16px;margin:auto}</style></head><body><main>${html}</main></body></html>`);
      const zone = page.getByRole("button", { name: "Upload image", exact: true });
      const surface = zone.locator(`.${classNames.surface}`);
      const bounds = await zone.boundingBox();
      assert.ok(bounds.height >= 184 && bounds.x >= 0 && bounds.x + bounds.width <= width,
        "the route stylesheet supplies a bounded, full-size drop target");
      assert.equal(await surface.evaluate(element => getComputedStyle(element).display), "flex");
      assert.equal(await zone.evaluate(element => getComputedStyle(element).borderRadius), "16px");
      await zone.hover();
      const trail = zone.locator(`.${classNames.trailCore}`);
      const motionPath = await page.evaluate(() => CSS.supports("offset-path", "rect(0 auto auto 0 round 16px)"));
      const animatedBorder = motionPath ? trail : zone.locator(`.${classNames.rim}`);
      const position = element => {
        const style = getComputedStyle(element);
        return CSS.supports("offset-path", "rect(0 auto auto 0 round 16px)") ? style.offsetDistance : style.backgroundPosition;
      };
      assert.equal(await animatedBorder.evaluate(element => getComputedStyle(element).animationPlayState), "running");
      const first = await animatedBorder.evaluate(position);
      await page.waitForFunction(({ selector, first, motionPath }) => {
        const style = getComputedStyle(document.querySelector(selector));
        return (motionPath ? style.offsetDistance : style.backgroundPosition) !== first;
      }, { selector: `.${motionPath ? classNames.trailCore : classNames.rim}`, first, motionPath }, { timeout: 3000 });
      assert.notEqual(await animatedBorder.evaluate(position), first,
        "the route stylesheet animates the perimeter on hover");
      await page.screenshot({ path: path.join(output, `route-only-${width}-${dark ? "dark" : "light"}.png`) });
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(await animatedBorder.evaluate(element => getComputedStyle(element).animationName), "none");
      await page.close();
    }
  } finally { await browser.close(); }
});
