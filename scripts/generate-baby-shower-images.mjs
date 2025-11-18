#!/usr/bin/env node
// ESM script to generate baby shower template preview images
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const projectRoot = path.resolve(process.cwd());
const publicDir = path.join(projectRoot, "public");
const outputDir = path.join(publicDir, "templates", "baby-showers");
const templateFile = path.join(projectRoot, "src", "components", "event-create", "BabyShowersCreateTemplate.tsx");

function getArg(name, fallback = null) {
  const ix = process.argv.findIndex((a) => a === name || a.startsWith(name + "="));
  if (ix === -1) return fallback;
  const val = process.argv[ix].split("=")[1];
  return val ?? fallback;
}

const provider = (getArg("--provider") || "openai").toString(); // openai | google
const forceRegenerate = getArg("--force") !== null || getArg("--regenerate") !== null;
const templateFilter = getArg("--template");

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
      const isRateLimit = error.message?.includes("rate limit") || 
                         error.status === 429 ||
                         error.code === 8; // Google gRPC rate limit
      
      if (isRateLimit && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`  Rate limited, retrying in ${waitTime}ms... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
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
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS_JSON is required for provider=google");
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
  const model = useDallE2 ? "dall-e-2" : (process.env.OPENAI_IMAGE_MODEL || "dall-e-3");
  
  try {
    // dall-e-3 supports: 1024x1024, 1792x1024 (landscape), 1024x1792 (portrait)
    // Use landscape for horizontal invitations
    const imageSize = model === "dall-e-3" ? "1792x1024" : size;
    
    const res = await openaiClient.images.generate({
      model,
      prompt,
      size: imageSize,
      quality: model === "dall-e-3" ? "hd" : undefined, // Use HD quality for better results
      n: 1,
      response_format: model === "dall-e-2" ? "b64_json" : "url", // dall-e-2 supports b64_json
    });
    
    if (!res.data || res.data.length === 0) {
      throw new Error("No image data returned from OpenAI");
    }
    
    // dall-e-3 returns URL, dall-e-2 can return b64_json
    const imageData = res.data[0];
    if (imageData.b64_json) {
      return Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      // Fetch the image from URL
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
    // If dall-e-3 fails and we haven't tried dall-e-2, try it
    if (model === "dall-e-3" && !useDallE2 && !process.env.OPENAI_IMAGE_MODEL) {
      console.log(`  Falling back to dall-e-2...`);
      return generateImageOpenAI(prompt, size, true); // Retry with dall-e-2
    }
    throw error;
  }
}

/**
 * Extract BABY_SHOWER_TEMPLATES array from TypeScript file
 * Uses regex to find template objects and extract id, description, and imagePrompt fields
 */
async function extractTemplates() {
  const content = await fs.readFile(templateFile, "utf8");
  
  const templates = [];
  
  // Use regex to find all template objects with id, description, and imagePrompt
  // Pattern: id: "..." ... description: "..." ... imagePrompt: "..."
  const templatePattern = /id:\s*["']([^"']+)["'][\s\S]*?description:\s*["']([^"']+)["'][\s\S]*?imagePrompt:\s*["']([^"']+)["']/g;
  
  let match;
  while ((match = templatePattern.exec(content)) !== null) {
    const id = match[1];
    const description = match[2];
    const imagePrompt = match[3];
    
    // Enhance the prompt with description and make it horizontal/realistic
    const enhancedPrompt = buildEnhancedPrompt(description, imagePrompt);
    
    templates.push({ id, imagePrompt: enhancedPrompt, originalPrompt: imagePrompt });
  }
  
  if (templates.length === 0) {
    throw new Error("No templates found in BABY_SHOWER_TEMPLATES. Check the file format.");
  }
  
  return templates;
}

/**
 * Build enhanced prompt that combines description with imagePrompt
 * Makes it horizontal, realistic, and more detailed
 */
function buildEnhancedPrompt(description, imagePrompt) {
  // Combine the invite style description with the image prompt
  // Add instructions for horizontal orientation and realistic style
  return `${description} ${imagePrompt} Horizontal landscape orientation, realistic photographic style, high quality, professional baby shower invitation design, 16:9 aspect ratio, soft natural lighting, clean composition.`;
}

/**
 * Save image buffer to file
 * Note: Generated images are typically PNG format, but we save with .webp extension
 * to match the expected file paths. Actual conversion to WebP can be done separately
 * if needed using tools like sharp or imagemagick.
 */
async function saveImage(buffer, filePath) {
  await fs.writeFile(filePath, buffer);
}

async function run() {
  console.log(`Generating baby shower template images using ${provider}...\n`);
  
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
      console.error("Error: GOOGLE_APPLICATION_CREDENTIALS_BASE64 or GOOGLE_APPLICATION_CREDENTIALS_JSON is required for provider=google");
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
  
  // Check if template file exists
  if (!(await fileExists(templateFile))) {
    console.error(`Error: Template file not found: ${templateFile}`);
    process.exit(1);
  }
  
  // Extract templates from TypeScript file
  let templates;
  try {
    templates = await extractTemplates();
    if (templates.length === 0) {
      console.error("Error: No templates found in BABY_SHOWER_TEMPLATES array");
      process.exit(1);
    }
    console.log(`Found ${templates.length} templates\n`);
  } catch (error) {
    console.error("Error extracting templates:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
  
  // Filter by template ID if specified
  if (templateFilter) {
    const beforeCount = templates.length;
    templates = templates.filter(t => t.id === templateFilter);
    if (templates.length === 0) {
      console.error(`Error: Template "${templateFilter}" not found`);
      console.error(`Available templates: ${beforeCount > 0 ? "..." : "none found"}`);
      process.exit(1);
    }
    console.log(`Filtering to template: ${templateFilter}\n`);
  }
  
  await ensureDir(outputDir);
  
  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];
  
  for (const template of templates) {
    const filename = `${template.id}.webp`;
    const filePath = path.join(outputDir, filename);
    
    if (!forceRegenerate && await fileExists(filePath)) {
      console.log(`✓ Exists, skipping: ${template.id}`);
      skipped++;
      continue;
    }
    
    try {
      console.log(`Generating: ${template.id}...`);
      const buffer = await generateImage(template.imagePrompt);
      await saveImage(buffer, filePath);
      console.log(`✓ Generated: ${filename}`);
      generated++;
    } catch (error) {
      const errorMsg = error.message || String(error);
      console.error(`✗ Error generating ${template.id}: ${errorMsg}`);
      errorDetails.push({ id: template.id, error: errorMsg });
      errors++;
      
      // If it's a critical error (not rate limit), show more details
      if (!errorMsg.includes("rate limit") && error.stack) {
        console.error(`  Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
    }
  }
  
  console.log(`\nSummary:`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  
  if (errors > 0) {
    console.log(`\nFailed templates:`);
    errorDetails.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`);
    });
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

