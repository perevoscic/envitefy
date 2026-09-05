import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { encode } from "next-auth/jwt";
import { chromium } from "playwright";
import { del } from "@vercel/blob";
import { connectScanDatabase } from "../scripts/scan-diagnostics-db.mjs";

// Local production build only. Fresh test account, real browser scan, bounded cleanup.
const base = "http://localhost:3011";
const client = await connectScanDatabase();
const userId = randomUUID();
const email = `snap-benchmark-${userId}@example.invalid`;
const report = { date: new Date().toISOString(), requests: [], result: null };
let browser;
let uploaded;
let saved;
let ocr;
let savedAt = 0;
const pending = [];
try {
  await client.query("insert into users(id,email,password_hash,first_name,last_name) values($1,$2,$3,'Scan','Benchmark')", [userId, email, `disabled-${randomUUID()}`]);
  const token = await encode({ secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-build-secret",
    maxAge: 600, token: { sub: userId, userId, email, name: "Scan Benchmark", isAdmin: false, provider: "credentials" } });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addCookies([
    {name:'next-auth.session-token', value:token, domain:'localhost', path:'/', httpOnly:true, secure:false},
    {name:'__Secure-next-auth.session-token', value:token, domain:'localhost', path:'/', httpOnly:true, secure:true},
  ]);
  const page = await context.newPage();
  const starts = new Map();
  page.on("request", (request) => starts.set(request, Date.now()));
  page.on("response", (response) => {
    const request = response.request();
    const url = new URL(response.url());
    if (url.origin !== base || !(/^\/api\/(ocr|upload|history|dashboard|auth\/session)/.test(url.pathname) || url.pathname.startsWith("/event/"))) return;
    const item = { path: url.pathname, query: url.search, method: request.method(), status: response.status(), startedAt: starts.get(request), headersMs: Date.now() - starts.get(request) };
    report.requests.push(item);
    pending.push((async () => {
      await response.finished();
      item.durationMs = Date.now() - item.startedAt;
      if (url.pathname === "/api/ocr") ocr = await response.json();
      if (url.pathname === "/api/upload") uploaded = await response.json();
      if (url.pathname === "/api/history" && request.method() === "POST") {
        saved = await response.json(); savedAt = Date.now();
      }
    })().catch((error) => { item.error = error.message; }));
  });
  const snapStart = Date.now();
  await page.goto(`${base}/snap`, { waitUntil: "networkidle", timeout: 60000 });
  report.snapOpenMs = Date.now() - snapStart;
  report.pageInfo = { url: page.url(), title: await page.title(), text: (await page.locator("body").innerText()).slice(0, 1800), inputs: await page.locator("input").evaluateAll(nodes => nodes.map(n => ({type:n.type,accept:n.accept}))) };
  await page.locator('input[type="file"]').nth(1).waitFor({ state: "attached", timeout: 5000 });
  const startedAt = Date.now();
  await page.locator('input[type="file"]').nth(1).setInputFiles("G:/Develop_Cloud/_Envitefy/Sample-Flyers/september 28th.jpg");
  await page.waitForURL(/\/event\//, { timeout: 120000 });
  await page.getByText(/Flippin.*Awesome/i).first().waitFor({ state: "visible", timeout: 30000 });
  report.uploadToVisibleEventMs = Date.now() - startedAt;
  report.saveToVisibleEventMs = savedAt ? Date.now() - savedAt : null;
  await page.waitForTimeout(1500); // Observe any delayed invalidation after navigation.
  await Promise.all(pending);
  assert.ok(saved?.id, "The browser must save a real event");
  const row = (await client.query("select title,data from event_history where id=$1 and user_id=$2", [saved.id, userId])).rows[0];
  assert.ok(row, "Saved event belongs to the temporary account");
  assert.equal((row.title.match(/8th/g) || []).length, 1);
  assert.match(row.title, /Livia.*Flippin.*Awesome/);
  assert.match(JSON.stringify(row.data), /850-960-1214/);
  assert.match(JSON.stringify(row.data), /12432 Emerald Coast/);
  const localClock = iso => new Intl.DateTimeFormat('en-GB', { timeZone: row.data.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
  assert.equal(localClock(row.data.startISO), '15:30');
  assert.equal(localClock(row.data.endISO), '17:30');
  const diagnostics = (await client.query(`select s.status, s.event_id=$2::uuid as linked,
      s.preview_bytes is not null as has_preview, u.scans_total
    from scan_attempts s join users u on u.id=s.user_id where s.user_id=$1`, [userId, saved.id])).rows[0];
  assert.deepEqual(diagnostics, { status: "saved", linked: true, has_preview: true, scans_total: 1 });
  const refreshes = report.requests.filter((r) => r.startedAt > savedAt && r.method === "GET" && ["/api/history", "/api/dashboard"].includes(r.path));
  report.redundantRefreshesAfterSave = refreshes.length;
  assert.equal(refreshes.length, 0);
  report.result = { title: row.title, start: row.data.startISO, end: row.data.endISO, venue: row.data.venue,
    location: row.data.location, rsvp: row.data.rsvp, timings: ocr?.timing, diagnostics };
  await page.screenshot({ path: "artifacts/snap-prebuilt-result.png", fullPage: true });
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  await browser?.close();
  // Remove only assets returned by this upload and rows owned by this fresh UUID.
  try {
  if (uploaded?.ok) {
    const paths = Object.values(uploaded.stored || {}).map((asset) => {
      const url = new URL(asset.url, base);
      return (url.searchParams.get("pathname") || url.pathname.replace(/^\/api\/blob\//, "").replace(/^\//, ""));
    });
    assert.ok(paths.length && paths.every((p) => /^event-media\/[^/]+\/attachment\//.test(p)));
    const scope = paths[0].split("/")[1];
    assert.ok(paths.every((p) => p.startsWith(`event-media/${scope}/attachment/`)));
    await del(paths);
    report.cleanedUploadedAssets = paths.length;
  }
  } catch (error) { report.assetCleanupError = error.message; process.exitCode = 1; }
  await client.query("delete from event_history where user_id=$1 and exists(select 1 from users where id=$1 and email=$2)", [userId, email]);
  await client.query("delete from users where id=$1 and email=$2", [userId, email]);
  await client.end();
  report.cleanedTestAccount = true;
  await writeFile("artifacts/snap-prebuilt-benchmark.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
