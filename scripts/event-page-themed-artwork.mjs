import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifestPath = path.join(root, "docs/event-page-themed-artwork.json");
const resultsDirectory = path.join(root, "output/event-page-themed-artwork/results");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const assets = manifest.assets;
const legacyPath = path.join(root, "src/data/event-page-themed-legacy.json");
const legacy = existsSync(legacyPath) ? JSON.parse(readFileSync(legacyPath, "utf8")) : { readyDesignIds: [], designs: [] };
const frozenPath = path.join(root, "docs/event-page-themed-artwork-v1.json");
const frozen = existsSync(frozenPath) ? JSON.parse(readFileSync(frozenPath, "utf8")) : { assets: [] };
const legacyIds = new Set(legacy.readyDesignIds);
const legacyAssets = frozen.assets.filter((asset) => legacyIds.has(asset.id));
const allAssets = [...legacyAssets, ...assets.filter((asset) => !legacyIds.has(asset.id))];
const [action = "status", ...args] = process.argv.slice(2);
const arg = (name) => args.indexOf(name) < 0 ? undefined : args[args.indexOf(name) + 1];
const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const resultPath = (id) => path.join(resultsDirectory, `${id}.json`);
const getAsset = (id) => {
  const asset = allAssets.find((item) => item.id === id);
  if (!asset) throw new Error(`Unknown design: ${id}`);
  return asset;
};
const outputPath = (asset) => {
  const output = path.resolve(root, asset.output);
  const allowed = path.resolve(root, "public/templates/event-pages") + path.sep;
  if (!output.startsWith(allowed) || !output.endsWith(".webp")) throw new Error("Artwork output must stay inside public/templates/event-pages");
  const prefix = `${asset.collection}--v2-`;
  if (asset.id.startsWith(prefix) && output !== path.resolve(root, "public/templates/event-pages/v2", asset.collection, `${asset.id.slice(prefix.length)}.webp`)) throw new Error(`v2 artwork must use its own immutable v2 path: ${asset.id}`);
  return output;
};
const readResult = (id) => {
  if (existsSync(resultPath(id))) return JSON.parse(readFileSync(resultPath(id), "utf8"));
  // Local result files are ignored. A clean checkout retains the published
  // provenance in the manifest; install/review/publish verify the actual WebP
  // against its recorded dimensions and hash before accepting it again.
  const recorded = allAssets.find((asset) => asset.id === id);
  return recorded && ["generated", "reviewed"].includes(recorded.status) &&
    typeof recorded.sha256 === "string" && recorded.width > 0 && recorded.height > 0
    ? recorded
    : null;
};
const isV2 = (asset) => asset.id.startsWith(`${asset.collection}--v2-`);
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
function hasV2Reviews(result) {
  const review = result?.visualReview;
  return review?.technicalReview?.pass === true && review?.diversityReview?.pass === true &&
    nonempty(review.diversityReview.cohortEvidence) &&
    ["medium", "viewpoint", "scale", "placement", "lighting", "setting", "narrative"].every((key) => nonempty(review.diversityReview.observed?.[key]));
}
const saveResult = (result) => {
  mkdirSync(resultsDirectory, { recursive: true });
  writeFileSync(resultPath(result.id), `${JSON.stringify(result, null, 2)}\n`);
};
async function verify(asset, result) {
  const output = outputPath(asset);
  if (!result || result.id !== asset.id || !existsSync(output)) throw new Error(`Missing installed artwork: ${asset.id}`);
  const metadata = await sharp(output).metadata();
  await sharp(output).raw().toBuffer();
  if (metadata.format !== "webp" || metadata.width !== result.width || metadata.height !== result.height || hash(output) !== result.sha256) throw new Error(`Artwork verification failed: ${asset.id}`);
  return result;
}

async function verifyPortrait(source) {
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height || Math.abs(metadata.width / metadata.height - 2 / 3) > 0.02) throw new Error("Artwork must use the authored vertical 2:3 composition; regenerate rather than crop a different composition");
}

if (action === "install") {
  const asset = getAsset(arg("--id"));
  const source = path.resolve(arg("--source"));
  if (path.extname(source).toLowerCase() !== ".png" || !existsSync(source)) throw new Error("A generated PNG source is required");
  await verifyPortrait(source);
  const previous = readResult(asset.id);
  const replacing = args.includes("--replace");
  if (previous && !replacing) {
    await verify(asset, previous);
    console.log(JSON.stringify({ id: asset.id, status: "already-installed" }));
  } else {
    const output = outputPath(asset);
    if (existsSync(output) && !previous) throw new Error(`Refusing to overwrite untracked artwork: ${output}`);
    if (replacing && previous?.visuallyReviewed) throw new Error("Review the replacement explicitly before replacing previously approved artwork");
    mkdirSync(path.dirname(output), { recursive: true });
    await sharp(source).rotate().webp({ quality: 85, effort: 6 }).toFile(output);
    const metadata = await sharp(output).metadata();
    const promptFile = arg("--prompt-file");
    const generationPrompt = promptFile ? readFileSync(path.resolve(root, promptFile), "utf8") : asset.prompt;
    const result = { id: asset.id, source, provider: "OpenAI built-in image_gen", generationPrompt, output: asset.output, width: metadata.width, height: metadata.height, sha256: hash(output), bytes: metadata.size, verifiedDecode: true, visuallyReviewed: false, generatedAt: new Date().toISOString(), ...(previous ? { revisions: [...(previous.revisions || []), { source: previous.source, sha256: previous.sha256, width: previous.width, height: previous.height, generationPrompt: previous.generationPrompt || null, reason: arg("--reason") || "Regenerated to correct the authored composition" }] } : {}) };
    await verify(asset, result);
    saveResult(result);
    console.log(JSON.stringify({ id: asset.id, status: "installed", width: result.width, height: result.height }));
  }
} else if (action === "review-file") {
  const file = path.resolve(root, arg("--file"));
  const report = JSON.parse(readFileSync(file, "utf8"));
  const entries = report.results || report.assets || report.entries || report.reviews || (Array.isArray(report) ? report : []);
  let count = 0;
  for (const entry of entries) {
    const passed = entry.pass === true || entry.approved === true || entry.status === "approved" || entry.verdict === "approved" || (entry.technicalReview?.pass === true && entry.diversityReview?.pass === true);
    if (!passed || entry.pass === false || entry.approved === false) continue;
    const asset = getAsset(entry.id);
    const result = await verify(asset, readResult(entry.id));
    if (!entry.sha256 || entry.sha256 !== result.sha256) throw new Error(`Visual review does not match the installed artwork: ${entry.id}`);
    const visualReview = { evidence: path.relative(root, file).replaceAll(path.sep, "/"), method: entry.reviewMethod || report.reviewMethod || "Visual inspection", notes: entry.notes || null, ...(entry.technicalReview ? { technicalReview: entry.technicalReview } : {}), ...(entry.diversityReview ? { diversityReview: entry.diversityReview } : {}) };
    if (isV2(asset) && !hasV2Reviews({ visualReview })) throw new Error(`v2 review requires technicalReview.pass and diversityReview.pass, cohortEvidence, and observed medium/viewpoint/scale/placement/lighting/setting/narrative: ${entry.id}`);
    if (isV2(asset) && !existsSync(path.resolve(root, entry.diversityReview.cohortEvidence))) throw new Error(`Missing visual cohort evidence: ${entry.diversityReview.cohortEvidence}`);
    saveResult({ ...result, visuallyReviewed: true, reviewedAt: new Date().toISOString(), visualReview });
    count++;
  }
  if (!count) throw new Error("The report contains no approved artwork with matching hashes");
  console.log(JSON.stringify({ reviewed: count }));
} else if (action === "reviewed") {
  for (const id of args.filter((value) => !value.startsWith("--"))) {
    const asset = getAsset(id);
    if (isV2(asset)) throw new Error("v2 artwork requires review-file with separate technical and observed diversity reviews; bare reviewed cannot approve v2 artwork");
    const result = await verify(asset, readResult(id));
    saveResult({ ...result, visuallyReviewed: true, reviewedAt: new Date().toISOString() });
  }
  console.log(JSON.stringify({ reviewed: args.length }));
} else if (action === "publish") {
  const ready = new Set();
  for (const asset of assets) {
    const result = readResult(asset.id);
    if (!result) continue;
    await verify(asset, result);
    const reviewed = result.visuallyReviewed && (!isV2(asset) || hasV2Reviews(result));
    Object.assign(asset, result, { status: reviewed ? "reviewed" : "generated" });
    if (reviewed && isV2(asset)) ready.add(asset.id);
  }
  // Delivered v1 addresses retain their original files and metadata across every v2 publish.
  for (const id of legacy.readyDesignIds) {
    const asset = legacyAssets.find((item) => item.id === id);
    if (!asset || asset.status !== "reviewed" || !asset.sha256) throw new Error(`Missing frozen delivered artwork provenance: ${id}`);
    await verify(asset, asset);
    ready.add(id);
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(path.join(root, "src/data/event-page-themed-artwork-availability.json"), `${JSON.stringify({ version: 2, readyDesignIds: [...ready] }, null, 2)}\n`);
  console.log(JSON.stringify({ reviewed: ready.size, legacyDelivered: legacy.readyDesignIds.length, total: assets.length }));
} else if (action === "pending") {
  const collection = arg("--collection");
  const limit = Number(arg("--limit")) || 60;
  console.log(JSON.stringify(assets.filter((asset) => asset.id.startsWith(`${asset.collection}--v2-`) && (!collection || asset.collection === collection) && !readResult(asset.id)).slice(0, limit)));
} else if (action === "status") {
  const installed = assets.filter((asset) => readResult(asset.id));
  const reviewed = installed.filter((asset) => { const result = readResult(asset.id); return result.visuallyReviewed && (!isV2(asset) || hasV2Reviews(result)); });
  const availabilityPath = path.join(root, "src/data/event-page-themed-artwork-availability.json");
  const delivered = new Set(existsSync(availabilityPath) ? JSON.parse(readFileSync(availabilityPath, "utf8")).readyDesignIds : []);
  const collections = (manifest.collections || []).map((collection) => {
    const members = assets.filter((asset) => asset.collection === collection.id);
    return { id: collection.id, expected: collection.expectedDesigns, installed: installed.filter((asset) => asset.collection === collection.id).length, reviewed: reviewed.filter((asset) => asset.collection === collection.id).length, active: members.length === collection.expectedDesigns && members.every((asset) => delivered.has(asset.id)) };
  });
  console.log(JSON.stringify({ total: assets.length, installed: installed.length, reviewed: reviewed.length, activeCollections: collections.filter((collection) => collection.active).length, collections }));
} else throw new Error(`Unknown action: ${action}`);
