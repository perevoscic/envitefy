import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("left sidebar mobile header opens navigation from click without early touch handlers", () => {
  const source = readSource("src/app/left-sidebar.tsx");

  assert.match(
    source,
    /ref=\{viewModel\.openBarButtonRef\}[\s\S]*?onClick=\{\(event\) => \{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\);\s*viewModel\.openSidebarFromTrigger\(\);\s*\}\}[\s\S]*?aria-label="Open navigation"/s
  );
  assert.doesNotMatch(
    source,
    /ref=\{viewModel\.openBarButtonRef\}[\s\S]*?onPointerDown=/s
  );
  assert.doesNotMatch(
    source,
    /ref=\{viewModel\.openBarButtonRef\}[\s\S]*?onTouchStart=/s
  );
});

test("left sidebar locks background scroll on mobile open and restores scroll position", () => {
  const source = readSource("src/app/left-sidebar.controller.ts");

  assert.ok(
    source.includes(
      'const MOBILE_SIDEBAR_SCROLL_LOCK_CLASS = "sidebar-mobile-open";'
    )
  );
  assert.ok(
    /documentElement\.style\.setProperty\("--nav-sidebar-scroll-y", `\$\{scrollY\}px`\);/.test(
      source
    )
  );
  assert.ok(
    source.includes(
      "documentElement.classList.add(MOBILE_SIDEBAR_SCROLL_LOCK_CLASS);"
    )
  );
  assert.ok(
    source.includes('body.classList.add(MOBILE_SIDEBAR_SCROLL_LOCK_CLASS);')
  );
  assert.ok(source.includes("window.scrollTo(0, scrollY);"));
});

test("left sidebar open state avoids a steady transformed drawer layer", () => {
  const controllerSource = readSource("src/app/left-sidebar.controller.ts");
  const sidebarSource = readSource("src/app/left-sidebar.tsx");
  const modelSource = readSource("src/app/left-sidebar.model.ts");

  assert.match(
    controllerSource,
    /const sidebarTransform = isDesktop\s*\?\s*"none"\s*:\s*isOpen\s*\?\s*"none"\s*:\s*"translateX\(-100%\)";/s
  );
  assert.doesNotMatch(sidebarSource, /will-change-transform/);
  assert.match(modelSource, /nav-chrome-sidebar-scroll-region/);
});
