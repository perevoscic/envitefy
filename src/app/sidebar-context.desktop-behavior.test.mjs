import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("sidebar context forces desktop expanded while preserving mobile drawer persistence", () => {
  const source = readSource("src/app/sidebar-context.tsx");

  assert.match(source, /const \[mobileCollapsed, setMobileCollapsed\] = useState<boolean>\(\s*readInitialMobileSidebarCollapsed,/s);
  assert.match(source, /const \[isDesktop, setIsDesktop\] = useState<boolean>\(isDesktopViewport\);/);
  assert.match(
    source,
    /const isCollapsed = useMemo\(\s*\(\) => \(isDesktop \? false : mobileCollapsed\),\s*\[isDesktop, mobileCollapsed\],\s*\);/s,
  );
  assert.match(
    source,
    /const setIsCollapsedAndPersist = useCallback\(\s*\(collapsed: boolean\) => \{\s*if \(isDesktop\) return;\s*setMobileCollapsedAndPersist\(collapsed\);\s*\},/s,
  );
  assert.match(
    source,
    /const toggleSidebar = useCallback\(\(\) => \{\s*if \(isDesktop\) return;\s*setMobileCollapsed\(\(previous\) => \{/s,
  );
});

test("workspace layout reserves only the expanded desktop sidebar width", () => {
  const wrapperSource = readSource("src/components/MainContentWrapper.tsx");
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");

  assert.match(
    wrapperSource,
    /const paddingLeft =\s*reserveSidebarSpace && isDesktop \? SIDEBAR_WIDTH_REM : "0";/s,
  );
  assert.doesNotMatch(wrapperSource, /SIDEBAR_COLLAPSED_REM/);
  assert.match(controllerSource, /const isCompact = false;/);
  assert.match(controllerSource, /const sidebarWidth = SIDEBAR_WIDTH_REM;/);
  assert.match(controllerSource, /const showMobileTopBar = !isDesktop && !isOpen;/);
});
