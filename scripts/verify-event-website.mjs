// Read-only live check of the collector. Does not call AI or save an event.
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import ts from "typescript";

const filename = path.resolve("src/lib/discovery/event-website.ts");
const loaded = new Module(filename);
loaded._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  filename,
);
const { collectEventWebsite } = loaded.exports;
const origin = "https://www.atlantacentennialclassic.com";
const paths = [
  "/",
  "/overview",
  "/host-hotels",
  "/plan-your-visit",
  "/schedule",
  "/competing-teams",
];
const cache = new Map();
async function fetchPage(url, options) {
  if (cache.has(url)) return cache.get(url);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(options?.timeoutMs || 12000),
    headers: { "User-Agent": "EnvitefyBot/1.0 (+https://envitefy.com)" },
  });
  if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
  const page = {
    text: await response.text(),
    contentType: response.headers.get("content-type") || "",
    finalUrl: response.url,
  };
  cache.set(url, page);
  return page;
}
const results = [];
for (const pathname of paths) {
  const seed = await fetchPage(`${origin}${pathname}`);
  const result = await collectEventWebsite(seed.finalUrl, seed.text, {
    fetchPage,
    budgetMs: 25000,
  });
  assert.equal(result.eventYear, 2027, pathname);
  assert.ok(result.participatingClubs.length > 0, `${pathname}: no clubs`);
  assert.ok(result.participatingClubs.every((club) => club.year === 2027));
  assert.equal(result.attractions.length, 4, `${pathname}: attractions`);
  assert.equal(result.schedule.status, "not_posted", `${pathname}: schedule status`);
  assert.ok(
    result.coverage.every((item) => ["collected", "unavailable"].includes(item.status)),
    `${pathname}: coverage`,
  );
  results.push(result);
  console.log(
    JSON.stringify({
      start: pathname,
      pages: result.sources.length,
      year: result.eventYear,
      clubs: result.participatingClubs.length,
      attractions: result.attractions.length,
      coverage: result.coverage.map(({ section, status }) => ({ section, status })),
    }),
  );
}
const expected = results[0].participatingClubs
  .map((club) => `${club.name}|${club.location}`)
  .sort();
for (const result of results)
  assert.deepEqual(
    result.participatingClubs.map((club) => `${club.name}|${club.location}`).sort(),
    expected,
  );
fs.mkdirSync("output/event-website-discovery", { recursive: true });
fs.writeFileSync(
  "output/event-website-discovery/verification-v2.json",
  JSON.stringify(results, null, 2),
);
console.log("All six starting URLs passed.");
