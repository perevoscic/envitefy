import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Contact sheets are inspection aids, never substitutes for independently generated assets.
const args = process.argv.slice(2);
const arg = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const root = process.cwd();
const collection = arg("--collection");
assert.ok(collection, "Use --collection <collection-id>");
const manifest = JSON.parse(readFileSync("docs/event-page-themed-artwork.json", "utf8"));
const members = manifest.assets.filter((asset) => asset.collection === collection && (!arg("--subtype") || asset.subtype === arg("--subtype")));
assert.ok(members.length, "Unknown collection or subtype");
const directory = path.resolve(root, arg("--out") || `.qa/themed-v2-review/${collection}`);
assert.ok(directory.startsWith(root + path.sep), "Review output must stay inside the workspace");
mkdirSync(directory, { recursive: true });
const xml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const installed = [];
for (const asset of members) {
  const file = path.resolve(root, asset.output);
  if (!existsSync(file)) continue;
  const bytes = readFileSync(file);
  const metadata = await sharp(bytes).metadata();
  await sharp(bytes).raw().toBuffer();
  installed.push({ id: asset.id, subtype: asset.subtype, name: asset.name, file, width: metadata.width, height: metadata.height, sha256: createHash("sha256").update(bytes).digest("hex") });
}
const cohorts = [];
for (const subtype of new Set(installed.map((entry) => entry.subtype))) {
  const images = installed.filter((entry) => entry.subtype === subtype);
  const columns = Math.min(images.length, 3);
  const rows = Math.ceil(images.length / columns);
  const visual = [];
  const labels = [];
  for (const [index, entry] of images.entries()) {
    const left = index % columns * 400 + 8;
    const top = Math.floor(index / columns) * 640 + 8;
    visual.push({ input: await sharp(entry.file).resize(384, 576, { fit: "contain", background: "#eeeaf3" }).toBuffer(), left, top });
    const title = entry.name.split(" · ").at(-1);
    labels.push({ input: Buffer.from(`<svg width="384" height="48"><rect width="384" height="48" fill="#fff"/><text x="8" y="21" font-size="15" fill="#292538" font-family="Arial">${xml(title)}</text><text x="8" y="41" font-size="11" fill="#625b75" font-family="Arial">${xml(entry.id.replace(`${collection}--v2-`, ""))}</text></svg>`), left, top: top + 576 });
  }
  const canvas = () => sharp({ create: { width: columns * 400, height: rows * 640, channels: 3, background: "#eeeaf3" } });
  const unlabeled = path.join(directory, `${subtype}-unlabeled.jpg`);
  const labeled = path.join(directory, `${subtype}.jpg`);
  await canvas().composite(visual).jpeg({ quality: 92 }).toFile(unlabeled);
  await canvas().composite([...visual, ...labels]).jpeg({ quality: 92 }).toFile(labeled);
  cohorts.push({ subtype, installed: images.length, expected: members.filter((asset) => asset.subtype === subtype).length, labeled: path.relative(root, labeled).replaceAll(path.sep, "/"), unlabeled: path.relative(root, unlabeled).replaceAll(path.sep, "/") });
}
let overview;
if (installed.length === 60) {
  const thumbnails = [];
  for (const [index, entry] of installed.entries()) thumbnails.push({ input: await sharp(entry.file).resize(192, 288).toBuffer(), left: index % 6 * 200 + 4, top: Math.floor(index / 6) * 300 + 4 });
  const file = path.join(directory, "collection-overview.jpg");
  await sharp({ create: { width: 1200, height: 3000, channels: 3, background: "#eeeaf3" } }).composite(thumbnails).jpeg({ quality: 92 }).toFile(file);
  overview = path.relative(root, file).replaceAll(path.sep, "/");
}
const evidence = { collection, createdAt: new Date().toISOString(), authored: members.length, installed: installed.length, ...(overview ? { overview } : {}), missing: members.filter((asset) => !installed.some((entry) => entry.id === asset.id)).map((asset) => asset.id), cohorts, entries: installed.map(({ file, ...entry }) => ({ ...entry, output: path.relative(root, file).replaceAll(path.sep, "/"), technicalReview: { pass: null }, diversityReview: { pass: null, cohortEvidence: cohorts.find((cohort) => cohort.subtype === entry.subtype).unlabeled, observed: { medium: "", viewpoint: "", scale: "", placement: "", lighting: "", setting: "", narrative: "" } } })) };
writeFileSync(path.join(directory, arg("--subtype") ? `${arg("--subtype")}-inspection-worklist.json` : "inspection-worklist.json"), JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({ collection, authored: members.length, installed: installed.length, cohorts: cohorts.length, directory }));
