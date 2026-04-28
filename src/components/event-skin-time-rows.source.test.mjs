import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

const runtimeSkinSources = [
  "src/components/BirthdaySkin.tsx",
  "src/components/ScannedInviteSkin.tsx",
  "src/components/weddings/ScannedWeddingInviteView.tsx",
];

test("event skins render date and time as separate When and At rows", () => {
  for (const relPath of runtimeSkinSources) {
    const source = readSource(relPath);

    assert.match(source, /label="When"[\s\S]*?title=\{displayDate\}/, relPath);
    assert.match(source, /label="At"[\s\S]*?title=\{displayTime\}/, relPath);
    assert.doesNotMatch(source, /subtitle=\{displayTime\}/, relPath);
  }
});

test("event skins hide missing OCR time rows instead of showing placeholders", () => {
  for (const relPath of runtimeSkinSources) {
    const source = readSource(relPath);

    assert.doesNotMatch(source, /Time TBD/, relPath);
    assert.match(source, /displayTime\s*\?\s*\(/, relPath);
  }
});

test("scanned event detail icons use one matching swatch color per skin", () => {
  const sharedInfoBlockSources = [
    "src/components/BirthdaySkin.tsx",
    "src/components/ScannedInviteSkin.tsx",
  ];

  for (const relPath of sharedInfoBlockSources) {
    const source = readSource(relPath);

    assert.match(source, /const detailIconSwatchColor = "var\(--theme-primary\)";/, relPath);
    assert.doesNotMatch(source, /swatchColor="var\(--theme-secondary\)"/, relPath);
    assert.doesNotMatch(source, /swatchColor="var\(--theme-accent\)"/, relPath);
    assert.match(
      source,
      /<InfoBlock[\s\S]*?swatchColor=\{detailIconSwatchColor\}[\s\S]*?label="When"/,
      relPath,
    );
    assert.match(
      source,
      /<InfoBlock[\s\S]*?swatchColor=\{detailIconSwatchColor\}[\s\S]*?label="At"/,
      relPath,
    );
  }

  const weddingSource = readSource("src/components/weddings/ScannedWeddingInviteView.tsx");
  assert.match(weddingSource, /<div style=\{\{ color: colors\.accent \}\}>\{icon\}<\/div>/);
});

const sampleSkinSources = [
  "ai-studio-code-samples/ethereal-invitations/src/components/FormalSkin.tsx",
  "ai-studio-code-samples/ethereal-invitations/src/components/SampleBirthdaySkin.tsx",
  "ai-studio-code-samples/ethereal-invitations/src/components/WeddingSkin.tsx",
];

test("sample skins keep the same When and At row convention", () => {
  for (const relPath of sampleSkinSources) {
    const source = readSource(relPath);

    assert.match(
      source,
      /(?:label="When"|>When<)[\s\S]*?(?:title=\{data\.date\}|\{data\.date\})/,
      relPath,
    );
    assert.match(
      source,
      /(?:label="At"|>At<)[\s\S]*?(?:title=\{data\.time\}|\{data\.time\})/,
      relPath,
    );
    assert.doesNotMatch(
      source,
      /subtitle=\{data\.time\}|subValue=\{data\.time\}|Party time/,
      relPath,
    );
  }
});
