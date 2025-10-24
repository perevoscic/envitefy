#!/usr/bin/env node
// Generate signup template images using OpenAI only (separate from Google/Nana)
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const projectRoot = path.resolve(process.cwd());
const rootDir = path.join(projectRoot, "scripts");
const publicDir = path.join(projectRoot, "public");

function getArg(name, fallback = null) {
  const ix = process.argv.findIndex((a) => a === name || a.startsWith(name + "="));
  if (ix === -1) return fallback;
  const val = process.argv[ix].split("=")[1];
  return val ?? fallback;
}

const profile = (getArg("--profile") || getArg("-p") || "default").toString();
const isNana = profile === "nana";

const outputBaseDir = isNana
  ? path.join(publicDir, "nana", "templates", "signup")
  : path.join(publicDir, "templates", "signup");
const catalogPath = path.join(rootDir, "signup-image-catalog.json");
const manifestJsonPath = isNana
  ? path.join(publicDir, "nana", "templates", "signup", "manifest.json")
  : path.join(publicDir, "templates", "signup", "manifest.json");
const manifestTsPath = isNana
  ? path.join(projectRoot, "src", "assets", "signup-templates.nana.ts")
  : path.join(projectRoot, "src", "assets", "signup-templates.ts");

const apiKey = isNana
  ? process.env.NANA_OPENAI_API_KEY || process.env.OPENAI_API_KEY
  : process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(isNana ? "NANA_OPENAI_API_KEY or OPENAI_API_KEY is not set" : "OPENAI_API_KEY is not set");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildPrompt(category, name, tier) {
  const baseStyle =
    "Lifestyle photography, candid wide shot from a moderate distance. Natural sunlight, side perspective, gentle depth of field, cinematic warm tone, authentic candid atmosphere. High-quality, clean readable scene, 1:1 composition.";
  const seasonAdds = {
    "Fall & Seasonal": "Warm autumn palette, oranges and ambers, cozy glow.",
    "Winter & Holidays": "Crisp winter palette, soft whites and deep greens, gentle sparkle.",
    "Spring": "Fresh spring palette, soft pastels, lively and airy.",
    "Summer": "Vibrant summer palette, bright light, playful energy.",
    "School & Education": "Friendly scholastic vibe, simple props, approachable.",
    "Church & Community": "Warm, welcoming community tone, respectful and uplifting.",
    "Sports & Recreation": "Dynamic energy, sense of motion, athletic context.",
    "Fundraising, Food, & Events": "Inviting, community-oriented, food/event styling.",
    "Family & Personal": "Cozy, personal, celebratory feel.",
    "Business & Professional": "Clean, modern, professional tone.",
    "Other / Special Interest": "Neutral modern styling tailored to the topic.",
  };
  const premiumPlus = " Cinematic lighting, rich textures, nuanced detail.";
  return `${name} — ${seasonAdds[category] || ""} ${baseStyle}${
    tier === "premium" ? premiumPlus : ""
  }`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateImage(prompt, size = "1024x1024") {
  const res = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size,
    quality: "high",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned");
  return Buffer.from(b64, "base64");
}

async function run() {
  const raw = await fs.readFile(catalogPath, "utf8");
  /** @type {Record<string, Array<{name: string; tier: 'free'|'premium'}>>} */
  const catalog = JSON.parse(raw);

  await ensureDir(outputBaseDir);

  /** @type {Record<string, Array<{ name: string; tier: 'free'|'premium'; path: string }>>} */
  const manifest = {};

  for (const [category, items] of Object.entries(catalog)) {
    const categorySlug = slugify(category);
    const categoryDir = path.join(outputBaseDir, categorySlug);
    await ensureDir(categoryDir);

    for (const item of items) {
      const nameSlug = slugify(item.name);
      const filename = `${nameSlug}.png`;
      const filePath = path.join(categoryDir, filename);
      const publicPath = isNana
        ? `/nana/templates/signup/${categorySlug}/${filename}`
        : `/templates/signup/${categorySlug}/${filename}`;

      if (!(await fileExists(filePath))) {
        const prompt = buildPrompt(category, item.name, item.tier);
        console.log("Generating: openai", isNana ? "[nana]" : "[default]", "-", category, "-", item.name);
        const buf = await generateImage(prompt);
        await fs.writeFile(filePath, buf);
      } else {
        console.log("Exists, skipping:", category, "-", item.name);
      }

      if (!manifest[category]) manifest[category] = [];
      manifest[category].push({ name: item.name, tier: item.tier, path: publicPath });
    }
  }

  await ensureDir(path.dirname(manifestJsonPath));
  await fs.writeFile(manifestJsonPath, JSON.stringify(manifest, null, 2));

  const tsLines = [];
  tsLines.push("// Auto-generated by scripts/generate-signup-templates-openai.mjs");
  tsLines.push("export type SignupTemplateItem = { name: string; tier: 'free'|'premium'; path: string };");
  tsLines.push("export type SignupTemplateManifest = Record<string, SignupTemplateItem[]>;");
  tsLines.push("export const SIGNUP_TEMPLATES: SignupTemplateManifest = ");
  tsLines.push(JSON.stringify(manifest, null, 2));
  tsLines.push(";");

  await ensureDir(path.dirname(manifestTsPath));
  await fs.writeFile(manifestTsPath, tsLines.join("\n"));

  console.log("\nWrote manifest: ", manifestJsonPath);
  console.log("Wrote TS export: ", manifestTsPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


