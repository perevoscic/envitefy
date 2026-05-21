import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("local password reset consumes the token atomically with password update", () => {
  const routeSource = readSource("src/app/api/auth/reset/route.ts");
  const dbSource = readSource("src/lib/db.ts");

  assert.match(routeSource, /resetPasswordWithToken\(\{ token, newPassword \}\)/);
  assert.doesNotMatch(routeSource, /getValidPasswordResetByToken/);
  assert.doesNotMatch(routeSource, /markPasswordResetUsed/);

  const helperBlock = dbSource.match(
    /export async function resetPasswordWithToken[\s\S]*?\n}\n\nexport async function markPasswordResetUsed/,
  );
  assert.ok(helperBlock, "expected resetPasswordWithToken helper before markPasswordResetUsed");
  assert.match(helperBlock[0], /await client\.query\("begin"\)/);
  assert.match(helperBlock[0], /update password_resets[\s\S]*set used_at = now\(\)[\s\S]*where token = \$1[\s\S]*and used_at is null[\s\S]*and expires_at > now\(\)[\s\S]*returning id, email, token, expires_at, used_at, created_at/);
  assert.match(helperBlock[0], /update users set password_hash = \$2 where email = \$1 returning id/);
  assert.match(helperBlock[0], /await client\.query\("commit"\)/);
  assert.match(helperBlock[0], /await client\.query\("rollback"\)/);
});
