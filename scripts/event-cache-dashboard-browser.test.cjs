const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

const payload = (owner) => ({
  ok: true, nextEvent: null, upcoming: [], rsvp: null,
  snapshot: { upcomingCount30Days: 0, upcomingCount7Days: 0, nextEventInDays: null },
  setupHealth: { flags: [] }, checklist: { source: "derived", items: [] },
  drafts: { count: 0, items: [] },
  metricsEligibility: { weatherEligible: false, travelWindowEligible: false },
  diagnostics: { owner },
});
const history = (owner) => ({ items: [{ id: "deleted-event", title: owner }, { id: `${owner}-event`, title: owner }] });

test("dashboard loads alongside a delayed sidebar and rejects earlier-account reads and invalidated events", { timeout: 120000 }, async () => {
  const output = path.resolve("output/event-cache-dashboard");
  fs.mkdirSync(output, { recursive: true });
  const mock = (name, source) => {
    const file = path.join(output, `${name}.tsx`);
    fs.writeFileSync(file, source);
    return file;
  };
  const auth = mock("auth", `import {useEffect,useState} from 'react';
    const update=async()=>({user:{email:sessionStorage.getItem('qa:email')||'a@test.com'}});
    export function useSession(){const [email,setEmail]=useState(()=>sessionStorage.getItem('qa:email')||'a@test.com');
      useEffect(()=>{const read=()=>setEmail(sessionStorage.getItem('qa:email')||'');window.addEventListener('qa:account',read);return()=>window.removeEventListener('qa:account',read)},[]);
      return {data:email?{user:{email}}:null,status:email?'authenticated':'unauthenticated',update}}`);
  const navigation = mock("navigation", `const router={push(){},replace(){},refresh(){}};export function useRouter(){return router} export function usePathname(){return '/'};`);
  const cohosts = mock("cohosts", `const value={invitations:[],loading:false,error:null,refresh(){}};export function useCoHostInvitations(){return value}`);
  const noop = mock("noop", "export default function Noop(){return null}");
  const home = mock("home", `import React from 'react';export default function Home({data,loading}){return <div id="dashboard-home">{JSON.stringify({owner:data?.diagnostics?.owner||null,loading})}</div>}`);
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/event-cache-dashboard.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js"], alias: {
        "next-auth/react": auth, "next/navigation": navigation,
        "@/components/CoHostInvitationProvider": cohosts,
        "@/components/dashboard/HomeOverviewDashboard": home,
        "@/components/dashboard/PendingCoHostInvitations": noop,
        "@/components/ScheduleReviewDialog": noop,
        "@/components/EventDeleteModal": noop,
        "@": path.resolve("src"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors()
      ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  assert.equal(script.includes("dangerouslyAllowBrowser"), false, "dashboard fixture must not include the AI SDK");
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script); }
    else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end('<html><head><meta charset="utf-8"></head><body><main id="root"></main><script src="/fixture.js"></script></body></html>'); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const held = [];
  const reads = [];
  let account = "a@test.com";
  let holdDashboard = false;
  const holdHistory = true;
  const release = async (entry, body) => {
    entry.released = true;
    entry.resolve(body);
    await entry.finished;
  };
  const findHeld = async (kind, identity) => {
    const end = Date.now() + 5000;
    while (Date.now() < end) {
      const entry = held.find((read) => read.kind === kind && read.account === identity && !read.released);
      if (entry) return entry;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.fail(`No pending ${kind} request for ${identity}`);
  };
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/**", async (route) => {
      const kind = new URL(route.request().url()).pathname === "/api/dashboard" ? "dashboard" : "history";
      const entry = { kind, account, released: false };
      reads.push(entry);
      let body = kind === "dashboard" ? payload(account) : history(account);
      if (kind === "dashboard" ? holdDashboard : holdHistory) {
        entry.finished = new Promise((resolve) => { entry.finish = resolve; });
        const delayed = new Promise((resolve) => { entry.resolve = resolve; });
        held.push(entry);
        body = await delayed;
      }
      try { await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }); }
      finally { entry.finish?.(); }
    });
    const state = () => page.locator("#cache-state").evaluate((element) => JSON.parse(element.textContent));
    const waitState = (check) => page.waitForFunction(check);
    const switchAccount = async (identity) => {
      account = identity;
      await page.evaluate((email) => { sessionStorage.setItem("qa:email", email); window.dispatchEvent(new Event("qa:account")); }, identity);
    };

    await page.goto(base);
    await page.locator("#cache-state").waitFor({ state: "attached" });
    await waitState(() => JSON.parse(document.querySelector("#cache-state").textContent).dashboard?.diagnostics.owner === "a@test.com");
    const first = await state();
    assert.equal(first.historyLoading, true);
    assert.equal(first.hydrated, false);
    assert.equal(first.dashboardLoading, false);
    assert.equal(reads.filter((read) => read.kind === "dashboard").length, 1, "first request is coalesced while history is held");
    assert.match(await page.locator("#dashboard-home").textContent(), /a@test.com/);
    const firstHistory = await findHeld("history", account);

    holdDashboard = true;
    await page.getByRole("button", { name: "Refresh all", exact: true }).click();
    const oldDashboard = await findHeld("dashboard", account);
    await switchAccount("b@test.com");
    const newDashboard = await findHeld("dashboard", account);
    const newHistory = await findHeld("history", account);
    await release(firstHistory, history("a@test.com"));
    await release(oldDashboard, payload("a@test.com"));
    await waitState(() => JSON.parse(document.querySelector("#cache-state").textContent).identity === "b@test.com");
    const switched = await state();
    assert.equal(switched.dashboard, null);
    assert.equal(switched.history.length, 0);
    assert.equal(switched.dashboardLoading, true, "old dashboard completion cannot stop the new account's spinner");
    assert.equal(switched.historyLoading, true, "old history completion cannot stop the new account's spinner");
    await release(newDashboard, payload("b@test.com"));
    await release(newHistory, history("b@test.com"));
    await waitState(() => JSON.parse(document.querySelector("#cache-state").textContent).dashboard?.diagnostics.owner === "b@test.com");
    assert.equal((await state()).history[0].title, "b@test.com");
    assert.equal(await page.evaluate(() => window.__cacheSnapshots.some((snapshot) => snapshot.identity === "b@test.com" && (
      snapshot.dashboard?.diagnostics.owner === "a@test.com" || snapshot.history.some((row) => row.title === "a@test.com")
    ))), false, "the previous account's data is never rendered after switching");

    // Remove an event while both older reads are pending; neither can restore it.
    await page.getByRole("button", { name: "Refresh all", exact: true }).click();
    const beforeDelete = await findHeld("dashboard", account);
    const historyBeforeDelete = await findHeld("history", account);
    await page.getByRole("button", { name: "Remove event", exact: true }).click();
    await release(beforeDelete, payload("deleted-stale"));
    await release(historyBeforeDelete, history(account));
    const afterDelete = await findHeld("dashboard", account);
    await release(afterDelete, payload(account));
    await release(await findHeld("history", account), history(account));
    await waitState(() => JSON.parse(document.querySelector("#cache-state").textContent).dashboardLoading === false);
    const deleted = await state();
    assert.equal(deleted.history.some((row) => row.id === "deleted-event"), false);
    assert.equal(deleted.dashboard.diagnostics.owner, account);

    // A save invalidates pending dashboard content without leaving loading stuck.
    await page.getByRole("button", { name: "Refresh all", exact: true }).click();
    const beforeSave = await findHeld("dashboard", account);
    await page.getByRole("button", { name: "Save event", exact: true }).click();
    await release(beforeSave, payload("before-save"));
    const afterSave = await findHeld("dashboard", account);
    await release(afterSave, payload(account));
    await release(await findHeld("history", account), history(account));
    await waitState(() => JSON.parse(document.querySelector("#cache-state").textContent).dashboardLoading === false);
    assert.equal((await state()).history.some((row) => row.id === "new-save"), true);
    assert.deepEqual(errors, []);
  } finally {
    for (const entry of held) if (!entry.released) entry.resolve({ items: [] });
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
