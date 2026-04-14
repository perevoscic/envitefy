import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("feature visibility is clamped to the gymnastics template", () => {
  const source = readSource("src/config/feature-visibility.ts");
  const settingsPage = readSource("src/app/settings/page.tsx");

  assert.match(
    source,
    /export const ENABLED_TEMPLATE_KEYS: TemplateKey\[] = \["gymnastics"\];/
  );
  assert.match(
    source,
    /export const TEMPLATE_DEFINITIONS: TemplateDef\[] = ALL_TEMPLATE_DEFINITIONS\.filter\(\s*\(definition\) => ENABLED_TEMPLATE_KEY_SET\.has\(definition\.key\)\s*\)/s
  );
  assert.match(
    source,
    /export const TEMPLATE_KEYS: TemplateKey\[] = \[\.\.\.ENABLED_TEMPLATE_KEYS\];/
  );
  assert.match(
    source,
    /const SPORTS_KEYS: TemplateKey\[] = \["gymnastics"\];/
  );
  assert.match(
    source,
    /const visibleTemplateKeys = clampEnabledTemplateKeys\(\s*normalizedKeys\.length > 0 \? normalizedKeys : \[\.\.\.preset\]\s*\);/s
  );
  assert.match(settingsPage, /TEMPLATE_DEFINITIONS\.map\(\(template\) => \(/);
});
