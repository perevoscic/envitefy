import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio category step uses editorial tiles and forwards tile clicks through the workspace handler", () => {
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
  assert.match(stepSource, /onSelectCategory: \(category: InviteCategory\) => void;/);
  assert.match(stepSource, /onSelect=\{onSelectCategory\}/);
  assert.doesNotMatch(stepSource, /setDetails\(/);
  assert.doesNotMatch(stepSource, /setCreateStep\(/);
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
  assert.match(gridSource, /grid-cols-2/);
  assert.match(gridSource, /auto-rows-\[136px\]/);
  assert.match(gridSource, /lg:grid-cols-4/);
  assert.match(gridSource, /Birthday: "row-span-2 sm:row-span-1"/);
  assert.match(gridSource, /Wedding: "row-span-2 sm:row-span-1"/);
  assert.match(gridSource, /"Baby Shower": "col-span-2 sm:col-span-1 row-span-1"/);
  assert.doesNotMatch(gridSource, /"Bridal Shower": "row-span-2 sm:row-span-1"/);
  assert.match(gridSource, /"Game Day": "order-2 sm:order-none"/);
  assert.match(gridSource, /Wedding: "order-3 sm:order-none"/);
  assert.match(gridSource, /"Bridal Shower": "order-4 sm:order-none"/);
  assert.match(gridSource, /"Baby Shower": "order-5 sm:order-none"/);
  assert.match(gridSource, /"Field Trip\/Day": "order-8 sm:order-none"/);
  assert.match(gridSource, /sizeVariant/);
  assert.match(dataSource, /imagePath:/);
  assert.match(dataSource, /sizeVariant: "feature"/);
  assert.match(dataSource, /sizeVariant: "horizontal"/);
  assert.match(dataSource, /sizeVariant: "wide"/);
  assert.match(dataSource, /surfaceVariant: "dark"/);
  assert.match(
    gridSource,
    /wide: "h-full sm:h-\[210px\] md:h-\[240px\] lg:col-span-2"/,
  );
  assert.match(
    gridSource,
    /feature:\s*"h-full sm:h-\[210px\] md:h-\[240px\] lg:col-span-1 lg:row-span-2 lg:h-full lg:min-h-\[500px\]"/,
  );
  assert.match(
    gridSource,
    /horizontal: "col-span-1 h-full sm:h-\[210px\] md:h-\[240px\]"/,
  );
  assert.match(gridSource, /index=\{index\}/);
  assert.match(dataSource, /name: "Birthday"/);
  assert.match(dataSource, /name: "Game Day"/);
  assert.match(dataSource, /name: "Wedding"/);
  assert.match(dataSource, /name: "Bridal Shower"/);
  assert.match(dataSource, /name: "Baby Shower"/);
  assert.match(dataSource, /name: "Field Trip\/Day"/);
  assert.match(dataSource, /name: "Anniversary"/);
  assert.match(dataSource, /name: "Housewarming"/);
  assert.match(dataSource, /name: "Custom Invite"/);
  assert.match(
    dataSource,
    /name: "Bridal Shower"[\s\S]*name: "Baby Shower"[\s\S]*sizeVariant: "wide"/,
  );
  assert.match(
    dataSource,
    /name: "Baby Shower"[\s\S]*sizeVariant: "wide"[\s\S]*name: "Field Trip\/Day"[\s\S]*sizeVariant: "standard"/,
  );
  assert.match(
    dataSource,
    /name: "Field Trip\/Day"[\s\S]*name: "Anniversary"/,
  );
  assert.match(
    dataSource,
    /name: "Anniversary"[\s\S]*sizeVariant: "standard"[\s\S]*name: "Housewarming"[\s\S]*sizeVariant: "standard"/,
  );
  assert.match(
    dataSource,
    /name: "Housewarming"[\s\S]*name: "Custom Invite"/,
  );
  assert.match(
    dataSource,
    /name: "Housewarming"[\s\S]*sizeVariant: "standard"[\s\S]*name: "Custom Invite"[\s\S]*sizeVariant: "standard"/,
  );
});
