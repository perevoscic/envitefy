import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const sourceRoots = ["src/app", "src/components"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);

function walkSourceFiles(relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSourceFiles(relativePath));
      continue;
    }

    const extension = path.extname(entry.name);
    if (!sourceExtensions.has(extension) || entry.name.includes(".test.")) continue;
    files.push(relativePath);
  }

  return files;
}

test("static /images references resolve from public/images", () => {
  const imageReferencePattern = /["'`](\/images\/[^"'`\s)]+)["'`]/g;
  const missing = [];

  for (const sourceFile of sourceRoots.flatMap(walkSourceFiles)) {
    const source = fs.readFileSync(path.join(repoRoot, sourceFile), "utf8");

    for (const match of source.matchAll(imageReferencePattern)) {
      const publicPath = match[1];
      if (!publicPath || publicPath.includes("${")) continue;

      const assetPath = publicPath.split(/[?#]/, 1)[0].replace(/^\/+/, "");
      const absoluteAssetPath = path.join(repoRoot, "public", assetPath);
      if (!fs.existsSync(absoluteAssetPath)) {
        missing.push(`${sourceFile}: ${publicPath}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
