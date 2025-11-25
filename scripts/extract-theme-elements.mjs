#!/usr/bin/env node
// Extract individual elements from birthday theme images using OpenRouter vision API
// For each theme image, extracts 3 elements (e.g., balloon, cloud, ribbon) as separate PNGs with transparent backgrounds
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = path.resolve(process.cwd());
const themeGalleryDir = path.join(projectRoot, "public", "templates", "birthdays", "theme-gallery");

const openrouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openrouterApiKey) {
  console.error("OPENROUTER_API_KEY is not set");
  process.exit(1);
}

const appReferer = process.env.OPENROUTER_HTTP_REFERER || process.env.PUBLIC_BASE_URL || "https://envitefy.com";
const appTitle = process.env.OPENROUTER_X_TITLE || "Envitefy";
// Use model from env or default to a valid vision model
// If you have a default model set in OpenRouter (like "nano banana"), set OPENROUTER_MODEL in .env
// Common vision models: openai/gpt-4o, openai/gpt-4o-mini, google/gemini-2.0-flash-exp:free, anthropic/claude-3.5-sonnet
const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

function getArg(name, fallback = null) {
  const ix = process.argv.findIndex((a) => a === name || a.startsWith(name + "="));
  if (ix === -1) return fallback;
  const val = process.argv[ix].split("=")[1];
  return val ?? fallback;
}

const themeFilter = getArg("--theme");
const forceRegenerate = getArg("--force") !== null;

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

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Call OpenRouter vision API to identify elements in the image
 */
async function identifyElements(imageBuffer, themeName) {
  const base64 = imageBuffer.toString("base64");
  const mime = "image/webp"; // Assuming webp input

  const prompt = `Analyze this birthday theme image. It contains multiple separate decorative elements (like balloons, clouds, ribbons, stars, etc.) arranged on a light/cream background.

Your task:
1. Identify the 3 most prominent/distinct decorative elements in the image
2. For each element, calculate the EXACT bounding box in pixels: {x, y, width, height}
   - x, y = top-left corner coordinates (where the element visually starts)
   - width, height = full dimensions of the element including all parts
3. Name each element descriptively (e.g., "balloon-bouquet", "cloud-stars", "ribbon-curl")

CRITICAL REQUIREMENTS:
- Bounding boxes must tightly fit around each element - include all visible parts
- If elements overlap, use separate bounding boxes for each distinct element
- Measure carefully: x and y start from the leftmost/topmost visible pixel of the element
- width and height should encompass the entire element from edge to edge
- Be precise - inaccurate coordinates will cause extraction errors

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "elements": [
    {
      "name": "descriptive-name",
      "bbox": {"x": number, "y": number, "width": number, "height": number}
    },
    {
      "name": "descriptive-name",
      "bbox": {"x": number, "y": number, "width": number, "height": number}
    },
    {
      "name": "descriptive-name",
      "bbox": {"x": number, "y": number, "width": number, "height": number}
    }
  ]
}`;

  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${base64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        "HTTP-Referer": appReferer,
        "X-Title": appTitle,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const errorMsg = `OpenRouter HTTP ${res.status}: ${text}`;
      if (res.status === 400 && text.includes("not a valid model")) {
        console.error(`\n❌ Invalid model ID: ${model}`);
        console.error(`Please set OPENROUTER_MODEL in your .env file with a valid model ID.`);
        console.error(`Common vision models: openai/gpt-4o, openai/gpt-4o-mini, google/gemini-2.0-flash-exp:free`);
        console.error(`If you have a default model set in OpenRouter, check your OpenRouter dashboard for the exact model ID.\n`);
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.elements || !Array.isArray(parsed.elements) || parsed.elements.length === 0) {
      throw new Error("No elements found in response");
    }

    return parsed.elements.slice(0, 3); // Take first 3 elements
  } catch (error) {
    console.error(`Error identifying elements: ${error.message}`);
    throw error;
  }
}

/**
 * Extract element from image using bounding box and remove background
 */
async function extractElement(imageBuffer, element, imageWidth, imageHeight, outputPath) {
  const { bbox, name } = element;

  // Ensure bbox is within image bounds
  const x = Math.max(0, Math.min(bbox.x || 0, imageWidth));
  const y = Math.max(0, Math.min(bbox.y || 0, imageHeight));
  const width = Math.min(bbox.width || 100, imageWidth - x);
  const height = Math.min(bbox.height || 100, imageHeight - y);

  // Add padding around the element
  const padding = 30;
  const paddedX = Math.max(0, x - padding);
  const paddedY = Math.max(0, y - padding);
  const paddedWidth = Math.min(width + padding * 2, imageWidth - paddedX);
  const paddedHeight = Math.min(height + padding * 2, imageHeight - paddedY);

  // Extract the region
  const extracted = await sharp(imageBuffer)
    .extract({
      left: Math.floor(paddedX),
      top: Math.floor(paddedY),
      width: Math.floor(paddedWidth),
      height: Math.floor(paddedHeight),
    })
    .toBuffer();

  // Get image metadata
  const metadata = await sharp(extracted).metadata();
  const { width: extractWidth, height: extractHeight } = metadata;

  // Remove background using threshold-based approach
  // First, get raw pixel data with exact size
  const { data, info } = await sharp(extracted)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Calculate expected buffer size
  const expectedBytes = info.width * info.height * 4;
  
  // Create a properly sized buffer and copy the data
  const pixels = Buffer.allocUnsafe(expectedBytes);
  if (data.length >= expectedBytes) {
    data.copy(pixels, 0, 0, expectedBytes);
  } else {
    // If buffer is smaller, pad with zeros (shouldn't happen, but safety check)
    data.copy(pixels, 0, 0, data.length);
    pixels.fill(0, data.length);
  }

  // Sample background pixels from edges (more reliable than just corners)
  const edgeSamples = [];
  const sampleStep = Math.max(1, Math.floor(Math.min(info.width, info.height) / 20));
  
  // Sample top edge
  for (let x = 0; x < info.width; x += sampleStep) {
    const idx = (0 * info.width + x) * 4;
    if (idx + 2 < pixels.length) {
      edgeSamples.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
  }
  // Sample bottom edge
  for (let x = 0; x < info.width; x += sampleStep) {
    const idx = ((info.height - 1) * info.width + x) * 4;
    if (idx + 2 < pixels.length) {
      edgeSamples.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
  }
  // Sample left edge
  for (let y = 0; y < info.height; y += sampleStep) {
    const idx = (y * info.width + 0) * 4;
    if (idx + 2 < pixels.length) {
      edgeSamples.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
  }
  // Sample right edge
  for (let y = 0; y < info.height; y += sampleStep) {
    const idx = (y * info.width + (info.width - 1)) * 4;
    if (idx + 2 < pixels.length) {
      edgeSamples.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }
  }

  if (edgeSamples.length === 0) {
    // Fallback: use simple brightness threshold
    console.warn(`  Warning: Could not sample background, using brightness threshold`);
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i + 3] = brightness > 245 ? 0 : 255;
    }
  } else {
    // Calculate average background color from edge samples
    const avgBg = {
      r: Math.round(edgeSamples.reduce((sum, c) => sum + c.r, 0) / edgeSamples.length),
      g: Math.round(edgeSamples.reduce((sum, c) => sum + c.g, 0) / edgeSamples.length),
      b: Math.round(edgeSamples.reduce((sum, c) => sum + c.b, 0) / edgeSamples.length),
    };

    // Calculate standard deviation to determine threshold dynamically
    const distances = edgeSamples.map(c => {
      return Math.sqrt(
        Math.pow(c.r - avgBg.r, 2) + Math.pow(c.g - avgBg.g, 2) + Math.pow(c.b - avgBg.b, 2)
      );
    });
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const stdDev = Math.sqrt(
      distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length
    );
    
    // Use adaptive threshold: average distance + 2 standard deviations
    const adaptiveThreshold = Math.min(50, Math.max(20, avgDistance + stdDev * 2));

    // Make background transparent using improved color distance
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate color distance from background
      const distance = Math.sqrt(
        Math.pow(r - avgBg.r, 2) + Math.pow(g - avgBg.g, 2) + Math.pow(b - avgBg.b, 2)
      );

      // Check brightness for very light backgrounds (cream/off-white)
      const brightness = (r + g + b) / 3;
      const isVeryLight = brightness > 235; // Slightly lower threshold for cream backgrounds

      // If pixel is similar to background or very light, make it transparent
      // Use a more lenient threshold to catch more background pixels
      if (distance < adaptiveThreshold || isVeryLight) {
        pixels[i + 3] = 0; // Set alpha to 0 (transparent)
      } else {
        // Keep the pixel opaque
        pixels[i + 3] = 255;
      }
    }
  }

  // Create image from pixels, trim transparent edges, and save
  const trimmedBuffer = await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .trim({ threshold: 0 }) // Trim fully transparent pixels
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  // Get trimmed dimensions
  const trimmedMetadata = await sharp(trimmedBuffer).metadata();

  // Save the trimmed image
  await fs.writeFile(outputPath, trimmedBuffer);

  return { width: trimmedMetadata.width, height: trimmedMetadata.height };
}

/**
 * Process a single theme image
 */
async function processThemeImage(themeDir, imageFile) {
  const imagePath = path.join(themeDir, imageFile);
  const themeName = path.basename(themeDir);

  console.log(`\nProcessing: ${themeName}`);

  // Read image
  const imageBuffer = await fs.readFile(imagePath);
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  console.log(`  Image size: ${width}x${height}`);

  // Identify elements using OpenRouter vision
  console.log(`  Identifying elements with OpenRouter...`);
  let elements;
  try {
    elements = await identifyElements(imageBuffer, themeName);
    console.log(`  Found ${elements.length} elements:`);
    elements.forEach((el, i) => {
      console.log(`    ${i + 1}. ${el.name} at (${el.bbox.x}, ${el.bbox.y})`);
    });
  } catch (error) {
    console.error(`  Error identifying elements: ${error.message}`);
    return false;
  }

  // Extract each element
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const elementName = element.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const outputFile = `${elementName}.png`;
    const outputPath = path.join(themeDir, outputFile);

    if (!forceRegenerate && (await fileExists(outputPath))) {
      console.log(`  ✓ Element ${i + 1} already exists: ${outputFile}`);
      continue;
    }

    try {
      console.log(`  Extracting element ${i + 1}: ${element.name}...`);
      await extractElement(imageBuffer, element, width, height, outputPath);
      console.log(`  ✓ Saved: ${outputFile}`);
    } catch (error) {
      console.error(`  ✗ Error extracting ${element.name}: ${error.message}`);
    }
  }

  return true;
}

/**
 * Main function
 */
async function run() {
  console.log(`Extracting elements from birthday theme images using OpenRouter`);
  console.log(`Model: ${model}`);
  if (!process.env.OPENROUTER_MODEL) {
    console.log(`(Using default model. Set OPENROUTER_MODEL in .env to use your default OpenRouter model)\n`);
  } else {
    console.log(`(Using OPENROUTER_MODEL from .env)\n`);
  }

  // Get all theme directories
  const entries = await fs.readdir(themeGalleryDir, { withFileTypes: true });
  const themeDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(themeGalleryDir, entry.name));

  if (themeFilter) {
    const filters = themeFilter.split(",").map((t) => t.trim().toLowerCase());
    const filtered = themeDirs.filter((dir) => {
      const name = path.basename(dir).toLowerCase();
      return filters.some((f) => name.includes(f));
    });
    if (filtered.length === 0) {
      console.error(`No themes match filter: ${themeFilter}`);
      process.exit(1);
    }
    console.log(`Filtering to ${filtered.length} theme(s): ${filters.join(", ")}\n`);
    themeDirs.length = 0;
    themeDirs.push(...filtered);
  }

  let processed = 0;
  let errors = 0;

  for (const themeDir of themeDirs) {
    const themeName = path.basename(themeDir);
    
    // Find the webp image in the theme directory
    const files = await fs.readdir(themeDir);
    const imageFile = files.find((f) => f.endsWith(".webp"));
    
    if (!imageFile) {
      console.log(`  ⚠ No .webp image found in ${themeName}, skipping`);
      continue;
    }

    try {
      const success = await processThemeImage(themeDir, imageFile);
      if (success) {
        processed++;
      } else {
        errors++;
      }
      
      // Rate limiting: wait a bit between requests
      await sleep(2000);
    } catch (error) {
      console.error(`  ✗ Error processing ${themeName}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Errors: ${errors}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

