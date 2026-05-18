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
  assert.match(
    source,
    /const sharePath = reusableSharePath \?\? \(await ensurePublicSharePath\(item\)\);/,
  );
  assert.match(
    source,
    /const nativeShareData = reusableSharePath\s*\? resolveNativeShareData\(shareData\)\s*: null;/,
  );
  assert.doesNotMatch(
    source,
    /await ensurePublicSharePath\(item\);\s*[\s\S]*await navigator\.share\(shareData\);/,
  );
});

test("native share data strips internal generation instructions from text payloads", () => {
  const source = readSource("src/utils/native-share.ts");

  assert.match(source, /function stripInternalInstructionCopy\(value: string\)/);
  assert.match(source, /stripInternalInstructionCopy\(value\)/);
  assert.match(source, /\\bUse the \[\^\.\]\{1,80\}\? Envitefy template family\\\.\?/);
  assert.match(
    source,
    /\\bPreserve the full event flow in the generated live card and guest-facing details\\\.\?/,
  );
  assert.match(source, /\\bAdditional event stops\?:\\s\*/);
  assert.match(source, /change\|replace\|update\|fix/);
});

test("native share data sends studio card links without extra message copy", () => {
  const source = readSource("src/utils/native-share.ts");

  assert.match(source, /function isStudioCardShareUrl\(value\?: string\): boolean/);
  assert.match(source, /return parsed\.pathname\.startsWith\("\/card\/"\);/);
  assert.match(
    source,
    /if \(isStudioCardShareUrl\(url\)\) \{\s*pushUniqueCandidate\(candidates, seen, \{ url \}\);\s*\} else \{/s,
  );
});
