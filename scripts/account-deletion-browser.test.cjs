const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("account deletion requests require confirmation and report delivery honestly", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/account-deletion");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/account-deletion/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": path.resolve("src") } },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process('@import "tailwindcss" source(none);\n@source "../components/account";\n@source "../../scripts/fixtures/account-deletion";', { from: path.resolve("src/app/account-deletion-qa.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const requests = [];
  const errors = [];
  const unexpected = [];
  let reply = { status: 200, body: { ok: true, delivered: true } };
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== "http://account-deletion.test") { unexpected.push(req.url()); return route.abort(); }
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname === "/api/contact") {
      requests.push(req.postDataJSON());
      return route.fulfill({ status: reply.status, contentType: "application/json", body: JSON.stringify(reply.body) });
    }
    if (url.pathname !== "/") { unexpected.push(req.url()); return route.abort(); }
    return route.fulfill({ contentType: "text/html", body: `<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Account deletion test</title><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
  });
  try {
    await page.goto("http://account-deletion.test/");
    const trigger = page.getByRole("button", { name: "Request account deletion", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(await dialog.getByLabel("Account email", { exact: true }).inputValue(), "owner@example.test");
    assert.equal(await dialog.getByLabel("Account email", { exact: true }).getAttribute("readonly"), "");
    assert.equal(await dialog.getByRole("button", { name: "Request account deletion", exact: true }).isDisabled(), true);
    assert.deepEqual((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations, []);
    assert.equal(requests.length, 0);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
    assert.equal(requests.length, 0);
    await trigger.click();
    await dialog.getByRole("checkbox").check();
    const submit = dialog.getByRole("button", { name: "Request account deletion", exact: true });
    reply = { status: 500, body: { error: "PRIVATE SMTP CONFIGURATION" } };
    await submit.click();
    await dialog.getByRole("alert").waitFor();
    assert.match(await dialog.getByRole("alert").innerText(), /could not be sent/);
    assert.doesNotMatch(await dialog.innerText(), /PRIVATE SMTP CONFIGURATION/);
    assert.equal(await dialog.getByRole("checkbox").isChecked(), true);
    reply = { status: 200, body: { ok: true, delivered: false } };
    await submit.click();
    await page.waitForFunction(() => !document.querySelector('form[aria-busy="true"]'));
    assert.equal(await dialog.getByRole("status").count(), 0);
    reply = { status: 200, body: { ok: true, delivered: true } };
    await submit.click();
    await dialog.getByRole("status").waitFor();
    assert.match(await dialog.getByRole("status").innerText(), /has not been deleted yet/);
    assert.equal(requests.length, 3);
    assert.equal(requests[2].email, "owner@example.test");
    assert.equal(requests[2].title, "Envitefy account deletion request");
    assert.match(requests[2].message, /ownership must be verified/);
    assert.deepEqual((await new AxeBuilder({ page }).include('[role="dialog"]').analyze()).violations, []);
    await page.screenshot({ path: path.join(output, "profile-success.png") });
    for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
      await page.setViewportSize(viewport);
      await page.goto("http://account-deletion.test/");
      await trigger.click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const box = await dialog.boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.y + box.height <= viewport.height);
      await dialog.getByRole("checkbox").check();
      await dialog.getByRole("button", { name: "Request account deletion", exact: true }).scrollIntoViewIfNeeded();
      const buttonBox = await dialog.getByRole("button", { name: "Request account deletion", exact: true }).boundingBox();
      assert.ok(buttonBox.height >= 44);
      await page.screenshot({ path: path.join(output, `profile-${viewport.width}.png`) });
      await page.addStyleTag({ content: "html { font-size: 24px; }" });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.goto("http://account-deletion.test/?public");
    await page.getByLabel("Account email", { exact: true }).fill("guest@example.test");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Request account deletion", exact: true }).click();
    await page.getByRole("status").waitFor();
    assert.equal(requests.at(-1).email, "guest@example.test");
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
  } finally {
    await browser.close();
  }
});
