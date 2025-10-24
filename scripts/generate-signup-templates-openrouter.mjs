#!/usr/bin/env node
// Generate signup template images using OpenRouter (OpenAI: GPT-5 Image)
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

const openrouterApiKey = isNana
  ? process.env.NANA_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
  : process.env.OPENROUTER_API_KEY;
if (!openrouterApiKey) {
  console.error(isNana ? "NANA_OPENROUTER_API_KEY or OPENROUTER_API_KEY is not set" : "OPENROUTER_API_KEY is not set");
  process.exit(1);
}

const appReferer = process.env.OPENROUTER_HTTP_REFERER || process.env.PUBLIC_BASE_URL || "https://snapmydate.com";
const appTitle = process.env.OPENROUTER_X_TITLE || "Snap My Date";
const model = (getArg("--model") || "openai/gpt-5-image-mini").toString();

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
      "Fall & Seasonal":
        "Warm autumn palette with oranges/ambers; orange trees, pumpkins, hay bales, string lights.",
      "Winter & Holidays":
        "Crisp winter palette (soft whites, deep greens); subtle sparkle, festive market or snowy ambience.",
      "Spring":
        "Fresh pastels; flowering trees and garden stalls; airy sunlight and light breezes.",
      "Summer":
        "Vibrant summer palette; bright sun flares; lemonade/ice cream stands; playful fair energy.",
      "School & Education":
        "Outdoor school fair/campus vibe; PTA/books/crafts tables; friendly scholastic tone.",
      "Church & Community":
        "Community fair/potluck tables; donation/volunteer booth; warm, welcoming mood.",
      "Sports & Recreation":
        "Parks/fields, light action cues, jerseys/cones/bleachers; energetic yet natural.",
      "Fundraising, Food, & Events":
        "Fundraiser ambiance with ticket/donation tables; food booths; inviting communal feel.",
      "Family & Personal":
        "Personal celebration in a park/picnic setting; balloons/party decor; cozy, unposed moments.",
      "Business & Professional":
        "Outdoor team event/company picnic; branded tent/badges; clean, modern professional tone.",
      "Other / Special Interest":
        "Neutral modern styling tailored to subject booths; balanced palette and uncluttered layout."
    };
  
    const premiumPlus =
      " Cinematic lighting, rich color grading, nuanced detail, professional framing.";
  
    // Compose final prompt
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

async function fetchImageBufferFromOpenRouter(prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openrouterApiKey}`,
      "HTTP-Referer": appReferer,
      "X-Title": appTitle,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: `Generate a single square (1024x1024) PNG image in a lifestyle photography style (no text). ${prompt}`,
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  const choice = data?.choices?.[0];
  const msg = choice?.message || {};

  // Try various shapes for image output
  // 1) Non-standard: message.images[0].image_url.url
  let imageUrl = msg?.images?.[0]?.image_url?.url || null;
  let b64 = msg?.images?.[0]?.b64_json || null;

  // 2) content array blocks with output_image, image_url, or inline base64
  if (!imageUrl && Array.isArray(msg?.content)) {
    for (const block of msg.content) {
      if (block?.type === "output_image" && block?.image_url?.url) {
        imageUrl = block.image_url.url;
        break;
      }
      if (block?.type === "image_url" && block?.image_url?.url) {
        imageUrl = block.image_url.url;
        break;
      }
      if (block?.type === "image" && (block?.b64_json || block?.image_base64)) {
        b64 = block.b64_json || block.image_base64;
        break;
      }
      if (block?.type === "text" && typeof block?.text === "string") {
        // Parse first URL from text (supports markdown ![alt](url))
        const mdMatch = block.text.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/);
        const urlMatch = block.text.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)/i);
        if (mdMatch?.[1]) { imageUrl = mdMatch[1]; break; }
        if (urlMatch?.[0]) { imageUrl = urlMatch[0]; break; }
      }
    }
  }

  // 3) plain string content
  if (!imageUrl && typeof msg?.content === "string") {
    const mdMatch = msg.content.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/);
    const urlMatch = msg.content.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)/i);
    if (mdMatch?.[1]) imageUrl = mdMatch[1];
    else if (urlMatch?.[0]) imageUrl = urlMatch[0];
  }

  if (b64) {
    return Buffer.from(b64, "base64");
  }

  if (!imageUrl) {
    // As a last resort, check for data URLs
    const dataUrl = typeof msg?.content === "string" ? msg.content.match(/data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/i) : null;
    if (dataUrl?.[2]) {
      return Buffer.from(dataUrl[2], "base64");
    }
    throw new Error("No image returned by OpenRouter response");
  }

  // If the URL is hosted on openrouter.ai, include auth headers to fetch
  const needsAuth = /(^https?:\/\/)?(www\.)?openrouter\.ai\//i.test(imageUrl);
  const imgHeaders = needsAuth
    ? { Authorization: `Bearer ${openrouterApiKey}`, "HTTP-Referer": appReferer, "X-Title": appTitle }
    : undefined;
  const imgRes = await fetch(imageUrl, { headers: imgHeaders });
  if (!imgRes.ok) {
    const t = await imgRes.text().catch(() => "");
    throw new Error(`Failed to download image: ${imgRes.status} ${t}`);
  }
  const arrayBuf = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuf);
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
        console.log("Generating: openrouter", isNana ? "[nana]" : "[default]", "-", category, "-", item.name);
        let buf;
        try {
          buf = await fetchImageBufferFromOpenRouter(prompt);
        } catch (e) {
          const msg = e?.message || String(e);
          console.warn("OpenRouter failed:", msg);
          // Fallback to OpenAI if available
          const fallbackKey = isNana
            ? (process.env.NANA_OPENAI_API_KEY || process.env.OPENAI_API_KEY)
            : process.env.OPENAI_API_KEY;
          if (fallbackKey) {
            console.log("Falling back to OpenAI image generation...");
            const client = new OpenAI({ apiKey: fallbackKey });
            const res = await client.images.generate({
              model: "gpt-image-1",
              prompt: `Generate a single square (1024x1024) PNG image in a lifestyle photography style (no text). ${prompt}`,
              size: "1024x1024",
              quality: "high",
            });
            const b64 = res.data?.[0]?.b64_json;
            if (!b64) throw new Error("OpenAI fallback: no image data returned");
            buf = Buffer.from(b64, "base64");
          } else {
            throw e;
          }
        }
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
  tsLines.push("// Auto-generated by scripts/generate-signup-templates-openrouter.mjs");
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


