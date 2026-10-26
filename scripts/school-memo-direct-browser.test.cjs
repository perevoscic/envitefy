const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("a school memo upload finishes its event before showing the checked date section", { timeout: 120000 }, async t => {
  const output = path.resolve("output/qa/school-memo-direct-browser");
  fs.mkdirSync(output, { recursive: true });
  const mock = (name, source) => { const file = path.join(output, `${name}.tsx`); fs.writeFileSync(file, source); return file; };
  const auth = mock("auth", `import {createContext} from 'react'; export const SessionContext=createContext(undefined); const session={user:{id:'memo-owner',email:'memo-owner@example.invalid',name:'Parent'}}; export function useSession(){return {data:session,status:'authenticated'}}`);
  const sidebar = mock("sidebar", `const noop=()=>{}; const value={selectedEventId:null,selectedEventTitle:null,selectedEventHref:null,selectedEventEditHref:null,activeEventTab:'design',setSelectedEventId:noop,setSelectedEventTitle:noop,setSelectedEventHref:noop,setSelectedEventOwnerHref:noop,setSelectedEventEditHref:noop,setActiveEventTab:tab=>window.__memoActiveTab=tab,setEventContextSourcePage:noop,clearEventContext:noop};export function useSidebar(){return value}`);
  const cache = mock("cache", `const noop=()=>{};const value={dashboardData:null,dashboardLoading:false,dashboardError:null,isIdentityReady:true,refreshDashboard:noop,setDashboardMetricsCache:noop};export function useEventCache(){return value}`);
  const cohosts = mock("cohosts", `const value={invitations:[],loading:false,error:null,refresh(){}};export function useCoHostInvitations(){return value}`);
  const noop = mock("noop", "export default function Noop(){return null}");
  const pending = mock("pending", `let taken=false;export async function takePendingSnapUpload(){if(taken)return null;taken=true;return {file:new File(['exact original school memo PDF bytes'],'weekly-memo.pdf',{type:'application/pdf'}),scanAttemptId:'scan-school-fixture'}}`);
  const media = mock("media", `export function validateClientUploadFile(){return null}export async function prepareOcrUploadFile(file){return file}export function getUploadAcceptAttribute(){return '.pdf,image/*'}export function revokeObjectUrl(url){if(url)URL.revokeObjectURL(url)}export function createObjectUrlPreview(file){return URL.createObjectURL(file)}export async function uploadMediaFile({file}){window.__memoOriginalBytes=await file.text();return {eventMedia:{thumbnail:'/source-preview.webp',attachment:{url:'/original-memo.pdf',name:file.name,type:file.type}}}}`);
  const log = mock("log", "export function createClientAttemptId(){return 'scan-school-fixture'}export function reportClientLog(){};");
  const calendarPreference = mock("calendar-preference", "export function useCalendarPreference(){return {provider:'google',signedIn:true,canRemember:provider=>provider==='google'}}");
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development", target: "web", devtool: false,
      entry: path.resolve("scripts/fixtures/school-memo-direct.tsx"), output: { path: output, filename: "fixture.js" },
      plugins: [new compiled.webpack.DefinePlugin({ "process.env": JSON.stringify({ NODE_ENV: "development" }) })],
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next-auth/react": auth, "next/navigation": path.resolve("scripts/fixtures/signup-editor/navigation.ts"),
        "@/app/sidebar-context": sidebar, "@/app/event-cache-context": cache,
        "@/components/CoHostInvitationProvider": cohosts,
        "@/components/dashboard/HomeOverviewDashboard": noop, "@/components/dashboard/PendingCoHostInvitations": noop,
        "@/components/EventDeleteModal": noop,
        "@/lib/pending-snap-upload": pending, "@/utils/media-upload-client": media, "@/utils/client-log": log,
        "@/hooks/useCalendarPreference": calendarPreference,
        "@": path.resolve("src"),
      } },
      module: { rules: [
        { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") },
        { test: /\.css$/, use: path.resolve("scripts/lib/event-editor-css-loader.cjs") },
      ] },
    });
    compiler.run((error, stats) => compiler.close(() => error || stats?.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  });
  const css = (await require("postcss")([require("@tailwindcss/postcss")()]).process('@import "tailwindcss" source(none); @source "../src/components/SchoolMemoDates.tsx"; @source "../src/components/ScannedInviteSkin.tsx"; @source "../src/components/snap/SnapProcessingCard.tsx";', { from: path.resolve("scripts/school-memo-direct-fixture.css") })).css;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  try {
    for (const width of [390, 1440]) await t.test(`${width}px upload opens a completed event without a review gate`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce", timezoneId: "America/Chicago" });
      const errors = [], writes = [];
      let saved = null, ocrCalls = 0, sportsMode = false;
      page.on("pageerror", error => errors.push(error.stack || error.message));
      const schedule = {
        kind: "school-memo", title: "Mrs. Example's Weekly Memo", issueDate: "2026-10-26", timezone: "America/Chicago", items: [
          { id: "spirit", type: "event", title: "Spirit Week", date: "2026-10-26", endDate: "2026-10-30" },
          { id: "bible", type: "test", title: "Bible Test", date: "2026-10-30", calendarSelected: false },
          { id: "spelling", type: "test", title: "Spelling Test", date: "2026-10-30" },
          { id: "pumpkin", type: "event", title: "Pumpkin Day", date: "2026-10-30", notes: "During lunch" },
          { id: "closure", type: "closure", title: "No School", date: "2026-11-11" },
          { id: "turkey", type: "event", title: "Turkey Trot", date: "2026-11-16" },
        ],
      };
      await page.route("**/*", async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.pathname === "/fixture.js") return route.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(output, "fixture.js")) });
        if (url.pathname === "/api/ocr") {
          ocrCalls++;
          if (sportsMode) return route.fulfill({ contentType: "application/json", body: JSON.stringify({ category: "Sport Events", scanSchedule: { title: "Team schedule", timezone: "America/Chicago", items: [{ id: "game", type: "game", title: "Tigers vs Panthers", date: "2026-10-30", startTime: "16:00", endTime: "17:00" }] }, fieldsGuess: { title: "Team schedule", start: null, end: null, timeFound: false, timezone: "America/Chicago", description: "Team game schedule" } }) });
          return route.fulfill({ contentType: "application/json", body: JSON.stringify({ category: "General Events", scanSchedule: schedule, ocrText: "Mrs. Example's Weekly Memo October 26\nBible Test Friday October 30", fieldsGuess: { title: schedule.title, start: "2026-10-26", end: null, timeFound: false, timezone: "America/Chicago", description: "Spirit Week: bring a donation to break dress code. Study spelling and memory verses daily.", scanSourceKind: "paperwork" } }) });
        }
        if (url.pathname === "/api/history" && request.method() === "POST") {
          writes.push({ path: url.pathname, body: request.postDataJSON() });
          const body = request.postDataJSON();
          saved = { id: "memo-fixture", title: body.title, data: body.data, public_slug: "weekly-school-memo", user_id: "memo-owner" };
          return route.fulfill({ contentType: "application/json", body: JSON.stringify(saved) });
        }
        if (url.pathname === "/api/history/memo-fixture") return route.fulfill({ contentType: "application/json", body: JSON.stringify(saved) });
        if (url.pathname.endsWith("/calendar-items")) {
          writes.push({ path: url.pathname, body: request.postDataJSON() });
          return route.fulfill({ contentType: "application/json", body: JSON.stringify({ results: request.postDataJSON().itemIds.map(id => ({ id, status: "added" })) }) });
        }
        if (url.pathname.startsWith("/api/")) throw new Error(`Unexpected API: ${url.pathname}`);
        return route.fulfill({ contentType: "text/html", body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0;font-family:Arial,sans-serif;background:#f7f3fa}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>` });
      });
      await page.goto("http://school-memo-direct.test/snap?action=upload&connected=google&provider=google");
      await page.locator("[data-school-memo-dates]").waitFor({ timeout: 15000 });
      assert.equal(ocrCalls, 1);
      assert.equal(writes.filter(write => write.path === "/api/history").length, 1, "the normal scan save finishes the memo without another review action");
      assert.equal(await page.getByRole("dialog", { name: "Review your school memo", exact: true }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Save memo", exact: true }).count(), 0);
      assert.equal(new URL(page.url()).pathname.startsWith("/event/"), true);
      assert.equal(new URL(page.url()).searchParams.get("tab"), "event", "the upload opens the finished event instead of the owner dashboard");
      assert.equal(await page.evaluate(() => window.__memoActiveTab), "design", "the internal owner tab selects the existing event-page surface");
      assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem("envitefy:created-event-context:v1")).activeTab), "design");
      assert.equal(saved.data.scanSchedule.items.length, 6);
      assert.equal(saved.data.scanSchedule.items.every(item => item.calendarSelected === true), true, "a newly finished memo starts with every extracted date selected");
      assert.equal(saved.data.startISO, null, "the issue date does not become a parent calendar event");
      assert.equal(await page.evaluate(() => window.__memoOriginalBytes), "exact original school memo PDF bytes");
      assert.equal(await page.getByText("Spirit Week: bring a donation to break dress code. Study spelling and memory verses daily.", { exact: true }).count() > 0, true, "the complete event retains its memo details");
      const section = page.locator("[data-school-memo-dates]");
      assert.equal(await section.getByRole("checkbox").count(), 6);
      assert.equal(await section.getByRole("checkbox").evaluateAll(inputs => inputs.every(input => input.checked)), true);
      assert.equal(await section.getByRole("button", { name: /^Add selected dates to calendar/ }).count(), 1);
      assert.equal(await page.getByRole("button", { name: /^Add to .*Calendar|^Add to calendar$/ }).count(), 0, "the memo has no competing parent calendar action");
      const flow = await section.evaluate(element => {
        const previous = element.previousElementSibling;
        return { previousHeight: previous?.getBoundingClientRect().height || 0, gap: previous ? element.getBoundingClientRect().top - previous.getBoundingClientRect().bottom : 0 };
      });
      assert.ok(flow.previousHeight < 500, `memo details do not stretch to the calendar list's height: ${JSON.stringify(flow)}`);
      assert.ok(flow.gap < 50, `dates follow the completed memo without a blank band: ${JSON.stringify(flow)}`);
      assert.equal(writes.filter(write => write.path.endsWith("/calendar-items")).length, 0, "finishing the event does not add any calendar dates");
      await page.waitForFunction(() => {
        const heading = document.querySelector("h1");
        const details = [...document.querySelectorAll("section")].find(element => element.textContent.includes("Good to Know") && !element.querySelector("[data-school-memo-dates]"));
        return [heading, details].every(element => {
          if (!element) return false;
          for (let current = element; current && current !== document.body; current = current.parentElement) {
            if (current.style.opacity && Number(current.style.opacity) < 0.99) return false;
          }
          return true;
        });
      });
      await page.screenshot({ path: path.join(output, `finished-event-all-selected-${width}.png`), fullPage: true });
      await section.getByRole("checkbox", { name: "Add Bible Test to calendar", exact: true }).uncheck();
      await section.getByRole("button", { name: /^Add selected dates to calendar/ }).click();
      await section.getByRole("status").filter({ hasText: "5 added" }).waitFor();
      assert.deepEqual(writes.at(-1).body.itemIds, ["spirit", "spelling", "pumpkin", "closure", "turkey"]);
      assert.equal(saved.data.scanSchedule.items.length, 6, "excluded dates remain in the saved memo");
      assert.deepEqual(errors, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await page.waitForFunction(() => {
        const heading = document.querySelector("h1");
        const details = [...document.querySelectorAll("section")].find(element => element.textContent.includes("Good to Know") && !element.querySelector("[data-school-memo-dates]"));
        return [heading, details].every(element => {
          if (!element) return false;
          for (let current = element; current && current !== document.body; current = current.parentElement) {
            if (current.style.opacity && Number(current.style.opacity) < 0.99) return false;
          }
          return true;
        });
      });
      await page.screenshot({ path: path.join(output, `finished-event-${width}.png`), fullPage: true });
      sportsMode = true;
      const writesBeforeSports = writes.length;
      await page.goto("http://school-memo-direct.test/snap?action=upload");
      await page.getByRole("dialog", { name: "Review your schedule", exact: true }).waitFor();
      assert.equal(writes.length, writesBeforeSports, "ordinary sports uploads still wait for schedule review before saving");
      await page.close();
    });
  } finally { await browser.close(); }
});
