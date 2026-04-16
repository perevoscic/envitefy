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
