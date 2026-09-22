"use client";

import {
  CARD_FONTS,
  CARD_HEIGHT,
  CARD_WIDTH,
  layoutSharedCard,
  sharedCardContent,
  type CardTextSource,
  type SharedCardDesign,
} from "./shared-card-design";

const loadedFonts = new Map<string, Promise<void>>();
export async function loadCardFonts(design: SharedCardDesign): Promise<void> {
  await Promise.all(
    [CARD_FONTS[design.font], CARD_FONTS.body].map((font) => {
      if (!loadedFonts.has(font.family)) {
        const load = new FontFace(font.family, `url("${font.url}")`, { weight: "100 900" })
          .load()
          .then((face) => {
            document.fonts.add(face);
          })
          .catch((error: Error) => {
            loadedFonts.delete(font.family);
            throw error;
          });
        loadedFonts.set(font.family, load);
      }
      return loadedFonts.get(font.family);
    }),
  );
}

export async function drawCardText(
  canvas: HTMLCanvasElement,
  source: CardTextSource,
  mode: "live_card" | "digital_flyer",
) {
  const design = source.sharedDesign;
  if (!design) throw new Error("This card does not have editable text yet.");
  await loadCardFonts(design);
  canvas.width = CARD_WIDTH * 2;
  canvas.height = CARD_HEIGHT * 2;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the invitation.");
  context.scale(2, 2);
  const layout = layoutSharedCard(
    design,
    sharedCardContent(source),
    mode,
    (text, size, font, weight) => {
      context.font = `${weight} ${size}px "${font}"`;
      return context.measureText(text).width;
    },
  );
  context.textAlign = "center";
  context.textBaseline = "top";
  // Quiet, translucent paper keeps lettering readable while retaining the artwork.
  context.save();
  context.translate(500, mode === "live_card" ? 420 : 730);
  context.scale(0.85, mode === "live_card" ? 0.9 : 1.5);
  const wash = context.createRadialGradient(0, 0, 60, 0, 0, 600);
  wash.addColorStop(0, `${design.surface}e6`);
  wash.addColorStop(0.65, `${design.surface}b3`);
  wash.addColorStop(1, `${design.surface}00`);
  context.fillStyle = wash;
  context.fillRect(-1000, -1500, 2000, 3000);
  context.restore();
  for (const line of layout.lines) {
    context.font = `${line.weight} ${line.size}px "${line.font}"`;
    context.fillStyle = line.color;
    context.fillText(line.text, line.x, line.y);
  }
  return layout;
}

export async function composeSharedCard(
  source: CardTextSource,
  mode: "live_card" | "digital_flyer",
): Promise<string> {
  const design = source.sharedDesign;
  if (!design) throw new Error("The invitation design is missing.");
  const text = document.createElement("canvas");
  const layout = await drawCardText(text, source, mode);
  if (layout.overflow)
    throw new Error(
      "There is too much wording to fit this invitation. Shorten the title or Overview before downloading or publishing.",
    );
  const artwork = new Image();
  artwork.crossOrigin = "anonymous";
  artwork.src = design.backgroundUrl;
  await artwork.decode().catch(() => {
    throw new Error("The artwork could not be loaded. Please retry.");
  });
  const canvas = document.createElement("canvas");
  canvas.width = text.width;
  canvas.height = text.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the invitation.");
  context.fillStyle = design.surface;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(
    canvas.width / artwork.naturalWidth,
    canvas.height / artwork.naturalHeight,
  );
  const width = artwork.naturalWidth * scale;
  const height = artwork.naturalHeight * scale;
  context.drawImage(
    artwork,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );
  context.drawImage(text, 0, 0);
  return canvas.toDataURL("image/webp", 0.92);
}
