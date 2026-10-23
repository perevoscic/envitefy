const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("Event Page controls open by default with Back hidden and retain draft exit behavior", {
  timeout: 180000,
}, async () => {
  const output = path.resolve(".qa/event-editor-back-browser");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/event-editor.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({
        "process.env": JSON.stringify({ NODE_ENV: "development" }),
      })],
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
          "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
          "next-auth/react": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
          "@/components/auth/AuthModal": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
          "@/app/sidebar-context": path.resolve("scripts/fixtures/event-editor-auth.tsx"),
          "@": path.resolve("src"),
        },
      },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
        { test: /\.(png|jpg|webp|svg)$/, type: "asset/inline" },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => {
      if (error || stats?.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true })));
      else resolve();
    }));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(
    '@import "tailwindcss" source(none); @source "../src/components/UnsavedProgressProvider.tsx"; @source "../src/app/event/general/customize/page.tsx"; @source "../src/components/events"; @source "../src/components/templates/TemplateEditorContext.tsx";',
    { from: path.resolve("scripts/event-editor-fixture.css") },
  )).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  page.setDefaultTimeout(10000);
  const errors = [], writes = [], records = new Map();
  const base = "http://localhost:43129";
  records.set("published-event", {
    id: "published-event", title: "School field trip", revision: "published-v1", public_slug: "school-trip",
    data: { status: "published", fields: { title: "School field trip", description: "Bring water.", sections: [] } },
  });
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.route("**/*", async (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
    if (url.pathname.startsWith("/api/history")) {
      const id = url.pathname.split("/")[3];
      if (request.method() === "GET") {
        const row = records.get(id);
        return route.fulfill({ status: row ? 200 : 404, contentType: "application/json", body: JSON.stringify(row ? { ...row, permissions: { role: "owner", canManageCollaborators: true } } : { error: "Not found" }) });
      }
      const body = request.postDataJSON();
      writes.push({ path: url.pathname, method: request.method(), body });
      const nextId = id || `draft-${writes.length}`;
      const previous = records.get(nextId);
      const row = {
        id: nextId, title: body.title, data: body.data, revision: `saved-${writes.length}`,
        public_slug: previous?.public_slug || (body.title === "Event draft" ? "event-draft" : nextId),
      };
      records.set(nextId, row);
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(row) });
    }
    if (url.pathname === "/api/event-themes/generate") {
      const body = request.postDataJSON();
      assert.equal(body.mode, "wording", "Back must never generate artwork");
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ details: body.currentDetails }) });
    }
    if (url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "application/json", body: "{}" });
    if (url.origin === base && /\.(webp|jpeg|jpg|png|svg)$/.test(url.pathname)) {
      const asset = path.resolve("public", `.${url.pathname}`);
      if (asset.startsWith(`${path.resolve("public")}${path.sep}`) && fs.existsSync(asset)) return route.fulfill({ path: asset });
    }
    if (url.origin === base) return route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}[data-leave]{position:fixed;bottom:90px;left:20px;z-index:50}</style></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>`,
    });
    return route.abort();
  });
  const workspace = page.locator("[data-event-page-editor]");
  const controls = page.getByRole("complementary", { name: "Event editing controls", exact: true, includeHidden: true });
  const actions = page.getByRole("group", { name: "Save event", exact: true });
  const view = page.getByRole("group", { name: "Editor view", exact: true });
  // Keep the temporary hidden action's existing handler covered without exposing it in the UI.
  const back = async () => {
    const button = actions.getByRole("button", { name: "Back", exact: true, includeHidden: true });
    assert.equal(await button.isVisible(), false, "Back stays hidden on desktop and mobile");
    assert.equal(await button.evaluate((element) => getComputedStyle(element).display), "none");
    await button.evaluate((element) => element.click());
  };
  const edit = () => view.getByRole("button", { name: "Edit", exact: true }).click();
  const expectLocalBack = async (count, message) => {
    assert.equal(new URL(page.url()).pathname, "/event/general/customize", message);
    assert.equal(await page.getByRole("dialog").count(), 0, "internal Back does not prompt to discard");
    assert.equal(writes.length, count, "internal Back does not save or publish");
  };
  const expectCreate = async (count) => {
    await page.locator("[data-destination]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/create", "unpublished Event Pages return to Create instead of their unavailable public address");
    assert.equal(new URL(page.url()).search, "");
    assert.equal(writes.length, count, "leaving a draft does not write content");
  };
  const openGeneral = async (query) => {
    await page.goto(`${base}/event/general/customize?mode=manual&${query}`);
    await workspace.waitFor();
    await view.getByRole("button", { name: "Preview", exact: true }).waitFor();
    await controls.waitFor({ state: "visible" });
    assert.equal(await actions.getByRole("button", { name: "Back", exact: true }).count(), 0, "the bottom Back action is absent from accessible controls");
    await controls.getByRole("button", { name: /^Headline/ }).click();
    await page.getByLabel("Headline", { exact: true }).waitFor();
  };
  try {
    // Match the screenshot: a holiday template can be explicitly saved without a title.
    await openGeneral("templateId=holidays--halloween--autumn-doorstep&collection=holidays-seasonal&occasion=halloween");
    const headline = page.getByLabel("Headline", { exact: true });
    assert.equal(await headline.inputValue(), "");
    await actions.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved.", { exact: true }).waitFor();
    const draftId = new URL(page.url()).searchParams.get("edit");
    assert.ok(draftId);
    assert.equal(records.get(draftId).title, "Event draft");
    assert.equal(records.get(draftId).data.status, "draft");
    assert.equal(records.get(draftId).data.bodyDesignId, "holidays--halloween--autumn-doorstep");
    assert.equal(records.get(draftId).data.manualEditor.snapshot.data.title, "");
    const saveCount = writes.length;
    await view.getByRole("button", { name: "Preview", exact: true }).waitFor();
    await headline.waitFor();
    await back();
    await controls.getByRole("button", { name: /^Headline/ }).waitFor();
    await expectLocalBack(saveCount, "Back from Headline returns to the main settings menu");
    await back();
    await view.getByRole("button", { name: "Edit", exact: true }).waitFor();
    await expectLocalBack(saveCount, "Back from the main settings menu shows the clean preview");
    await page.screenshot({ path: path.join(output, "saved-holiday-preview.png") });
    await back();
    await expectCreate(saveCount);

    for (const { width, query } of [
      { width: 1440, query: `edit=${draftId}` },
      { width: 390, query: `edit=${draftId}&editor=menu&returnTo=%2Fevent%2Fevent-draft%3Ftab%3Devent` },
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await openGeneral(query);
      assert.equal(await headline.inputValue(), "", "reopening the saved draft restores its blank title");
      const pending = `Pending Halloween title ${width}`;
      await headline.fill(pending);
      const before = writes.length;
      for (const tool of ["Page sections", "Layout", "Custom URL"]) {
        await controls.getByRole("group", { name: "Page tools", exact: true }).getByRole("button", { name: tool, exact: true }).click();
        await back();
        await controls.getByRole("button", { name: /^Headline/ }).waitFor();
        await expectLocalBack(before, `${tool}: Back returns to the main settings menu`);
        await controls.getByRole("button", { name: /^Headline/ }).click();
        assert.equal(await headline.inputValue(), pending, "Back preserves pending headline content");
      }
      await back();
      await controls.getByRole("button", { name: /^Headline/ }).waitFor();
      await expectLocalBack(before, "Back closes the native subsection with pending content retained");
      await back();
      await view.getByRole("button", { name: "Edit", exact: true }).waitFor();
      await expectLocalBack(before, "Back shows preview without discarding pending content");
      await back();
      await page.getByRole("dialog").waitFor();
      assert.equal(new URL(page.url()).pathname, "/event/general/customize", "only the final exit asks about unsaved content");
      await page.getByRole("button", { name: "Keep editing", exact: true }).click();
      await edit();
      await controls.getByRole("button", { name: /^Headline/ }).click();
      assert.equal(await headline.inputValue(), pending, "Keep editing retains the pending title");
      await back();
      await back();
      await back();
      await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
      await expectCreate(before);
      assert.equal(records.get(draftId).data.manualEditor.snapshot.data.title, "", "discarding preserves the last explicitly saved draft");
    }

    // Generated/uploaded Event Pages supply a public cancelHref even while still drafts.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/event/general/customize?mode=create`);
    await workspace.waitFor();
    await actions.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Draft saved.", { exact: true }).first().waitFor();
    const customId = new URL(page.url()).searchParams.get("edit");
    assert.equal(records.get(customId).data.status, "draft");
    const firstCustomCount = writes.length;
    await view.getByRole("button", { name: "Preview", exact: true }).click();
    await back();
    await expectCreate(firstCustomCount);
    await page.goto(`${base}/event/general/customize?mode=create&edit=${customId}&returnTo=%2Fevent%2F${customId}%3Ftab%3Devent`);
    await workspace.waitFor();
    await view.getByRole("button", { name: "Preview", exact: true }).click();
    await view.getByRole("button", { name: "Edit", exact: true }).waitFor();
    const customCount = writes.length;
    await back();
    await expectCreate(customCount);

    for (const query of ["edit=published-event", "edit=published-event&editor=menu&returnTo=%2Fevent%2Fschool-trip"]) {
      await page.goto(`${base}/event/general/customize?${query}`);
      await workspace.waitFor();
      await page.getByRole("heading", { name: "School field trip", exact: true }).waitFor();
      await view.getByRole("button", { name: "Preview", exact: true }).click();
      await view.getByRole("button", { name: "Edit", exact: true }).waitFor();
      const before = writes.length;
      await back();
      await page.locator("[data-destination]").waitFor();
      assert.equal(new URL(page.url()).pathname, "/event/school-trip", "published Event Pages retain their public return address");
      assert.equal(new URL(page.url()).searchParams.get("tab"), "event");
      assert.equal(writes.length, before, "leaving a published page does not save it");
    }
    assert.deepEqual(errors, [], "editor navigation has no uncaught browser errors");
  } catch (error) {
    fs.writeFileSync(path.join(output, "failure.json"), JSON.stringify({ url: page.url(), errors, writes, body: await page.locator("body").innerText() }, null, 2));
    await page.screenshot({ path: path.join(output, "failure.png") });
    throw error;
  } finally {
    await browser.close();
  }
});
