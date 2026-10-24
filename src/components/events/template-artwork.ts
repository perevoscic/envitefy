export type TemplateArtwork = {
  id: string;
  name: string;
  coverTitle?: string;
  artwork: string;
  label: string;
  background: string;
  ink: string;
  accent: string;
  font: string;
  composition:
    | "editorial"
    | "arch"
    | "oval"
    | "postcard"
    | "poster"
    | "framed"
    | "organic"
    | "panorama"
    | "journal";
  surfaceClassName?: string;
};


/** Match the design's visual language, rather than varying covers arbitrarily. */
export function artworkComposition(direction: string): TemplateArtwork["composition"] {
  const words = direction.toLowerCase();
  if (/oval|circle|medallion|disco|moon|portal|menu/.test(words)) return "oval";
  if (/postcard|scrapbook|collage|polaroid/.test(words)) return "postcard";
  if (/arch|botanical|floral|blossom|storybook|window|garden/.test(words)) return "arch";
  if (/coastal|wave|organic|keyhole/.test(words)) return "organic";
  if (/poster|neon|electric|comic|scoreboard|arena|stage|sport/.test(words)) return "poster";
  if (/panorama|landscape|cinematic/.test(words)) return "panorama";
  if (/journal|letter|ledger|newspaper/.test(words)) return "journal";
  if (/classic|luxury|formal|frame|collegiate|toile|gilded/.test(words)) return "framed";
  return "editorial";
}

/** Preserve the accent hue while keeping lettering legible on its page color. */
export function artworkInk(background: string, accent: string): string {
  const hex = background.replace("#", "");
  const lightness = [0, 2, 4].reduce(
    (sum, start, index) =>
      sum + Number.parseInt(hex.slice(start, start + 2), 16) * [0.299, 0.587, 0.114][index],
    0,
  );
  return lightness < 140 ? "#fffaf3" : `color-mix(in srgb, ${accent} 45%, #231e29)`;
}
