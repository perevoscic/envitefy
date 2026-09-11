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
  assert.match(layoutSource, /manifest:\s*"\/manifest\.webmanifest\?v=v14"/);
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

test("mobile chrome pairs blue-violet clouds with a matching native tint", () => {
  assert.equal(manifest.theme_color, "#8998ED");
  assert.equal(manifest.background_color, "#F3EEFF");
  assert.match(layoutSource, /colorScheme:\s*"only light"/);
  assert.match(
    layoutSource,
    /\{\s*media:\s*"\(prefers-color-scheme:\s*light\)",\s*color:\s*themeColorPalette\.brand\s*\}/,
  );
  assert.match(
    layoutSource,
    /\{\s*media:\s*"\(prefers-color-scheme:\s*dark\)",\s*color:\s*themeColorPalette\.brand\s*\}/,
  );
  assert.match(layoutSource, /\{\s*color:\s*themeColorPalette\.brand\s*\}/);
  assert.match(globalsSource, /color-scheme:\s*only light/);
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
    /--mobile-chrome-top:\s*#8998ed/,
  );
  assert.match(
    globalsSource,
    /--mobile-chrome-bottom:\s*#8998ed/,
  );
  assert.match(globalsSource, /body::after\s*\{[\s\S]*?background:\s*var\(--mobile-chrome-bottom\)/);
  assert.match(
    globalsSource,
    /--ios-browser-chrome-background:\s*#8998ed/,
  );
  const iosBrowserBodyBlock =
    globalsSource.match(/html\[data-ios-browser-chrome="true"\]\s+body\s*\{([^}]*)\}/)?.[1] ||
    "";
  assert.match(iosBrowserBodyBlock, /background-color:\s*var\(--ios-browser-chrome-background\)/);
  assert.doesNotMatch(iosBrowserBodyBlock, /background-image:\s*none/);
  assert.doesNotMatch(iosBrowserBodyBlock, /var\(--background\)/);
  assert.doesNotMatch(
    globalsSource,
    /html\[data-ios-browser-chrome="true"\]\s+body::after\s*\{[\s\S]*?display:\s*none/,
  );
  assert.match(globalsSource, /height:\s*max\(env\(safe-area-inset-bottom,\s*0px\),\s*0px\)/);
  assert.match(globalsSource, /height:\s*max\(env\(safe-area-inset-top,\s*0px\),\s*0px\)/);
  assert.match(
    globalsSource,
    /background-image:\s*var\(--mobile-browser-surface-gradient\)/,
  );
  assert.match(
    themeColorSource,
    /const BRAND_THEME_COLOR = "#8998ED"/,
  );
  assert.match(
    themeColorSource,
    /const BRAND_NAVIGATION_BAR_COLOR = BRAND_THEME_COLOR/,
  );
  assert.match(
    themeColorSource,
    /navigationBar:\s*BRAND_NAVIGATION_BAR_COLOR/,
  );
  assert.match(
    themeColorSource,
    /querySelectorAll<HTMLMetaElement>\(THEME_COLOR_SELECTOR\)/,
  );
  assert.match(themeColorSyncSource, /getPreferredThemeColor/);
  assert.match(themeColorSyncSource, /isIosBrowserChrome/);
  assert.match(themeColorSyncSource, /setIosBrowserChromeColors/);
  assert.match(themeColorSyncSource, /HERO_THEME_COLOR_ATTRIBUTE/);
  assert.match(themeColorSyncSource, /MutationObserver/);
  assert.match(themeColorSource, /COLOR_SCHEME_SELECTOR/);
  assert.match(themeColorSource, /setLightColorSchemeMeta/);
  assert.match(themeColorSource, /const IOS_BROWSER_CHROME_COLOR = BRAND_THEME_COLOR/);
  for (const edge of ["top", "bottom"]) {
    const clouds = globalsSource.match(new RegExp(`--mobile-chrome-${edge}-clouds:([^;]+);`))?.[1] || "";
    assert.equal((clouds.match(/radial-gradient/g) || []).length, 3);
    assert.doesNotMatch(clouds, /linear-gradient/);
    assert.match(globalsSource, new RegExp(`background: var\\(--mobile-chrome-${edge}-clouds\\), var\\(--mobile-chrome-${edge}\\)`));
  }
  assert.doesNotMatch(themeColorSource, /IOS_BROWSER_THEME_COLOR/);
  assert.doesNotMatch(themeColorSource, /IOS_BROWSER_PAGE_BACKGROUND_COLOR/);
  assert.doesNotMatch(themeColorSource, /IOS_BROWSER_NAVIGATION_BAR_COLOR/);
});
