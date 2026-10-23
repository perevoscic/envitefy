const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { createJiti } = require("jiti");
const { chromium } = require("playwright");
const { transform } = require("lightningcss");

function cssModule(file) {
  const result = transform({ filename: file, code: fs.readFileSync(file), cssModules: true });
  return {
    css: result.code.toString(),
    names: Object.fromEntries(
      Object.entries(result.exports).map(([key, value]) => [key, value.name]),
    ),
  };
}

test("editor settings expose the shared aurora while Preview and embedded editors retain authored paper", {
  timeout: 60000,
}, async () => {
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none); @source "../components/ui/gradient-backgrounds.tsx";',
    );
  const globals = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  const workspace = cssModule("src/components/events/event-editor.module.css");
  const navigation = cssModule("src/components/navigation/navigation-appearance.module.css");
  const jiti = createJiti(__filename, {
    alias: { "@": path.resolve("src") },
    jsx: { runtime: "automatic" },
  });
  const { resolveThemeCssVariables } = jiti("../src/themes/registry.ts");
  const { GradientBackgroundLayer } = jiti("../src/components/ui/gradient-backgrounds.tsx");
  const gradient = renderToStaticMarkup(React.createElement(GradientBackgroundLayer));
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const output = path.resolve("output/event-editor-navigation");
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const mode of ["light", "dark"]) {
      for (const paper of ["#dce7ee", "#163e32"]) {
        const variables = Object.entries(resolveThemeCssVariables("general", mode))
          .map(([key, value]) => `${key}:${value}`)
          .join(";");
        await page.setContent(
          `<!doctype html><html class="${mode === "dark" ? "dark" : ""}" data-event-page-color="${paper}" style="${variables};--event-page-chrome-color:${paper}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${globals}\n${workspace.css}\n${navigation.css}\nbody{margin:0}[data-app-mobile-topbar]{position:fixed;inset:0 0 auto;height:86px;padding:12px;z-index:10}.nav-chrome-glass-header{height:66px;border-radius:26px}[data-app-main-content]{position:relative;isolation:isolate;padding-top:94px;min-height:100dvh;--app-content-top-inset:94px}[data-fixture-content]{position:relative;z-index:10}</style></head><body><header class="${navigation.names.chrome}" data-app-mobile-topbar="app"><div class="nav-chrome-glass-header">Envitefy navigation</div></header><main data-app-main-content="true">${gradient}<div data-fixture-content><section class="${workspace.names.workspace}" data-event-page-editor data-editing="false" data-mobile-editing="false" data-embedded="false"><div class="${workspace.names.body}"><div class="${workspace.names.preview}" style="background:${paper}"><h1>Original event page</h1></div><aside class="${workspace.names.panel}" aria-label="Event editing controls"><h2>Event details</h2><input aria-label="Event title" value="Unchanged host title"></aside></div></section></div></main></body></html>`,
        );
        const colors = () =>
          page.evaluate(() => {
            const root = document.documentElement;
            const nav = document.querySelector('[data-app-mobile-topbar="app"]');
            const panel = document.querySelector('[aria-label="Event editing controls"]');
            const rounded = document.querySelector(".nav-chrome-glass-header");
            const gradient = document.querySelector('[data-project-gradient-background="true"]');
            return {
              root: getComputedStyle(root).backgroundColor,
              body: getComputedStyle(document.body).backgroundColor,
              main: getComputedStyle(document.querySelector("main")).backgroundColor,
              outerNav: getComputedStyle(nav).backgroundColor,
              roundedNav: getComputedStyle(rounded).background,
              panel: getComputedStyle(panel).backgroundColor,
              workspace: getComputedStyle(document.querySelector("[data-event-page-editor]")).backgroundColor,
              preview: getComputedStyle(document.querySelector('[aria-label="Event editing controls"]').previousElementSibling).backgroundColor,
              gradientDisplay: getComputedStyle(gradient).display,
              gradientImage: getComputedStyle(gradient).backgroundImage,
              gradientPosition: getComputedStyle(gradient).position,
              gradientPointerEvents: getComputedStyle(gradient).pointerEvents,
              safeTop: getComputedStyle(document.body, "::before").backgroundColor,
              safeBottom: getComputedStyle(document.body, "::after").backgroundColor,
              registeredPaper: root.getAttribute("data-event-page-color"),
              registeredColor: root.style.getPropertyValue("--event-page-chrome-color"),
            };
          });
        const clean = await colors();
        const expectedPaper = paper === "#dce7ee" ? "rgb(220, 231, 238)" : "rgb(22, 62, 50)";
        const transparent = "rgba(0, 0, 0, 0)";
        for (const field of ["root", "body", "main", "safeTop", "safeBottom", "preview"])
          assert.equal(clean[field], expectedPaper, `${mode}: clean ${field} keeps authored paper`);
        for (const field of ["workspace", "panel"])
          assert.equal(clean[field], transparent, `${mode}: ${field} has no opaque editor canvas`);
        assert.equal(clean.gradientDisplay, "none", `${mode}: clean page hides the app aurora`);
        assert.equal(
          clean.outerNav,
          transparent,
          `${mode}: navigation has no outer surface`,
        );
        await page.evaluate(() => {
          const editor = document.querySelector("[data-event-page-editor]");
          editor.setAttribute("data-mobile-editing", "true");
        });
        const editing = await colors();
        for (const field of ["root", "body", "main", "safeTop", "safeBottom", "workspace", "panel"])
          assert.equal(
            editing[field],
            transparent,
            `${mode}: mobile ${field} exposes the shared app background`,
          );
        assert.equal(editing.gradientDisplay, "block", `${mode}: mobile settings show the app aurora`);
        assert.match(editing.gradientImage, /radial-gradient\(/, `${mode}: settings use the real aurora gradient`);
        assert.equal(editing.gradientPosition, "fixed", `${mode}: aurora continues behind the navbar`);
        assert.equal(editing.gradientPointerEvents, "none", `${mode}: aurora does not intercept editor input`);
        assert.equal(editing.preview, expectedPaper, `${mode}: settings retain the original preview paper`);
        assert.equal(
          editing.outerNav,
          transparent,
          `${mode}: controls do not paint a navbar surround`,
        );
        assert.equal(
          editing.roundedNav,
          clean.roundedNav,
          `${mode}: rounded navigation retains its appearance`,
        );
        assert.equal(
          editing.registeredPaper,
          paper,
          `${mode}: editor chrome never replaces authored paper metadata`,
        );
        assert.equal(
          editing.registeredColor,
          paper,
          `${mode}: registered paper remains available to the preview`,
        );
        if (paper === "#dce7ee")
          await page.screenshot({ path: path.join(output, `${mode}-editing.png`) });
        await page.locator("[data-event-page-editor]").evaluate((element) => {
          element.setAttribute("data-editing", "true");
          element.setAttribute("data-mobile-editing", "false");
        });
        for (const width of [768, 1023, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          const desktop = await colors();
          for (const field of ["root", "body", "main", "safeTop", "safeBottom", "workspace", "panel"])
            assert.equal(desktop[field], transparent, `${mode}: ${width}px editing ${field} exposes the app background`);
          assert.equal(desktop.gradientDisplay, "block", `${mode}: ${width}px editing shows the shared aurora`);
          assert.equal(desktop.gradientImage, editing.gradientImage, `${mode}: desktop uses the same aurora`);
          assert.equal(desktop.preview, expectedPaper, `${mode}: ${width}px preview keeps authored paper`);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page
          .locator("[data-event-page-editor]")
          .evaluate((element) => {
            element.setAttribute("data-mobile-editing", "true");
            element.setAttribute("data-embedded", "true");
          });
        const embedded = await colors();
        assert.equal(
          embedded.root,
          expectedPaper,
          `${mode}: embedded editors do not recolor the app shell`,
        );
        assert.equal(embedded.gradientDisplay, "none", `${mode}: embedded editors keep the app aurora hidden`);
        await page.locator("[data-event-page-editor]").evaluate((element) => {
          element.setAttribute("data-embedded", "false");
          element.setAttribute("data-editing", "false");
          element.setAttribute("data-mobile-editing", "false");
        });
        const restored = await colors();
        for (const field of ["root", "body", "main", "safeTop", "safeBottom", "preview"])
          assert.equal(restored[field], expectedPaper, `${mode}: closing controls restores ${field} paper`);
        assert.equal(restored.gradientDisplay, "none", `${mode}: returning to Preview hides the app aurora`);
        assert.equal(
          restored.roundedNav,
          clean.roundedNav,
          `${mode}: returning to Preview preserves navigation`,
        );
        assert.equal(
          await page.getByLabel("Event title").inputValue(),
          "Unchanged host title",
          `${mode}: state changes preserve editor fields`,
        );
      }
    }
  } finally {
    await browser.close();
  }
});
