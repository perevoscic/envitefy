import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("dashboard upload action reads durable pending uploads before reopening the picker", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(
    source,
    /import \{ type PendingSnapUpload, takePendingSnapUpload \} from "@\/lib\/pending-snap-upload";/,
  );
  assert.match(source, /const pendingUpload = await takePendingSnapUpload\(\);/);
  assert.match(
    source,
    /if \(pendingUpload\) \{\s*onFile\(pendingUpload\.file, pendingUpload\.previewUrl\);\s*\} else \{\s*openUpload\(\);\s*\}/s,
  );
});

test("dashboard snap pickers click synchronously without setTimeout wrappers", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(
    source,
    /const openCamera = useCallback\(\(\) => \{\s*resetForm\(\);[\s\S]*?cameraInputRef\.current\.click\(\);/s,
  );
  assert.match(
    source,
    /const openUpload = useCallback\(\(\) => \{\s*resetForm\(\);[\s\S]*?fileInputRef\.current\.click\(\);/s,
  );
  assert.doesNotMatch(source, /setTimeout\(\(\) => \{\s*if \(cameraInputRef\.current\)/s);
  assert.doesNotMatch(source, /setTimeout\(\(\) => \{\s*if \(fileInputRef\.current\)/s);
});
