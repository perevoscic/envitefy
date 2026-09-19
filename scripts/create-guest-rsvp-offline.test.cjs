const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("hydrated Gender Reveal RSVP sends required answers, preserves rejected input, retries, and preview never writes", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/create-campaign/2026-09-18/implementation/rsvp-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/create-guest-rsvp/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@/app/providers$": path.resolve("scripts/fixtures/create-guest-rsvp/providers.ts"), "@": path.resolve("src") } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const cssPath = path.resolve(".next-dev/static/css/app/layout.css");
  let css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
  if (!css) {
    const postcss = require("postcss"); const tailwind = require("@tailwindcss/postcss");
    const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/EventRsvpPrompt.tsx";');
    css = (await postcss([tailwind()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  }
  const server = http.createServer((request, response) => {
    if (request.url === "/fixture.js") { response.setHeader("Content-Type", "text/javascript"); response.end(script); }
    else { response.setHeader("Content-Type", "text/html"); response.end(`<html><head><style>${css}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const requests = [];
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.url().endsWith("/api/events/qa-rsvp/rsvp")) {
      requests.push(request.postDataJSON());
      const rejected = requests.length === 1;
      return route.fulfill({ status: rejected ? 400 : 200, contentType: "application/json", body: JSON.stringify(rejected ? { error: "Team Pink or Team Blue?" } : { ok: true }) });
    }
    if (request.url().startsWith(base)) return route.continue();
    return route.abort();
  });
  try {
    await page.goto(base);
    await page.getByRole("button", { name: "Yes", exact: true }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel("First name", { exact: true }).fill("Taylor");
    await modal.getByLabel("Last name", { exact: true }).fill("QA");
    await modal.getByLabel("Email", { exact: true }).fill("qa@example.test");
    await modal.getByRole("button", { name: "Send RSVP", exact: true }).click();
    assert.equal(requests.length, 0, "native required guess prevents incomplete request");
    await modal.getByLabel("Team guess", { exact: false }).selectOption("blue");
    await modal.getByRole("button", { name: "Send RSVP", exact: true }).click();
    await modal.getByRole("alert").waitFor();
    assert.match(await modal.getByRole("alert").innerText(), /Team Pink or Team Blue/);
    assert.equal(await modal.getByLabel("First name", { exact: true }).inputValue(), "Taylor");
    assert.deepEqual(requests[0], { response: "yes", name: "Taylor QA", email: "qa@example.test", answersJson: { genderGuess: "blue" } });
    await page.screenshot({ path: path.join(output, "rejected-rsvp.png"), fullPage: true });
    await modal.getByRole("button", { name: "Send RSVP", exact: true }).click();
    await page.getByText("RSVP'd: Yes", { exact: true }).waitFor();
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[1], requests[0]);
    await page.goto(`${base}/?preview=1`);
    await page.getByRole("button", { name: "Yes", exact: true }).click();
    await page.getByRole("dialog").getByLabel("First name", { exact: true }).fill("Preview");
    assert.equal(await page.getByRole("button", { name: "Preview only", exact: true }).isDisabled(), true);
    assert.equal(requests.length, 2, "preview sends no response, even with a published event id");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("button", { name: "Yes", exact: true }).evaluate((button) => button === document.activeElement), true, "modal returns keyboard focus to the response control");
    assert.deepEqual(failures, []);
    fs.writeFileSync(path.join(output, "result.json"), JSON.stringify({ actualComponent: "EventRsvpPrompt", requests, rejectedFormRetained: true, retrySucceeded: true, previewWrites: 0, focusRestored: true, realBackendCalls: 0, realEmailCalls: 0 }, null, 2));
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
});
