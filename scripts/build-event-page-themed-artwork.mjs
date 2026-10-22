import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";

/** Prepares/validates a worklist. Image generation uses the built-in image_gen tool only. */
const root = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = path.join(root, "src/data/event-page-themed-designs.ts");
const manifestPath = path.join(root, "docs/event-page-themed-artwork.json");
export function loadAuthoredDesigns() {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const result = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
      fileName: file, reportDiagnostics: true,
    });
    const errors = (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error);
    assert.equal(errors.length, 0, `Authored template source must parse: ${file}`);
    const module = { exports: {} };
    cache.set(file, module);
    const require = (specifier) => specifier.startsWith(".")
      ? load(path.resolve(path.dirname(file), `${specifier}.ts`))
      : createRequire(import.meta.url)(specifier);
    vm.runInNewContext(result.outputText, { module, exports: module.exports, require }, { filename: file });
    return module.exports;
  }
  return JSON.parse(JSON.stringify(load(sourcePath)));
}

/** Long generation directions stay out of the client-side catalog. */
export function artworkPrompt(design, collection, direction) {
  const authoredScene = direction.scenes.find((scene) => scene.name === design.coverTitle);
  assert.ok(authoredScene?.artDirection?.version === 2, `${design.id} needs version-two visual direction`);
  const art = authoredScene.artDirection;
  const pilots = JSON.parse(readFileSync(path.join(root, "docs/event-page-themed-pilot-prompts-v2.json"), "utf8"));
  const pilot = pilots.find((item) => item.id === design.id);
  if (pilot) return pilot.prompt;
  if (art.promptOverride) return art.promptOverride;
  return [
    `Create one original text-free event-page hero artwork for ${collection.name}, direction ${direction.name}.`,
    `Subject and setting: ${design.scene}.`,
    `Visual treatment: ${art.treatment}. Camera and framing: ${art.camera}. Lighting: ${art.lighting}. Composition and focal placement: ${art.composition}.`,
    "Vertical portrait 2:3 artwork. Follow this specific framing and medium literally. Preserve natural subject colors in photographs and the explicitly described palette in illustrations. Refined detail, convincing equipment, coherent materials and anatomy where applicable. The scene must read clearly at a small gallery thumbnail size; editable event lettering is placed outside the artwork.",
    `Avoid: ${art.avoid.join("; ")}. Do not turn an active or architectural scene into a decorative still life. Do not add generic props to fill space.`,
    "Do not include letters, words, numbers, dates, logos, watermarks, brand names, fictional event details, printed signage or a baked-in invitation border. Produce the artwork only, without a webpage or device mockup. Do not copy a recognizable existing photograph or commercial illustration.",
    collection.id === "religious-events" ? `This artwork is specifically for ${direction.style}. Respect only this identified tradition and occasion; do not combine symbols from different faiths, depict sacred figures or include scripture, calligraphy or imitated religious text. Keep sacred objects properly placed on clean elevated surfaces. Do not invent ritual claims, participant identities or an event date.` : "Keep all equipment, architecture and occasion-specific details accurate; avoid generic objects from unrelated event categories.",
    collection.category === "sports" ? "Use no professional team or league logos. Any people should have natural proportions, sensible sport-specific clothing, safely plausible poses and a clear relationship to the correct playing surface and equipment." : "",
  ].filter(Boolean).join(" ");
}

export function buildArtworkManifest({ allowPartial = false } = {}) {
  const { EVENT_PAGE_THEMED_COLLECTIONS: collections, EVENT_PAGE_THEMED_DESIGNS: designs, EVENT_PAGE_THEMED_BRIEFS: briefs } = loadAuthoredDesigns();
  assert.equal(collections.length, 18, "There must be eighteen replacement collections");
  assert.equal(new Set(designs.map((design) => design.id)).size, designs.length, "Design ids must be unique");
  assert.equal(new Set(designs.map((design) => design.scene)).size, designs.length, "Each design needs a distinct authored scene");
  assert.equal(new Set(designs.map((design) => design.artwork)).size, designs.length, "Each design needs its own artwork path");
  for (const collection of collections) {
    const collectionDesigns = designs.filter((design) => design.collection === collection.id);
    if (allowPartial && collectionDesigns.length === 0) continue;
    assert.equal(briefs[collection.id].length, 10, `${collection.id} must have ten curated visual directions`);
    assert.equal(collectionDesigns.length, 60, `${collection.id} must have sixty designs`);
    assert.equal(new Set(collectionDesigns.map((design) => design.subtype)).size, 10, `${collection.id} must retain its ten distinct themes`);
    assert.equal(new Set(collectionDesigns.map((design) => design.editorLayout)).size, 7, `${collection.id} must cover the seven supported page layouts`);
    const scenes = briefs[collection.id].flatMap((direction) => direction.scenes);
    assert.ok(new Set(scenes.map((scene) => scene.artDirection.medium)).size >= 4, `${collection.id} needs at least four visual media`);
    assert.ok(scenes.filter((scene) => scene.artDirection.medium !== "photography").length >= 12, `${collection.id} needs independently illustrated alternatives`);
    for (const direction of briefs[collection.id]) {
      assert.equal(direction.scenes.length, 6, `${collection.id}/${direction.subtype} must have six authored stories`);
      assert.ok(new Set(direction.scenes.map((scene) => scene.artDirection.camera)).size >= 3, `${collection.id}/${direction.subtype} needs varied viewpoints and framing`);
      assert.ok(new Set(direction.scenes.map((scene) => scene.artDirection.lighting)).size >= 3, `${collection.id}/${direction.subtype} needs varied lighting`);
      assert.ok(new Set(direction.scenes.map((scene) => scene.artDirection.composition)).size >= 3, `${collection.id}/${direction.subtype} needs varied focal placement`);
    }
  }
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { assets: [] };
  const previousById = new Map(previous.assets.map((asset) => [asset.id, asset]));
  return {
    version: 2,
    authoredOn: "2026-10-22",
    provider: "OpenAI built-in image_gen",
    generationTool: "image_gen.imagegen",
    generationPolicy: "One original image-generation call per asset. No alternate provider, composite contact-sheet splitting, reused generic photograph or automated generation from this builder.",
    expectedDesigns: 1080,
    collections: collections.map((collection) => ({ ...collection, authoredDesigns: designs.filter((design) => design.collection === collection.id).length })),
    assets: designs.map((design) => {
      const previousAsset = previousById.get(design.id);
      const collection = collections.find((item) => item.id === design.collection);
      const direction = briefs[design.collection].find((item) => item.subtype === design.subtype);
      const prompt = artworkPrompt(design, collection, direction);
      // Preserve generated/reviewed provenance on a repeat preparation. Prompt or
      // output changes need explicit regeneration rather than falsifying old results.
      if (previousAsset && previousAsset.status !== "pending") {
        assert.equal(previousAsset.prompt, prompt, `Cannot silently change generated prompt: ${design.id}`);
        assert.equal(previousAsset.output, `public${design.artwork}`, `Cannot silently move generated output: ${design.id}`);
      }
      return {
        ...previousAsset,
        id: design.id, collection: design.collection, name: design.name,
        subtype: design.subtype, scene: design.scene,
        artDirection: direction.scenes.find((scene) => scene.name === design.coverTitle).artDirection,
        output: `public${design.artwork}`, publicPath: design.artwork,
        prompt, status: previousAsset?.status ?? "pending",
        provider: previousAsset?.provider ?? "OpenAI built-in image_gen",
        tool: "image_gen.imagegen", transparentBackground: false, aspectRatio: "2:3",
        reviewRequired: ["correct-category-and-occasion", "distinct-story-and-medium", "different-angle-framing-light-and-focal-placement", "no-baked-text-or-branding", "visual-quality", "equipment-and-cultural-accuracy", "cohort-diversity-review"],
      };
    }),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const manifest = buildArtworkManifest({ allowPartial: process.argv.includes("--allow-partial") });
  if (check) {
    const current = JSON.parse(readFileSync(manifestPath, "utf8"));
    assert.ok(isDeepStrictEqual(current, manifest), "Artwork manifest is out of date; run node scripts/build-event-page-themed-artwork.mjs");
  } else writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ action: check ? "validated" : "prepared", collections: manifest.collections.length, authoredDesigns: manifest.assets.length, expectedDesigns: manifest.expectedDesigns, generatedImages: 0 }));
}
