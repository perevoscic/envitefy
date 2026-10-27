const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("custom URLs work across Event Pages, Live Cards and Sign-up Forms without saving pending content", { timeout: 180000 }, async () => {
  const output = path.resolve(".qa/product-urls");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({ mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/product-urls.tsx"), output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@/app/sidebar-context": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
        "@": path.resolve("src"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/events"; @source "../src/components/smart-signup-form";',
    { from: path.resolve("scripts/product-urls-fixture.css") },
  )).css;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(10000);
  const base = "http://localhost:43129";
  const id = "11111111-1111-4111-8111-111111111111";
  const records = new Map();
  const writes = [];
  const errors = [];
  let failRename = false;
  page.on("pageerror", error => errors.push(error.stack || error.message));
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript; charset=utf-8", body: script });
    if (url.pathname === "/api/events/public-slug") return json({ available: url.searchParams.get("slug") !== "already-taken", slug: url.searchParams.get("slug") });
    const match = url.pathname.match(/^\/api\/(?:history\/([^/]+)|events\/([^/]+)\/public-slug)$/);
    if (match) {
      const eventId = match[1] || match[2];
      const row = records.get(eventId);
      if (!row) return json({ error: "Not found" }, 404);
      if (request.method() === "GET") return json(row);
      const body = request.postDataJSON();
      writes.push({ path: url.pathname, body });
      if (body.expectedRevision !== row.revision) return json({ error: "This event changed since you opened it.", code: "event_changed" }, 409);
      if (match[2]) {
        if (failRename) return json({ error: "That URL is already in use." }, 409);
        row.public_slug = body.publicSlug;
        row.data.publicSlug = body.publicSlug;
      } else {
        row.title = body.title;
        row.data = { ...row.data, ...body.data };
      }
      row.revision = `${row.revision}-next`;
      const prefix = row.data.primaryOutput === "live_card" ? "card" : row.data.primaryOutput === "signup_form" ? "smart-signup-form" : "event";
      return json({ ...row, ...(match[1] ? { permissions: undefined } : {}), publicSlug: row.public_slug, publicPath: `/${prefix}/${row.public_slug}` });
    }
    if (url.pathname === "/api/events/share") return json({ recipients: [] });
    if (url.pathname.startsWith("/api/")) return json({});
    if (url.pathname.match(/\.(?:webp|png|jpg|svg)$/)) return route.fulfill({ status: 204, body: "" });
    if (url.origin === base) return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
    return route.abort();
  });
  const record = (primaryOutput = "event_page", data = {}) => ({ id, title: "Original page title", public_slug: "original-link", revision: "v1", permissions: { role: "owner", canManageCollaborators: true }, data: { primaryOutput, status: "published", publicSlug: "original-link", ...data } });
  try {
    records.set(id, record());
    await page.goto(`${base}/event/general/customize?mode=page&edit=${id}`);
    await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Preview", exact: true }).waitFor();
    await page.getByLabel("Event title", { exact: true }).fill("Pending corrected title");
    await page.getByRole("button", { name: /Custom URL/ }).click();
    const input = page.getByRole("textbox", { name: "Custom URL", exact: true });
    await input.fill("already-taken");
    await page.getByRole("status").filter({ hasText: "already taken" }).waitFor();
    assert.equal(writes.length, 0, "typing and availability checks never write");
    await input.fill("Chosen Page 2026");
    failRename = true;
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "already in use" }).waitFor();
    assert.equal(await input.inputValue(), "Chosen Page 2026", "failed claims preserve input");
    failRename = false;
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Link updated" }).waitFor();
    assert.equal(records.get(id).title, "Original page title", "Save link does not save pending content");
    assert.equal(records.get(id).public_slug, "chosen-page-2026");
    await page.getByRole("button", { name: "Back to details" }).click();
    assert.equal(await page.getByLabel("Event title").inputValue(), "Pending corrected title");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Changes saved" }).waitFor();
    assert.equal(records.get(id).title, "Pending corrected title");
    assert.equal(records.get(id).public_slug, "chosen-page-2026", "later content saves preserve the custom URL");
    assert.equal(writes.at(-1).body.expectedRevision, "v1-next");

    await page.goto(`${base}/fixture`);
    const forms = await page.evaluate(() => ({ card: window.__urlFixtures.createLiveCardForm("America/Chicago"), signup: window.__urlFixtures.createSignupThemeForm("school-days") }));
    forms.card.title = "A family celebration";
    records.set(id, record("live_card", { status: "draft", createdVia: "livecard-builder", liveCardBuilder: { form: forms.card } }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/live-cards?mode=livecard&edit=${id}`);
    await page.getByLabel("Event title", { exact: true }).fill("Pending card title");
    await page.getByRole("button", { name: "2 Event details", exact: true }).click();
    await page.getByRole("button", { name: "Custom URL", exact: true }).click();
    await input.fill("family-celebration");
    await page.getByText(`${base}/card/family-celebration`, { exact: true }).waitFor();
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Link updated" }).waitFor();
    assert.equal(records.get(id).data.status, "draft", "customizing a card URL never publishes it");
    assert.equal(records.get(id).data.liveCardBuilder.form.title, "A family celebration", "Save link does not save pending card wording");
    const dialog = page.getByRole("dialog", { name: "Custom URL", exact: true });
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391, "mobile URL dialog fits the viewport");
    await page.screenshot({ path: path.join(output, "livecard-mobile.png") });
    await page.getByRole("button", { name: "Close custom URL" }).click();
    await page.getByRole("button", { name: "1 Your card", exact: true }).click();
    assert.equal(await page.getByLabel("Event title", { exact: true }).inputValue(), "Pending card title", "URL editing preserves mounted card wording");

    forms.signup.title = "Parent conferences";
    records.set(id, record("signup_form", { category: "Sign-up Forms", status: "draft", signupForm: forms.signup,
      templateEditor: { category: "signup-forms", templateId: "editorial--school-days", snapshot: { form: forms.signup } } }));
    await page.goto(`${base}/signup-forms/templates/editorial--school-days/customize?mode=signup&edit=${id}`);
    await page.getByRole("button", { name: "Custom URL", exact: true }).click();
    await page.getByRole("heading", { name: "Custom URL", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog", { name: "Custom URL", exact: true }).count(), 0, "signup URL editing uses the native settings panel");
    await input.fill("parent-conferences");
    await page.getByText(`${base}/smart-signup-form/parent-conferences`, { exact: true }).waitFor();
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Link updated" }).waitFor();
    await page.getByRole("button", { name: "Back to details", exact: true }).click();
    await page.getByRole("heading", { name: "Add your details", exact: true }).waitFor();
    await page.getByRole("group", { name: "Save event", exact: true }).getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
    assert.equal(writes.at(-1).body.expectedRevision, "v1-next", "signup definitions use the URL save's new revision");
    assert.equal(records.get(id).public_slug, "parent-conferences");

    records.set(id, { ...record(), permissions: { role: "cohost", canManageCollaborators: false } });
    await page.goto(`${base}/fixture?edit=${id}`);
    await page.getByRole("button", { name: "Custom URL", exact: true }).click();
    await page.getByText("Only the owner can change this URL.").waitFor();
    assert.equal(await input.count(), 0);
    await page.goto(`${base}/event/general/customize?mode=page&edit=${id}`);
    await page.getByRole("group", { name: "Editor view", exact: true }).getByRole("button", { name: "Preview", exact: true }).waitFor();
    await page.getByLabel("Event title", { exact: true }).fill("Co-host content edit");
    assert.equal(await page.getByRole("button", { name: /Custom URL/ }).count(), 0);
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Changes saved" }).waitFor();
    assert.equal(await page.getByRole("button", { name: /Custom URL/ }).count(), 0, "content-only responses do not reveal owner URL controls to co-hosts");
    await page.goto(`${base}/fixture`);
    await page.getByRole("button", { name: "Custom URL", exact: true }).click();
    await page.getByText(/Save a draft to create your URL/).waitFor();
    assert.equal(await input.count(), 0, "new creations do not claim a URL before explicit saving");
    assert.deepEqual(errors, []);
  } catch (failure) {
    await page.screenshot({ path: path.join(output, "failure.png") });
    throw new Error(`${failure.message}\nURL: ${page.url()}\nBrowser errors: ${errors.join("\n")}`, { cause: failure });
  } finally { await browser.close(); }
});
