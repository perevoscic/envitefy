import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("left sidebar derives a single create-access flag and gates the root create row", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /const hasCreateEventAccess = useMemo\(\s*\(\) => useGymnasticsDirectCreate \|\| createMenuOptionCount > 0,\s*\[createMenuOptionCount, useGymnasticsDirectCreate\]\s*\)/s
  );
  assert.match(
    source,
    /\{hasCreateEventAccess \? \(\s*<button\s+type="button"\s+onClick=\{openCreateEventPage\}[\s\S]*?<span className="truncate">Create Event<\/span>/s
  );
});

test("left sidebar also gates the compact create nav item behind create access", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /hasCreateEventAccess\s*\?\s*\{\s*id: "create" as const,\s*icon: Plus,\s*label: "Create event",\s*onClick: openCreateEventPage,\s*\}\s*:\s*null/s
  );
});

test("left sidebar create handler and panel state reset when create access is unavailable", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /const openCreateEventPage = useCallback\(\(\) => \{\s*if \(!hasCreateEventAccess\) \{\s*setForcedCreateActiveLabel\(null\);\s*setSidebarPage\("root"\);\s*return;\s*\}/s
  );
  assert.match(
    source,
    /useEffect\(\(\) => \{\s*if \(\s*hasCreateEventAccess \|\|\s*\(sidebarPage !== "createEvent" && sidebarPage !== "createEventOther"\)\s*\) \{\s*return;\s*\}\s*setForcedCreateActiveLabel\(null\);\s*setSidebarPage\("root"\);\s*\}, \[hasCreateEventAccess, setSidebarPage, sidebarPage\]\);/s
  );
});
