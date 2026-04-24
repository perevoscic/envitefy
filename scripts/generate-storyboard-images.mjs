#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import {
  buildFallbackFramePlan,
  buildLooseInputFromCli,
  buildRunPaths,
  createFramesManifest,
  materializeSceneSpec,
  normalizeFramePlan,
  normalizeSceneSpec,
  parseCliArgs,
  resolveImageSize,
} from "./lib/storyboard-generator.mjs";

const projectRoot = path.resolve(process.cwd());

const EXTRACTION_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "storyboard_scene_spec",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        numberOfFrames: {
          anyOf: [{ type: "integer", minimum: 1, maximum: 24 }, { type: "null" }],
        },
        characterLock: { type: "string" },
        outfitLock: { type: "string" },
        phoneLock: { type: "string" },
        flyerLock: { type: "string" },
        accessoryLock: { type: "string" },
        locationLock: { type: "string" },
        backgroundAnchors: { type: "string" },
        screenLock: { type: "string" },
        composition: { type: "string" },
        mood: { type: "string" },
        mainCharacterDetails: { type: "string" },
        locationEnvironment: { type: "string" },
        propsKeyObjects: { type: "string" },
        visualStyle: { type: "string" },
        cameraFormat: { type: "string" },
        frameToFrameChanges: { type: "string" },
        actionSequence: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "numberOfFrames",
        "characterLock",
        "outfitLock",
        "phoneLock",
        "flyerLock",
        "accessoryLock",
        "locationLock",
        "backgroundAnchors",
        "screenLock",
        "composition",
        "mood",
        "mainCharacterDetails",
        "locationEnvironment",
        "propsKeyObjects",
        "visualStyle",
        "cameraFormat",
        "frameToFrameChanges",
        "actionSequence",
      ],
    },
  },
};

const FRAME_PLAN_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "storyboard_frame_plan",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        frames: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              actionBeat: { type: "string" },
              cameraShot: { type: "string" },
              composition: { type: "string" },
              mood: { type: "string" },
            },
            required: ["title", "actionBeat", "cameraShot", "composition", "mood"],
          },
        },
      },
      required: ["frames"],
    },
  },
};

function printUsage() {
  console.log(`Usage:
  npm run storyboard:generate -- --prompt "your prompt here" [options]

Options:
  --job <label>                    Optional run label used in the folder slug
  --frames <n>                    Override frame count
  --camera-format <vertical|horizontal|square>
  --character-lock <text>
  --outfit-lock <text>
  --phone-lock <text>
  --flyer-lock <text>
  --accessory-lock <text>
  --location-lock <text>
  --background-anchors <text>
  --screen-lock <text>
  --composition <text>
  --mood <text>
  --visual-style <text>
  --main-character-details <text>
  --location-environment <text>
  --props-key-objects <text>
  --frame-to-frame-changes <text>
  --action-sequence "a|b|c"
  --notes <text>
  --output <relative-or-absolute-path>
  --help
`);
}

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  return new OpenAI({ apiKey });
}

function resolveTextModel() {
  return process.env.STORYBOARD_OPENAI_TEXT_MODEL || process.env.STUDIO_OPENAI_TEXT_MODEL || "gpt-4.1-mini";
}

function resolveImageModel() {
  return process.env.STORYBOARD_OPENAI_IMAGE_MODEL || process.env.STUDIO_OPENAI_IMAGE_MODEL || "gpt-image-2";
}

function resolveImageQuality() {
  const raw = `${process.env.STORYBOARD_OPENAI_IMAGE_QUALITY || ""}`.trim().toLowerCase();
  if (raw === "low" || raw === "high" || raw === "auto") return raw;
  return "medium";
}

function resolveJsonObject(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }
  return null;
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function extractSceneSpec(client, model, looseInput) {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: EXTRACTION_RESPONSE_FORMAT,
    messages: [
      {
        role: "system",
        content:
          "You extract a partial creative storyboard scene spec from a loose prompt. Fill only what the prompt supports with high confidence. Prefer continuity lock fields such as character, outfit, props, location, screen style, composition, and mood when present. Leave strings empty when unclear. If frame count is not clearly specified, return null. Preserve the user's creative intent.",
      },
      {
        role: "user",
        content: [
          "Extract a partial scene spec for a storyboard image sequence.",
          `Raw prompt: ${looseInput.rawPrompt}`,
          looseInput.extraNotes ? `Extra notes: ${looseInput.extraNotes}` : "",
          looseInput.overrides.numberOfFrames != null
            ? `User override frame count: ${looseInput.overrides.numberOfFrames}`
            : "",
          looseInput.overrides.cameraFormat
            ? `User override camera format: ${looseInput.overrides.cameraFormat}`
            : "",
          looseInput.overrides.visualStyle
            ? `User override visual style: ${looseInput.overrides.visualStyle}`
            : "",
          looseInput.overrides.characterLock
            ? `User override character lock: ${looseInput.overrides.characterLock}`
            : "",
          looseInput.overrides.outfitLock
            ? `User override outfit lock: ${looseInput.overrides.outfitLock}`
            : "",
          looseInput.overrides.phoneLock ? `User override phone lock: ${looseInput.overrides.phoneLock}` : "",
          looseInput.overrides.flyerLock ? `User override flyer lock: ${looseInput.overrides.flyerLock}` : "",
          looseInput.overrides.locationLock
            ? `User override location lock: ${looseInput.overrides.locationLock}`
            : "",
          looseInput.overrides.backgroundAnchors
            ? `User override background anchors: ${looseInput.overrides.backgroundAnchors}`
            : "",
          looseInput.overrides.screenLock ? `User override screen lock: ${looseInput.overrides.screenLock}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  return resolveJsonObject(completion.choices?.[0]?.message?.content || "") || {};
}

async function buildFramePlan(client, model, sceneSpec) {
  const materialized = materializeSceneSpec(sceneSpec);
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: FRAME_PLAN_RESPONSE_FORMAT,
    messages: [
      {
        role: "system",
        content:
          "You are building a frame-by-frame cinematic ad storyboard. Return exactly the requested number of frames. Each frame must feel like the same subject, same world, same campaign, with continuity preserved across character identity, hairstyle, wardrobe, phone, flyer, environment, background anchors, lighting direction, app UI, and premium brand tone. Keep each frame as a single still image concept with no collage, no split image, and no floating text.",
      },
      {
        role: "user",
        content: [
          "Create a storyboard frame plan for image generation.",
          `Raw prompt: ${materialized.rawPrompt}`,
          `Number of frames: ${materialized.numberOfFrames}`,
          `Character lock: ${materialized.characterLock}`,
          `Outfit lock: ${materialized.outfitLock}`,
          `Phone lock: ${materialized.phoneLock}`,
          `Flyer lock: ${materialized.flyerLock}`,
          materialized.accessoryLock ? `Accessory lock: ${materialized.accessoryLock}` : "",
          `Location lock: ${materialized.locationLock}`,
          `Background anchors: ${materialized.backgroundAnchors}`,
          `Screen lock: ${materialized.screenLock}`,
          `Sequence composition: ${materialized.composition}`,
          `Sequence mood: ${materialized.mood}`,
          materialized.mainCharacterDetails
            ? `Main character details: ${materialized.mainCharacterDetails}`
            : "",
          materialized.locationEnvironment
            ? `Location/environment: ${materialized.locationEnvironment}`
            : "",
          materialized.propsKeyObjects ? `Props/key objects: ${materialized.propsKeyObjects}` : "",
          materialized.visualStyle ? `Visual style: ${materialized.visualStyle}` : "",
          `Camera format: ${materialized.cameraFormat}`,
          `Frame-to-frame changes: ${materialized.frameToFrameChanges}`,
          `Action sequence: ${materialized.actionSequence.join(" | ")}`,
          materialized.extraNotes ? `Extra notes: ${materialized.extraNotes}` : "",
          "For each frame, return a short title, the exact action beat for that frame, a camera shot label, a frame-specific composition line, and a frame-specific mood line. Do not return full prompt prose.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  });

  const parsed = resolveJsonObject(completion.choices?.[0]?.message?.content || "");
  return normalizeFramePlan(sceneSpec, parsed?.frames);
}

async function generateImage(client, model, prompt, size) {
  const response = await client.images.generate({
    model,
    prompt,
    size,
    quality: resolveImageQuality(),
    background: "opaque",
    n: 1,
  });
  const b64 = response.data?.[0]?.b64_json || "";
  if (!b64) {
    throw new Error("No image payload returned from OpenAI.");
  }
  return Buffer.from(b64, "base64");
}

async function main() {
  const parsedArgs = parseCliArgs(process.argv.slice(2));
  if (parsedArgs.help === "true") {
    printUsage();
    return;
  }

  const looseInput = buildLooseInputFromCli(parsedArgs);
  if (!looseInput.rawPrompt) {
    printUsage();
    throw new Error("A prompt is required. Pass --prompt \"...\".");
  }

  const client = getOpenAiClient();
  const textModel = resolveTextModel();
  const imageModel = resolveImageModel();
  const inferredSpec = await extractSceneSpec(client, textModel, looseInput);
  const sceneSpec = normalizeSceneSpec(looseInput, inferredSpec);
  const runPaths = buildRunPaths(projectRoot, {
    outputRoot: looseInput.outputRoot,
    jobLabel: looseInput.jobLabel,
    rawPrompt: looseInput.rawPrompt,
  });

  await fs.mkdir(runPaths.imagesDir, { recursive: true });

  const requestPayload = {
    generatedAt: new Date().toISOString(),
    input: looseInput,
    models: {
      textModel,
      imageModel,
    },
    run: {
      outputRoot: runPaths.outputRoot,
      runDir: runPaths.runDir,
      slug: runPaths.slug,
      timestamp: runPaths.timestamp,
    },
  };

  await writeJson(runPaths.requestPath, requestPayload);
  await writeJson(runPaths.sceneSpecPath, sceneSpec);

  let framePlan;
  try {
    framePlan = await buildFramePlan(client, textModel, sceneSpec);
  } catch (_error) {
    console.warn("[storyboard] frame-plan generation failed; using fallback prompts");
    framePlan = buildFallbackFramePlan(sceneSpec);
  }

  const framesManifest = createFramesManifest(runPaths, sceneSpec, framePlan, {
    textModel,
    imageModel,
  });
  await writeJson(runPaths.framesPath, framesManifest);

  const imageSize = resolveImageSize(sceneSpec.cameraFormat.value);
  let hadError = false;

  for (const frame of framesManifest.frames) {
    const filename = `frame-${String(frame.frameNumber).padStart(2, "0")}.png`;
    const filePath = path.join(runPaths.imagesDir, filename);
    frame.status = "generating";
    await writeJson(runPaths.framesPath, framesManifest);

    try {
      console.log(`[storyboard] generating frame ${frame.frameNumber}/${framesManifest.frames.length}`);
      const imageBuffer = await generateImage(client, imageModel, frame.prompt, imageSize);
      await fs.writeFile(filePath, imageBuffer);
      frame.status = "done";
      frame.error = null;
    } catch (error) {
      hadError = true;
      frame.status = "error";
      frame.error = error instanceof Error ? error.message : "Image generation failed.";
      console.error(`[storyboard] frame ${frame.frameNumber} failed: ${frame.error}`);
    }

    await writeJson(runPaths.framesPath, framesManifest);
  }

  console.log(`[storyboard] run directory: ${runPaths.runDir}`);
  if (hadError) {
    throw new Error("One or more storyboard frames failed to generate.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
