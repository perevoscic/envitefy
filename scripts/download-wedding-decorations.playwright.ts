/**
 * Playwright automation script for downloading PNG decorative artwork
 * from PNGTree for Envitefy wedding themes.
 *
 * Usage:
 *   1. Install Playwright in this repo (dev dependency):
 *        npm install --save-dev playwright
 *        npx playwright install chromium
 *   2. Set PNGTREE_USERNAME / PNGTREE_PASSWORD in your shell env,
 *      or replace the placeholders below directly.
 *   3. Run:
 *        npx ts-node scripts/download-wedding-decorations.playwright.ts
 *
 * The script will:
 *   - Log into pngtree.com
 *   - Run themed searches
 *   - Download up to N PNGs per theme
 *   - Save into: public/templates/weddings/<theme-id>/assets/
 *   - Rename files to match the config.json decoration paths.
 */

import fs from "fs/promises";
import path from "path";
import { chromium, type Download } from "playwright";

type ThemeAssetPlan = {
  themeId: string;
  searchQuery: string;
  maxDownloads: number;
  files: string[];
};

const THEME_ASSET_PLANS: ThemeAssetPlan[] = [
  {
    themeId: "wild-rose-halo",
    searchQuery: "floral corner border rose watercolor png transparent",
    maxDownloads: 4,
    files: [
      "corner-top-left.png",
      "corner-top-right.png",
      "corner-bottom-left.png",
      "corner-bottom-right.png",
    ],
  },
  {
    themeId: "emerald-garden-vignette",
    searchQuery: "botanical frame arch greenery png transparent",
    maxDownloads: 3,
    files: ["arch-top.png", "arch-side-left.png", "arch-side-right.png"],
  },
  {
    themeId: "willow-fern-embrace",
    searchQuery: "fern leaves botanical border png transparent",
    maxDownloads: 3,
    files: ["fern-top.png", "fern-bottom.png", "fern-corners.png"],
  },
  {
    themeId: "champagne-velvet",
    searchQuery: "gold foil texture edge png transparent",
    maxDownloads: 3,
    files: ["gold-foil-top.png", "gold-foil-bottom.png", "gold-foil-corners.png"],
  },
  {
    themeId: "autumn-ember-waltz",
    searchQuery: "autumn leaves border watercolor png transparent",
    maxDownloads: 3,
    files: ["leaves-top.png", "leaves-bottom.png", "leaves-corners.png"],
  },
  {
    themeId: "rustic-oak-storybook",
    searchQuery: "kraft paper torn edge frame png transparent",
    maxDownloads: 3,
    files: ["paper-top.png", "paper-bottom.png", "paper-sides.png"],
  },
];

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function loginToPngTree() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();

  const username = process.env.PNGTREE_USERNAME ?? "placeholder_username";
  const password = process.env.PNGTREE_PASSWORD ?? "placeholder_password";

  await page.goto("https://pngtree.com/login", { waitUntil: "networkidle" });

  // Adjust selectors if PNGTree updates their login form.
  await page.fill('input[type="email"], input[name="email"]', username);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"], button:has-text("Log in"), button:has-text("Login")');

  await page.waitForTimeout(4000);

  return { browser, context, page };
}

async function downloadForTheme(plan: ThemeAssetPlan) {
  const { browser, context, page } = await loginToPngTree();

  try {
    const targetDir = path.join(
      process.cwd(),
      "public",
      "templates",
      "weddings",
      plan.themeId,
      "assets"
    );
    await ensureDir(targetDir);

    await page.goto(
      `https://pngtree.com/so/${encodeURIComponent(plan.searchQuery)}`,
      { waitUntil: "networkidle" }
    );

    // Wait for search results grid
    await page.waitForSelector(".list .design-box, .list-wrap .design-box", {
      timeout: 15000,
    });

    const downloadLinks = await page.$$(
      'a[href*="/element/"]:not([data-downloaded="1"])'
    );

    const toDownload = downloadLinks.slice(0, plan.maxDownloads);

    const downloadedFiles: Download[] = [];

    for (let i = 0; i < toDownload.length; i += 1) {
      const link = toDownload[i];
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60000 }),
        link.click(),
      ]);
      downloadedFiles.push(download);
      await page.waitForTimeout(1500);
    }

    for (let i = 0; i < downloadedFiles.length && i < plan.files.length; i += 1) {
      const download = downloadedFiles[i];
      const fileName = plan.files[i];
      const targetPath = path.join(targetDir, fileName);
      await download.saveAs(targetPath);
      // Simple safeguard to avoid reusing the same download
      await download.createReadStream()?.cancel();
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  for (const plan of THEME_ASSET_PLANS) {
    // eslint-disable-next-line no-console
    console.log(`Downloading PNGTree artwork for theme: ${plan.themeId}`);
    try {
      await downloadForTheme(plan);
      // eslint-disable-next-line no-console
      console.log(`✓ Completed downloads for ${plan.themeId}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`✗ Failed downloads for ${plan.themeId}`, err);
    }
  }
}

void main();

