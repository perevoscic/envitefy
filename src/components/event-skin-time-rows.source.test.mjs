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

test("event skins render date row and gate the At row on available time", () => {
  for (const relPath of runtimeSkinSources) {
    const source = readSource(relPath);

    assert.match(source, /label="When"[\s\S]*?title=\{displayDate\}/, relPath);
    assert.match(source, /hasDisplayTime\s*\?\s*\([\s\S]*label="At"[\s\S]*title=\{displayTime\}/, relPath);
    assert.doesNotMatch(source, /subtitle=\{displayTime\}/, relPath);
  }
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
