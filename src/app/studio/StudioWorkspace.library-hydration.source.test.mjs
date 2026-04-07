import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("library hydration restores persisted loading items instead of leaving them spinning forever", () => {
  const sanitize = readSource("src/app/studio/studio-workspace-sanitize.ts");
  const hook = readSource("src/app/studio/workspace/useStudioMediaLibrary.ts");
  const remote = readSource("src/app/studio/workspace/studio-library-remote.ts");

  assert.match(sanitize, /export function restoreHydratedMediaItems\(items: MediaItem\[\]\)/);
  assert.match(hook, /readLocalStorageItems/);
  assert.match(hook, /\/api\/studio\/library/);
  assert.match(hook, /mergeStudioLibraries/);
  assert.match(hook, /putStudioLibraryRemote/);
  assert.match(hook, /canonicalizeLibraryPayloadForCompare/);
  assert.match(remote, /prepareStudioLibraryItemsForRemote/);
  assert.match(
    sanitize,
    /if \(item\.status !== "loading" && item\.status !== "error"\) return item;/,
  );
  assert.match(sanitize, /status: "error",[\s\S]*Open it in the editor to generate it again\./);
});
