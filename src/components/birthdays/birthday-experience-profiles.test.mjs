import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  BIRTHDAY_BODY_COMPOSITIONS,
  BIRTHDAY_BODY_FACT_TREATMENTS,
  BIRTHDAY_BODY_GALLERY_TREATMENTS,
  BIRTHDAY_EXPERIENCE_COMPOSITIONS,
  BIRTHDAY_EXPERIENCE_MEDIA_FRAMES,
  BIRTHDAY_EXPERIENCE_TITLE_TREATMENTS,
  buildBirthdayExperienceProfiles,
} from "../../data/birthday-experience-profiles.mjs";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const createDesign = (index) => ({
  id: `birthday-design-${index}`,
  name: `Birthday Design ${index}`,
  style: "Creative",
  category: "Creative",
  family: "creative",
  heroMood: "A complete party environment",
  occasion: "Birthday",
  audience: "Kids",
  primaryColor: "#fff5ea",
  secondaryColor: "#d87338",
  decorations: { graphicType: "art-studio" },
});

test("104 birthday designs receive non-repeating structural experience signatures", () => {
  const profiles = buildBirthdayExperienceProfiles(
    Array.from({ length: 104 }, (_, index) => createDesign(index)),
  );
  const signatures = profiles.map((design) => design.experience.signature);
  const bodySignatures = profiles.map((design) => design.experience.bodySignature);

  assert.equal(profiles.length, 104);
  assert.equal(new Set(signatures).size, 104);
  assert.equal(new Set(bodySignatures).size, 104);
  assert.ok(BIRTHDAY_EXPERIENCE_COMPOSITIONS.length >= 12);
  assert.ok(BIRTHDAY_EXPERIENCE_MEDIA_FRAMES.length >= 13);
  assert.ok(BIRTHDAY_EXPERIENCE_TITLE_TREATMENTS.length >= 8);
  assert.ok(BIRTHDAY_BODY_COMPOSITIONS.length >= 26);
  assert.ok(BIRTHDAY_BODY_FACT_TREATMENTS.length >= 13);
  assert.ok(BIRTHDAY_BODY_GALLERY_TREATMENTS.length >= 8);
  assert.ok(profiles.every((design) => design.experience.ornament === "art-studio"));
});

test("the 24 original birthday templates use 24 different body compositions", () => {
  const originalIds = [
    "party-pop",
    "candy-dreams",
    "rainbow-bash",
    "playful-pals",
    "birthday-burst",
    "sweet-celebration",
    "super-star",
    "happy-dance",
    "magic-sparkle",
    "celebration-time",
    "fun-fiesta",
    "joyful-jamboree",
    "whimsical-wonder",
    "cheerful-chaos",
    "party-parade",
    "birthday-bliss",
    "sparkle-splash",
    "celebration-craze",
    "happy-hooray",
    "party-palooza",
    "birthday-bonanza",
    "sweet-surprise",
    "party-perfect",
    "birthday-bash",
  ];
  const profiles = buildBirthdayExperienceProfiles(
    originalIds.map((id, index) => ({ ...createDesign(index), id })),
  );
  const compositionById = new Map(
    profiles.map((design) => [design.id, design.experience.bodyComposition]),
  );

  assert.equal(new Set(compositionById.values()).size, 24);
  assert.equal(compositionById.get("rainbow-bash"), "festival-lineup");
  assert.equal(compositionById.get("birthday-burst"), "party-timeline");
  assert.equal(compositionById.get("sweet-celebration"), "menu-table");

  const mermaid = buildBirthdayExperienceProfiles([
    { ...createDesign(24), id: "undersea-mermaid-cove" },
  ])[0];
  assert.equal(mermaid.experience.bodyComposition, "orbit-dashboard");
});

test("the complete birthday catalog is upgraded through the experience-profile contract", () => {
  const catalogSource = readSource("src/data/birthday-design-catalog.ts");
  const generatedSource = readSource("src/data/birthday-template-data.ts");
  const originalIds = [
    ...catalogSource.matchAll(/^ {2}"([a-z0-9-]+)": \{$/gm),
  ].map((match) => match[1]);
  const generatedIds = [...generatedSource.matchAll(/^ {4}id: "([a-z0-9-]+)",$/gm)].map(
    (match) => match[1],
  );

  assert.equal(originalIds.length, 24);
  assert.equal(generatedIds.length, 80);
  assert.equal(new Set([...originalIds, ...generatedIds]).size, 104);
  assert.match(catalogSource, /buildBirthdayExperienceProfiles\(\[/);
  assert.match(catalogSource, /export type BirthdayCatalogDesign/);
});

test("birthday and wedding thumbnails render their real template compositions", () => {
  const birthdayGallerySource = readSource(
    "src/components/birthdays/BirthdayDesignGallery.tsx",
  );
  const birthdayPreviewSource = readSource(
    "src/components/birthdays/BirthdayDesignPreview.tsx",
  );
  const birthdayRendererSource = readSource("src/components/birthdays/BirthdayRenderer.tsx");
  const birthdayBodySource = readSource(
    "src/components/birthdays/BirthdayExperienceBody.tsx",
  );
  const weddingPreviewSource = readSource("src/components/weddings/WeddingDesignPreview.tsx");

  assert.match(birthdayGallerySource, /<BirthdayDesignPreview design=\{design\}/);
  assert.doesNotMatch(birthdayGallerySource, /<Image\s/);
  assert.match(birthdayPreviewSource, /<BirthdayExperienceHero/);
  assert.match(birthdayPreviewSource, /<BirthdayExperienceBody/);
  assert.match(birthdayRendererSource, /if \(theme\.experience\)/);
  assert.match(birthdayRendererSource, /data-birthday-experience=\{profile\.signature\}/);
  assert.match(birthdayRendererSource, /<BirthdayExperienceBody/);
  assert.doesNotMatch(
    birthdayRendererSource.match(/function UniqueBirthdayExperienceLayout[\s\S]*?function ConfettiSplashLayout/)?.[0] || "",
    /<BirthdayContentSections/,
  );
  assert.match(birthdayBodySource, /data-birthday-body-experience=\{profile\.bodySignature\}/);
  assert.match(birthdayBodySource, /data-birthday-gallery-treatment=\{treatment\}/);
  assert.match(birthdayBodySource, /data-birthday-fact-treatment=\{treatment\}/);
  assert.equal(
    new Set(
      [...birthdayBodySource.matchAll(/case "([a-z-]+)":/g)]
        .map((match) => match[1])
        .filter((value) => BIRTHDAY_BODY_COMPOSITIONS.includes(value)),
    ).size,
    26,
  );
  assert.match(weddingPreviewSource, /<WeddingRenderer template=\{template\} event=\{previewEvent\}/);
  assert.match(weddingPreviewSource, /background: design\.primaryColor/);
  assert.match(weddingPreviewSource, /data-wedding-layout=\{design\.layout\}/);
});
