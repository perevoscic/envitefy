/** Prepare one incoming image before it enters tracked site assets. No URL migrations. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
if (!args.includes("--input") || !args.includes("--output")) {
  throw new Error("Usage: npm run images:prepare -- --input output/image-staging/original.png --output public/images/final-name.webp [--lossless]");
}
const source = path.resolve(option("--input"));
const destination = path.resolve(option("--output"));
const inside = (directory, file) => {
  const relative = path.relative(directory, file);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
};
const assetRoots = ["public", "images", "templates", "src/assets"].map((relative) => path.join(root, relative));
if (!assetRoots.some((directory) => inside(directory, destination)) || path.extname(destination).toLowerCase() !== ".webp") {
  throw new Error("Output must be a .webp inside public/, images/, templates/ or src/assets/.");
}
if (assetRoots.some((directory) => inside(directory, source))) throw new Error("Stage the original outside tracked asset directories before preparation.");
if (inside(root, source)) {
  const relative = path.relative(root, source);
  const ignored = execFileSync("git", ["check-ignore", "--", relative], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
  if (!ignored) throw new Error("The original must be in an ignored staging directory.");
}
if (fs.existsSync(destination)) throw new Error(`Destination exists; choose the intended final asset path explicitly: ${destination}`);

const input = fs.readFileSync(source);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inputHash = digest(input);
const metadata = await sharp(input, { animated: true }).metadata();
if ((metadata.pages || 1) !== 1) throw new Error("Animated images require an explicit animation-preserving preparation workflow.");
const lossless = args.includes("--lossless") || metadata.hasAlpha || /logo|icon|wordmark/i.test(path.basename(destination));
const staging = fs.mkdtempSync(path.join(os.tmpdir(), "envitefy-image-"));
const prepared = path.join(staging, "verified.webp");
function run(command, commandArgs) {
  return execFileSync(command, commandArgs, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 120_000, windowsHide: true });
}
try {
  run(process.env.FFMPEG_PATH || "ffmpeg", ["-hide_banner", "-loglevel", "error", "-n", "-noautorotate", "-i", source,
    "-frames:v", "1", "-c:v", "libwebp", "-lossless", lossless ? "1" : "0", "-q:v", "85", "-compression_level", "6", prepared]);
  const bytes = fs.readFileSync(prepared);
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") throw new Error("FFmpeg output is not genuine WebP.");
  const probe = JSON.parse(run(process.env.FFPROBE_PATH || "ffprobe", ["-v", "error", "-show_streams", "-of", "json", prepared]));
  const stream = probe.streams.find((entry) => entry.codec_type === "video");
  if (stream?.codec_name !== "webp" || stream.width !== metadata.width || stream.height !== metadata.height) throw new Error("Output codec/dimensions do not match the input.");
  const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer();
  if (metadata.hasAlpha) {
    const alpha = await sharp(input).extractChannel("alpha").raw().toBuffer();
    for (let pixel = 0; pixel < alpha.length; pixel++) {
      if (decoded[pixel * 4 + 3] !== alpha[pixel]) throw new Error("Output transparency differs from the original.");
    }
  }
  if (digest(fs.readFileSync(source)) !== inputHash) throw new Error("The original changed during conversion; retained it without importing.");
  // The verified temporary WebP remains available if installing the final asset fails.
  fs.unlinkSync(source);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(prepared, destination, fs.constants.COPYFILE_EXCL);
  if (digest(fs.readFileSync(destination)) !== digest(bytes)) throw new Error(`Installed asset differs; verified copy remains at ${prepared}`);
  fs.unlinkSync(prepared);
  fs.rmdirSync(staging);
  console.log(`Prepared ${path.relative(root, destination).replaceAll("\\", "/")}: ${metadata.width}x${metadata.height} WebP. Original deleted before import; no redirect created.`);
} catch (error) {
  throw new Error(`${error.message}\nPreparation directory: ${staging}`, { cause: error });
}
