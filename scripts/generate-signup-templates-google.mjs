#!/usr/bin/env node
// Generate signup template images using Google Vertex AI (Imagen)
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import aiplatform from "@google-cloud/aiplatform";

const { PredictionServiceClient } = aiplatform.v1;
const { helpers } = aiplatform;

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

// Optional CLI overrides to avoid env coupling (still Google-only, no mixing)
const projectOverride = getArg("--project");
const locationOverride = getArg("--location");
const modelOverride = getArg("--model");
const credsB64Arg = getArg("--creds_base64");
const credsJsonArg = getArg("--creds_json");

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
    Spring: "Fresh spring palette, soft pastels, lively and airy.",
    Summer: "Vibrant summer palette, bright light, playful energy.",
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

function getCreds() {
  const credsB64 =
    credsB64Arg ||
    (isNana
      ? process.env.NANA_GOOGLE_APPLICATION_CREDENTIALS_BASE64 || process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
      : process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64);
  const credsJson =
    credsJsonArg ||
    (isNana
      ? process.env.NANA_GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      : process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  if (credsB64) {
    const decoded = Buffer.from(credsB64, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed?.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed;
  }
  if (credsJson) {
    const parsed = JSON.parse(credsJson);
    if (parsed?.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed;
  }
  return null;
}

async function generateImage(prompt) {
  const project =
    projectOverride ||
    (isNana
      ? process.env.NANA_GOOGLE_VERTEX_PROJECT || process.env.GOOGLE_VERTEX_PROJECT
      : process.env.GOOGLE_VERTEX_PROJECT);
  const location =
    locationOverride ||
    (isNana
      ? process.env.NANA_GOOGLE_VERTEX_LOCATION || process.env.GOOGLE_VERTEX_LOCATION || "us-central1"
      : process.env.GOOGLE_VERTEX_LOCATION || "us-central1");
  if (!project) throw new Error("GOOGLE_VERTEX_PROJECT (or NANA_GOOGLE_VERTEX_PROJECT) is required");

  const credentials = getCreds();

  const clientOptions = { apiEndpoint: `${location}-aiplatform.googleapis.com` };
  if (credentials) {
    clientOptions.credentials = {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    };
    if (credentials.project_id) clientOptions.projectId = credentials.project_id;
  }
  const predictionClient = new PredictionServiceClient(clientOptions);

  const modelName = modelOverride || process.env.GOOGLE_VERTEX_IMAGE_MODEL || "imagen-3.0-generate-002"; // supports 4.0 as well
  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${modelName}`;

  const parameters = helpers.toValue({ sampleCount: 1, aspectRatio: "1:1" });
  const instances = [helpers.toValue({ prompt })];
  const [response] = await predictionClient.predict({ endpoint, instances, parameters });
  const pred = (response.predictions || [])[0];
  if (!pred) throw new Error("No predictions from Vertex");
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
        console.log("Generating: google", isNana ? "[nana]" : "[default]", "-", category, "-", item.name);
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
  tsLines.push("// Auto-generated by scripts/generate-signup-templates-google.mjs");
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


