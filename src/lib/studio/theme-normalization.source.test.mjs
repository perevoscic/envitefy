import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio theme normalization classifies branded and fuzzy requests for rewrite while leaving generic themes safe", () => {
  const source = readSource("src/lib/studio/theme-normalization.ts");

  assert.match(source, /export function classifyStudioThemeRisk\(theme: string\): StudioThemeNormalizationRisk/);
  assert.match(source, /if \(UNSAFE_BLOCK_PATTERNS\.some\(\(pattern\) => pattern\.test\(trimmed\)\)\) return "block";/);
  assert.match(source, /if \(\s*BRANDED_THEME_PATTERNS\.some\(\(pattern\) => pattern\.test\(trimmed\)\) \|\|/s);
  assert.match(source, /spider\[- \]\?man/);
  assert.match(source, /bluey/i);
  assert.match(source, /dog cartoon from australia/);
});

test("studio theme normalization rebuilds prompt guidance from normalized themes instead of raw branded input", () => {
  const source = readSource("src/lib/studio/theme-normalization.ts");

  assert.match(source, /export function applyStudioThemeNormalization\(/);
  assert.match(source, /Highest-priority visual direction from the user: \$\{normalizedTheme\}\./);
  assert.match(
    source,
    /Preserve the mood, setting, palette, and celebratory energy while removing franchise names, logos, trademarked props, recognizable costumes, and branded character carryovers\./,
  );
  assert.match(source, /Additional visual preferences from the user: \$\{visualPreferences\}\./);
  assert.match(source, /colorPalette: safeString\(request\.guidance\?\.colorPalette\) \|\| paletteHints \|\| null,/);
});

test("studio theme normalization prompt asks the model for strict JSON rewrites instead of blocking branded requests", () => {
  const source = readSource("src/lib/studio/theme-normalization.ts");

  assert.match(source, /Return strict JSON only\./);
  assert.match(
    source,
    /Block only for clearly unsafe or disallowed content\. Do not block only because a request mentions branding or copyrighted characters; rewrite those\./,
  );
  assert.match(source, /Raw user theme:/);
  assert.match(source, /User visual preferences:/);
});
