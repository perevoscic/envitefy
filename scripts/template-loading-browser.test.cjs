const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { chromium } = require("playwright");
const loadTs = require("./lib/event-messages-test-loader.cjs");

function loadingStages() {
  let status = "loading";
  const stubs = {
    "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
    "next-auth/react": { useSession: () => ({ status, data: status === "authenticated" ? { user: { email: "host@example.com" } } : null, update: async () => {} }) },
    "@/hooks/useCreationAccess": { useCreationAccess: () => ({ access: null, loading: true, error: "", reload: async () => {} }) },
    "@/components/auth/AuthModal": { __esModule: true, default: () => null },
    "@/components/UnsavedProgressProvider": { useUnsavedProgress: () => ({ requestLeave: () => {}, allowNavigation: () => {} }) },
    "@/lib/event-history-client": { useEventHistoryClient: () => ({ fetch: async () => { throw new Error("Loading markup must not request event data."); } }) },
    "next/dynamic": { __esModule: true, default: (_load, options) => {
      function EditorChunk() { return options.loading(); }
      EditorChunk.loading = options.loading;
      return EditorChunk;
    } },
  };
  const cache = new Map();
  const Boundary = loadTs("src/components/event-create/CreationAccessBoundary.tsx", stubs, cache).default;
  const Provider = loadTs("src/components/templates/TemplateEditorContext.tsx", stubs, cache).default;
  const PublicEditor = loadTs("src/components/templates/PublicTemplateEditor.tsx", stubs, cache).default;
  const props = { category: "gymnastics", templateId: "airborne-atlas" };
  const access = renderToStaticMarkup(React.createElement(Boundary, { product: "event_page", category: props.category }, "Private fields"));
  status = "authenticated";
  const draft = renderToStaticMarkup(React.createElement(Provider, props, "Private fields"));
  const editor = PublicEditor(props).props.children.props.children;
  const module = `<div class="shell"><div class="workspace">${renderToStaticMarkup(editor.type.loading())}</div></div>`;
  for (const markup of [access, draft, module]) {
    assert.match(markup, /data-template-editor-loading="true"/);
    assert.doesNotMatch(markup, /Private fields|Opening your event workspace|Loading your editor/);
  }
  return { access, draft, module };
}

test("access, draft and lazy-editor loading use the same animated card without a layout jump", { timeout: 60000 }, async () => {
  const stages = loadingStages();
  const { resolveThemeCssVariables } = loadTs("src/themes/registry.ts");
  const css = fs.readFileSync("src/components/templates/template-editor.module.css", "utf8");
  const appearance = fs.readFileSync("src/styles/app-appearance.css", "utf8");
  const output = path.resolve("output/template-loading-stages");
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.route("**/*", route => route.abort());
    const html = (theme, markup) => {
      const vars = Object.entries(resolveThemeCssVariables("general", theme)).map(([key, value]) => `${key}:${value}`).join(";");
      return `<!doctype html><html class="${theme === "dark" ? "dark" : ""}" style="${vars};--app-content-top-inset:64px"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*,*::before,*::after{box-sizing:border-box}body{margin:0;padding-top:64px;font-family:Arial,sans-serif;background:var(--background)}${appearance}${css}</style></head><body>${markup}</body></html>`;
    };
    for (const theme of ["light", "dark"]) {
      for (const [width, height] of [[320, 707], [390, 844], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        let firstBounds;
        for (const [stage, markup] of Object.entries(stages)) {
          await page.setContent(html(theme, markup));
          assert.equal(await page.locator("[data-template-editor-loading]").count(), 1, stage);
          assert.match(await page.getByRole("status").ariaSnapshot(), /Opening your template…/);
          const message = await page.locator("[data-loading-message]").getAttribute("data-loading-message");
          const letters = Array.from(message).filter(letter => letter !== " ").length;
          assert.equal(await page.evaluate(() => document.getAnimations().length), 2 + letters, `${stage} keeps the card and incoming text effects`);
          const bounds = await page.locator(".openingCard").boundingBox();
          firstBounds ||= bounds;
          assert.deepEqual(bounds, firstBounds, `${theme}/${width}/${stage} keeps the card in the same position`);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          await page.screenshot({ path: path.join(output, `${theme}-${width}-${stage}.png`) });
        }
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [stage, markup] of Object.entries(stages)) {
      await page.setContent(html("dark", markup));
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
      assert.match(await page.getByRole("status").ariaSnapshot(), /Opening your template…/);
    }
  } finally { await browser.close(); }
});

test("ten phrases roll continuously without revealing incoming words early, survive handoffs and stop for errors or reduced motion", { timeout: 60000 }, async () => {
  const compiled = require("next/dist/compiled/webpack/webpack");
  compiled.init();
  const output = path.resolve("output/template-loading-cycle");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/template-loading-cycle.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: { "@": path.resolve("src") } },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 707 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
      if (new URL(route.request().url()).pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
      return route.fulfill({ contentType: "text/html; charset=utf-8", body: '<!doctype html><html><head><meta charset="utf-8"><style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>' });
    });
    await page.goto("http://template-loading-cycle.test/");
    await page.waitForFunction(() => window.templateLoadingCycle && Number(document.querySelector("[data-loading-round]")?.getAttribute("data-loading-round")) > 0);
    const caption = page.locator("[data-loading-message]");
    const phrases = await page.evaluate(() => window.templateLoadingCycle.phrases);
    assert.equal(phrases.length, 10);
    assert.equal(new Set(phrases).size, 10);
    const first = await caption.getAttribute("data-loading-message");
    const firstRound = await caption.getAttribute("data-loading-round");
    const bounds = await page.locator('[class*="openingCardContent"]').boundingBox();
    assert.equal(await page.locator('[data-loading-face="out"]').count(), 0, "the first phrase has no preloaded visible front face");
    assert.equal(await page.locator('[class*="openingLetterIn"]').last().evaluate(element => getComputedStyle(element).opacity), "0", "incoming letters remain hidden until their own roll begins");
    await page.waitForTimeout(150);
    await page.evaluate(() => window.templateLoadingCycle.remount());
    assert.equal(await caption.getAttribute("data-loading-message"), first, "a loading-stage handoff retains the current phrase");
    assert.equal(await caption.getAttribute("data-loading-round"), firstRound);
    const gap = await page.evaluate(async previous => {
      const letters = document.querySelectorAll('[class*="openingLetterIn"]');
      await letters[letters.length - 1].getAnimations()[0].finished;
      const endedAt = performance.now();
      const root = document.querySelector("[data-loading-message]");
      if (root.getAttribute("data-loading-message") !== previous) return 0;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { observer.disconnect(); reject(new Error("The next roll did not start after the final letter finished.")); }, 2000);
        const observer = new MutationObserver(() => {
          if (root.getAttribute("data-loading-message") === previous) return;
          clearTimeout(timeout);
          observer.disconnect();
          resolve(performance.now() - endedAt);
        });
        observer.observe(root, { attributes: true, attributeFilter: ["data-loading-message"] });
      });
    }, first);
    assert.ok(gap < 400, `the next roll starts immediately, without a reading pause (${gap}ms)`);
    assert.equal(await caption.getAttribute("data-loading-previous-message"), first, "the previous words roll out while the next words roll in");
    assert.equal(await page.locator('[class*="openingLetterIn"]').last().evaluate(element => getComputedStyle(element).opacity), "0", "the next phrase is not shown before its entrance");
    const seen = [first, await caption.getAttribute("data-loading-message")];
    while (seen.length < 11) {
      const previous = seen.at(-1);
      await page.waitForFunction(value => document.querySelector("[data-loading-message]")?.getAttribute("data-loading-message") !== value, previous);
      const message = await caption.getAttribute("data-loading-message");
      assert.ok(phrases.includes(message));
      assert.notEqual(message, previous);
      seen.push(message);
      assert.deepEqual(await page.locator('[class*="openingCardContent"]').boundingBox(), bounds, "phrase length never moves the card");
    }
    assert.deepEqual(new Set(seen.slice(0, 10)), new Set(phrases), "each shuffled round uses all ten phrases once");
    assert.match(await page.getByRole("status").ariaSnapshot(), /Opening your template…/);
    await page.evaluate(() => window.templateLoadingCycle.fail());
    assert.match(await page.getByRole("status").innerText(), /Your draft could not be opened/);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    await page.waitForTimeout(1000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => window.templateLoadingCycle.show());
    await page.waitForFunction(() => document.querySelector("[data-loading-round]")?.getAttribute("data-loading-round") === "1");
    const staticMessage = await caption.getAttribute("data-loading-message");
    await page.waitForTimeout(1200);
    assert.equal(await caption.getAttribute("data-loading-message"), staticMessage);
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
    assert.equal(await page.locator('[class*="openingLetterIn"]').last().evaluate(element => getComputedStyle(element).opacity), "1", "reduced motion leaves the phrase readable");
    await page.evaluate(() => window.templateLoadingCycle.hide());
    await page.waitForTimeout(1000);
    assert.equal(await page.locator("[data-template-editor-loading]").count(), 0);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
