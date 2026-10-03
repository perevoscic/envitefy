const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
require("dotenv").config({ quiet: true });
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { composeCardLettering } = loadTs("src/lib/card-lettering-composition.ts");
const { verifyStudioArtwork } = loadTs("src/lib/studio/output-checks.ts");
async function main() {
  const quality = process.argv[3] || "high";
  const out = path.resolve("output/lettering-probe");
  const startedAt = Date.now();
  const background = await sharp(await fs.readFile(process.argv[2])).resize(1024, 1536, { fit: "fill" }).webp({ lossless: true }).toBuffer();
  const isolated = await fs.readFile(path.join(out, `layer-${quality}.png`));
  const result = await composeCardLettering(background, isolated);
  const compositionMs = Date.now() - startedAt;
  await fs.writeFile(path.join(out, `placed-${quality}.webp`), result.composite);
  const checkStarted = Date.now();
  const check = await verifyStudioArtwork(`data:image/webp;base64,${result.composite.toString("base64")}`,
    { title: "Movie Under the Stars", requiredArtworkLines: ["You’re invited"], category: "General event", userIdea: "Art deco cinema-themed golden lettering on the selected background" },
    "live_card", { layeredLettering: true, letteringOnly: true, references: [{ mimeType: "image/webp", data: result.layer.toString("base64") }] });
  const evidence = { quality, requests: { background: 0, lettering: 0, validation: 1, repair: 0, upload: 0, publication: 0 }, compositionMs, validationMs: Date.now() - checkStarted, layout: result.layout, check };
  await fs.writeFile(path.join(out, `validation-${quality}.json`), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
