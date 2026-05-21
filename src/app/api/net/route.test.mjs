import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("net diagnostic route is development-only and does not expose exception messages", () => {
  const source = readSource("src/app/api/net/route.ts");

  assert.match(source, /process\.env\.NODE_ENV !== "development"/);
  assert.match(source, /return NextResponse\.json\(\{ ok: false \}, \{ status: 404 \}\)/);
  assert.match(source, /console\.warn\("\[net\] Diagnostic network check failed", error\)/);
  assert.match(source, /return NextResponse\.json\(\{ ok: false \}, \{ status: 500 \}\)/);
  assert.doesNotMatch(source, /error:\s*e\.message/);
  assert.doesNotMatch(source, /error:\s*error\.message/);
});
