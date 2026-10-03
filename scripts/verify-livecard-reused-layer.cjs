// Explicit validation-only QA of saved lettering on an existing alternative background.
const fs = require("node:fs/promises");
const path = require("node:path");
require("dotenv").config({ quiet: true });
const loadTs = require("./lib/event-messages-test-loader.cjs");
const { composeCardLettering } = loadTs("src/lib/card-lettering-composition.ts");
const { verifyStudioArtwork } = loadTs("src/lib/studio/output-checks.ts");
async function main() {
  const root = "output/livecard-provider-evidence";
  const background = await fs.readFile(`${root}/normal-high/background.webp`);
  const layer = await fs.readFile(`${root}/normal-medium/lettering.webp`);
  const source = JSON.parse(await fs.readFile(`${root}/normal-medium/evidence.json`, "utf8"));
  const started = Date.now();
  const result = await composeCardLettering(background, layer, source.layout);
  const compositionMs = Date.now() - started;
  const checkStarted = Date.now();
  const check = await verifyStudioArtwork(`data:image/webp;base64,${result.composite.toString("base64")}`, {
    title: "Movie Under the Stars", requiredArtworkLines: ["You’re invited"], category: "General event", userIdea: "Outdoor cinema with navy twilight and coordinated gold marquee lettering",
  }, "live_card", { letteringOnly: true, layeredLettering: true, references: [{ mimeType: "image/webp", data: layer.toString("base64") }] });
  const out = path.resolve(root, "reused-lettering"); await fs.mkdir(out, { recursive: true });
  await fs.writeFile(path.join(out, "composed.webp"), result.composite);
  const evidence = { counts: { background: 0, lettering: 0, validation: 1, repair: 0, upload: 0, publication: 0 }, compositionMs, validationMs: Date.now() - checkStarted, layout: result.layout, check };
  await fs.writeFile(path.join(out, "evidence.json"), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence));
  if (check.status !== "passed") process.exitCode = 1;
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
