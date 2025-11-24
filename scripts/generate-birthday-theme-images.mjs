#!/usr/bin/env node
// Generate multiple images for each birthday theme (3 per theme by default)
// Inspired by scripts/generate-birthdays-images.mjs
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const projectRoot = path.resolve(process.cwd());
const publicDir = path.join(projectRoot, "public");
const outputDir = path.join(publicDir, "templates", "birthdays", "theme-gallery");
const birthdayThemesSourcePath = path.join(
  projectRoot,
  "src",
  "app",
  "event",
  "birthdays",
  "customize",
  "page.tsx"
);

function getArg(name, fallback = null) {
  const ix = process.argv.findIndex((a) => a === name || a.startsWith(name + "="));
  if (ix === -1) return fallback;
  const val = process.argv[ix].split("=")[1];
  return val ?? fallback;
}

const provider = (getArg("--provider") || "openai").toString(); // openai | google
const forceRegenerate = getArg("--force") !== null || getArg("--regenerate") !== null;
const themeFilter = getArg("--theme");
const sourceFilter = (getArg("--source") || "all").toString(); // professional | design | all
const imageCount = Math.max(1, parseInt(getArg("--count") || "3", 10) || 3);

let openaiClient = null;
if (provider === "openai") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set");
    process.exit(1);
  }
  openaiClient = new OpenAI({ apiKey });
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

function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/--+/g, "-");
}

function normalize(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function extractArrayLiteral(content, token) {
  const tokenIndex = content.indexOf(token);
  if (tokenIndex === -1) return null;
  const start = content.indexOf("[", tokenIndex);
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (ch === "[") depth++;
    else if (ch === "]") depth--;

    if (depth === 0) {
      return content.slice(start, i + 1);
    }
  }
  return null;
}

function parseArrayLiteral(literal, label) {
  if (!literal) return [];
  try {
    // Use Function instead of JSON.parse to allow trailing commas and single quotes
    const fn = new Function(`return ${literal};`);
    const value = fn();
    if (!Array.isArray(value)) {
      throw new Error(`Parsed ${label} is not an array`);
    }
    return value;
  } catch (error) {
    throw new Error(`Failed to parse ${label}: ${error.message}`);
  }
}

/**
 * Extract both PROFESSIONAL_THEMES and DESIGN_THEMES from the customize page.
 */
async function extractBirthdayThemes() {
  const fileContent = await fs.readFile(birthdayThemesSourcePath, "utf8");

  const professionalLiteral = extractArrayLiteral(fileContent, "const PROFESSIONAL_THEMES");
  const designLiteral = extractArrayLiteral(fileContent, "const DESIGN_THEMES");

  const professionalThemesRaw = parseArrayLiteral(professionalLiteral, "PROFESSIONAL_THEMES");
  const designThemesRaw = parseArrayLiteral(designLiteral, "DESIGN_THEMES");

  const themes = [];

  for (const theme of professionalThemesRaw) {
    const name = theme.themeName || theme.name || theme.id;
    const palette =
      Array.isArray(theme.recommendedColorPalette) && theme.recommendedColorPalette.length
        ? `Palette hints: ${theme.recommendedColorPalette.join(", ")}.`
        : null;

    themes.push({
      id: theme.id || slugify(name),
      slug: slugify(theme.id || name),
      name: name,
      description: normalize(theme.description),
      headerIllustrationPrompt: normalize(theme.headerIllustrationPrompt),
      cornerAccentPrompt: normalize(theme.cornerAccentPrompt),
      backgroundPrompt: normalize(theme.backgroundPrompt),
      primaryObjects: null,
      graphics: null,
      colors: palette,
      source: "professional",
    });
  }

  for (const theme of designThemesRaw) {
    const name = theme.name || theme.id;
    const descriptionParts = [theme.category, theme.aesthetic].filter(Boolean).map(normalize);
    const colors = theme.colors ? `Colors: ${normalize(theme.colors)}` : null;

    themes.push({
      id: theme.id || slugify(name),
      slug: slugify(theme.id || name),
      name,
      description: descriptionParts.join(". "),
      headerIllustrationPrompt: normalize(theme.graphics),
      cornerAccentPrompt: null,
      backgroundPrompt: null,
      primaryObjects: normalize(theme.primaryObjects),
      graphics: normalize(theme.graphics),
      colors,
      source: "design",
    });
  }

  if (themes.length === 0) {
    throw new Error("No themes parsed from customize page");
  }

  return themes;
}

function themeMatchesFilter(theme, filterList) {
  const lcName = theme.name.toLowerCase();
  const lcSlug = theme.slug.toLowerCase();
  const lcId = (theme.id || "").toLowerCase();
  return filterList.some(
    (filter) =>
      lcName.includes(filter) || lcSlug === filter || lcId === filter || lcName === filter
  );
}

function buildVariationHint(index) {
  const hints = [
    "Vary the camera angle and object placement while keeping the theme intact.",
    "Swap which props lead the scene and adjust lighting warmth slightly.",
    "Use a different mix of the theme objects and rearrange them around the frame.",
  ];
  return hints[index % hints.length];
}

function buildThemePrompt(theme, variationIndex) {
  const parts = [
    `${theme.name} birthday invitation background.`,
    theme.description,
    theme.colors,
    theme.headerIllustrationPrompt && `Header idea: ${theme.headerIllustrationPrompt}.`,
    theme.cornerAccentPrompt && `Edge or corner accents: ${theme.cornerAccentPrompt}.`,
    theme.backgroundPrompt && `Background texture: ${theme.backgroundPrompt}.`,
    theme.graphics && `Graphic motifs: ${theme.graphics}.`,
    theme.primaryObjects && `Primary objects to feature: ${theme.primaryObjects}.`,
    "Create a 16:9 landscape scene with at least three distinct objects, characters, or animals that clearly express the theme.",
    "Arrange props near the edges/foreground so the center stays calm for future text overlay.",
    "No words or logos in the artwork. High resolution, natural lighting, polished but playful look.",
    `Variation ${variationIndex + 1}: ${buildVariationHint(variationIndex)}`,
  ];

  return parts.filter(Boolean).join(" ");
}

/**
 * Generate image with retry logic for rate limits
 */
async function generateImage(prompt, size = "1792x1024", retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (provider === "google") {
        return await generateImageGoogle(prompt);
      } else {
        return await generateImageOpenAI(prompt, size, false);
      }
    } catch (error) {
      const isRateLimit =
        error.message?.includes("rate limit") ||
        error.status === 429 ||
        error.code === 8; // Google gRPC rate limit

      if (isRateLimit && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`  Rate limited, retrying in ${waitTime}ms... (attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
}

async function generateImageGoogle(prompt) {
  const aiplatform = await import("@google-cloud/aiplatform");
  const { PredictionServiceClient } = aiplatform.v1;
  const { helpers } = aiplatform;

  const credsB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  let credentials = null;

  if (credsB64) {
    try {
      const decoded = Buffer.from(credsB64, "base64").toString("utf8");
      credentials = JSON.parse(decoded);
    } catch (error) {
      throw new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_BASE64: ${error.message}`);
    }
  } else if (credsJson) {
    try {
      credentials = JSON.parse(credsJson);
    } catch (error) {
      throw new Error(`Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: ${error.message}`);
    }
  } else {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS_JSON is required for provider=google"
    );
  }

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";

  if (!project) {
    throw new Error("GOOGLE_VERTEX_PROJECT is required for provider=google");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Google credentials must include client_email and private_key");
  }

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  const clientOptions = { apiEndpoint: `${location}-aiplatform.googleapis.com` };
  clientOptions.credentials = {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  };
  if (credentials.project_id) {
    clientOptions.projectId = credentials.project_id;
  }

  const predictionClient = new PredictionServiceClient(clientOptions);
  const modelName = process.env.GOOGLE_VERTEX_IMAGE_MODEL || "imagen-4.0-generate-001";
  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${modelName}`;

  const parameters = helpers.toValue({
    sampleCount: 1,
    aspectRatio: "16:9", // Horizontal landscape for invitations
  });
  const instances = [helpers.toValue({ prompt })];

  const [response] = await predictionClient.predict({
    endpoint,
    instances,
    parameters,
  });

  const pred = (response.predictions || [])[0];
  if (!pred) {
    throw new Error("No predictions returned from Google Vertex AI");
  }

  let b64 = null;
  try {
    b64 = pred.structValue.fields.bytesBase64Encoded.stringValue;
  } catch {}

  if (!b64 && pred.structValue?.fields?.image?.structValue?.fields?.base64?.stringValue) {
    b64 = pred.structValue.fields.image.structValue.fields.base64.stringValue;
  }

  if (!b64) {
    throw new Error("No image data returned from Google Vertex AI. Check the response structure.");
  }

  return Buffer.from(b64, "base64");
}

async function generateImageOpenAI(prompt, size, useDallE2 = false) {
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized. Check OPENAI_API_KEY environment variable.");
  }

  // Use dall-e-3 for better availability, fallback to dall-e-2 if needed
  const model = useDallE2 ? "dall-e-2" : process.env.OPENAI_IMAGE_MODEL || "dall-e-3";

  try {
    // dall-e-3 supports: 1024x1024, 1792x1024 (landscape), 1024x1792 (portrait)
    const imageSize = model === "dall-e-3" ? "1792x1024" : size;

    const res = await openaiClient.images.generate({
      model,
      prompt,
      size: imageSize,
      quality: model === "dall-e-3" ? "hd" : undefined,
      n: 1,
      response_format: model === "dall-e-2" ? "b64_json" : "url",
    });

    if (!res.data || res.data.length === 0) {
      throw new Error("No image data returned from OpenAI");
    }

    const imageData = res.data[0];
    if (imageData.b64_json) {
      return Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      const imageResponse = await fetch(imageData.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      throw new Error("No image data (b64_json or url) in OpenAI response");
    }
  } catch (error) {
    if (model === "dall-e-3" && !useDallE2 && !process.env.OPENAI_IMAGE_MODEL) {
      console.log(`  Falling back to dall-e-2...`);
      return generateImageOpenAI(prompt, size, true); // Retry with dall-e-2
    }
    throw error;
  }
}

async function saveImage(buffer, filePath) {
  await fs.writeFile(filePath, buffer);
}

async function run() {
  console.log(`Generating birthday theme images using ${provider}...\n`);

  // Validate provider credentials
  if (provider === "google") {
    const project = process.env.GOOGLE_VERTEX_PROJECT;
    const credsB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!project) {
      console.error("Error: GOOGLE_VERTEX_PROJECT is required for provider=google");
      console.error("Set it in your .env file or environment variables.");
      process.exit(1);
    }

    if (!credsB64 && !credsJson) {
      console.error(
        "Error: GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS_JSON is required for provider=google"
      );
      console.error("Set one of these in your .env file or environment variables.");
      process.exit(1);
    }
  } else if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY is required for provider=openai");
      console.error("Set it in your .env file or environment variables.");
      process.exit(1);
    }
  } else {
    console.error(`Error: Unknown provider "${provider}". Use --provider=openai or --provider=google`);
    process.exit(1);
  }

  // Check source file exists
  if (!(await fileExists(birthdayThemesSourcePath))) {
    console.error(`Error: Birthday themes source not found: ${birthdayThemesSourcePath}`);
    process.exit(1);
  }

  let themes;
  try {
    themes = await extractBirthdayThemes();
  } catch (error) {
    console.error("Error extracting themes:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }

  if (sourceFilter !== "all") {
    themes = themes.filter((t) => t.source === sourceFilter);
    if (themes.length === 0) {
      console.error(`Error: No themes matched --source=${sourceFilter}`);
      process.exit(1);
    }
  }

  if (themeFilter) {
    const filters = themeFilter
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const before = themes.length;
    themes = themes.filter((t) => themeMatchesFilter(t, filters));
    if (themes.length === 0) {
      console.error(
        `Error: No themes match filter "${themeFilter}". Started with ${before} themes.`
      );
      process.exit(1);
    }
    console.log(`Filtering to ${themes.length} theme(s): ${filters.join(", ")}\n`);
  }

  await ensureDir(outputDir);

  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];

  for (const theme of themes) {
    console.log(`Theme: ${theme.name} (${theme.source})`);
    for (let i = 0; i < imageCount; i++) {
      const filename = `${theme.slug}-${i + 1}.webp`;
      const filePath = path.join(outputDir, filename);

      if (!forceRegenerate && (await fileExists(filePath))) {
        console.log(`  ✓ Exists, skipping image ${i + 1}: ${filename}`);
        skipped++;
        continue;
      }

      try {
        console.log(`  Generating image ${i + 1}/${imageCount}...`);
        const prompt = buildThemePrompt(theme, i);
        const buffer = await generateImage(prompt);
        await saveImage(buffer, filePath);
        console.log(`  ✓ Generated: ${filename}`);
        generated++;
      } catch (error) {
        const errorMsg = error.message || String(error);
        console.error(`  ✗ Error generating ${filename}: ${errorMsg}`);
        errorDetails.push({ id: theme.id, file: filename, error: errorMsg });
        errors++;

        if (!errorMsg.includes("rate limit") && error.stack) {
          console.error(`    Stack trace: ${error.stack.split("\n").slice(0, 3).join("\n")}`);
        }
      }
    }
    console.log("");
  }

  console.log(`Summary:`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Output dir: ${outputDir}`);

  if (errors > 0) {
    console.log(`\nFailed items:`);
    errorDetails.forEach(({ id, file, error }) => {
      console.log(`  - ${id} (${file}): ${error}`);
    });
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

