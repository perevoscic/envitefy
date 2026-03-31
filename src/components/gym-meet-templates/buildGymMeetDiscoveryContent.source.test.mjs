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

test("structured hotel cards keep inline booking actions without image-dependent mapping", () => {
  const source = readSource("src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts");

  assert.doesNotMatch(source, /imageUrl: safeString\(hotel\?\.imageUrl\)/);
  assert.match(source, /\{ label: "Book Hotel", url: safeString\(hotel\?\.bookingUrl\) \}/);
  assert.match(source, /\.split\(\/\\s\+\\\|\\s\+\/\)/);
  assert.doesNotMatch(
    source,
    /id: "hotel-cards",[\s\S]{0,120}columns: 2 as const,/,
  );
});

test("admission variant pricing requires explicit amount evidence instead of note-only payment markers", () => {
  const source = readSource("src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts");

  assert.match(source, /const extractExplicitVariantAmount = \(text: string, keywordPattern: RegExp\) =>/);
  assert.match(source, /const RELATIVE_VARIANT_PRICE_PATTERN = \/\\b\(\?:less\|more\|additional\|extra\|discount\|surcharge\)\\b\/i;/);
  assert.match(source, /const extractCurrencyDisplay = \(value: unknown\) =>/);
  assert.match(source, /extractExplicitVariantAmount\(note, CASH_VARIANT_KEYWORD\)/);
  assert.match(source, /extractExplicitVariantAmount\(note, CARD_VARIANT_KEYWORD\)/);
  assert.match(source, /!RELATIVE_VARIANT_PRICE_PATTERN\.test\(normalizedClause\)/);
  assert.match(source, /const priceAmount = extractCurrencyDisplay\(price\);/);
  assert.doesNotMatch(source, /const cashMarker = \/\\bcash\\b\/i\.test\(`\$\{label\} \$\{note\}`\)/);
  assert.doesNotMatch(source, /const cardMarker = \/\\b\(card\|credit\|debit\)\\b\/i\.test\(`\$\{label\} \$\{note\}`\)/);
});
