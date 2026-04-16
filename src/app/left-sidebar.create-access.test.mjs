import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("left sidebar controller derives a single create-access flag", () => {
  const source = readSource("src/app/left-sidebar.controller.ts");

  assert.match(
    source,
    /const hasCreateEventAccess = useMemo\(\s*\(\) => useGymnasticsDirectCreate \|\| createMenuOptionCount > 0,\s*\[createMenuOptionCount, useGymnasticsDirectCreate\]\s*\)/s
  );
});

test("left sidebar controller resets create panel state when create access disappears", () => {
  const source = readSource("src/app/left-sidebar.controller.ts");

  assert.match(
    source,
    /const openCreateEventPage = useCallback\(\(\) => \{\s*if \(!hasCreateEventAccess\) \{\s*setForcedCreateActiveLabel\(null\);\s*setSidebarPage\("root"\);\s*return;\s*\}/s
  );
  assert.match(
    source,
    /useEffect\(\(\) => \{\s*if \(\s*hasCreateEventAccess \|\|\s*\(sidebarPage !== "createEvent" && sidebarPage !== "createEventOther"\)\s*\) \{\s*return;\s*\}\s*setForcedCreateActiveLabel\(null\);\s*setSidebarPage\("root"\);\s*\}, \[hasCreateEventAccess, setSidebarPage, sidebarPage\]\);/s
  );
});

test("left sidebar view still gates both root and compact create entries behind create access", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /\{hasCreateEventAccess \? \(\s*<button\s+type="button"\s+onClick=\{onCreate\}[\s\S]*?Create Event\s*<\/span>/s
  );
  assert.doesNotMatch(source, /CompactRail/);
  assert.doesNotMatch(source, /Collapse navigation/);
  assert.doesNotMatch(source, /Expand navigation/);
});

test("left sidebar exposes Studio below Home in the always-open workspace navigation", () => {
  const source = readSource("src/app/left-sidebar.tsx");
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");
  const modelSource = readSource("src/app/left-sidebar.model.ts");

  assert.match(
    source,
    /Home\s*<\/span>\s*<\/Link>\s*<Link\s+href="\/studio"[\s\S]*?Studio\s*<\/span>/s
  );
  assert.match(
    controllerSource,
    /case "studio":\s*return pathname === "\/studio" && sidebarPage === "root";/s
  );
  assert.match(modelSource, /\|\s*"studio"/);
});
