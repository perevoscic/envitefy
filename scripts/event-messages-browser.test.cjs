const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("Messages requires preview and explicit Send, retains drafts, recovers interrupted sends, and fits mobile", { timeout: 120000 }, async () => {
  const output = path.resolve(".qa/event-messages");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-messages/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: { "@": path.resolve("src") } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const postcss = require("postcss");
  const tailwind = require("@tailwindcss/postcss");
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components/EventMessagesPanel.tsx";\n@source "../components/UnsavedProgressProvider.tsx";\n@source "../../scripts/fixtures/event-messages/entry.tsx";');
  const css = (await postcss([tailwind()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript; charset=utf-8"); res.end(script); }
    else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(`<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="background:#f4f3fa"><main id="root"></main><script src="/fixture.js"></script></body></html>`); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }).catch(async (error) => {
    await new Promise((resolve) => server.close(resolve));
    throw error;
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const actions = [];
  const failures = [];
  const data = { audienceCount: 2, replyTo: "host@example.test", eventUrl: "https://envitefy.com/event/livia", messages: [] };
  let failProcessing = true;
  page.on("pageerror", (error) => failures.push(error.message));
  await page.route("**/*", async (route) => {
    const req = route.request();
    if (req.url().includes("/api/events/qa-event/messages")) {
      const payload = req.method() === "POST" ? req.postDataJSON() : null;
      if (payload) {
        actions.push(payload);
        if (["save", "send"].includes(payload.action)) {
          let message = data.messages.find((item) => item.id === payload.id);
          if (!message) { message = { id: payload.id, createdAt: new Date().toISOString(), sentAt: null, deliveries: [], status: "draft" }; data.messages.unshift(message); }
          if (message.status === "draft") {
            message.subject = payload.subject; message.body = payload.body;
            if (payload.action === "send") {
              message.status = "queued"; message.sentAt = new Date().toISOString();
              message.deliveries = ["Taylor", "Alex"].map((name) => ({ name, email: `${name.toLowerCase()}@example.test`, status: "pending", updatedAt: new Date().toISOString() }));
            }
          }
        }
        if (payload.action === "process") {
          if (failProcessing) { failProcessing = false; return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Sending interrupted. Check history." }) }); }
          const message = data.messages.find((item) => item.id === payload.id);
          message.deliveries[0].status = "sent";
          message.deliveries[1].status = "skipped";
        }
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    }
    if (req.url().startsWith(base)) return route.continue();
    return route.abort();
  });
  try {
    await page.goto(base);
    await page.getByText("Yes and Maybe · 2 guests", { exact: true }).waitFor();
    await page.getByRole("textbox", { name: "Subject", exact: true }).fill("New party time");
    await page.getByRole("textbox", { name: "Message", exact: true }).fill("Please join us at 3 PM.\nBring a swimsuit!");
    assert.equal(actions.length, 0, "editing never saves or sends automatically");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved. No emails were sent.", { exact: true }).waitFor();
    assert.deepEqual(actions.map((action) => action.action), ["save"]);
    await page.reload();
    await page.locator("summary").click();
    await page.getByRole("button", { name: "Edit draft", exact: true }).click();
    assert.equal(await page.getByRole("textbox", { name: "Subject", exact: true }).inputValue(), "New party time");
    await page.getByRole("button", { name: "Preview email", exact: true }).click();
    await page.getByRole("region", { name: "Email preview" }).waitFor();
    assert.equal(actions.length, 1, "preview never sends");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(output, "mobile-preview.png"), fullPage: true });
    await page.getByRole("button", { name: "Send to 2 guests", exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.match(await page.getByRole("alert").innerText(), /Sending interrupted/);
    const continued = page.getByRole("button", { name: "Continue sending", exact: true });
    if (!(await continued.isVisible())) await page.locator("summary").click();
    await continued.click();
    await page.getByText("Sending finished. Review each recipient’s status in the history below.", { exact: true }).waitFor();
    await page.getByText("Excluded — no longer Yes/Maybe", { exact: true }).waitFor();
    assert.equal(data.messages.length, 1, "draft and send retain one message id");
    assert.equal(actions.filter((action) => action.action === "send").length, 1);
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.screenshot({ path: path.join(output, "desktop-history.png"), fullPage: true });
    await page.reload();
    await page.getByText(/1 sent · 0 failed · 0 pending · 1 excluded/).waitFor();
    assert.equal(actions.filter((action) => action.action === "send").length, 1, "refresh never resends");
    assert.deepEqual(failures, []);
  } catch (error) {
    console.error(JSON.stringify({ actions, failures, text: await page.locator("body").innerText() }, null, 2));
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
    throw error;
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
});
