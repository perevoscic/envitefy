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

function drawLeftLine(ctx, text, x, y, accentWord, accentColor) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const gap = ctx.measureText(" ").width;
  let cursor = x;

  for (const word of words) {
    const isAccent = clean(accentWord).toLowerCase() === word.toLowerCase();
    ctx.fillStyle = isAccent ? accentColor : "#ffffff";
    ctx.fillText(word, cursor, y);
    cursor += ctx.measureText(word).width + gap;
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

async function drawSocialPostLayout({
  ctx,
  loadImage,
  projectRoot,
  caption,
  callToAction,
  accentColor,
}) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const isLandscape = canvasWidth > canvasHeight;
  const safeX = canvasWidth * 0.07;
  const safeWidth = canvasWidth * (isLandscape ? 0.48 : 0.82);

  const overlay = ctx.createLinearGradient(0, 0, isLandscape ? canvasWidth * 0.76 : 0, canvasHeight);
  overlay.addColorStop(0, "rgba(12, 9, 27, 0.88)");
  overlay.addColorStop(isLandscape ? 0.6 : 0.46, "rgba(18, 12, 40, 0.68)");
  overlay.addColorStop(1, "rgba(18, 12, 40, 0.08)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const wordmarkPath = path.join(projectRoot, "public", "brand", "envitefy-wordmark.png");
  if (await exists(wordmarkPath)) {
    const wordmark = await loadImage(wordmarkPath);
    const logoWidth = canvasWidth * (isLandscape ? 0.22 : 0.34);
    const logoHeight = logoWidth * ((wordmark.height || 355) / (wordmark.width || 1103));
    ctx.drawImage(wordmark, safeX, canvasHeight * 0.065, logoWidth, logoHeight);
  }

  const text = clean(caption?.text);
  const emphasisWord = clean(caption?.emphasisWord);
  let fontSize = Math.round(canvasWidth * (isLandscape ? 0.058 : 0.078));
  let lines = [];
  while (fontSize >= Math.round(canvasWidth * 0.044)) {
    ctx.font = `900 ${fontSize}px "Envitefy Caption", sans-serif`;
    lines = wrapText(ctx, text, safeWidth, isLandscape ? 3 : 4);
    const longest = Math.max(...lines.map((line) => ctx.measureText(line).width), 0);
    if (longest <= safeWidth) break;
    fontSize -= 6;
  }

  ctx.font = `900 ${fontSize}px "Envitefy Caption", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0, 0, 0, 0.34)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 7;
  const lineHeight = fontSize * 1.02;
  const headlineBottom = canvasHeight * (isLandscape ? 0.7 : 0.72);
  const startY = headlineBottom - (Math.max(lines.length, 1) - 1) * lineHeight;
  for (let index = 0; index < lines.length; index += 1) {
    drawLeftLine(ctx, lines[index], safeX, startY + index * lineHeight, emphasisWord, accentColor);
  }

  const cta = clean(callToAction);
  if (cta) {
    ctx.shadowColor = "transparent";
    ctx.font = `800 ${Math.round(canvasWidth * (isLandscape ? 0.018 : 0.032))}px "Envitefy Caption", sans-serif`;
    const horizontalPadding = canvasWidth * 0.026;
    const pillHeight = canvasHeight * (isLandscape ? 0.085 : 0.058);
    const pillWidth = Math.min(ctx.measureText(cta).width + horizontalPadding * 2, safeWidth);
    const pillY = canvasHeight * (isLandscape ? 0.79 : 0.81);
    const radius = pillHeight / 2;
    const pillGradient = ctx.createLinearGradient(safeX, pillY, safeX + pillWidth, pillY);
    pillGradient.addColorStop(0, "#6b3cff");
    pillGradient.addColorStop(1, "#37a8ff");
    ctx.fillStyle = pillGradient;
    ctx.beginPath();
    ctx.roundRect(safeX, pillY, pillWidth, pillHeight, radius);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(cta, safeX + horizontalPadding, pillY + pillHeight / 2);
  }
}

export async function renderCaptionedFrameBuffer({
  projectRoot = process.cwd(),
  inputPath,
  caption,
  cameraFormat = "vertical",
  width,
  height,
  accentColor = "#5a7dff",
  layout = "video-caption",
  callToAction = "",
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

  if (layout === "social-post") {
    await drawSocialPostLayout({
      ctx,
      loadImage,
      projectRoot,
      caption,
      callToAction,
      accentColor,
    });
    return canvas.toBuffer("image/png");
  }

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
  accentColor = "#5a7dff",
  layout = "video-caption",
  callToAction = "",
}) {
  const buffer = await renderCaptionedFrameBuffer({
    projectRoot,
    inputPath,
    caption,
    cameraFormat,
    width,
    height,
    accentColor,
    layout,
    callToAction,
  });
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  return buffer;
}
