const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("signup and login remain scrollable with a reachable Close on short screens", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/auth-modal-browser");
  fs.mkdirSync(output, { recursive: true });
  const mocks = path.join(output, "mocks.tsx");
  fs.writeFileSync(mocks, `
    export function useSidebar() { return { setIsCollapsed() {} }; }
    export function signIn() { throw new Error("This layout test must never submit authentication"); }
    export default function Link({ children, ...props }) { return <a {...props}>{children}</a>; }
  `);
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/auth-modal.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: { "@/app/sidebar-context": mocks, "next-auth/react": mocks, "next/link": mocks, "@": path.resolve("src") },
      },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }, { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace(
    '@import "tailwindcss";',
    '@import "tailwindcss" source(none); @source "../components/auth"; @source "../components/branding/EnvitefyWordmark.tsx"; @source "../components/ui/button.tsx";',
  );
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 568 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
      if (url.hostname === "auth-modal.test" && url.pathname === "/") return route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
      });
      return route.abort();
    });
    await page.goto("http://auth-modal.test/");
    for (const viewport of [{ width: 390, height: 568 }, { width: 667, height: 375 }, { width: 320, height: 480 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport);
      for (const mode of ["signup", "login"]) {
        await page.getByRole("button", { name: `Open ${mode}`, exact: true }).click();
        const dialog = page.getByRole("dialog", { name: mode === "signup" ? "Create an account" : "Log in", exact: true });
        const close = dialog.getByRole("button", { name: "Close", exact: true });
        const bounds = await close.boundingBox();
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height,
          `${mode} Close must fit ${viewport.width}x${viewport.height}: ${JSON.stringify(bounds)}`);
        assert.ok(bounds.height >= 44, "Close retains its touch target");
        await dialog.getByRole("button", { name: mode === "signup" ? "Create account" : "Sign in", exact: true }).scrollIntoViewIfNeeded();
        const actions = await dialog.getByRole("button", { name: mode === "signup" ? "Create account" : "Sign in", exact: true }).boundingBox();
        assert.ok(actions.y >= -1 && actions.y + actions.height <= viewport.height + 1,
          `${mode} form action must fit ${viewport.width}x${viewport.height} after scrolling: ${JSON.stringify(actions)}`);
        await page.keyboard.press("Escape");
        assert.equal(await dialog.count(), 0, "Escape closes the dialog after scrolling");
        await page.getByRole("button", { name: `Open ${mode}`, exact: true }).click();
        const reopenedClose = page.getByRole("dialog").getByRole("button", { name: "Close", exact: true });
        await reopenedClose.click();
        assert.equal(await page.getByRole("dialog").count(), 0, "The visible Close action works");
      }
    }
    await page.setViewportSize({ width: 390, height: 568 });
    await page.getByRole("button", { name: "Open signup", exact: true }).click();
    await page.screenshot({ path: path.join(output, "signup-390x568.png") });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
