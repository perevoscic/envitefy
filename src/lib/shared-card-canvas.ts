"use client";

import {
  CARD_HEIGHT,
  CARD_WIDTH,
  type CardTextSource,
  cardFontRoles,
  hasGeneratedCardHeadline,
  layoutSharedCard,
  type SharedCardDesign,
  sharedCardArtworkUrl,
  sharedCardContent,
} from "./shared-card-design";

const loadedFonts = new Map<string, Promise<void>>();
export async function loadCardFonts(design: SharedCardDesign): Promise<void> {
  const roles = cardFontRoles(design);
  await Promise.all(
    [roles.title, roles.intro, roles.body].map((font) => {
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
    hasGeneratedCardHeadline(source),
  );
  context.textAlign = "center";
  context.textBaseline = "top";
  // Quiet, translucent paper keeps lettering readable while retaining the artwork.
  context.save();
  // Never wash over or redraw the generated title/opening line.
  if (hasGeneratedCardHeadline(source)) {
    context.beginPath();
    context.rect(0, 760, CARD_WIDTH, CARD_HEIGHT - 760);
    context.clip();
  }
  context.translate(500, mode === "live_card" ? 420 : 730);
  context.scale(0.85, mode === "live_card" ? 0.9 : 1.5);
  const wash = context.createRadialGradient(0, 0, 60, 0, 0, 600);
  wash.addColorStop(0, `${design.surface}e6`);
  wash.addColorStop(0.65, `${design.surface}b3`);
  wash.addColorStop(1, `${design.surface}00`);
  context.fillStyle = wash;
  if (mode === "digital_flyer" || !hasGeneratedCardHeadline(source))
    context.fillRect(-1000, -1500, 2000, 3000);
  context.restore();
  for (const line of layout.lines) {
    context.font = `${line.weight} ${line.size}px "${line.font}"`;
    context.fillStyle = line.color;
    context.fillText(line.text, line.x, line.y);
  }
  if (mode === "digital_flyer" && layout.qrCodes?.length) {
    const { default: QRCode } = await import("qrcode");
    for (const link of layout.qrCodes) {
      const code = QRCode.create(link.url, { errorCorrectionLevel: "M" });
      const quiet = 4;
      const moduleSize =
        Math.max(1, Math.floor((link.size * 2) / (code.modules.size + quiet * 2))) / 2;
      const size = moduleSize * (code.modules.size + quiet * 2);
      const left = Math.round(link.x - size / 2);
      context.fillStyle = "#ffffff";
      context.fillRect(left, link.y, size, size);
      context.fillStyle = "#000000";
      for (let row = 0; row < code.modules.size; row++)
        for (let col = 0; col < code.modules.size; col++) {
          if (code.modules.get(row, col))
            context.fillRect(
              left + (col + quiet) * moduleSize,
              link.y + (row + quiet) * moduleSize,
              moduleSize,
              moduleSize,
            );
        }
      context.fillStyle = design.ink;
      context.font = `600 24px "${cardFontRoles(design).body.family}"`;
      context.fillText(link.label, link.x, link.y + size + 10);
      context.font = `400 18px "${cardFontRoles(design).body.family}"`;
      context.fillText(link.display, link.x, link.y + size + 42, 260);
    }
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
      "The event details do not fit this invitation. Shorten the location labels or download after simplifying the details.",
    );
  const artwork = new Image();
  artwork.crossOrigin = "anonymous";
  artwork.src = sharedCardArtworkUrl(source);
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
