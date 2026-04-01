import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football routes redirect to gymnastics", () => {
  const landingPage = readSource("src/app/football/page.tsx");
  const eventPage = readSource("src/app/event/football/page.tsx");

  assert.match(landingPage, /redirect\("\/gymnastics"\)/);
  assert.match(eventPage, /redirect\("\/gymnastics"\)/);
});

test("football is removed from the sitemap and redirected in middleware", () => {
  const middleware = readSource("src/middleware.ts");
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(middleware, /normalizedPathname === "\/football"/);
  assert.match(middleware, /normalizedPathname === "\/event\/football"/);
  assert.doesNotMatch(sitemap, /path: "\/football"/);
  assert.match(sitemap, /path: "\/snap"/);
});
