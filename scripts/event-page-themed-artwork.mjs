import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifestPath = path.join(root, "docs/event-page-themed-artwork.json");
const resultsDirectory = path.join(root, "output/event-page-themed-artwork/results");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const assets = manifest.assets;
const [action = "status", ...args] = process.argv.slice(2);
const arg = (name) => args.indexOf(name) < 0 ? undefined : args[args.indexOf(name) + 1];
const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const resultPath = (id) => path.join(resultsDirectory, `${id}.json`);
const getAsset = (id) => {
  const asset = assets.find((item) => item.id === id);
  if (!asset) throw new Error(`Unknown design: ${id}`);
  return asset;
};
const outputPath = (asset) => {
  const output = path.resolve(root, asset.output);
  const allowed = path.resolve(root, "public/templates/event-pages") + path.sep;
  if (!output.startsWith(allowed) || !output.endsWith(".webp")) throw new Error("Artwork output must stay inside public/templates/event-pages");
  return output;
};
const readResult = (id) => {
  if (existsSync(resultPath(id))) return JSON.parse(readFileSync(resultPath(id), "utf8"));
  // Local result files are ignored. A clean checkout retains the published
  // provenance in the manifest; install/review/publish verify the actual WebP
  // against its recorded dimensions and hash before accepting it again.
  const recorded = assets.find((asset) => asset.id === id);
  return recorded && ["generated", "reviewed"].includes(recorded.status) &&
    typeof recorded.sha256 === "string" && recorded.width > 0 && recorded.height > 0
    ? recorded
    : null;
};
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
    const result = { id: asset.id, source, provider: "OpenAI built-in image_gen", output: asset.output, width: metadata.width, height: metadata.height, sha256: hash(output), bytes: metadata.size, verifiedDecode: true, visuallyReviewed: false, generatedAt: new Date().toISOString(), ...(previous ? { revisions: [...(previous.revisions || []), { source: previous.source, sha256: previous.sha256, width: previous.width, height: previous.height, reason: "Regenerated to correct the authored composition" }] } : {}) };
    await verify(asset, result);
    saveResult(result);
    console.log(JSON.stringify({ id: asset.id, status: "installed", width: result.width, height: result.height }));
  }
} else if (action === "reviewed") {
  for (const id of args.filter((value) => !value.startsWith("--"))) {
    const asset = getAsset(id);
    const result = await verify(asset, readResult(id));
    saveResult({ ...result, visuallyReviewed: true, reviewedAt: new Date().toISOString() });
  }
  console.log(JSON.stringify({ reviewed: args.length }));
} else if (action === "publish") {
  const ready = [];
  for (const asset of assets) {
    const result = readResult(asset.id);
    if (!result) continue;
    await verify(asset, result);
    Object.assign(asset, result, { status: result.visuallyReviewed ? "reviewed" : "generated" });
    if (result.visuallyReviewed) ready.push(asset.id);
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(path.join(root, "src/data/event-page-themed-artwork-availability.json"), `${JSON.stringify({ version: 1, readyDesignIds: ready }, null, 2)}\n`);
  console.log(JSON.stringify({ reviewed: ready.length, total: assets.length }));
} else if (action === "pending") {
  const collection = arg("--collection");
  const limit = Number(arg("--limit")) || 60;
  console.log(JSON.stringify(assets.filter((asset) => (!collection || asset.collection === collection) && !readResult(asset.id)).slice(0, limit)));
} else if (action === "status") {
  const installed = assets.filter((asset) => readResult(asset.id));
  console.log(JSON.stringify({ total: assets.length, installed: installed.length, reviewed: installed.filter((asset) => readResult(asset.id).visuallyReviewed).length }));
} else throw new Error(`Unknown action: ${action}`);
