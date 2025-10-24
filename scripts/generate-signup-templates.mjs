#!/usr/bin/env node
// ESM script to generate signup template images and manifest files
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
const provider = (getArg("--provider") || "openai").toString(); // openai | google
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

let openaiClient = null;
if (provider === "openai") {
  const apiKey = isNana
    ? process.env.NANA_OPENAI_API_KEY || process.env.OPENAI_API_KEY
    : process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      isNana
        ? "NANA_OPENAI_API_KEY or OPENAI_API_KEY is not set"
        : "OPENAI_API_KEY is not set"
    );
    process.exit(1);
  }
  openaiClient = new OpenAI({ apiKey });
}

/** @param {string} s */
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Create a consistent prompt per category and name.
 * Premium items are more detailed with cinematic lighting.
 */
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
  if (provider === "google") {
    const aiplatform = await import("@google-cloud/aiplatform");
    const { PredictionServiceClient } = aiplatform.v1;
    const { helpers } = aiplatform;

    const credsB64 = isNana
      ? process.env.NANA_GOOGLE_APPLICATION_CREDENTIALS_BASE64 || process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
      : process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    const credsJson = isNana
      ? process.env.NANA_GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      : process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    let credentials = null;
    if (credsB64) {
      const decoded = Buffer.from(credsB64, "base64").toString("utf8");
      credentials = JSON.parse(decoded);
    } else if (credsJson) {
      credentials = JSON.parse(credsJson);
    }
    const project = isNana
      ? process.env.NANA_GOOGLE_VERTEX_PROJECT || process.env.GOOGLE_VERTEX_PROJECT
      : process.env.GOOGLE_VERTEX_PROJECT;
    const location = isNana
      ? process.env.NANA_GOOGLE_VERTEX_LOCATION || process.env.GOOGLE_VERTEX_LOCATION || "us-central1"
      : process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
    if (!project) {
      throw new Error("GOOGLE_VERTEX_PROJECT (or NANA_GOOGLE_VERTEX_PROJECT) is required for provider=google");
    }
    if (credentials?.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }
    const clientOptions = { apiEndpoint: `${location}-aiplatform.googleapis.com` };
    if (credentials) {
      clientOptions.credentials = {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      };
      if (credentials.project_id) clientOptions.projectId = credentials.project_id;
    }
    const predictionClient = new PredictionServiceClient(clientOptions);
    const modelName = process.env.GOOGLE_VERTEX_IMAGE_MODEL || "imagen-4.0-generate-001";
    const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${modelName}`;

    const parameters = helpers.toValue({
      sampleCount: 1,
      aspectRatio: "1:1",
      // safetyFilterLevel: "block_few", // optional
      // personGeneration: "allow_adult", // optional
    });
    const instances = [helpers.toValue({ prompt })];

    const [response] = await predictionClient.predict({
      endpoint,
      instances,
      parameters,
    });

    const pred = (response.predictions || [])[0];
    if (!pred) throw new Error("No predictions from Vertex");
    // Try to walk common shapes
    let b64 = null;
    try {
      b64 = pred.structValue.fields.bytesBase64Encoded.stringValue;
    } catch {}
    if (!b64 && pred.structValue?.fields?.image?.structValue?.fields?.base64?.stringValue) {
      b64 = pred.structValue.fields.image.structValue.fields.base64.stringValue;
    }
    if (!b64) throw new Error("No image data returned from Google Vertex AI");
    return Buffer.from(b64, "base64");
  }

  // Default: OpenAI
  const res = await openaiClient.images.generate({
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
        console.log("Generating:", provider, isNana ? "[nana]" : "[default]", "-", category, "-", item.name);
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
  tsLines.push("// Auto-generated by scripts/generate-signup-templates.mjs");
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


