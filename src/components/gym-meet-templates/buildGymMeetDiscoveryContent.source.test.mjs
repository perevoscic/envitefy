import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("structured hotel cards suppress extra travel copy and link lists", () => {
  const source = readSource("src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts");

  assert.match(source, /const hotelCardsOnlyMode = travelAccommodationInPlay && travelHotelCards.length > 0;/);
  assert.match(source, /\.\.\.\(hotelCardsOnlyMode \? \[\] : buildPublicSectionBlocks\(effectivePublicSections\?\.travel\)\)/);
  assert.match(source, /!\(travelAccommodationInPlay && hotelCards.length > 0\) && hotelLinks.length > 0/);
});

test("structured hotel cards carry image urls and inline booking actions", () => {
  const source = readSource("src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts");

  assert.match(source, /imageUrl: safeString\(hotel\?\.imageUrl\)/);
  assert.match(source, /\{ label: "Book Hotel", url: safeString\(hotel\?\.bookingUrl\) \}/);
  assert.match(source, /columns: 2 as const,/);
});
