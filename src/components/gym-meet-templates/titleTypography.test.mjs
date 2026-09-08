import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("gym meet title typography maps key templates to explicit display fonts", () => {
  const source = readSource("src/components/gym-meet-templates/registry.ts");

  assert.match(source, /"id": "airborne-atlas"[\s\S]*"titleTypographyId": "playfair"/);
  assert.match(source, /"id": "neon-runway"[\s\S]*"titleTypographyId": "orbitron"/);
  assert.match(source, /"id": "petal-poise"[\s\S]*"titleTypographyId": "cormorant"/);
  assert.match(source, /"id": "copper-grip"[\s\S]*"titleTypographyId": "anton"/);
});

test("gallery and picker share the live scene typography", () => {
  const files = [
    "src/components/gym-meet-templates/GymnasticsScene.tsx",
  ];

  for (const file of ["GymnasticsDesignGallery.tsx", "TemplateSelector.tsx"]) {
    assert.match(readSource(`src/components/gym-meet-templates/${file}`), /GymnasticsPreview/);
  }
  for (const file of files) {
    const source = readSource(file);
    assert.match(
      source,
      /getGymMeetTitleTypography/,
      `${file} does not use the shared title typography helper`
    );
  }
});
