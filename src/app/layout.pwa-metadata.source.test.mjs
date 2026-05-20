import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const layoutSource = readFileSync(join(__dirname, "layout.tsx"), "utf8");
const globalsSource = readFileSync(join(__dirname, "globals.css"), "utf8");
const themeColorSource = readFileSync(join(repoRoot, "src", "lib", "theme-color.ts"), "utf8");
const themeColorSyncSource = readFileSync(
  join(repoRoot, "src", "components", "ThemeColorSync.tsx"),
  "utf8",
);
const manifest = JSON.parse(
  readFileSync(join(repoRoot, "public", "manifest.webmanifest"), "utf8"),
);

test("root layout leaves head metadata to Next", () => {
  assert.doesNotMatch(layoutSource, /<head\b/);
  assert.doesNotMatch(layoutSource, /<\/head>/);
  assert.doesNotMatch(layoutSource, /<title\b/);
});

test("root metadata declares Envitefy as the install app name", () => {
  assert.match(layoutSource, /applicationName:\s*"Envitefy"/);
  assert.match(layoutSource, /manifest:\s*"\/manifest\.webmanifest\?v=v9"/);
  assert.match(layoutSource, /"apple-mobile-web-app-capable":\s*"yes"/);
  assert.match(
    layoutSource,
    /"apple-mobile-web-app-status-bar-style":\s*"black-translucent"/,
  );
  assert.match(
    layoutSource,
    /appleWebApp:\s*\{[\s\S]*?statusBarStyle:\s*"black-translucent"[\s\S]*?title:\s*"Envitefy"[\s\S]*?\}/,
  );
});

test("web app manifest names the installed app Envitefy", () => {
  assert.equal(manifest.name, "Envitefy");
  assert.equal(manifest.short_name, "Envitefy");
});

test("installed app top chrome is white without drawing fake native chrome in the page", () => {
  assert.equal(manifest.theme_color, "#FFFFFF");
  assert.equal(manifest.background_color, "#F8F5FF");
  assert.match(layoutSource, /colorScheme:\s*"light"/);
  assert.match(
    layoutSource,
    /\{\s*media:\s*"\(prefers-color-scheme:\s*light\)",\s*color:\s*themeColorPalette\.brand\s*\}/,
  );
  assert.match(
    layoutSource,
    /\{\s*media:\s*"\(prefers-color-scheme:\s*dark\)",\s*color:\s*themeColorPalette\.brand\s*\}/,
  );
  assert.match(layoutSource, /\{\s*color:\s*themeColorPalette\.brand\s*\}/);
  assert.match(globalsSource, /color-scheme:\s*light/);
  assert.match(
    layoutSource,
    /backgroundColor:\s*themeColorPalette\.background/,
  );
  assert.doesNotMatch(
    layoutSource,
    /backgroundColor:\s*themeColorPalette\.navigationBar/,
  );
  assert.match(
    layoutSource,
    /themeColor:\s*\[[\s\S]*?color:\s*themeColorPalette\.brand[\s\S]*?\]/,
  );
  assert.match(
    globalsSource,
    /--mobile-chrome-top:\s*#ffffff/,
  );
  assert.match(
    globalsSource,
    /--mobile-chrome-bottom:\s*#8d7be9/,
  );
  assert.doesNotMatch(globalsSource, /--mobile-chrome-bottom-backing-height/);
  assert.doesNotMatch(globalsSource, /--mobile-chrome-bottom-backing/);
  assert.doesNotMatch(globalsSource, /body::after/);
  assert.doesNotMatch(
    globalsSource,
    /background-image:\s*var\(--mobile-browser-surface-gradient\)/,
  );
  assert.match(
    themeColorSource,
    /const BRAND_THEME_COLOR = "#FFFFFF"/,
  );
  assert.match(
    themeColorSource,
    /const BRAND_NAVIGATION_BAR_COLOR = "#8D7BE9"/,
  );
  assert.match(
    themeColorSource,
    /navigationBar:\s*BRAND_NAVIGATION_BAR_COLOR/,
  );
  assert.match(
    themeColorSource,
    /querySelectorAll<HTMLMetaElement>\(THEME_COLOR_SELECTOR\)/,
  );
  assert.doesNotMatch(
    themeColorSyncSource,
    /getPreferredThemeColor|HERO_THEME_COLOR_ATTRIBUTE|MutationObserver/,
  );
});
