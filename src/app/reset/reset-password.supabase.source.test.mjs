import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("forgot password flow avoids localhost Supabase recovery redirects", () => {
  const forgotRoute = readSource("src/app/api/auth/forgot/route.ts");
  const supabaseAuth = readSource("src/lib/supabase-auth.ts");

  assert.match(forgotRoute, /buildPublicPasswordResetUrl\(await absoluteUrl\("\/reset"\)\)/);
  assert.match(supabaseAuth, /buildSupabasePasswordResetRedirectUrl\(params\.baseResetUrl\)/);
});

test("reset flow accepts encoded Supabase recovery fragments", () => {
  const middleware = readSource("src/middleware.ts");
  const resetClient = readSource("src/app/reset/ResetPasswordPageClient.tsx");

  assert.match(middleware, /pathname\.startsWith\("\/%23access_token="\)/);
  assert.match(middleware, /url\.pathname = "\/reset";/);
  assert.match(middleware, /url\.hash = pathname\.slice\("\/%23"\.length\);/);
  assert.match(resetClient, /setProvider\(p \|\| \(at \? "supabase" : ""\)\)/);
});
