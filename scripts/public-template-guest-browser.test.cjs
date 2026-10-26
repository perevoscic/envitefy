const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();
let fixtureBundle;
const fixture = (output) => fixtureBundle ||= buildFixture(output);

async function buildFixture(output) {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/public-template-guest/entry.tsx"),
      output: { path: output, filename: "fixture.js" },
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "next-auth/react": path.resolve("scripts/fixtures/public-template-guest/auth.tsx"),
        "@/components/auth/AuthModal": path.resolve("scripts/fixtures/public-template-guest/auth.tsx"),
        "@/components/navigation/ConciergeSheet": path.resolve("scripts/fixtures/public-template-guest/empty.tsx"),
        "@/components/ConditionalFooter": path.resolve("scripts/fixtures/public-template-guest/empty.tsx"),
        "@/components/MobileOverflowReporter": path.resolve("scripts/fixtures/public-template-guest/empty.tsx"),
        "@/components/CoHostInvitationProvider": path.resolve("scripts/fixtures/public-template-guest/wrapper.tsx"),
        "@/app/event-cache-context": path.resolve("scripts/fixtures/public-template-guest/wrapper.tsx"),
        "@/contexts/MenuContext": path.resolve("scripts/fixtures/public-template-guest/wrapper.tsx"),
        "@/components/CalendarAction": path.resolve("scripts/fixtures/signup-editor/calendar.tsx"),
        "./SignupDesignPanel": path.resolve("scripts/fixtures/signup-editor/design.tsx"),
        "@": path.resolve("src"),
      } },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) }),
        new compiled.webpack.NormalModuleReplacementPlugin(/^\.\/left-sidebar$/, path.resolve("scripts/fixtures/public-template-guest/empty.tsx"))],
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const source = fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', '@import "tailwindcss" source(none); @source "../components/smart-signup-form"; @source "../components/events"; @source "../components/navigation"; @source "../components/templates/TemplateEditorContext.tsx"; @source "../components/UnsavedProgressProvider.tsx"; @source "../app/templates/signup/page.tsx"; @source "../../scripts/fixtures/public-template-guest";');
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process(source, { from: path.resolve("src/app/globals.css") })).css;
  return { script: fs.readFileSync(path.join(output, "fixture.js")), css };
}

test("guests retain public navigation and template edits until an authenticated explicit save", { timeout: 240000 }, async () => {
  const output = path.resolve("output/public-template-guest-browser");
  const { script, css } = await fixture(output);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const base = "http://localhost:43131";
  const signupPath = "/signup-forms/templates/editorial--school-days/customize";
  const eventPath = "/birthdays/templates/party-pop/customize";
  try {
    for (const { width, colorScheme } of [{ width: 390, colorScheme: "light" }, { width: 1280, colorScheme: "light" }, { width: 390, colorScheme: "dark" }, { width: 1280, colorScheme: "dark" }]) {
      for (const scenario of colorScheme === "dark" ? ["save"] : ["save", "header-signup", ...(width < 1024 ? ["header-login"] : []), "save-and-leave", "cancel-save-and-leave", "event-save"]) {
        const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: "reduce", colorScheme });
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        const errors = [];
        const writes = [];
        page.on("pageerror", (error) => errors.push(error.stack || error.message));
        await context.route("**/*", async (route) => {
          const request = route.request();
          const url = new URL(request.url());
          if (url.origin !== base) return route.abort();
          if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
          if (url.pathname.startsWith("/api/")) {
            if (request.method() !== "GET") {
              const payload = request.postDataJSON();
              writes.push({ pathname: url.pathname, method: request.method(), payload });
              return route.fulfill({ json: { ...payload, id: "account-draft", revision: "saved-revision" } });
            }
            return route.fulfill({ json: { people: [], recipients: [], events: [] } });
          }
          const publicFile = path.resolve("public", url.pathname.slice(1));
          if (publicFile.startsWith(path.resolve("public") + path.sep) && fs.existsSync(publicFile) && fs.statSync(publicFile).isFile()) return route.fulfill({ body: fs.readFileSync(publicFile) });
          if (/\.(?:woff2?|ttf|webp|png|svg|jpe?g)$/.test(url.pathname)) return route.fulfill({ status: 404, body: "" });
          return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
        });
        try {
          const isEvent = scenario === "event-save";
          const editorPath = isEvent ? eventPath : signupPath;
          await page.goto(`${base}/previous`);
          await page.goto(`${base}${editorPath}`);
          const header = page.locator("header[data-public-landing-header]");
          await header.getByRole("link", { name: "Envitefy home", exact: true }).waitFor();
          assert.equal(await header.getByRole("button", { name: "Let's create", exact: true }).isVisible(), true);
          const actionBar = isEvent ? page.getByRole("textbox", { name: "Event title", exact: true }) : page.getByRole("navigation", { name: "Signup editor", exact: true });
          const [headerBounds, actionBounds] = await Promise.all([header.boundingBox(), actionBar.boundingBox()]);
          assert.ok(actionBounds.y >= headerBounds.y + headerBounds.height, `public header must clear editor controls at ${width}px`);
          if (width < 1024) {
            await header.getByRole("button", { name: "Open navigation", exact: true }).click();
            await page.getByRole("dialog").waitFor();
            await page.keyboard.press("Escape");
          }
          const title = `Guest ${scenario} ${width}`;
          if (!isEvent) await page.getByRole("button", { name: "Edit event title", exact: true }).click();
          await page.getByRole("textbox", { name: "Event title", exact: true }).fill(title);
          if (!isEvent) await page.getByRole("button", { name: "Done editing event title", exact: true }).click();
          assert.equal(writes.length, 0, "editing public templates never saves or uploads");
          await page.evaluate(() => { window.__guestEditorBeforeAuth = document.querySelector("#signup-title") || document.querySelector('input'); });
          if (scenario === "save") {
            await page.screenshot({ path: path.join(output, `guest-editor-${colorScheme}-${width}.png`) });
            const toolbarPaper = await actionBar.evaluate((element) => getComputedStyle(element.parentElement).backgroundColor);
            if (colorScheme === "dark") {
              assert.equal(await page.locator("html").evaluate((element) => element.classList.contains("dark")), true);
              const channels = toolbarPaper.match(/[\d.]+/g).slice(0, 3).map(Number);
              assert.ok(channels.every((channel) => channel < 100), `dark editor actions use the app surface (${toolbarPaper})`);
            }
          }

          if (scenario === "save-and-leave" || scenario === "cancel-save-and-leave") {
            await page.getByRole("button", { name: "← Back", exact: true }).click();
            const progress = page.getByRole("dialog", { name: "Save your progress?", exact: true });
            await progress.getByRole("button", { name: "Save and leave", exact: true }).click();
            const account = page.getByRole("dialog", { name: "Account required", exact: true });
            await account.waitFor();
            assert.equal(new URL(page.url()).pathname, editorPath, "guest Save and leave cannot navigate before an account save");
            assert.equal(writes.length, 0, "browser recovery is not an account save");
            await page.screenshot({ path: path.join(output, `${scenario}-${width}.png`) });
            if (scenario === "cancel-save-and-leave") {
              await account.getByRole("button", { name: "Close account dialog", exact: true }).click();
              await account.waitFor({ state: "hidden" });
              assert.equal(new URL(page.url()).pathname, editorPath, "closing account signup keeps the current editor");
              await page.getByText(title, { exact: true }).waitFor();
              await page.getByRole("button", { name: "← Back", exact: true }).click();
              await progress.waitFor();
              assert.equal(writes.length, 0, "cancelled authentication preserves unsaved changes without a write");
            } else {
              await account.getByRole("button", { name: "Complete account signup", exact: true }).click();
              await page.getByText("Destination: /previous", { exact: true }).waitFor();
              assert.equal(writes.length, 1, "Save and leave writes only after account creation");
              assert.equal(writes[0].payload.data.signupForm.title, title);
            }
            assert.deepEqual(errors, []);
            continue;
          }

          if (scenario === "header-login") {
            await header.getByRole("button", { name: "Open navigation", exact: true }).click();
            await page.getByRole("button", { name: "Login", exact: true }).click();
          } else if (scenario === "header-signup") await header.getByRole("button", { name: "Let's create", exact: true }).click();
          else await page.getByRole("button", { name: isEvent ? "Save event draft" : "Save as draft", exact: true }).click();
          const account = page.getByRole("dialog", { name: "Account required", exact: true });
          await account.waitFor();
          const returnHref = await account.getAttribute("data-auth-return");
          assert.ok(returnHref.startsWith(`${editorPath}?draft=`), "authentication returns to the exact retained template draft");
          assert.equal(writes.length, 0, "the account prompt precedes all history/media writes");
          await page.screenshot({ path: path.join(output, `${scenario}-account-${colorScheme}-${width}.png`) });
          await account.getByRole("button", { name: scenario === "header-login" ? "Complete login" : "Complete account signup", exact: true }).click();
          if (scenario === "header-signup" || scenario === "header-login") {
            await account.waitFor({ state: "hidden" });
            await page.getByText(title, { exact: true }).waitFor();
            assert.equal(writes.length, 0, "creating an account from navigation does not implicitly save");
            await page.getByRole("button", { name: "Save as draft", exact: true }).click();
          }
          await page.waitForURL(/edit=account-draft/);
          assert.equal(await page.evaluate(() => window.__guestEditorBeforeAuth === (document.querySelector("#signup-title") || document.querySelector('input'))), true, "app chrome changes keep the actual editor mounted across authentication");
          assert.equal(writes.length, 1, "the explicit save becomes one account write after authentication");
          assert.equal(writes[0].pathname, "/api/history");
          assert.equal(writes[0].payload.data.status, "draft");
          assert.equal(isEvent ? writes[0].payload.data.templateEditor.snapshot.data.title : writes[0].payload.data.signupForm.title, title, "authentication retains the latest authored title");
          assert.deepEqual(errors, []);
          await page.screenshot({ path: path.join(output, `${scenario}-saved-${colorScheme}-${width}.png`) });
        } catch (error) {
          await page.screenshot({ path: path.join(output, `failure-${scenario}-${colorScheme}-${width}.png`), fullPage: true });
          throw new Error(`${scenario} in ${colorScheme} at ${width}px: ${error.message}\nPage errors: ${JSON.stringify(errors)}\nPage text: ${(await page.locator("body").innerText()).slice(0, 2400)}`);
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
});

test("guest account and sign-in publishing resumes the native editor action exactly once", { timeout: 240000 }, async () => {
  const output = path.resolve("output/public-template-guest-browser");
  const { script, css } = await fixture(output);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const base = "http://localhost:43131";
  const signupPath = "/signup-forms/templates/editorial--school-days/customize";
  const eventPath = "/birthdays/templates/party-pop/customize";
  const scenarios = ["signup-create", "signup-signin", "signup-switch", "signup-oauth", "signup-cancel", "signup-failed-auth", "signup-validation", "signup-oauth-invalid", "event-create", "event-signin", "event-validation"];
  const readDraft = (page) => page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open("envitefy-template-drafts", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const all = db.transaction("drafts").objectStore("drafts").getAll();
      all.onsuccess = () => { resolve(all.result.sort((a, b) => b.updatedAt - a.updatedAt)[0]); db.close(); };
      all.onerror = () => { reject(all.error); db.close(); };
    };
  }));
  try {
    for (const width of [320, 390, 1280]) {
      for (const scenario of width === 320 ? ["signup-create", "event-create"] : scenarios) {
        const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: "reduce" });
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        const errors = [];
        const writes = [];
        page.on("pageerror", (error) => errors.push(error.stack || error.message));
        page.on("dialog", (dialog) => void dialog.accept());
        await context.route("**/*", async (route) => {
          const request = route.request();
          const url = new URL(request.url());
          if (url.origin !== base) return route.abort();
          if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: script });
          if (url.pathname.startsWith("/api/")) {
            if (request.method() !== "GET") {
              const payload = request.postDataJSON();
              writes.push({ pathname: url.pathname, method: request.method(), payload });
              return route.fulfill({ json: { ...payload, id: "account-draft", revision: "saved-revision" } });
            }
            return route.fulfill({ json: { people: [], recipients: [], events: [] } });
          }
          const publicFile = path.resolve("public", url.pathname.slice(1));
          if (publicFile.startsWith(path.resolve("public") + path.sep) && fs.existsSync(publicFile) && fs.statSync(publicFile).isFile()) return route.fulfill({ body: fs.readFileSync(publicFile) });
          if (/\.(?:woff2?|ttf|webp|png|svg|jpe?g)$/.test(url.pathname)) return route.fulfill({ status: 404, body: "" });
          return route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
        });
        try {
          const isEvent = scenario.startsWith("event-");
          const invalid = scenario.endsWith("-validation");
          const editorPath = isEvent ? eventPath : signupPath;
          const title = invalid ? "" : `Publish ${scenario} ${width}`;
          await page.goto(`${base}${editorPath}`);
          if (!isEvent) await page.getByRole("button", { name: "Edit event title", exact: true }).click();
          await page.getByRole("textbox", { name: "Event title", exact: true }).fill(title);
          if (!isEvent) {
            await page.getByRole("button", { name: "Done editing event title", exact: true }).click();
            await page.getByRole("button", { name: "+ Add section", exact: true }).first().click();
            await page.getByRole("button", { name: /^\+ Registration places/ }).click();
            await page.getByRole("button", { name: "Preview & publish →", exact: true }).click();
          }
          const chooseSignIn = scenario.endsWith("-signin");
          const publishAction = chooseSignIn ? "Sign in & publish" : "Create an account & publish";
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "guest publishing choices fit the native editor width");
          for (const action of ["Create an account & publish", "Sign in & publish"]) {
            const bounds = await page.getByRole("button", { name: action, exact: true }).boundingBox();
            assert.ok(bounds && bounds.height >= 44 && bounds.x >= -1 && bounds.x + bounds.width <= width + 1,
              `${action} must remain a reachable native editor action at ${width}px: ${JSON.stringify(bounds)}`);
          }
          if (scenario === "signup-create" || scenario === "event-create") await page.screenshot({ path: path.join(output, `${scenario}-choices-${width}.png`) });
          await page.getByRole("button", { name: publishAction, exact: true }).click();
          const account = page.getByRole("dialog", { name: "Account required", exact: true });
          if (scenario === "signup-validation") {
            await page.getByText("Give your signup a title.", { exact: true }).waitFor();
            assert.equal(await account.count(), 0, "native signup validation runs before authentication");
            assert.equal(writes.length, 0);
            assert.deepEqual(errors, []);
            continue;
          }
          await account.waitFor();
          assert.equal(await account.getAttribute("data-auth-action"), "publish", "publishing retains explicit intent while authenticating");
          const returnHref = await account.getAttribute("data-auth-return");
          assert.ok(returnHref.startsWith(`${editorPath}?draft=`));
          assert.equal(writes.length, 0, "account authentication precedes every publish write");
          const draftBeforeAuth = await readDraft(page);
          assert.equal(draftBeforeAuth.pendingPublish, true, "redirect recovery retains the explicit publish intent");
          if (scenario === "signup-cancel") {
            await account.getByRole("button", { name: "Close account dialog", exact: true }).click();
            await account.waitFor({ state: "hidden" });
            await page.waitForFunction(() => new Promise((resolve) => {
              const request = indexedDB.open("envitefy-template-drafts", 1);
              request.onsuccess = () => {
                const db = request.result;
                const all = db.transaction("drafts").objectStore("drafts").getAll();
                all.onsuccess = () => { resolve(all.result.every((draft) => !draft.pendingPublish)); db.close(); };
              };
            }));
            await page.goto(`${base}${returnHref}`);
            await page.getByRole("button", { name: "Edit event title", exact: true }).waitFor();
            assert.equal(writes.length, 0, "cancelled publishing does not resume after reload");
            await page.locator("header[data-public-landing-header]").getByRole("button", { name: "Let's create", exact: true }).click();
            await account.waitFor();
            assert.equal(await account.getAttribute("data-auth-action"), "save");
            await account.getByRole("button", { name: "Complete account signup", exact: true }).click();
            await account.waitFor({ state: "hidden" });
            await page.getByText(title, { exact: true }).waitFor();
            assert.equal(writes.length, 0, "an unrelated account signup cannot replay cancelled publishing");
            await page.getByRole("button", { name: "Save as draft", exact: true }).click();
            await page.waitForURL(/edit=account-draft/);
            assert.equal(writes.length, 1);
            assert.equal(writes[0].payload.data.status, "draft", "a later Save stays a private draft");
            assert.deepEqual(errors, []);
            continue;
          }
          if (scenario === "signup-failed-auth") {
            await account.getByRole("button", { name: "Simulate failed authentication", exact: true }).click();
            await account.getByRole("alert").filter({ hasText: "Authentication failed" }).waitFor();
            assert.equal(writes.length, 0, "failed authentication does not publish");
          }
          if (scenario === "signup-switch") {
            await account.getByRole("button", { name: "Switch to sign in", exact: true }).click();
            await account.getByRole("button", { name: "Sign in & publish", exact: true }).waitFor();
            assert.equal(await account.getAttribute("data-auth-action"), "publish", "switching account mode retains publication intent");
          }
          if (scenario === "signup-oauth-invalid") {
            await page.evaluate(() => new Promise((resolve, reject) => {
              const request = indexedDB.open("envitefy-template-drafts", 1);
              request.onerror = () => reject(request.error);
              request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction("drafts", "readwrite");
                const store = transaction.objectStore("drafts");
                const all = store.getAll();
                all.onsuccess = () => {
                  const draft = all.result.sort((a, b) => b.updatedAt - a.updatedAt)[0];
                  draft.snapshot.form.sections = [];
                  store.put(draft);
                };
                transaction.oncomplete = () => { db.close(); resolve(); };
                transaction.onerror = () => { db.close(); reject(transaction.error); };
              };
            }));
          }
          if (scenario === "signup-oauth" || scenario === "signup-oauth-invalid") {
            await account.getByRole("button", { name: "Complete Google redirect", exact: true }).click();
          } else {
            const completeAction = chooseSignIn || scenario === "signup-switch" ? "Sign in & publish" : "Create an account & publish";
            await account.getByRole("button", { name: completeAction, exact: true }).click();
          }
          if (scenario === "event-validation" || scenario === "signup-oauth-invalid") {
            const message = isEvent ? "Give your event a title." : "Add at least one named signup slot.";
            await page.getByRole("alert").filter({ hasText: message }).first().waitFor();
            assert.equal(writes.length, 0, "native post-auth validation blocks invalid publication");
            const consumed = await readDraft(page);
            assert.equal(Boolean(consumed.pendingPublish), false, "failed publication consumes the old request instead of replaying it");
            await page.goto(`${base}${returnHref}`);
            await page.getByRole(isEvent ? "textbox" : "button", { name: isEvent ? "Event title" : "Edit event title", exact: true }).waitFor();
            assert.equal(writes.length, 0, "reloading after a publish validation failure never republishes");
            assert.deepEqual(errors, []);
            continue;
          }
          await page.waitForURL(isEvent ? /\/event\/[^/]+$/ : /\/smart-signup-form\/account-draft\?published=1$/);
          assert.equal(writes.length, 1, "combined authentication and publication saves once without requiring another Publish click");
          assert.equal(writes[0].pathname, "/api/history");
          assert.equal(writes[0].payload.data.status, "published");
          assert.equal(isEvent ? writes[0].payload.data.templateEditor.snapshot.data.title : writes[0].payload.data.signupForm.title, title, "the native published payload retains the latest authored title");
          if (!isEvent) assert.equal(writes[0].payload.data.signupForm.sections[0].slots[0].label, "Registration");
          assert.deepEqual(errors, []);
          await page.screenshot({ path: path.join(output, `${scenario}-published-${width}.png`) });
        } catch (error) {
          await page.screenshot({ path: path.join(output, `failure-${scenario}-${width}.png`), fullPage: true });
          throw new Error(`${scenario} at ${width}px: ${error.message}\nPage errors: ${JSON.stringify(errors)}\nWrites: ${JSON.stringify(writes)}\nPage text: ${(await page.locator("body").innerText()).slice(0, 2400)}`);
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
});
