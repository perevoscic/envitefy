import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("forgot password emails use a first-party public reset URL instead of a Supabase action link", () => {
  const forgotRoute = readSource("src/app/api/auth/forgot/route.ts");
  const resetUrlHelpers = readSource("src/lib/auth-reset-url.ts");
  const publicAssetUrl = readSource("src/lib/public-asset-url.ts");

  assert.match(
    forgotRoute,
    /new URL\(buildPublicPasswordResetUrl\(await absoluteUrl\("\/reset"\)\)\)/,
  );
  assert.match(forgotRoute, /resetUrlBuilder\.searchParams\.set\("token", reset\.token\)/);
  assert.doesNotMatch(forgotRoute, /createSupabaseRecoveryLink/);
  assert.match(resetUrlHelpers, /new URL\(buildPublicAssetUrl\(baseResetUrl \|\| "\/reset"\)\)/);
  assert.match(publicAssetUrl, /if \(!origin \|\| isLoopbackHost\(origin\)\) continue;/);
});

test("reset flow accepts encoded Supabase recovery fragments", () => {
  const middleware = readSource("src/middleware.ts");
  const resetClient = readSource("src/app/reset/ResetPasswordPageClient.tsx");

  assert.match(middleware, /pathname\.startsWith\("\/%23access_token="\)/);
  assert.match(middleware, /url\.pathname = "\/reset";/);
  assert.match(middleware, /url\.hash = pathname\.slice\("\/%23"\.length\);/);
  assert.match(resetClient, /setProvider\(p \|\| \(at \? "supabase" : ""\)\)/);
});
