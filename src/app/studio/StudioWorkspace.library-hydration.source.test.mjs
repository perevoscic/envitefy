import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("library hydration restores persisted loading items instead of leaving them spinning forever", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /function restoreHydratedMediaItems\(items: MediaItem\[\]\)/);
  assert.match(
    source,
    /setMediaList\(restoreHydratedMediaItems\(sanitizeMediaItems\(parsed\)\)\);/,
  );
  assert.match(
    source,
    /if \(item\.status !== "loading" && item\.status !== "error"\) return item;/,
  );
  assert.match(source, /status: "error",[\s\S]*Open it in the editor to generate it again\./);
});
