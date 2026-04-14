import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio category step uses editorial tiles and advances on tile click", () => {
  const stepSource = readSource("src/app/studio/workspace/StudioCategoryStep.tsx");

  assert.match(stepSource, /import \{ StudioCategoryGrid \} from "\.\/StudioCategoryGrid";/);
  assert.match(
    stepSource,
    /import \{ STUDIO_CATEGORY_TILES \} from "\.\/studio-category-tile-data";/,
  );
  assert.match(stepSource, /<StudioCategoryGrid/);
  assert.doesNotMatch(stepSource, /Continue Planning/);
  assert.doesNotMatch(stepSource, /Pick the invite style that best fits your event/);
  assert.doesNotMatch(stepSource, /Not sure yet\?/);
  assert.doesNotMatch(stepSource, /Get inspiration/);
  assert.match(
    stepSource,
    /onSelect=\{\(categoryName\) => \{[\s\S]*setDetails\(\(prev\) => \(\{[\s\S]*category: categoryName,[\s\S]*\}\)\);[\s\S]*setStep\("form"\);[\s\S]*\}\}/,
  );
});

test("studio category tiles are image-backed and layout-driven", () => {
  const tileSource = readSource("src/app/studio/workspace/StudioCategoryTile.tsx");
  const gridSource = readSource("src/app/studio/workspace/StudioCategoryGrid.tsx");
  const dataSource = readSource("src/app/studio/workspace/studio-category-tile-data.ts");

  assert.match(tileSource, /aria-pressed=\{active\}/);
  assert.match(tileSource, /className=\{`h-full w-full object-cover/);
  assert.doesNotMatch(tileSource, /Currently selected/);
  assert.doesNotMatch(tileSource, /category\.badge/);
  assert.match(tileSource, /transition=\{\{ delay: index \* 0\.05 \+ 0\.2 \}\}/);
  assert.match(gridSource, /md:grid-cols-3/);
  assert.match(gridSource, /sizeVariant/);
  assert.match(dataSource, /imagePath:/);
  assert.match(dataSource, /sizeVariant: "feature"/);
  assert.match(dataSource, /sizeVariant: "horizontal"/);
  assert.match(dataSource, /sizeVariant: "panorama"/);
  assert.match(dataSource, /surfaceVariant: "dark"/);
  assert.match(gridSource, /wide: "row-span-1 h-\[280px\] md:col-span-2"/);
  assert.match(
    gridSource,
    /feature: "h-\[280px\] md:col-span-1 md:row-span-2 md:h-full md:min-h-\[580px\]"/,
  );
  assert.match(
    gridSource,
    /horizontal: "col-span-1 row-span-1 h-\[280px\]"/,
  );
  assert.match(gridSource, /panorama: "row-span-1 h-\[240px\] md:col-span-3"/);
  assert.match(gridSource, /index=\{index\}/);
  assert.match(dataSource, /name: "Birthday"/);
  assert.match(dataSource, /name: "Wedding"/);
  assert.match(dataSource, /name: "Field Trip\/Day"/);
  assert.match(dataSource, /name: "Bridal Shower"/);
  assert.match(dataSource, /name: "Housewarming"/);
  assert.match(dataSource, /name: "Baby Shower"/);
  assert.match(dataSource, /name: "Anniversary"/);
  assert.match(dataSource, /name: "Custom Invite"/);
  assert.match(
    dataSource,
    /name: "Bridal Shower"[\s\S]*sizeVariant: "horizontal"/,
  );
  assert.match(
    dataSource,
    /name: "Baby Shower"[\s\S]*sizeVariant: "horizontal"/,
  );
  assert.match(
    dataSource,
    /name: "Anniversary"[\s\S]*name: "Housewarming"[\s\S]*sizeVariant: "horizontal"/,
  );
  assert.match(
    dataSource,
    /name: "Housewarming"[\s\S]*name: "Custom Invite"/,
  );
});
