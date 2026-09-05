import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import path from "node:path";
import sharp from "sharp";
import { productContract, type StudioProduct } from "./product-contract.ts";
import type { StudioEventDetails, StudioLiveCardMetadata } from "./types.ts";

let fontReady = false;
function ensureFont() {
  if (fontReady) return;
  const file = path.join(process.cwd(), "public/fonts/Josefin_Sans/static/JosefinSans-Regular.ttf");
  if (!GlobalFonts.registerFromPath(file, "Envitefy Export"))
    throw new Error("Invitation export font could not be loaded.");
  fontReady = true;
}

export function flyerTextBlocks(
  event: StudioEventDetails,
  copy: StudioLiveCardMetadata | null,
): string[] {
  const schedule = [
    event.date,
    [event.startTime, event.endTime].filter(Boolean).join(" – "),
    event.timezone,
  ]
    .filter(Boolean)
    .join(" · ");
  const location = [...new Set([event.venueName, event.venueAddress].filter(Boolean))].join("\n");
  return [
    event.title,
    event.honoreeName && !event.title.toLowerCase().includes(event.honoreeName.toLowerCase()) ? event.honoreeName : "",
    event.approvedWording || event.description || copy?.invitation.openingLine || "",
    schedule,
    location,
    ...(event.additionalLocations || []).map((stop) =>
      [stop.label, stop.timeText, stop.venue, stop.location || stop.address, stop.description]
        .filter(Boolean)
        .join(" · "),
    ),
    event.dressCode ? `Dress code: ${event.dressCode}` : "",
    event.rsvpEnabled !== false && event.rsvpContact
      ? ["RSVP", event.rsvpContact, event.rsvpBy ? `by ${event.rsvpBy}` : ""]
          .filter(Boolean)
          .join(" ")
      : "",
    event.registryNote || "",
    ...(event.links || []).map((link) => `${link.label}: ${link.url}`),
  ].filter((text): text is string => Boolean(text?.trim()));
}

function wrap(ctx: SKRSContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText([line, word].filter(Boolean).join(" ")).width <= width) {
        line = [line, word].filter(Boolean).join(" ");
      } else {
        if (line) lines.push(line);
        line = "";
        // URLs and long words wrap without deleting or changing any characters.
        for (const char of Array.from(word)) {
          if (ctx.measureText(line + char).width > width && line) {
            lines.push(line);
            line = "";
          }
          line += char;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function composeFlyerExport(
  artwork: string,
  event: StudioEventDetails,
  copy: StudioLiveCardMetadata | null,
  product: StudioProduct,
): Promise<string> {
  if (product !== "digital_flyer" && product !== "printable_flyer") return artwork;
  if (!/^data:image\/[\w.+-]+;base64,/.test(artwork))
    throw new Error("Flyer export requires an inline generated image.");
  ensureFont();
  const contract = productContract(product);
  const { width, height, safeMargin } = contract;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const input = Buffer.from(artwork.slice(artwork.indexOf(",") + 1), "base64");
  const background = await sharp(input)
    .resize(width, Math.round(height * 0.46), { fit: "cover", position: "attention" })
    .png()
    .toBuffer();
  const img = await loadImage(background);
  ctx.fillStyle = "#FFFDF8";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0);
  const fade = ctx.createLinearGradient(0, height * 0.38, 0, height * 0.46);
  fade.addColorStop(0, "rgba(255,253,248,0)");
  fade.addColorStop(1, "#FFFDF8");
  ctx.fillStyle = fade;
  ctx.fillRect(0, height * 0.38, width, height * 0.08 + 2);
  ctx.fillStyle = "#202A36"; // Fixed high contrast; generated palette never controls text legibility.
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const blocks = flyerTextBlocks(event, copy);
  const startY = Math.round(height * 0.47);
  let layout: Array<{ lines: string[]; size: number }> = [];
  let fit = false;
  for (let bodySize = 48; bodySize >= 36; bodySize -= 2) {
    layout = blocks.map((text, index) => {
      const size = index === 0 ? bodySize * 1.8 : bodySize;
      ctx.font = `${size}px "Envitefy Export"`;
      return { lines: wrap(ctx, text, width - safeMargin * 2), size };
    });
    const total = layout.reduce(
      (sum, block) => sum + block.lines.length * block.size * 1.25 + bodySize * 0.52,
      0,
    );
    if (startY + total <= height - safeMargin) {
      fit = true;
      break;
    }
  }
  if (!fit)
    throw new Error(
      "The flyer has more wording than fits legibly. Shorten the invitation wording or use an event page for the full details.",
    );
  let y = startY;
  for (const block of layout) {
    ctx.font = `${block.size}px "Envitefy Export"`;
    for (const line of block.lines) {
      ctx.fillText(line, width / 2, y);
      y += block.size * 1.25;
    }
    y += layout[1]?.size ? layout[1].size * 0.52 : 24;
  }
  const png = await sharp(canvas.toBuffer("image/png"))
    .withMetadata({ density: contract.dpi })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
