import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("scanned invite skin computes readable colors for variable dark and light skins", () => {
  const source = readSource("src/components/ScannedInviteSkin.tsx");

  assert.match(source, /const directionsButtonTextColor = ensureReadableTextColor/);
  assert.match(source, /backgroundColor: directionsButtonBackground/);
  assert.match(source, /color: directionsButtonTextColor/);
  assert.match(source, /`Hosted by \$\{displayRsvpName\}`/);
  assert.match(source, /title=\{displayRsvpTitle\}/);

  assert.match(source, /const detailCardTextColor = ensureReadableTextColor/);
  assert.match(source, /backgroundColor: detailCardBackground/);
  assert.match(source, /color: detailCardTextColor/);
  assert.match(source, /style=\{\{ color: detailCardMutedTextColor \}\}/);
  assert.match(source, /OcrFactCards/);
  assert.match(source, /filterRenderedOcrFacts/);
  assert.match(source, /detailLayout\?: "default" \| "wideDetails"/);
  assert.match(source, /const detailsGridClassName =/);
  assert.match(
    source,
    /items-start gap-6 lg:grid-cols-\[minmax\(280px,0\.8fr\)_minmax\(0,1\.45fr\)\]/,
  );
  assert.match(
    source,
    /items-start gap-6 lg:grid-cols-\[minmax\(390px,1\.12fr\)_minmax\(0,1fr\)\] xl:grid-cols-\[minmax\(440px,1\.15fr\)_minmax\(0,0\.95fr\)\]/,
  );
  assert.match(source, /self-start rounded-\[2\.6rem\]/);
  assert.match(source, /facts=\{leftColumnOcrFacts\}/);
  assert.match(source, /facts=\{rightColumnOcrFacts\}/);
  assert.match(source, />\s*Apple\s*<\/button>/);

  assert.doesNotMatch(source, /style=\{\{ backgroundColor: "var\(--theme-text\)" \}\}/);
  assert.doesNotMatch(source, /flex flex-col justify-between rounded-\[3rem\]/);
  assert.doesNotMatch(source, /md:grid-cols-4/);
  assert.doesNotMatch(
    source,
    /className="text-2xl font-bold text-black\/90">\{displayDetailCopy\}/,
  );
  assert.doesNotMatch(source, /ICS File/);
});

test("birthday skin computes readable colors for variable dark and light skins", () => {
  const source = readSource("src/components/BirthdaySkin.tsx");

  assert.match(source, /const directionsButtonTextColor = ensureReadableTextColor/);
  assert.match(source, /backgroundColor: directionsButtonBackground/);
  assert.match(source, /color: directionsButtonTextColor/);

  assert.match(source, /const planCardTextColor = ensureReadableTextColor/);
  assert.doesNotMatch(source, /`Hosted by \$\{displayRsvpName\}`/);
  assert.match(source, /title=\{displayRsvpTitle\}/);
  assert.match(source, /backgroundColor: planCardBackground/);
  assert.match(source, /color: planCardTextColor/);
  assert.match(source, /style=\{\{ color: planCardMutedTextColor \}\}/);
  assert.match(source, /const displayRsvpTitle = displayRsvpName\.replace[\s\S]*\|\| "Host"/);
  assert.match(source, /title=\{displayVenueName \|\| "Party Location"\}/);
  assert.match(source, /OcrFactCards/);
  assert.match(source, /filterRenderedOcrFacts/);
  assert.match(
    source,
    /items-start gap-6 lg:grid-cols-\[minmax\(390px,1\.12fr\)_minmax\(0,1fr\)\] xl:grid-cols-\[minmax\(440px,1\.15fr\)_minmax\(0,0\.95fr\)\]/,
  );
  assert.match(source, /self-start rounded-\[2\.6rem\]/);
  assert.match(source, /facts=\{leftColumnOcrFacts\}/);
  assert.match(source, /facts=\{rightColumnOcrFacts\}/);
  assert.match(source, />\s*Apple\s*<\/button>/);

  assert.doesNotMatch(source, /style=\{\{ backgroundColor: "var\(--theme-text\)" \}\}/);
  assert.doesNotMatch(source, /flex flex-col justify-between rounded-\[3rem\]/);
  assert.doesNotMatch(source, /md:grid-cols-4/);
  assert.doesNotMatch(source, /className="text-2xl font-bold text-black\/90">\{displayPlanCopy\}/);
  assert.doesNotMatch(source, /Games, Food & Fun!/);
  assert.doesNotMatch(source, /ICS File/);
});

test("all scanned invite skins share OCR fact cards", () => {
  const genericSource = readSource("src/components/ScannedInviteSkin.tsx");
  const birthdaySource = readSource("src/components/BirthdaySkin.tsx");
  const weddingSource = readSource("src/components/weddings/ScannedWeddingInviteView.tsx");
  const basketballSource = readSource("src/components/BasketballSkin.tsx");
  const graduationSource = readSource("src/components/GraduationSkin.tsx");
  const footballSource = readSource("src/components/FootballSkin.tsx");
  const pickleballSource = readSource("src/components/PickleballSkin.tsx");

  assert.match(genericSource, /ocrFacts\?: OcrFact\[\] \| null/);
  assert.match(birthdaySource, /ocrFacts\?: OcrFact\[\] \| null/);
  assert.match(weddingSource, /ocrFacts\?: OcrFact\[\] \| null/);
  assert.match(basketballSource, /ocrFacts=\{ocrFacts\}/);
  assert.match(graduationSource, /ocrFacts=\{ocrFacts\}/);
  assert.match(footballSource, /ocrFacts=\{ocrFacts\}/);
  assert.match(pickleballSource, /ocrFacts=\{ocrFacts\}/);
});
