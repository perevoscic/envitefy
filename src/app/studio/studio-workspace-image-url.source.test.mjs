import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio library normalizes persisted image urls and falls back when images fail to load", () => {
  const sanitize = readSource("src/app/studio/studio-workspace-sanitize.ts");
  const workspace = readSource("src/app/studio/StudioWorkspace.tsx");
  const library = readSource("src/app/studio/workspace/StudioLibraryStep.tsx");

  assert.match(sanitize, /function isLoopbackHostname\(hostname: string\)/);
  assert.match(sanitize, /export function normalizeStudioLibraryImageUrl\(value: unknown\): string \| undefined/);
  assert.match(sanitize, /if \(raw\.startsWith\("blob:"\)\) return undefined;/);
  assert.match(sanitize, /if \(raw\.startsWith\("\/"\) \|\| raw\.startsWith\("data:"\)\) return raw;/);
  assert.match(sanitize, /if \(isLoopbackHostname\(parsed\.hostname\)\) \{/);
  assert.match(sanitize, /return `\$\{parsed\.pathname\}\$\{parsed\.search\}\$\{parsed\.hash\}`;/);
  assert.match(sanitize, /url: normalizeStudioLibraryImageUrl\(value\.url\),/);

  assert.match(workspace, /function getMediaPreviewUrl\(item: MediaItem\)/);
  assert.match(workspace, /function handleMediaImageLoadError\(item: MediaItem\)/);
  assert.match(workspace, /patchMediaItem\(item\.id, \{ url: fallbackUrl \}\);/);
  assert.match(library, /src=\{item\.url \|\| getFallbackThumbnail\(item\.details\)\}/);
  assert.match(library, /referrerPolicy="no-referrer"/);
  assert.match(library, /onError=\{\(\) => handleMediaImageLoadError\(item\)\}/);
});
