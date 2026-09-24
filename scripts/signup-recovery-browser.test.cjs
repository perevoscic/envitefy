const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("signup recovery guides email and phone lookup, retry, resend and keyboard focus", {
  timeout: 120000,
}, async () => {
  const output = path.resolve(".qa/signup-recovery");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/signup-recovery/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"] },
      module: {
        rules: [
          {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: path.resolve("scripts/lib/create-guest-ts-loader.cjs"),
          },
        ],
      },
    });
    compiler.run((error, stats) =>
      compiler.close(() =>
        error || stats?.hasErrors()
          ? reject(error || new Error(stats.toString({ all: false, errors: true })))
          : resolve(),
      ),
    );
  });
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(
      '@import "tailwindcss" source(none);\n@source "../components/smart-signup-form/SignupRecovery.tsx";\n@source "../../scripts/fixtures/signup-recovery/entry.tsx";',
      { from: path.resolve("src/app/globals.css") },
    )
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") {
      res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      res.end(script);
    } else {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signup recovery</title><style>${css}
        :root { --signup-border:#cbb7a5; --signup-page:#f3e2ce; --signup-surface:#fffbf3; --signup-text:#492c20; --signup-muted:#65432f; }
        body { background:var(--signup-page); color:var(--signup-text); }
      </style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`);
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 },
      reducedMotion: "reduce",
    });
    page.setDefaultTimeout(10000);
    await page.clock.install();
    const requests = [];
    const failures = [];
    let reply = "hold";
    let pending;
    let markRequestHeld;
    const requestHeld = new Promise((resolve) => {
      markRequestHeld = resolve;
    });
    page.on("pageerror", (error) => failures.push(error.message));
    await page.route("**/*", async (route) => {
      if (route.request().url() === `${base}/api/history/qa-signup/signup/recover`) {
        requests.push(route.request().postDataJSON());
        if (reply === "hold") {
          pending = route;
          markRequestHeld();
          return;
        }
        if (reply === "offline") return route.abort("internetdisconnected");
        if (reply === "invalid")
          return route.fulfill({
            status: 400,
            json: { error: "Enter the email address or full phone number you used to sign up." },
          });
        return route.fulfill({ json: { ok: true, message: "Generic recovery response" } });
      }
      if (route.request().url().startsWith(`${base}/`)) return route.continue();
      return route.abort();
    });
    await page.goto(base);
    await page.getByText("Edit or cancel your signup", { exact: true }).click();
    const email = page.getByRole("textbox", { name: "Email address", exact: true });
    assert.equal(await email.getAttribute("type"), "email");
    assert.equal(await email.getAttribute("autocomplete"), "email");
    assert.equal(await page.getByText(/Check your spam or junk folder/).isVisible(), false);
    await email.fill("guest@example.test");
    await page.getByRole("button", { name: "Use phone number instead", exact: true }).click();
    const phone = page.getByRole("textbox", { name: "Phone number", exact: true });
    assert.equal(await phone.evaluate((element) => element === document.activeElement), true);
    assert.equal(await phone.getAttribute("type"), "tel");
    await phone.fill("(850) 555-0123");
    await page.getByText(/We’ll send the link to the email saved with your signup/).waitFor();
    await page.getByRole("button", { name: "Use email address instead", exact: true }).click();
    assert.equal(await email.inputValue(), "guest@example.test");
    assert.equal(await email.evaluate((element) => element === document.activeElement), true);
    assert.equal(requests.length, 0, "switching methods never requests a link");
    await page.screenshot({ path: path.join(output, "mobile-email.png"), fullPage: true });
    await email.press("Enter");
    await requestHeld;
    await page.getByRole("button", { name: "Sending…", exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector("input").readOnly);
    assert.equal(
      await page.getByRole("button", { name: "Use phone number instead" }).isDisabled(),
      true,
    );
    await email.press("Enter");
    assert.deepEqual(requests, [{ contact: "guest@example.test" }]);
    await pending.fulfill({ json: { ok: true } });
    const heading = page.getByRole("heading", { name: "Check your email", exact: true });
    await heading.waitFor();
    assert.equal(await heading.evaluate((element) => element === document.activeElement), true);
    assert.equal(await email.count(), 0, "confirmation replaces the input form");
    const confirmation = await page.locator("section").innerText();
    assert.match(confirmation, /If your details match a signup with a saved email/);
    assert.doesNotMatch(confirmation, /guest@example.test/);
    const resend = page.getByRole("button", { name: "Resend link", exact: true });
    assert.equal(await resend.isDisabled(), true);
    await page.screenshot({ path: path.join(output, "mobile-confirmation.png"), fullPage: true });
    await page.getByText("Need help?", { exact: true }).click();
    await page.getByText(/Your original confirmation email also has/).waitFor();
    assert.equal(requests.length, 1);
    await page.clock.fastForward(30001);
    assert.equal(await resend.isEnabled(), true);
    reply = "offline";
    await resend.click();
    await page.getByRole("alert").waitFor();
    assert.match(await page.getByRole("alert").innerText(), /Check your connection/);
    assert.equal(await heading.isVisible(), true, "a failed resend preserves the next step");
    reply = "accepted";
    await resend.click();
    await page.waitForFunction(() => !document.querySelector('[role="alert"]'));
    assert.equal(await resend.isDisabled(), true);
    assert.equal(requests.length, 3);
    await page.getByRole("button", { name: "Try another email or phone" }).click();
    assert.equal(await email.inputValue(), "guest@example.test");
    assert.equal(await email.evaluate((element) => element === document.activeElement), true);
    await page.getByRole("button", { name: "Use phone number instead" }).click();
    assert.equal(await phone.inputValue(), "(850) 555-0123");
    reply = "invalid";
    await phone.fill("123");
    await page.getByRole("button", { name: "Email me a link" }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await phone.inputValue(), "123", "validation retains the entered contact");
    assert.equal(await phone.getAttribute("aria-invalid"), "true");
    await phone.fill("(850) 555-0123");
    assert.equal(await page.getByRole("alert").count(), 0);
    reply = "accepted";
    await page.getByRole("button", { name: "Email me a link" }).click();
    await heading.waitFor();
    assert.deepEqual(requests.at(-1), { contact: "(850) 555-0123" });
    assert.equal(
      await page.locator("section").innerText(),
      confirmation,
      "email and phone requests show the same private response",
    );
    await page.getByRole("button", { name: "Try another email or phone" }).click();
    await page.getByRole("button", { name: "Use email address instead" }).click();
    await email.fill("missing@example.test");
    await page.getByRole("button", { name: "Email me a link" }).click();
    await heading.waitFor();
    assert.equal(
      await page.locator("section").innerText(),
      confirmation,
      "unmatched contacts reveal no signup status",
    );
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 812, height: 375 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
    }
    await page.screenshot({ path: path.join(output, "desktop-confirmation.png"), fullPage: true });
    assert.deepEqual(failures, []);
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
