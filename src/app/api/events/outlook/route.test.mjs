import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("single-event Outlook create failures do not echo mapped event payloads", () => {
  const source = readSource("src/app/api/events/outlook/route.ts");
  const failureIndex = source.indexOf("Failed to create event");
  const failureBlock = source.slice(failureIndex, source.indexOf("const created:", failureIndex));

  assert.ok(failureIndex > 0);
  assert.match(failureBlock, /return NextResponse\.json\(\{ error: message \}, \{ status: 500 \}\)/);
  assert.doesNotMatch(failureBlock, /\bdebug\b/);
  assert.doesNotMatch(failureBlock, /\brequest:\s*graphBody\b/);
});
