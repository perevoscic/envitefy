const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("host signup views, icon actions, filters and saved email preferences work on desktop and phones", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/signup-host-dashboard");
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/signup-host-dashboard.tsx"), output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": path.resolve("src") } },
      plugins: [{ apply(compiler) { compiler.hooks.compilation.tap("FixtureCss", (compilation) => { compiled.webpack.NormalModule.getCompilationHooks(compilation).loader.tap("FixtureCss", (context) => { context.currentTraceSpan = require("next/dist/trace").trace("fixture-css"); }); }); } }],
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: [require.resolve("next/dist/build/webpack/loaders/next-style-loader"), { loader: require.resolve("next/dist/build/webpack/loaders/css-loader/src"), options: { modules: { getLocalIdent: (_context, _template, name) => `signup-host_${name}` }, postcss: async () => ({ postcss: require("postcss") }) } }] },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none);\n@source "../components/smart-signup-form/SignupHostDashboard.tsx";\n@source "../components/smart-signup-form/SignupHostAlerts.tsx";',
    { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script); }
    else { res.setHeader("Content-Type", "text/html"); res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}
      :root { --signup-border:#cbb7a5; --signup-page:#f3e2ce; --signup-surface:#fffbf3; --signup-text:#492c20; --signup-muted:#65432f; }
      body { margin:0; color:var(--signup-text); background:var(--signup-page); font-family:system-ui,sans-serif; }
      button:focus-visible,summary:focus-visible {outline:2px solid #59439e;outline-offset:3px;}
      </style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
    const page = await browser.newPage({ viewport: { width: 1280, height: 950 }, reducedMotion: "reduce" });
    const failures = [], posts = [];
    let settings = { email: "host@example.test", preferences: { newSignups: true, changes: true, cancellations: true, waitlist: true }, deliveries: [
      { id: "failed-alert", kind: "new_signup", name: "Alex Justus", status: "failed", createdAt: "2026-10-06T12:00:00Z" },
      { id: "unknown-alert", kind: "changed", name: "Lauren", status: "unknown", createdAt: "2026-10-06T12:30:00Z" },
    ] };
    let failSave = false;
    page.on("pageerror", (error) => failures.push(error.message));
    await page.route("**/*", async (route) => {
      if (route.request().url() === `${base}/api/history/qa-signup/signup/alerts`) {
        if (route.request().method() === "POST") {
          const body = route.request().postDataJSON(); posts.push(body);
          if (failSave) return route.fulfill({ status: 503, json: { error: "Temporary email settings error" } });
          if (body.preferences) settings.preferences = body.preferences;
          else settings.deliveries[0].status = "pending";
        }
        return route.fulfill({ json: settings });
      }
      if (route.request().url().startsWith(`${base}/`)) return route.continue();
      return route.abort();
    });
    page.setDefaultTimeout(10000);
    await page.goto(base);
    assert.equal(await page.getByRole("button", { name: "By item/shift", exact: true }).getAttribute("aria-pressed"), "true");
    const items = await page.locator("[data-signup-item]").all();
    assert.equal(items.length, 2);
    assert.match(await items[0].innerText(), /3 items reserved · 1 of 4 remaining/);
    await page.screenshot({ path: path.join(output, "desktop-items.png"), fullPage: true });
    await page.getByRole("button", { name: "By person", exact: true }).click();
    const people = page.locator("[data-signup-participant]");
    assert.equal(await people.count(), 3);
    const first = await people.nth(0).boundingBox(), second = await people.nth(1).boundingBox();
    assert.equal(first.y, second.y); assert.ok(second.x > first.x + first.width, "two participants share a row");
    const edit = page.getByRole("button", { name: "Edit signup for Alex Justus", exact: true });
    const editBox = await edit.boundingBox(); assert.ok(editBox.width >= 44 && editBox.height >= 44);
    assert.equal(await edit.locator("svg").count(), 1); assert.equal(await edit.innerText(), "");
    await edit.click(); assert.deepEqual(await page.evaluate(() => window.signupActions), ["edit:alex"]);
    await people.nth(0).getByText("Participant details", { exact: true }).click();
    await page.getByText("No nuts, please", { exact: true }).waitFor();
    await people.nth(0).getByText("Participant details", { exact: true }).click();
    assert.ok((await people.nth(0).locator("details").boundingBox()).height < 60, "collapsed details remain compact");
    await page.screenshot({ path: path.join(output, "desktop-people.png"), fullPage: true });
    await page.getByRole("textbox", { name: "Search participants" }).fill("No nuts");
    assert.equal(await people.count(), 1);
    await page.getByRole("textbox", { name: "Search participants" }).fill("");
    await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("cancelled");
    assert.equal(await people.count(), 1); assert.match(await people.innerText(), /Past signup/);
    assert.equal(await people.getByRole("button").count(), 0);
    await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("active");
    await page.getByText("Email alerts", { exact: true }).click();
    await page.getByText("host@example.test", { exact: true }).waitFor();
    await page.getByText(/Owners and accepted co-hosts receive signup emails automatically/).waitFor();
    for (const label of ["Receive signup emails", "New signups", "Signup changes", "Cancellations", "Waitlist additions and confirmations"]) {
      assert.equal(await page.getByRole("checkbox", { name: label, exact: true }).isChecked(), true);
    }
    const checkbox = page.getByRole("checkbox", { name: "New signups", exact: true });
    await checkbox.uncheck(); failSave = true;
    await page.getByRole("button", { name: "Save email preferences", exact: true }).click();
    await page.getByText("Temporary email settings error", { exact: true }).waitFor();
    assert.equal(await checkbox.isChecked(), false, "failed save keeps the host's choices available");
    failSave = false;
    await page.getByRole("button", { name: "Save email preferences", exact: true }).click();
    await page.getByText("Email alert preferences saved.", { exact: true }).waitFor();
    assert.equal(posts.length, 2);
    await page.getByText("Recent email attempts", { exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Retry email", exact: true }).count(), 1, "unknown results cannot be resent blindly");
    await page.getByRole("button", { name: "Retry email", exact: true }).click();
    await page.getByText("Email retry queued.", { exact: true }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: "By person", exact: true }).click();
    await page.getByText("Email alerts", { exact: true }).click();
    assert.equal(await page.getByRole("checkbox", { name: "New signups", exact: true }).isChecked(), false, "saved preferences survive reload");
    await page.getByText("Email alerts", { exact: true }).click();
    for (const viewport of [{ width: 375, height: 812 }, { width: 667, height: 375 }]) {
      await page.setViewportSize(viewport);
      const a = await people.nth(0).boundingBox(), b = await people.nth(1).boundingBox();
      assert.ok(b.y > a.y + a.height, "narrow layouts show one card per row");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `people-${viewport.width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => document.documentElement.style.fontSize = "20px");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "larger text retains usable layout");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Remove signup for Alex Justus", exact: true }).click();
    assert.equal(await people.count(), 3);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Remove signup for Alex Justus", exact: true }).click();
    assert.equal(await people.count(), 2);
    await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("cancelled");
    assert.equal(await people.count(), 2, "removal retains the cancelled signup audit record");
    await page.getByText("Email alerts", { exact: true }).click();
    await page.getByRole("checkbox", { name: "Receive signup emails", exact: true }).uncheck();
    assert.equal(await page.getByRole("checkbox", { name: "Signup changes", exact: true }).isChecked(), false);
    await page.getByRole("button", { name: "Save email preferences", exact: true }).click();
    await page.getByText("Email alert preferences saved.", { exact: true }).waitFor();
    assert.deepEqual(posts.at(-1).preferences, { newSignups: false, changes: false, cancellations: false, waitlist: false });
    await page.reload();
    await page.getByText("Email alerts", { exact: true }).click();
    for (const label of ["Receive signup emails", "New signups", "Signup changes", "Cancellations", "Waitlist additions and confirmations"]) {
      assert.equal(await page.getByRole("checkbox", { name: label, exact: true }).isChecked(), false, "saved opt-out survives reload");
    }
    assert.deepEqual(failures, []);
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
