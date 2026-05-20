import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const layoutSource = readFileSync(join(__dirname, "layout.tsx"), "utf8");
const globalsSource = readFileSync(join(__dirname, "globals.css"), "utf8");
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

test("installed app chrome uses the mobile page purple", () => {
  assert.equal(manifest.theme_color, "#8D7BE9");
  assert.match(layoutSource, /colorScheme:\s*"light"/);
  assert.match(
    layoutSource,
    /themeColor:\s*\[[\s\S]*?color:\s*themeColorPalette\.brand[\s\S]*?\]/,
  );
  assert.match(
    globalsSource,
    /--mobile-safe-area-bottom:\s*var\(--mobile-chrome-bottom\)/,
  );
  assert.match(
    globalsSource,
    /body::after[\s\S]*?height:\s*env\(safe-area-inset-bottom,\s*0px\)[\s\S]*?background:\s*var\(--mobile-safe-area-bottom\)/,
  );
});
