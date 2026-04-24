#!/usr/bin/env node
// One-shot helper: opens a Playwright Chromium window, lets you sign into
// http://localhost:3000, then saves storageState JSON for reuse with
// scripts/studio-create-live-cards.playwright.cjs --storage-state <path>.

const path = require("node:path");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");

const BASE_URL = process.env.STUDIO_BASE_URL || "http://localhost:3000";
const OUT_PATH = path.join(process.cwd(), "qa-artifacts", "studio-storage-state.json");
const POLL_MS = 1500;
const MAX_WAIT_MS = 10 * 60 * 1000;

async function pollSession(page) {
  const started = Date.now();
  while (Date.now() - started < MAX_WAIT_MS) {
    try {
      const res = await page.request.get(`${BASE_URL}/api/auth/session`);
      if (res.ok()) {
        const body = await res.json().catch(() => ({}));
        const email = body?.user?.email;
        if (email) return email;
      }
    } catch {
      // ignore transient errors
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error("Timed out waiting for sign-in.");
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  console.log(`Opened ${BASE_URL}. Sign in with the same account you want to populate.`);
  console.log("Polling /api/auth/session for an authenticated user...");
  const email = await pollSession(page);
  console.log(`Detected sign-in as ${email}. Saving storage state...`);

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await context.storageState({ path: OUT_PATH });
  console.log(`Wrote ${OUT_PATH}`);
  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
