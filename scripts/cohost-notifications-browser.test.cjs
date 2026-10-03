const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");
const compiled = require("next/dist/compiled/webpack/webpack");
compiled.init();

test("co-host notices refresh, preserve pending invites, accept explicitly and clear on account changes", {
  timeout: 120000,
}, async () => {
  const output = path.resolve("output/cohost-notifications");
  fs.mkdirSync(output, { recursive: true });
  const writeMock = (name, source) => {
    const file = path.join(output, `${name}.tsx`);
    fs.writeFileSync(file, source);
    return file;
  };
  const auth = writeMock(
    "auth",
    `import { useEffect, useState } from 'react'; export function useSession() {const [email,setEmail]=useState(()=>sessionStorage.getItem('qa:email')||'friend@test.com');useEffect(()=>{const update=()=>setEmail(sessionStorage.getItem('qa:email')||'');window.addEventListener('qa:account',update);return()=>window.removeEventListener('qa:account',update);},[]);return {data:email?{user:{email}}:null,status:email?'authenticated':'unauthenticated'};}`,
  );
  const navigation = writeMock(
    "navigation",
    `export function useRouter(){return {push(href){history.pushState({},'',href);window.dispatchEvent(new Event('qa:navigate'));}}}`,
  );
  const link = writeMock(
    "link",
    `import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,
  );
  const image = writeMock(
    "image",
    `import React from 'react';export default function Image({fill,quality,...props}){return <img {...props} style={fill?{position:'absolute',width:'100%',height:'100%'}:{}}/>}`,
  );
  const noop = writeMock(
    "noop",
    `export default function Noop(){return null} export function DashboardPlanningPanels(){return null} export function NextEventPlanning(){return null} export function FlipClock(){return null}`,
  );
  const cache = writeMock(
    "cache",
    `export const EVENT_CACHE_INVALIDATE_EVENT='envitefy:events:invalidate';`,
  );
  await new Promise((resolve, reject) => {
    const compiler = compiled.webpack({
      mode: "development",
      target: "web",
      devtool: false,
      entry: path.resolve("scripts/fixtures/cohost-notifications.tsx"),
      output: { path: output, filename: "fixture.js" },
      plugins: [
        new compiled.webpack.DefinePlugin({
          "process.env": JSON.stringify({ NODE_ENV: "development" }),
        }),
      ],
      resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
          "next-auth/react": auth,
          "next/navigation": navigation,
          "next/link": link,
          "next/image": image,
          "@/app/event-cache-context": cache,
          "@/components/EventActions": noop,
          "@/components/EventDeleteModal": noop,
          "@/components/ui/flip-clock": noop,
          "./DashboardGames": noop,
          "./DashboardOverviewSections": noop,
          "@": path.resolve("src"),
        },
      },
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
  const source = fs
    .readFileSync("src/app/globals.css", "utf8")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss" source(none);\n@source "../components/CoHostInvitationProvider.tsx";\n@source "../components/dashboard/*.tsx";\n@source "../../scripts/fixtures/cohost-notifications.tsx";',
    );
  const css = (
    await require("postcss")([require("@tailwindcss/postcss")()]).process(source, {
      from: path.resolve("src/app/globals.css"),
    })
  ).css;
  const script = fs.readFileSync(path.join(output, "fixture.js"));
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js") {
      res.setHeader("Content-Type", "text/javascript");
      return res.end(script);
    }
    if (req.url === "/no-event-placeholder-card-wide.webp") {
      res.setHeader("Content-Type", "image/webp");
      return res.end(fs.readFileSync("public/no-event-placeholder-card-wide.webp"));
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="background:linear-gradient(120deg,#f5d8f5,#d8f7ff)"><main id="root"></main><script src="/fixture.js"></script></body></html>`,
    );
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
      viewport: { width: 1240, height: 950 },
      reducedMotion: "reduce",
    });
    await page.clock.install();
    const errors = [];
    const accepts = [];
    const reads = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const invite = (id, title) => ({
      id,
      eventId: `event-${id}`,
      eventTitle: title,
      ownerName: "Taylor",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    let pending = [invite("one", "Garden party")];
    let failReads = false;
    let failAccept = false;
    let holdRead = false;
    let releaseRead;
    let holdAccept = false;
    let releaseAccept;
    await page.route("**/api/cohost-invitations", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        reads.push(true);
        const body = JSON.stringify({ invitations: pending });
        if (holdRead)
          await new Promise((resolve) => {
            releaseRead = resolve;
          });
        return route
          .fulfill({
            status: failReads ? 503 : 200,
            contentType: "application/json",
            body: failReads
              ? JSON.stringify({ error: "Invitations unavailable. Try again." })
              : body,
          })
          .catch(() => {});
      }
      const input = request.postDataJSON();
      accepts.push(input);
      if (holdAccept)
        await new Promise((resolve) => {
          releaseAccept = resolve;
        });
      if (failAccept)
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Acceptance unavailable. Try again." }),
        });
      const accepted = pending.find((i) => i.id === input.invitationId);
      pending = pending.filter((i) => i.id !== input.invitationId);
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ eventId: accepted.eventId }),
      });
    });
    const bell = page.locator("#dashboard-cohost-invitations > button").first();
    const panel = page.getByRole("dialog", { name: "Co-host invitations" });
    const openBell = async () => {
      if (!(await panel.isVisible())) await bell.click();
      await panel.waitFor();
    };
    await page.goto(base);
    await page.getByRole("button", { name: "Co-host invitations, 1 pending" }).waitFor();
    assert.equal(await page.locator("#dashboard-cohost-invitations section").count(), 0);
    assert.equal(await panel.count(), 0, "the bell starts closed");
    assert.equal(accepts.length, 0, "opening the dashboard does not accept");
    await page.getByRole("complementary", { name: "New co-host invitation" }).waitFor();
    await page.clock.fastForward(5001);
    assert.equal(
      await page.getByRole("complementary", { name: "New co-host invitation" }).count(),
      0,
    );
    await page.getByText("1 to review", { exact: true }).waitFor();
    await page.getByRole("button", { name: /Needs attention/ }).click();
    const review = page.getByRole("dialog", { name: "Needs attention" });
    await review.getByRole("link", { name: /Accept co-host invitation/ }).click();
    await review.waitFor({ state: "hidden" });
    await panel.waitFor();
    await panel.getByRole("heading", { name: "Garden party" }).waitFor();
    assert.equal(
      await panel
        .getByRole("button", { name: "Accept co-host invitation for Garden party" })
        .count(),
      1,
    );
    await page.screenshot({ path: path.join(output, "dashboard-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: path.join(output, "dashboard-mobile.png") });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const name of ["Accept", "Decline"]) {
      const button = await panel
        .getByRole("button", { name: `${name} co-host invitation for Garden party` })
        .boundingBox();
      assert.ok(button.height >= 44 && button.width >= 44);
    }
    const sheet = await panel.boundingBox();
    assert.ok(Math.abs(sheet.y + sheet.height - 812) <= 1, "phones use a bottom sheet");
    await page.keyboard.press("Escape");
    await panel.waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 812, height: 375 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "24px";
    });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
    await page.setViewportSize({ width: 1240, height: 950 });
    pending.push(invite("two", "Autumn dinner"));
    await page.clock.fastForward(30_000);
    await page.getByRole("button", { name: "Co-host invitations, 2 pending" }).waitFor();
    await page.getByRole("complementary", { name: "New co-host invitation" }).waitFor();
    await page.getByRole("button", { name: "Dismiss invitation notification" }).click();
    failReads = true;
    await page.getByRole("button", { name: "Refresh dashboard" }).click();
    await openBell();
    await panel.getByText("Invitations unavailable. Try again.").waitFor();
    assert.equal(
      await panel.getByRole("heading", { name: "Garden party" }).count(),
      1,
      "failed refresh preserves pending invites",
    );
    failReads = false;
    await panel.getByRole("button", { name: "Retry", exact: true }).click();
    await panel.getByText("Invitations unavailable. Try again.").waitFor({ state: "hidden" });
    holdRead = true;
    await page.getByRole("button", { name: "Refresh dashboard" }).click();
    await page.clock.fastForward(15_001);
    await openBell();
    await panel.getByText("Co-host invitations took too long to load. Try again.").waitFor();
    assert.equal(await panel.getByRole("heading", { name: "Garden party" }).count(), 1);
    holdRead = false;
    releaseRead?.();
    await panel.getByRole("button", { name: "Retry", exact: true }).click();
    await panel
      .getByText("Co-host invitations took too long to load. Try again.")
      .waitFor({ state: "hidden" });
    failAccept = true;
    await panel.getByRole("button", { name: "Accept co-host invitation for Garden party" }).click();
    await panel.getByText("Acceptance unavailable. Try again.").waitFor();
    assert.equal(await panel.getByRole("heading", { name: "Garden party" }).count(), 1);
    failAccept = false;
    holdRead = true;
    await page.getByRole("button", { name: "Refresh dashboard" }).click();
    await page.waitForFunction(() => true);
    holdAccept = true;
    await openBell();
    await panel.getByRole("button", { name: "Accept co-host invitation for Garden party" }).click();
    await panel
      .locator('[aria-label="Accept co-host invitation for Garden party"][aria-busy="true"]')
      .waitFor();
    assert.equal(
      await panel
        .getByRole("button", { name: "Decline co-host invitation for Autumn dinner" })
        .isEnabled(),
      false,
    );
    holdRead = false;
    holdAccept = false;
    releaseAccept();
    await page.waitForURL("**/event/event-one?tab=event");
    releaseRead?.();
    await panel.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Co-host invitations, 1 pending" }).waitFor();
    await openBell();
    assert.equal(await panel.getByRole("heading", { name: "Garden party" }).count(), 0);
    await panel.getByRole("button", { name: "Decline co-host invitation for Autumn dinner" }).click();
    await panel.getByText("No pending invitations", { exact: true }).waitFor();
    assert.deepEqual(accepts, [
      { invitationId: "one", action: "accept" },
      { invitationId: "one", action: "accept" },
      { invitationId: "two", action: "decline" },
    ]);
    await page.getByRole("button", { name: "Co-host invitations, none pending" }).waitFor();
    await page.keyboard.press("Escape");
    pending = [];
    await page.evaluate(() => {
      sessionStorage.setItem("qa:email", "other@test.com");
      window.dispatchEvent(new Event("qa:account"));
    });
    await page.getByRole("button", { name: "Co-host invitations, none pending" }).waitFor();
    await page.getByText("All caught up", { exact: true }).waitFor();
    await page.evaluate(() => {
      sessionStorage.removeItem("qa:email");
      window.dispatchEvent(new Event("qa:account"));
    });
    const before = reads.length;
    await page.clock.fastForward(30_000);
    assert.equal(reads.length, before, "signed-out users do not poll invitation data");
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
