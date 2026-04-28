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
    /if \(pendingUpload\) \{\s*onFile\(pendingUpload\.file, pendingUpload\.previewUrl \?\? null, pendingUpload\.scanAttemptId\);\s*\} else \{/s,
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

test("dashboard scan preview uses object URLs instead of base64 before OCR", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /createObjectUrlPreview\(selected\)/);
  assert.match(source, /revokeObjectUrl\(objectPreviewUrlRef\.current\)/);
  assert.doesNotMatch(
    source,
    /void readFileAsDataUrl\(selected\)[\s\S]*?setPreviewUrl\(nextPreviewUrl\)/,
  );
});

test("dashboard sends scan attempt ids through OCR, media upload, and history", () => {
  const source = readSource("src/components/Dashboard.tsx");

  assert.match(source, /const scanAttemptId = pendingScanAttemptId \|\| createClientAttemptId\("scan"\);/);
  assert.match(source, /form\.append\("scanAttemptId", scanAttemptId\);/);
  assert.match(source, /scanAttemptId,\s*\}\);/);
  assert.match(source, /body: JSON\.stringify\(\{ \.\.\.payload, scanAttemptId \}\)/);
});
