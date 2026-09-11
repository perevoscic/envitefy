import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("sidebar context keeps desktop pin and peek separate from mobile persistence", () => {
  const source = readSource("src/app/sidebar-context.tsx");

  assert.match(source, /const \[mobileCollapsed, setMobileCollapsed\] = useState<boolean>\(\s*readInitialMobileSidebarCollapsed,/s);
  assert.match(source, /const \[isDesktop, setIsDesktop\] = useState<boolean>\(isDesktopViewport\);/);
  assert.match(
    source,
    /const isCollapsed = useMemo\(\s*\(\) => \(isDesktop \? !\(desktopPinned \|\| desktopPeek\) : mobileCollapsed\),\s*\[isDesktop, desktopPinned, desktopPeek, mobileCollapsed\],\s*\);/s,
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

test("app layout tracks the same compact and expanded widths as navigation", () => {
  const wrapperSource = readSource("src/components/MainContentWrapper.tsx");
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");

  assert.match(
    wrapperSource,
    /const paddingLeft =\s*reserveSidebarSpace && isDesktop\s*\? isCollapsed \? SIDEBAR_COLLAPSED_REM : SIDEBAR_WIDTH_REM\s*: "0";/s,
  );
  assert.match(wrapperSource, /useSidebar\(\)/);
  assert.match(controllerSource, /const isCompact = isDesktop && !isOpen;/);
  assert.match(controllerSource, /const sidebarWidth = isCompact \? SIDEBAR_COLLAPSED_REM : SIDEBAR_WIDTH_REM;/);
  assert.match(controllerSource, /const showMobileTopBar = !isDesktop && !isOpen;/);
});
