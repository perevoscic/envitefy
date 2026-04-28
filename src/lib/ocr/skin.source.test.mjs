import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("ocr skin inference dispatches through the resolved studio provider", () => {
  const source = readSource("src/lib/ocr/skin.ts");
  const backgroundSource = readSource("src/lib/ocr/skin-background.ts");

  assert.match(source, /import \{ resolveStudioProvider \} from "@\/lib\/studio\/provider";/);
  assert.match(source, /buildOcrSkinBackgroundPromptRules/);
  assert.match(source, /type OcrSkinBackground/);
  assert.match(source, /export const ocrSkinDeps = \{/);
  assert.match(source, /resolveStudioProvider,/);
  assert.match(source, /const provider = ocrSkinDeps\.resolveStudioProvider\(\);/);
  assert.match(source, /provider === "openai"/);
  assert.match(source, /inferWithOpenAi/);
  assert.match(source, /inferWithGemini/);
  assert.match(source, /scanned-birthday-bento-pop/);
  assert.match(source, /scanned-wedding-noir-modern/);
  assert.match(source, /scanned-basketball-court-energy/);
  assert.match(source, /scanned-football-friday-lights/);
  assert.match(source, /FOOTBALL_SKIN_IDS/);
  assert.match(source, /scanned-pickleball-showdown/);
  assert.match(source, /PICKLEBALL_SKIN_IDS/);
  assert.match(source, /sportKind\?: OcrSportKind;/);
  assert.match(source, /scanned-invite-bento-celebration/);
  assert.match(source, /EXACT dominant color palette from the flyer itself/);
  assert.match(
    source,
    /Do not mute, soften, or pastelize a vivid flyer palette unless the flyer is already soft\./,
  );
  assert.match(source, /"background":\{"version":1,"seed":"unique-kebab-case"/);
  assert.match(source, /objectKinds/);
  assert.match(source, /required: \["skinId", "palette", "background"\]/);
  assert.match(source, /normalizeOcrSkinBackground/);
  assert.match(source, /resolveOcrSkinBackground/);
  assert.match(source, /"housewarming"/);
  assert.match(source, /housewarming: "Housewarming"/);
  assert.match(source, /basketball: "Basketball"/);
  assert.match(source, /football: "Football"/);
  assert.match(source, /category === "basketball"/);
  assert.match(source, /category === "football"/);
  assert.match(source, /scanned-football-watch-party/);
  assert.match(source, /sportKind === "pickleball"/);
  assert.match(source, /buildOcrSkinBackgroundPromptRules\(category, sportKind\)/);
  assert.match(backgroundSource, /normalized === "housewarming"/);
  assert.match(backgroundSource, /normalized === "basketball"/);
  assert.match(backgroundSource, /normalized === "football"/);
  assert.match(backgroundSource, /isFootballOcrSkinCandidate/);
  assert.match(backgroundSource, /normalizeOcrSportKind/);
  assert.match(backgroundSource, /isPickleballOcrSkinCandidate/);
  assert.match(
    backgroundSource,
    /housewarming: \["confetti", "dot", "star", "banner", "botanical-sprig"\]/,
  );
  assert.match(
    backgroundSource,
    /basketball: \["basketball", "hoop", "court-line", "sneaker", "banner"\]/,
  );
  assert.match(
    backgroundSource,
    /football: \["football", "helmet", "goalpost", "field-line", "stadium-light", "star", "banner"\]/,
  );
  assert.match(backgroundSource, /sneakers: "sneaker"/);
  assert.match(
    backgroundSource,
    /pickleball: \["pickleball", "paddle", "net-line", "court-line", "star", "banner", "dot"\]/,
  );
});

test("ocr pipeline adds provider-aware ocrSkin for invite-like OCR categories", () => {
  const source = readSource("src/lib/ocr/pipeline.ts");

  assert.match(source, /isBasketballOcrSkinCandidate/);
  assert.match(source, /isFootballOcrSkinCandidate/);
  assert.match(source, /isPickleballOcrSkinCandidate/);
  assert.match(source, /inferOcrSkinSelection/);
  assert.match(source, /isOcrInviteCategory/);
  assert.match(source, /const isPickleballOcrEvent =/);
  assert.match(source, /const isFootballOcrEvent =/);
  assert.match(source, /const ocrSkin =/);
  assert.match(source, /const ocrSkinCategory = isPickleballOcrEvent/);
  assert.match(source, /isFootballOcrEvent/);
  assert.match(source, /\? "football"/);
  assert.match(source, /category = "Sport Events";/);
  assert.match(source, /isOcrInviteCategory\(ocrSkinCategory\)/);
  assert.match(source, /await inferOcrSkinSelection\(\{/);
  assert.match(source, /category: ocrSkinCategory \|\| "general"/);
  assert.match(source, /sportKind: ocrSkinSportKind/);
  assert.match(source, /ocrSkin,/);
});
