import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildArtworkManifest, loadAuthoredDesigns } from "./build-event-page-themed-artwork.mjs";

const { EVENT_PAGE_THEMED_COLLECTIONS: collections, EVENT_PAGE_THEMED_DESIGNS: designs, EVENT_PAGE_THEMED_BRIEFS: briefs } = loadAuthoredDesigns();
const manifest = buildArtworkManifest();
const expectedCollections = ["bridal-showers", "graduations", "housewarming", "open-house", "religious-events", "dance", "cheerleading", "basketball", "baseball", "softball", "soccer", "volleyball", "hockey", "lacrosse", "tennis", "track-field", "swimming", "wrestling"];
const layouts = ["split", "banner", "poster", "editorial", "spotlight", "minimal", "cards"];
const compositions = ["editorial", "arch", "oval", "postcard", "poster", "framed", "organic", "panorama", "journal"];

test("all eighteen replacements contain sixty individually authored scenes", () => {
  assert.deepEqual(collections.map((collection) => collection.id).sort(), [...expectedCollections].sort());
  assert.equal(designs.length, 1080);
  for (const collection of collections) {
    const members = designs.filter((design) => design.collection === collection.id);
    assert.equal(members.length, 60, collection.id);
    assert.equal(briefs[collection.id].length, 10, collection.id);
    for (const direction of briefs[collection.id]) {
      assert.equal(direction.scenes.length, 6, `${collection.id}/${direction.subtype}`);
      assert.equal(members.filter((design) => design.subtype === direction.subtype).length, 6);
      for (const scene of direction.scenes) {
        assert.ok(scene.name.length > 3);
        assert.ok(scene.brief.length > 40, `${collection.id}/${scene.name} needs a concrete subject and setting`);
      }
    }
  }
  for (const field of ["id", "artwork", "scene"]) assert.equal(new Set(designs.map((design) => design[field])).size, 1080, field);
});

test("every design defines a complete page presentation and a unique stable artwork path", () => {
  for (const design of designs) {
    assert.equal(design.id, `${design.collection}--${design.slug}`);
    assert.match(design.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(design.slug.startsWith("v2-"));
    assert.equal(design.artwork, `/templates/event-pages/v2/${design.collection}/${design.slug.slice(3)}.webp`);
    assert.ok(layouts.includes(design.editorLayout));
    assert.ok(compositions.includes(design.composition));
    for (const value of [design.background, design.ink, design.accent]) assert.match(value, /^#[a-f0-9]{6}$/);
    assert.ok(design.font.length > 10);
    assert.equal(design.font, design.theme.fontFamily);
    assert.ok(design.theme.bg && design.theme.text && design.theme.accent && design.theme.preview);
    assert.ok(["paper", "dark", "tinted"].includes(design.bodyPresentation.surface));
    assert.ok(["cards", "ruled", "open", "panels", "timeline"].includes(design.bodyPresentation.sectionStyle));
    assert.ok(["left", "center"].includes(design.bodyPresentation.alignment));
    assert.match(design.bodyPresentation.borderRadius, /^\d+(?:\.\d+)?rem$/);
    assert.ok(["airy", "compact", "balanced"].includes(design.bodyPresentation.spacing));
    assert.ok(!("artworkPrompt" in design), "Long generation prompts must not expand in client catalog imports");
  }
  for (const collection of collections) {
    const members = designs.filter((design) => design.collection === collection.id);
    assert.equal(new Set(members.map((design) => design.editorLayout)).size, 7);
    assert.equal(new Set(members.map((design) => design.composition)).size, 9);
    assert.ok(new Set(members.map((design) => design.font)).size >= 3);
  }
});

test("artwork worklist has exact prompts and safe outputs, retaining generated provenance", () => {
  assert.equal(manifest.assets.length, 1080);
  assert.equal(manifest.generationTool, "image_gen.imagegen");
  assert.equal(new Set(manifest.assets.map((asset) => asset.prompt)).size, 1080);
  for (const asset of manifest.assets) {
    const design = designs.find((item) => item.id === asset.id);
    assert.equal(asset.output, `public${design.artwork}`);
    const pilot = JSON.parse(readFileSync(new URL("../docs/event-page-themed-pilot-prompts-v2.json", import.meta.url), "utf8")).find((item) => item.id === asset.id);
    assert.ok(pilot ? asset.prompt === pilot.prompt : asset.prompt.includes(`Subject and setting: ${design.scene}.`));
    assert.equal(asset.artDirection.version, 2);
    assert.ok(asset.artDirection.camera.length > 10);
    assert.ok(asset.artDirection.lighting.length > 10);
    assert.ok(asset.artDirection.composition.length > 10);
    assert.equal(asset.tool, "image_gen.imagegen");
    assert.equal(asset.provider, "OpenAI built-in image_gen");
    assert.equal(asset.aspectRatio, "2:3");
    assert.equal(asset.transparentBackground, false);
    assert.ok(["pending", "generated", "reviewed"].includes(asset.status));
    if (asset.status !== "pending") {
      assert.ok(asset.source && asset.sha256 && asset.width > 0 && asset.height > 0);
      assert.equal(asset.verifiedDecode, true);
    }
  }
  const saved = JSON.parse(readFileSync(new URL("../docs/event-page-themed-artwork.json", import.meta.url), "utf8"));
  assert.deepEqual(manifest, saved);
});

test("every six-scene cohort varies viewpoint, lighting, focal placement and visual medium", () => {
  for (const collection of collections) {
    const scenes = briefs[collection.id].flatMap((direction) => direction.scenes);
    assert.ok(new Set(scenes.map((scene) => scene.artDirection.medium)).size >= 4, collection.id);
    assert.ok(scenes.filter((scene) => scene.artDirection.medium !== "photography").length >= 12, collection.id);
    for (const direction of briefs[collection.id]) {
      for (const field of ["camera", "lighting", "composition"]) assert.ok(new Set(direction.scenes.map((scene) => scene.artDirection[field])).size >= 3, `${collection.id}/${direction.subtype}/${field}`);
      assert.ok(new Set(direction.scenes.map((scene) => scene.artDirection.medium)).size >= 3, `${collection.id}/${direction.subtype}/media`);
    }
  }
});

test("religious designs identify their tradition and occasion without assigning an event date", () => {
  const religious = designs.filter((design) => design.collection === "religious-events");
  const traditions = ["Christian", "Jewish", "Muslim", "Hindu", "Sikh", "Buddhist"];
  for (const design of religious) {
    assert.ok(traditions.some((tradition) => design.label.includes(tradition)), design.id);
    const prompt = manifest.assets.find((asset) => asset.id === design.id).prompt;
    assert.ok(prompt.includes(`This artwork is specifically for ${design.style}.`));
    assert.ok(prompt.includes("do not combine symbols from different faiths"));
    assert.ok(prompt.includes("Do not invent ritual claims, participant identities or an event date."));
    assert.ok(!("startDate" in design) && !("date" in design));
  }
  assert.equal(new Set(religious.map((design) => design.subtype)).size, 10);
});

test("primary authored text colors have accessible contrast on every palette", () => {
  const luminance = (hex) => hex.slice(1).match(/.{2}/g).map((part) => {
    const value = Number.parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  for (const design of designs) {
    const values = [luminance(design.background), luminance(design.ink)].sort((a, b) => b - a);
    const contrast = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(contrast >= 4.5, `${design.id}: ${contrast.toFixed(2)}`);
  }
});
