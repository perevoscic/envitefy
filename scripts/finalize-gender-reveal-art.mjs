import fs from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";

const reportPath = "docs/design/gender-reveal-webp-verification-2026-09-07.json";
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const designs = JSON.parse(fs.readFileSync("src/data/gender-reveal-templates.json", "utf8"));
if (report.entries.length !== 60) throw new Error("Expected 60 verified replacements");
// Validate the whole replacement set before deleting any exact matched original.
for (const entry of report.entries) {
  const design = designs.find((item) => item.id === entry.id);
  if (!design || design.heroImage !== entry.webp || !entry.verified || entry.psnr < 30) throw new Error(entry.id);
  if (!entry.original.startsWith("/Users/rj/.codex/generated_images/01a07e17-1042-70f3-b63c-a0c8ebb1c59f/") || !/\.(png|jpe?g)$/.test(entry.original)) throw new Error("Unexpected original path");
  const file = `public${entry.webp}`;
  const bytes = fs.readFileSync(file);
  if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256) throw new Error(`Changed replacement: ${entry.id}`);
  const metadata = await sharp(file).metadata();
  if (metadata.format !== "webp" || metadata.width !== entry.width || metadata.height !== entry.height) throw new Error(entry.id);
  await sharp(file).raw().toBuffer();
}
for (const entry of report.entries) {
  if (fs.existsSync(entry.original)) fs.unlinkSync(entry.original);
  entry.originalRemoved = !fs.existsSync(entry.original);
}
report.originalsRemoved = report.entries.every((entry) => entry.originalRemoved);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ verifiedWebPs: report.entries.length, originalsRemoved: report.originalsRemoved }));
