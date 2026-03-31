import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

for (const relativePath of [
  "src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx",
  "src/components/gym-meet-templates/ShowcaseDiscoveryContent.tsx",
]) {
  test(`${path.basename(relativePath)} uses hotel-specific auto-fit grid and bottom-pinned CTA layout`, () => {
    const source = readSource(relativePath);

    assert.match(source, /const hotelCardGridClass = "grid gap-[34] \[grid-template-columns:repeat\(auto-fit,minmax\(340px,1fr\)\)\]";/);
    assert.match(
      source,
      /block\.id === "hotel-cards" \? hotelCardGridClass : gridClassForColumns\(block\.columns\)/,
    );
    assert.match(source, /block\.id === "hotel-cards" \? "flex h-full flex-col" : ""/);
    assert.match(
      source,
      /block\.id === "hotel-cards"\s*\?\s*"text-sm font-black uppercase tracking-\[0\.2em\] opacity-70 sm:text-base"/,
    );
    assert.match(
      source,
      /block\.id === "hotel-cards" \? "mt-auto pt-4" : "mt-4"/,
    );
  });
}

test("generic card-grid helpers keep their non-hotel layouts unchanged", () => {
  const gymSource = readSource("src/components/gym-meet-templates/GymMeetDiscoveryContent.tsx");
  const showcaseSource = readSource("src/components/gym-meet-templates/ShowcaseDiscoveryContent.tsx");

  assert.match(gymSource, /return "grid gap-4 md:grid-cols-2";/);
  assert.match(showcaseSource, /return "grid gap-3 md:grid-cols-2";/);
});
