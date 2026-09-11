// Isolated browser regression using the real shared control and gymnastics strip.
// Calendar launches and profile requests stay inside this local test fixture.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");
const { chromium } = require("playwright");
const React = require("react");
const { renderToString } = require("react-dom/server");

const root = path.resolve(__dirname, "..");
const work = fs.mkdtempSync(path.join(root, "tmp", "calendar-actions-"));
const fixtureFile = path.join(work, "fixture.tsx");
const fixture = `
import React, { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { SessionContext } from "next-auth/react";
import CalendarAction from "@/components/CalendarAction";
import FloatingActionStrip from "@/components/gym-meet-templates/FloatingActionStrip";
import { writeLocalCalendarDefault } from "@/lib/calendar-preference";
const links = { google: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meet", outlook: "https://outlook.live.com/calendar/0/deeplink/compose?subject=Meet", appleInline: "/api/ics?event=meet" };
export function Fixture({ account = "" }) {
  const [email, setEmail] = useState(account);
  const session = { status: email ? "authenticated" : "unauthenticated", data: email ? { user: { email }, expires: "2099-01-01" } : null, update: async () => null };
  const choose = (provider) => window.launches.push(provider);
  return <SessionContext.Provider value={session}>
    <main className="mx-auto max-w-sm p-4 text-[#17293c]">
      <div id="generic"><CalendarAction links={links} /></div>
      <div id="gym" className="mt-5"><FloatingActionStrip buttonClass="inline-flex items-center justify-center gap-2 rounded-full border border-current/20 px-4 py-2 text-xs" onShare={() => {}} onGoogleCalendar={() => choose("google")} onAppleCalendar={() => choose("apple")} onOutlookCalendar={() => choose("microsoft")} onMobileEdit={() => choose("edit")} /></div>
      <div id="owner" className="mt-5"><FloatingActionStrip buttonClass="inline-flex items-center justify-center gap-2 rounded-full border border-current/20 px-4 py-2 text-xs" onShare={() => {}} onGoogleCalendar={() => {}} onAppleCalendar={() => {}} onOutlookCalendar={() => {}} mobileEditHref="/event/gymnastics/customize?edit=meet&editor=menu" /></div>
      <div id="guest" hidden><FloatingActionStrip buttonClass="" onShare={() => {}} onGoogleCalendar={() => {}} onAppleCalendar={() => {}} onOutlookCalendar={() => {}} /></div>
      <button id="settings" onClick={() => writeLocalCalendarDefault("microsoft")}>Change default in Settings</button>
      <button id="account" onClick={() => setEmail("second@example.test")}>Switch account</button>
    </main>
  </SessionContext.Provider>;
}
if (typeof window !== "undefined") {
  window.launches = [];
  window.open = (href) => { window.launches.push(href); return {}; };
  hydrateRoot(document.getElementById("root"), <Fixture account={window.fixtureAccount} />);
}
`;
fs.writeFileSync(fixtureFile, fixture);
fs.writeFileSync(
  path.join(work, "loader.cjs"),
  `const ts = require(${JSON.stringify(require.resolve("typescript"))}); module.exports = function(source) { return ts.transpileModule(source, {fileName:this.resourcePath,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText; };`,
);

// Load the same fixture for server rendering without modifying global module hooks.
const moduleCache = new Map();
function loadTypeScript(file) {
  if (moduleCache.has(file)) return moduleCache.get(file).exports;
  const mod = new Module(file);
  mod.filename = file;
  mod.paths = Module._nodeModulePaths(root);
  moduleCache.set(file, mod);
  const normalRequire = Module.createRequire(path.join(root, "package.json"));
  mod.require = (request) => {
    if (request === "lucide-react") {
      const lucideFile = path.join(root, "node_modules/lucide-react/dist/cjs/lucide-react.js");
      const lucide = new Module(lucideFile);
      lucide.paths = Module._nodeModulePaths(path.dirname(lucideFile));
      lucide._compile(fs.readFileSync(lucideFile, "utf8"), lucideFile);
      return lucide.exports;
    }
    if (request.startsWith("@/")) {
      const base = path.join(root, "src", request.slice(2));
      const match = [base, `${base}.tsx`, `${base}.ts`].find(
        (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      return loadTypeScript(match);
    }
    return normalRequire(request);
  };
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
  return mod.exports;
}

async function main() {
  const runtime = require("next/dist/compiled/webpack/webpack");
  runtime.init();
  await new Promise((resolve, reject) =>
    runtime.webpack(
      {
        mode: "development",
        devtool: false,
        entry: fixtureFile,
        plugins: [
          new runtime.webpack.DefinePlugin({
            "process.env": JSON.stringify({ NODE_ENV: "development" }),
          }),
        ],
        output: { path: work, filename: "bundle.js" },
        resolve: {
          extensions: [".tsx", ".ts", ".js"],
          alias: { "@": path.join(root, "src") },
          modules: [path.join(root, "node_modules")],
        },
        module: {
          rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(work, "loader.cjs") }],
        },
      },
      (error, stats) =>
        error || stats.hasErrors()
          ? reject(error || Error(stats.toString({ all: false, errors: true })))
          : resolve(),
    ),
  );
  const css = await require("postcss")([require("@tailwindcss/postcss")()]).process(
      '@import "tailwindcss" source(none); @source "./fixture.tsx"; @source "../../src/components/CalendarAction.tsx"; @source "../../src/components/gym-meet-templates/FloatingActionStrip.tsx";',
    { from: path.join(work, "styles.css") },
  );
  const { Fixture } = loadTypeScript(fixtureFile);
  let profile = null;
  const connections = { google: true, apple: true, microsoft: true };
  let failProfile = false;
  let failSave = false;
  const writes = [];
  const server = http.createServer(async (req, res) => {
    if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(fs.readFileSync(path.join(work, "bundle.js")));
      return;
    }
    if (req.url === "/styles.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(css.css);
      return;
    }
    if (req.url === "/api/calendars") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(connections));
      return;
    }
    if (req.url === "/api/user/profile") {
      res.setHeader("Content-Type", "application/json");
      if (req.method === "PUT") {
        let body = "";
        for await (const chunk of req) body += chunk;
        writes.push(JSON.parse(body));
        if (failSave) {
          res.statusCode = 500;
          res.end("{}");
          return;
        }
        profile = JSON.parse(body).preferredProvider;
      } else if (failProfile) {
        res.statusCode = 500;
        res.end("{}");
        return;
      }
      res.end(JSON.stringify({ preferredProvider: profile }));
      return;
    }
    const account = req.url.includes("signed-in") ? "first@example.test" : "";
    res.setHeader("Content-Type", "text/html");
    res.end(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body style="background:#f6f1e7"><div id="root">${renderToString(React.createElement(Fixture, { account }))}</div><script>window.fixtureAccount=${JSON.stringify(account)}</script><script src="/bundle.js"></script></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|didn.t match/i.test(message.text()))
      errors.push(message.text());
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const generic = () => page.locator("#generic button");
  const gym = () => page.locator("#gym").getByRole("button", { name: /^Add to / });
  const waitLabel = async (label) => {
    await page.waitForFunction(
      (value) =>
        document.querySelector("#generic button")?.textContent === value &&
        document.querySelector('#gym button[aria-label^="Add to "]')?.textContent === value,
      label,
    );
  };
  try {
    await page.goto(base);
    await waitLabel("Add to calendar");
    const edit = page.locator("#gym").getByRole("button", { name: "Edit event" });
    await edit.click();
    assert.equal((await page.evaluate(() => window.launches)).at(-1), "edit");
    assert.equal(await page.locator('#guest [aria-label="Edit event"]').count(), 0);
    assert.equal(await page.locator('#owner a[aria-label="Edit event"]').getAttribute("target"), "_top");
    for (const [name, provider] of [
      ["Google Calendar", "google"],
      ["Apple Calendar", "apple"],
      ["Outlook Calendar", "microsoft"],
    ]) {
      await gym().click();
      const dialog = page.getByRole("dialog", { name: "Add to calendar" });
      await dialog.waitFor();
      assert.equal(
        await dialog.getByRole("button", { name: /Calendar$/, exact: false }).count(),
        3,
      );
      await dialog.getByRole("button", { name, exact: true }).click();
      assert.equal((await page.evaluate(() => window.launches)).at(-1), provider);
      await waitLabel("Add to calendar");
    }
    for (const width of [320, 360, 768, 1280]) {
      await page.setViewportSize({ width, height: 780 });
      await generic().click();
      const dialog = page.getByRole("dialog");
      const box = await dialog.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, `dialog fits ${width}px`);
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
      await page.waitForFunction(
        () => document.querySelector("#generic button") === document.activeElement,
      );
      const buttonBox = await gym().boundingBox();
      assert.ok(buttonBox.x >= 0 && buttonBox.x + buttonBox.width <= width);
      if (width < 768) {
        const editBox = await edit.boundingBox();
        assert.ok(editBox.width >= 44 && editBox.height >= 44);
        assert.ok(editBox.x >= buttonBox.x + buttonBox.width + 7);
        assert.ok(Math.abs(editBox.y - buttonBox.y) < 1, "Edit stays beside calendar");
        assert.ok(editBox.x + editBox.width <= width);
      } else {
        assert.equal(await edit.isVisible(), false, "desktop editor keeps its sidebar");
      }
      const ownerEdit = page.locator('#owner a[aria-label="Edit event"]');
      assert.equal(await ownerEdit.isVisible(), width < 1024);
      if (width < 1024) {
        const calendarBox = await page.locator("#owner").getByRole("button", { name: /^Add to / }).boundingBox();
        const editBox = await ownerEdit.boundingBox();
        assert.ok(editBox.x >= calendarBox.x + calendarBox.width + 7);
        assert.ok(Math.abs(editBox.y - calendarBox.y) < 1);
      }
      if (width === 360) {
        await page.locator("#gym").screenshot({ path: path.join(root, "tmp", "gymnastics-mobile-event-actions.png") });
      }
    }
    await generic().click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Google Calendar", exact: true }).click();
    await waitLabel("Add to Google Calendar");
    await page.reload();
    await waitLabel("Add to Google Calendar");
    await generic().click();
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.match((await page.evaluate(() => window.launches)).at(-1), /calendar.google.com/);

    // The account profile wins over another person's browser-local preference.
    profile = "microsoft";
    await page.goto(`${base}/signed-in`);
    await waitLabel("Add to Outlook Calendar");
    await generic().click();
    assert.match((await page.evaluate(() => window.launches)).at(-1), /outlook.live.com/);
    profile = "apple";
    await page.locator("#settings").click();
    await waitLabel("Add to Apple Calendar");
    await generic().click();
    assert.match((await page.evaluate(() => window.launches)).at(-1), /\/api\/ics\?event=meet$/);

    profile = null;
    await page.locator("#account").click();
    await waitLabel("Add to calendar");
    await generic().click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Outlook Calendar", exact: true }).click();
    await waitLabel("Add to Outlook Calendar");
    assert.deepEqual(writes.at(-1), { preferredProvider: "microsoft" });

    profile = "google";
    connections.google = false;
    await page.reload();
    await waitLabel("Add to calendar");
    await generic().click();
    await page.getByRole("button", { name: "Google Calendar", exact: true }).click();
    await waitLabel("Add to calendar");
    assert.equal(
      profile,
      "google",
      "viewing a disconnected default never clears the saved preference",
    );

    connections.google = true;
    failProfile = true;
    await page.reload();
    await waitLabel("Add to calendar");
    await generic().click();
    await page.getByRole("button", { name: "Google Calendar", exact: true }).click();
    assert.match((await page.evaluate(() => window.launches)).at(-1), /calendar.google.com/);
    failProfile = false;
    profile = null;
    failSave = true;
    await page.reload();
    await generic().click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Google Calendar", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector("#generic button")?.textContent === "Add to calendar",
    );
    assert.equal(profile, null);
    assert.deepEqual(errors, [], "no client errors or hydration mismatches");
    console.log(
      "Calendar browser checks passed: mobile Edit placement and callback, owner Edit link, guest controls, chooser providers, 320/360/768/1280px, focus restoration, remembered guest default, all account defaults, Settings updates, account switching, disconnected/default failures, and hydration.",
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        errors,
        launches: await page.evaluate(() => window.launches),
        body: (await page.locator("body").innerText()).slice(0, 1800),
      }),
    );
    throw error;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    // Remove only files created by this fixture in its unique workspace directory.
    for (const name of ["fixture.tsx", "loader.cjs", "bundle.js"]) {
      const file = path.join(work, name);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    fs.rmdirSync(work);
  });
