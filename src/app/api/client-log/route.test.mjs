import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("client-log rejects oversized content-length before reading the body", () => {
  const source = readSource("src/app/api/client-log/route.ts");
  const postStart = source.indexOf("export async function POST(request: Request)");
  const contentLengthCheck = source.indexOf("if (contentLengthExceedsLimit(request))", postStart);
  const boundedRead = source.indexOf("const raw = await readTextWithLimit(request)", postStart);

  assert.ok(postStart > 0);
  assert.ok(contentLengthCheck > postStart);
  assert.ok(boundedRead > contentLengthCheck);
  assert.doesNotMatch(source, /request\.text\(\)/);
});

test("client-log stream reader stops once the byte limit is exceeded", () => {
  const source = readSource("src/app/api/client-log/route.ts");

  assert.match(source, /const MAX_BODY_BYTES = 24 \* 1024/);
  assert.match(source, /request\.body\?\.getReader\(\)/);
  assert.match(source, /bytes \+= value\.byteLength/);
  assert.match(source, /if \(bytes > MAX_BODY_BYTES\)/);
  assert.match(source, /await reader\.cancel\(\)\.catch\(\(\) => undefined\)/);
  assert.match(source, /return null/);
});
