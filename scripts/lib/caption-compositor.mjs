import fs from "node:fs/promises";
import path from "node:path";
import { resolveRenderDimensions } from "./storyboard-generator.mjs";

let canvasPromise = null;
let registeredFontFamily = "";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getCanvasModule() {
  if (!canvasPromise) {
    canvasPromise = import("@napi-rs/canvas");
  }
  return canvasPromise;
}

async function ensureCaptionFont(projectRoot = process.cwd()) {
  if (registeredFontFamily) return registeredFontFamily;
  const canvasMod = await getCanvasModule();
  const candidates = [
    path.join(projectRoot, "public", "fonts", "Josefin_Sans", "static", "JosefinSans-Bold.ttf"),
    path.join(projectRoot, "public", "fonts", "Josefin_Sans", "static", "JosefinSans-SemiBold.ttf"),
    path.join(projectRoot, "public", "fonts", "Josefin_Sans", "JosefinSans-VariableFont_wght.ttf"),
  ];

  for (const candidate of candidates) {
    if (!(await exists(candidate))) continue;
    try {
      canvasMod.GlobalFonts.registerFromPath(candidate, "Envitefy Caption");
      registeredFontFamily = '"Envitefy Caption"';
      return registeredFontFamily;
    } catch {}
  }

  registeredFontFamily = "sans-serif";
  return registeredFontFamily;
}

function wrapText(ctx, text, maxWidth, maxLines = 3) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines = [];
  let current = words[0];
  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  lines.push(current);

  const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumedWords < words.length) {
    const remaining = words.slice(consumedWords);
    if (remaining.length > 0) {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${remaining.join(" ")}`.trim();
    }
  }

  return lines.slice(0, maxLines);
}

function drawCenteredLine(ctx, text, y, accentWord, accentColor) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const gap = ctx.measureText(" ").width;
  const widths = words.map((word) => ctx.measureText(word).width);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, words.length - 1);
  let cursor = (ctx.canvas.width - totalWidth) / 2;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const isAccent = clean(accentWord).toLowerCase() === word.toLowerCase();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.88)";
    ctx.lineJoin = "round";
    ctx.lineWidth = 10;
    ctx.strokeText(word, cursor, y);
    ctx.fillStyle = isAccent ? accentColor : "#ffffff";
    ctx.fillText(word, cursor, y);
    cursor += widths[index] + gap;
  }
}

function drawImageCover(ctx, image, width, height) {
  const imageWidth = image.width || width;
  const imageHeight = image.height || height;
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

export async function renderCaptionedFrameBuffer({
  projectRoot = process.cwd(),
  inputPath,
  caption,
  cameraFormat = "vertical",
  width,
  height,
  accentColor = "#34d399",
}) {
  const { createCanvas, loadImage } = await getCanvasModule();
  const fontFamily = await ensureCaptionFont(projectRoot);
  const renderSize = resolveRenderDimensions(cameraFormat);
  const canvasWidth = width || renderSize.width;
  const canvasHeight = height || renderSize.height;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  const image = await loadImage(inputPath);
  drawImageCover(ctx, image, canvasWidth, canvasHeight);

  const gradient = ctx.createLinearGradient(0, canvasHeight * 0.52, 0, canvasHeight);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvasHeight * 0.5, canvasWidth, canvasHeight * 0.5);

  const text = clean(caption?.text);
  const emphasisWord = clean(caption?.emphasisWord);
  const safeWidth = canvasWidth * 0.84;
  let fontSize = 96;
  let lines = [];

  while (fontSize >= 54) {
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    lines = wrapText(ctx, text, safeWidth, 3);
    const longest = Math.max(...lines.map((line) => ctx.measureText(line).width), 0);
    if (longest <= safeWidth) break;
    fontSize -= 6;
  }

  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  const lineHeight = fontSize * 1.08;
  const startY = canvasHeight * 0.78 - ((lines.length - 1) * lineHeight) / 2;

  for (let index = 0; index < lines.length; index += 1) {
    drawCenteredLine(ctx, lines[index], startY + index * lineHeight, emphasisWord, accentColor);
  }

  return canvas.toBuffer("image/png");
}

export async function renderCaptionedFrameToFile({
  projectRoot = process.cwd(),
  inputPath,
  outputPath,
  caption,
  cameraFormat = "vertical",
  width,
  height,
  accentColor = "#34d399",
}) {
  const buffer = await renderCaptionedFrameBuffer({
    projectRoot,
    inputPath,
    caption,
    cameraFormat,
    width,
    height,
    accentColor,
  });
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  return buffer;
}
