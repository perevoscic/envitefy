/** Legacy migration only: explicitly authorized cleanup of existing delivery artwork.
 * New assets use `npm run images:prepare -- --input ... --output ...` before import.
 * Historical evidence, supplied branding sources and platform icons are not artwork inputs.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = path.join(root, "src/data/repository-image-migrations.json");
const policy = JSON.parse(fs.readFileSync(path.join(root, "scripts/data/repository-image-policy.json"), "utf8"));
const check = process.argv.includes("--check");
if (!check && !process.argv.includes("--legacy-migration")) {
  throw new Error("New site images must be prepared before import: npm run images:prepare -- --input <staged-original> --output public/<name>.webp. Existing-asset migrations require --legacy-migration.");
}
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  cwd: root, maxBuffer: 64 * 1024 * 1024,
}).toString().split("\0").filter(Boolean))];
const raster = /\.(png|jpe?g|avif|gif|bmp|tiff?)$/i;
const candidates = files.filter((file) => policy.roots.some((prefix) => file.startsWith(prefix)) &&
  raster.test(file) && fs.existsSync(path.join(root, file)) &&
  (!Object.hasOwn(policy.retained, file) || (policy.retained[file].startsWith("Empty scaffold") && fs.statSync(path.join(root, file)).size !== 0)));
const records = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 120_000, windowsHide: true });
}

async function verify(file, expected) {
  const absolute = path.join(root, file);
  const bytes = fs.readFileSync(absolute);
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") throw new Error(`Not WebP: ${file}`);
  const probe = JSON.parse(run(process.env.FFPROBE_PATH || "ffprobe", ["-v", "error", "-show_streams", "-of", "json", absolute]));
  const stream = probe.streams.find((entry) => entry.codec_type === "video");
  if (stream?.codec_name !== "webp" || stream.width !== expected.width || stream.height !== expected.height) throw new Error(`WebP dimensions/codec changed: ${file}`);
  const decoded = await sharp(absolute).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (expected.alpha) {
    for (let pixel = 0; pixel < expected.alpha.length; pixel++) {
      if (decoded.data[pixel * 4 + 3] !== expected.alpha[pixel]) throw new Error(`Transparency changed: ${file}`);
    }
  }
  return decoded;
}

if (check) {
  if (candidates.length) throw new Error(`Non-WebP artwork entered asset directories before preparation. Stage incoming originals outside these directories and use npm run images:prepare:\n${candidates.join("\n")}`);
  for (const record of records) {
    if (fs.existsSync(path.join(root, record.source))) throw new Error(`Original remains: ${record.source}`);
    await verify(record.destination, record);
  }
  console.log(`Verified ${records.length} WebP replacements; no unconverted delivery artwork. ${Object.keys(policy.retained).length} documented source/platform exceptions.`);
} else {
  const pending = records.filter(({ source }) => fs.existsSync(path.join(root, source)));
  const prepared = new Map();
  // Validate the entire input batch before encoding anything.
  for (const source of candidates) {
    const sourceBytes = fs.readFileSync(path.join(root, source));
    const metadata = await sharp(sourceBytes, { animated: true }).metadata();
    if ((metadata.pages || 1) !== 1) throw new Error(`Animated artwork needs an explicit animation-preserving conversion: ${source}`);
    prepared.set(source, metadata);
  }
  for (const source of candidates) {
    const absolute = path.join(root, source);
    const sourceBytes = fs.readFileSync(absolute);
    const metadata = prepared.get(source);
    const alpha = metadata.hasAlpha ? await sharp(sourceBytes).extractChannel("alpha").raw().toBuffer() : undefined;
    const existing = records.find((record) => record.source === source);
    if (existing) {
      if (createHash("sha256").update(sourceBytes).digest("hex") !== existing.sourceSha256) throw new Error(`Source changed since conversion; retained: ${source}`);
      await verify(existing.destination, { ...existing, alpha });
      continue;
    }
    // Do not silently replace newer artwork already delivered under the sibling URL.
    const sibling = source.replace(raster, ".webp");
    const destination = fs.existsSync(path.join(root, sibling)) ? source.replace(raster, `-${path.extname(source).slice(1)}.webp`) : sibling;
    if (fs.existsSync(path.join(root, destination))) throw new Error(`Destination already exists: ${destination}`);
    const lossless = metadata.hasAlpha || /(?:logo|brand|icon|wordmark|cutout|frame)/i.test(source);
    const temporary = path.join(root, `${destination}.converting-${process.pid}.webp`);
    run(process.env.FFMPEG_PATH || "ffmpeg", ["-hide_banner", "-loglevel", "error", "-n", "-noautorotate", "-i", absolute,
      "-frames:v", "1", "-c:v", "libwebp", "-lossless", lossless ? "1" : "0", "-q:v", "85", "-compression_level", "6", temporary]);
    const record = { source, destination, width: metadata.width, height: metadata.height, lossless,
      sourceSha256: createHash("sha256").update(sourceBytes).digest("hex") };
    await verify(path.relative(root, temporary), { ...record, alpha });
    fs.renameSync(temporary, path.join(root, destination));
    pending.push(record);
    records.push(record);
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, `${JSON.stringify(records, null, 2)}\n`);
    console.log(`Verified ${source} -> ${destination}`);
  }
  // Persist recovery information before touching references or removing any source.
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(records, null, 2)}\n`);

  const substitutions = new Map();
  for (const { source, destination } of records) {
    substitutions.set(source, destination);
    if (source.startsWith("public/")) substitutions.set(source.slice(6), destination.slice(6));
    if (source.startsWith("templates/")) substitutions.set(`/${source}`, `/${destination}`);
    if (source.startsWith("src/")) substitutions.set(`@/${source.slice(4)}`, `@/${destination.slice(4)}`);
  }
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp([...substitutions.keys()].sort((a, b) => b.length - a.length).map(escape).join("|") || "(?!)", "g");
  let changed = 0;
  for (const file of files) {
    if (!/^(src|public|templates|images|scripts)\//.test(file) || !/\.(?:[cm]?jsx?|tsx?|json|css|html|webmanifest)$/.test(file) ||
      file === "src/data/repository-image-migrations.json" || file === "scripts/data/repository-image-policy.json" || file === "scripts/convert-repo-images.mjs" || !fs.existsSync(path.join(root, file))) continue;
    const original = fs.readFileSync(path.join(root, file), "utf8");
    const updated = original.replace(expression, (match) => substitutions.get(match));
    if (original !== updated) { fs.writeFileSync(path.join(root, file), updated); changed++; }
  }
  for (const record of pending) {
    const absolute = path.resolve(root, record.source);
    if (!absolute.startsWith(path.resolve(root) + path.sep)) throw new Error(`Outside repository: ${record.source}`);
    if (createHash("sha256").update(fs.readFileSync(absolute)).digest("hex") !== record.sourceSha256) throw new Error(`Source changed during conversion; retained: ${record.source}`);
    fs.unlinkSync(absolute);
  }
  console.log(`Converted ${pending.length} images, updated ${changed} reference files, and deleted only verified originals.`);
}
