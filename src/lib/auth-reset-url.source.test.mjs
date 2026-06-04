import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("password reset URL helpers rewrite loopback origins to a public reset page", () => {
  const helper = readSource("src/lib/auth-reset-url.ts");

  assert.match(helper, /buildPublicAssetUrl\(baseResetUrl \|\| "\/reset"\)/);
  assert.match(helper, /url\.pathname = "\/reset";/);
  assert.match(helper, /url\.searchParams\.set\("provider", "supabase"\);/);
});
