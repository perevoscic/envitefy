import fs from "node:fs";
import path from "node:path";
import { CARD_FONTS } from "./shared-card-design";

type Font = { family: string; url: string };
const coverage = new Map<string, (codepoint: number) => boolean>();

/** Read bundled TrueType cmap tables; do not rely on host-installed fallback fonts. */
function fontCoverage(font: Font) {
  const cached = coverage.get(font.url);
  if (cached) return cached;
  const bytes = fs.readFileSync(path.join(process.cwd(), "public", font.url));
  let cmap = 0;
  for (let i = 0; i < bytes.readUInt16BE(4); i++) {
    const offset = 12 + i * 16;
    if (bytes.toString("ascii", offset, offset + 4) === "cmap") cmap = bytes.readUInt32BE(offset + 8);
  }
  if (!cmap) throw new Error("The lettering font could not be read.");
  const tables: number[] = [];
  for (let i = 0; i < bytes.readUInt16BE(cmap + 2); i++) {
    const record = cmap + 4 + i * 8;
    const platform = bytes.readUInt16BE(record), encoding = bytes.readUInt16BE(record + 2);
    if (platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))
      tables.push(cmap + bytes.readUInt32BE(record + 4));
  }
  const supports = (code: number) => tables.some(offset => {
    const format = bytes.readUInt16BE(offset);
    if (format === 12) {
      let low = 0, high = bytes.readUInt32BE(offset + 12) - 1;
      while (low <= high) {
        const mid = (low + high) >>> 1, group = offset + 16 + mid * 12;
        const first = bytes.readUInt32BE(group), last = bytes.readUInt32BE(group + 4);
        if (code < first) high = mid - 1;
        else if (code > last) low = mid + 1;
        else return bytes.readUInt32BE(group + 8) + code - first !== 0;
      }
    }
    if (format === 4 && code <= 0xffff) {
      const count = bytes.readUInt16BE(offset + 6) / 2;
      for (let i = 0; i < count; i++) {
        const end = bytes.readUInt16BE(offset + 14 + i * 2);
        if (code > end) continue;
        const start = bytes.readUInt16BE(offset + 16 + count * 2 + i * 2);
        if (code < start) return false;
        const delta = bytes.readInt16BE(offset + 16 + count * 4 + i * 2);
        const address = offset + 16 + count * 6 + i * 2;
        const range = bytes.readUInt16BE(address);
        if (!range) return ((code + delta) & 0xffff) !== 0;
        const glyph = bytes.readUInt16BE(address + range + (code - start) * 2);
        return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
      }
    }
    return false;
  });
  coverage.set(font.url, supports);
  return supports;
}

export function cardFontSupportsText(font: Font, text: string) {
  const supports = fontCoverage(font);
  return [...text.normalize("NFC")].every(character => /\s/u.test(character) || supports(character.codePointAt(0)!));
}

export function readableCardFont(font: Font, text: string): Font {
  if (cardFontSupportsText(font, text)) return font;
  const fallback = Object.values(CARD_FONTS).find(candidate => cardFontSupportsText(candidate, text));
  if (fallback) return fallback;
  throw new Error("The available lettering fonts cannot display some of these characters. Your wording is unchanged. Use supported characters before generating this card.");
}
