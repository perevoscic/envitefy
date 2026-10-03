// Explicit private/local QA. Does not publish or contact guests.
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
require("dotenv").config({ quiet: true });
const loadTs = require("./lib/event-messages-test-loader.cjs");
const cache = new Map();
const load = (name) => loadTs(name, {}, cache);
const { createLiveCardForm } = load("src/lib/livecard-builder.ts");
const { generateSharedCard, sharedCardGenerationDeps } = load("src/lib/shared-card-generation.ts");
const { generateCardHeadline, headlineGenerationDeps } = load("src/lib/shared-card-headline.ts");

async function main() {
  const scenario = process.argv[2] || "normal";
  const qualityOption = process.argv.find((value) => value.startsWith("--quality="));
  if (qualityOption) process.env.STUDIO_OPENAI_IMAGE_QUALITY = qualityOption.split("=")[1];
  const out = path.resolve("output/livecard-provider-evidence", scenario);
  await fs.mkdir(out, { recursive: true });
  const form = { ...createLiveCardForm("America/Chicago"), eventType: "General event", title: "Movie Under the Stars", headlineIntro: scenario === "no-opening" ? "" : "You’re invited", design: "A cinematic outdoor movie night, navy twilight sky with stars, warmly illuminated movie screen, popcorn and lawn chairs, immersive layered scene. Coordinated gold expressive movie marquee lettering." };
  if (scenario === "reference-photo") {
    const photo = await fs.readFile("public/templates/weddings/rustic-boho/detail-hands.webp");
    form.referenceUrl = `data:image/webp;base64,${photo.toString("base64")}`;
    form.eventType = "Wedding"; form.title = "An Evening Together";
    form.design = "Romantic garden wedding, preserve the reference's hand-holding subject, natural warm lighting and botanical greenery. Expressive ivory and gold lettering.";
  }
  const counts = { background: 0, lettering: 0, validation: 0, repair: process.argv.includes("--reuse-background") ? 1 : 0, upload: 0, publication: 0 };
  const requestContext = { jobId: `private-qa-${scenario}`, revision: createHash("sha256").update(JSON.stringify(form)).digest("hex"), attempt: counts.repair ? 2 : 1 };
  const providerRequests = [];
  const originalInfo = console.info;
  console.info = (name, metadata, ...rest) => { if (name === "livecard_image_request") providerRequests.push(metadata); originalInfo(name, metadata, ...rest); };
  const durations = [];
  for (const [deps, key, stage] of [[sharedCardGenerationDeps, "generateImage", "background"], [headlineGenerationDeps, "generate", "lettering"], [sharedCardGenerationDeps, "verify", "validation"], [headlineGenerationDeps, "verify", "validation"], [sharedCardGenerationDeps, "encode", "conversion"], [headlineGenerationDeps, "compose", "composition"]]) {
    const original = deps[key];
    deps[key] = async (...args) => {
      if (stage in counts) counts[stage]++;
      const startedAt = Date.now();
      try {
        const result = await original(...args);
        if (["background", "lettering"].includes(stage) && result.ok) await fs.writeFile(path.join(out, `${stage}-provider.png`), Buffer.from(result.imageDataUrl.split(",")[1], "base64"));
        return result;
      }
      finally { durations.push({ stage, durationMs: Date.now() - startedAt }); }
    };
  }
  const startedAt = Date.now();
  let design, headline, error;
  try {
    if (process.argv.includes("--reuse-background")) {
      const bytes = await fs.readFile(path.join(out, "background.webp"));
      design = { version: 1, font: "classic", ink: "#ffffff", accent: "#e7c27a", surface: "#16253b", backgroundUrl: `data:image/webp;base64,${bytes.toString("base64")}` };
    } else design = await generateSharedCard(form, undefined, undefined, requestContext);
    await fs.writeFile(path.join(out, "background.webp"), Buffer.from(design.backgroundUrl.split(",")[1], "base64"));
    headline = await generateCardHeadline(form, design, undefined, undefined, false, requestContext);
    await fs.writeFile(path.join(out, "composed.webp"), Buffer.from(headline.imageUrl.split(",")[1], "base64"));
    if (headline.layerUrl) await fs.writeFile(path.join(out, "lettering.webp"), Buffer.from(headline.layerUrl.split(",")[1], "base64"));
  } catch (failure) { error = failure.message; }
  const evidence = { scenario, ...requestContext, providerRequests, model: process.env.STUDIO_OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare", editModel: process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL || "gpt-image-2.5-flare", quality: process.env.STUDIO_OPENAI_IMAGE_QUALITY || "high", counts, durations, totalMs: Date.now() - startedAt, validation: headline?.validation, layout: headline?.layout, error };
  await fs.writeFile(path.join(out, process.argv.includes("--reuse-background") ? "evidence-repair.json" : "evidence.json"), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence));
  if (error) process.exitCode = 1;
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
