import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import sharp from "sharp";
import { cardFontRoles, suggestCardTypography, type SharedCardDesign } from "./shared-card-design";
import { bundledCardFontPath, readableCardFont } from "./card-font-coverage";
import type { LiveCardForm } from "./livecard-builder";

// A 320px phone shows a 288px card after preview margins: 84/56 become 24/16px.
const WIDTH = 1000;
const HEIGHT = 1500;
const TEXT_WIDTH = 800;
const MIN_TITLE = 84;
const MIN_INTRO = 56;
type Context = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;
type Line = { text: string; size: number; family: string; weight: number; height: number };

function registerFont(font: { family: string; url: string }) {
  if (!GlobalFonts.has(font.family) && !GlobalFonts.registerFromPath(bundledCardFontPath(font.url), font.family))
    throw new Error("The card typeface could not be loaded. Please try again.");
}
function luminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)!.map(v => parseInt(v, 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
export function letteringContrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function setFont(ctx: Context, line: Pick<Line, "size" | "family" | "weight">) {
  ctx.font = `${line.weight} ${line.size}px "${line.family}"`;
}
function textWidth(ctx: Context, text: string) {
  const m = ctx.measureText(text);
  return Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
}
function wrap(ctx: Context, text: string, size: number, family: string, weight: number): Line[] | null {
  setFont(ctx, { size, family, weight });
  const lines: string[] = [];
  // Segment graphemes rather than UTF-16 units when a name exceeds a full line.
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  for (const paragraph of text.trim().split(/\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (textWidth(ctx, word) > TEXT_WIDTH) {
        if (line) { lines.push(line); line = ""; }
        for (const { segment } of segmenter.segment(word)) {
          if (textWidth(ctx, segment) > TEXT_WIDTH) return null;
          if (line && textWidth(ctx, line + segment) > TEXT_WIDTH) { lines.push(line); line = ""; }
          line += segment;
        }
      } else if (line && textWidth(ctx, `${line} ${word}`) > TEXT_WIDTH) {
        lines.push(line); line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
  }
  return lines.map(text => {
    const m = ctx.measureText(text);
    return { text, size, family, weight, height: Math.ceil(Math.max(size * 1.25, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + 16)) };
  });
}

/** Exact host wording, local bundled typefaces, and a contrasting halo at phone size. */
export async function renderCardFontLettering(background: Buffer, form: Pick<LiveCardForm, "title" | "headlineIntro" | "design" | "eventType" | "date" | "startTime" | "endTime" | "endDate" | "timezone" | "locations">, design: SharedCardDesign, material?: Buffer) {
  const metadata = await sharp(background, { limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Background dimensions are missing.");
  const themed = { ...design, typography: design.typography || suggestCardTypography(form.design, form.eventType, design.font) };
  const selected = cardFontRoles(themed);
  const roles = { ...selected, title: readableCardFont(selected.title, form.title), intro: readableCardFont(selected.intro, form.headlineIntro), body: selected.body };
  registerFont(roles.title); registerFont(roles.intro); registerFont(roles.body);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");
  const intro = form.headlineIntro.trim() ? wrap(ctx, form.headlineIntro, MIN_INTRO, roles.intro.family, roles.introWeight) : [];
  let title: Line[] | null = null;
  const maxHeight = 850;
  const introHeight = intro?.reduce((n, l) => n + l.height, 0) || 0;
  for (let size = Math.max(MIN_TITLE, roles.titleSize); size >= MIN_TITLE; size--) {
    const candidate = wrap(ctx, form.title, size, roles.title.family, roles.titleWeight);
    if (candidate?.length && intro && introHeight + (intro.length ? 32 : 0) + candidate.reduce((n, l) => n + l.height, 0) <= maxHeight) { title = candidate; break; }
  }
  if (!title || !intro) throw new Error("Shorten the title or opening line so every word stays readable on phones.");
  const contentHeight = introHeight + (intro.length ? 32 : 0) + title.reduce((n, l) => n + l.height, 0);
  const regionHeight = Math.ceil(contentHeight + 72);
  // Score actual background crops. Prefer quiet, light/dark consistent areas in
  // the upper card; leave the bottom 20% for guest controls.
  const { data, info } = await sharp(background).resize(100, 150, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const regionRows = Math.ceil(regionHeight / 10);
  let best = { top: 150, score: Infinity, light: true };
  for (let top = 150; top + regionHeight <= 1200; top += 30) {
    let sum = 0, squares = 0, edges = 0, count = 0;
    for (let y = Math.floor(top / 10); y < Math.min(info.height, Math.floor(top / 10) + regionRows); y++) for (let x = 8; x < 92; x++) {
      const i = (y * info.width + x) * info.channels;
      const v = (data[i] * .2126 + data[i + 1] * .7152 + data[i + 2] * .0722) / 255;
      sum += v; squares += v * v; count++;
      if (x > 8) edges += Math.abs(v - (data[i - info.channels] * .2126 + data[i - info.channels + 1] * .7152 + data[i - info.channels + 2] * .0722) / 255);
    }
    const mean = sum / count;
    const score = squares / count - mean * mean + edges / count + Math.abs(top - (design.letteringStyle?.preferredTop || 270)) / 15000;
    if (score < best.score) best = { top, score, light: mean >= .5 };
  }
  // Keep the design's ink when it contrasts with its halo; otherwise select
  // a dependable matching dark/light base. The opaque halo protects each glyph
  // on mixed foliage, photographs and dark subjects without a rectangular panel.
  const halo = best.light ? "#fff8ed" : "#17212b";
  const ink = letteringContrast(design.ink, halo) >= 4.5 ? design.ink : best.light ? "#17212b" : "#fff8ed";
  const accent = letteringContrast(design.accent, halo) >= 4.5 ? design.accent : ink;
  // Keep material inside real glyphs, and constrain EVERY texture pixel against
  // the opaque halo. Material detail must never trade away phone readability.
  let titleFill: string | ReturnType<Context["createPattern"]> = ink;
  if (material) {
    const { data: pixels } = await sharp(material, { limitInputPixels: 40_000_000 })
      .resize(WIDTH, HEIGHT, { fit: "cover" }).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    const swatch = createCanvas(WIDTH, HEIGHT);
    const swatchContext = swatch.getContext("2d");
    const image = swatchContext.createImageData(WIDTH, HEIGHT);
    const base = [1, 3, 5].map(offset => parseInt(ink.slice(offset, offset + 2), 16));
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
      const color = base.map((channel, c) => Math.round(channel * .7 + pixels[i * 3 + c] * .3));
      const hex = `#${color.map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
      const safe = letteringContrast(hex, halo) >= 4.5 ? color : base;
      image.data.set([...safe, 255], i * 4);
    }
    swatchContext.putImageData(image, 0, 0);
    titleFill = ctx.createPattern(swatch, "no-repeat") || ink;
  }
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  const draw = (line: Line, top: number, color: NonNullable<typeof titleFill>) => {
    setFont(ctx, line);
    const m = ctx.measureText(line.text);
    // Center visual glyph bounds, including script overhang, rather than advance width.
    const x = WIDTH / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
    const baseline = top + (line.height - m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 + m.actualBoundingBoxAscent;
    ctx.strokeStyle = halo;
    ctx.lineWidth = 12;
    ctx.strokeText(line.text, x, baseline);
    ctx.fillStyle = color;
    ctx.fillText(line.text, x, baseline);
  };
  let y = best.top + 32;
  for (const line of intro) { draw(line, y, ink); y += line.height; }
  if (intro.length) y += 32;
  for (const line of title) { draw(line, y, titleFill || ink); y += line.height; }
  // Small palette-matched diamond and rules add ornament without crossing words.
  if (design.letteringStyle?.ornament !== false) {
    const ornamentY = best.top + regionHeight - 17;
    ctx.strokeStyle = halo; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(370, ornamentY); ctx.lineTo(465, ornamentY); ctx.moveTo(535, ornamentY); ctx.lineTo(630, ornamentY); ctx.stroke();
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(500, ornamentY - 7); ctx.lineTo(507, ornamentY); ctx.lineTo(500, ornamentY + 7); ctx.lineTo(493, ornamentY); ctx.closePath(); ctx.fill();
  }
  const scale = metadata.width / WIDTH;
  const left = Math.floor(70 * scale), top = Math.floor(best.top * scale);
  const width = Math.ceil(860 * scale), height = Math.ceil(regionHeight * scale);
  const layer = await sharp(canvas.toBuffer("image/png")).resize(metadata.width, metadata.height).extract({ left, top, width, height }).webp({ lossless: true }).toBuffer();
  const composite = await sharp(background).composite([{ input: layer, left, top }]).webp({ lossless: true }).toBuffer();
  return {
    layer, composite,
    layout: { left, top, width, height, canvasWidth: metadata.width, canvasHeight: metadata.height },
    typography: { titleSize: title[0].size, introSize: intro.length ? MIN_INTRO : 0, ink, halo, contrast: letteringContrast(ink, halo), titleLines: title.map(l => l.text), introLines: intro.map(l => l.text), materialApplied: Boolean(material) },
  };
}
