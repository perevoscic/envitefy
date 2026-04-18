import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio workspace keeps native share inside the direct click path", () => {
  const source = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(source, /import \{ resolveNativeShareData \} from "@\/utils\/native-share";/);
  assert.match(source, /function getReusablePublicSharePath\(item: MediaItem\): string \| null \{/);
  assert.match(source, /const reusableSharePath = getReusablePublicSharePath\(item\);/);
  assert.match(source, /const sharePath = reusableSharePath \?\? \(await ensurePublicSharePath\(item\)\);/);
  assert.match(source, /const nativeShareData = reusableSharePath\s*\? resolveNativeShareData\(shareData\)\s*: null;/);
  assert.doesNotMatch(source, /await ensurePublicSharePath\(item\);\s*[\s\S]*await navigator\.share\(shareData\);/);
});
