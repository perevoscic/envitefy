import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("football landing route exposes a public landing page and launcher CTAs", () => {
  const page = readSource("src/app/football/page.tsx");
  const landing = readSource("src/components/football-landing/FootballLanding.tsx");

  assert.match(page, /Envitefy Football/);
  assert.match(page, /https:\/\/envitefy\.com\/football/);
  assert.match(page, /FootballLanding/);
  assert.match(landing, /Start your football page/);
  assert.match(landing, /\/event\/football/);
  assert.match(landing, /football-hero\.jpeg/);
});

test("football landing route is public and in sitemap", () => {
  const middleware = readSource("src/middleware.ts");
  const sitemap = readSource("src/app/sitemap.ts");

  assert.match(middleware, /"\/football"/);
  assert.match(middleware, /"\/event\/football"/);
  assert.match(sitemap, /path: "\/football"/);
});
