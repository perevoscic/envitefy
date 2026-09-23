import { colorContrast as signupColorContrast } from "./color-contrast";

export { colorContrast as signupColorContrast } from "./color-contrast";

import { SIGNUP_COMPOSITIONS } from "@/lib/signup-designs";
import type { SignupThemeDetails } from "@/lib/signup-theme-brief";
import type { SignupCustomTheme, SignupForm, SignupHeaderImageAsset } from "@/types/signup";

export const SIGNUP_CUSTOM_THEME_PROMPT_LIMIT = 12000;
export const SIGNUP_CUSTOM_THEME_REFERENCE_LIMIT = 2 * 1024 * 1024;
export const SIGNUP_CUSTOM_THEME_FONTS = [
  "editorial",
  "modern",
  "friendly",
  "classic",
  "literary",
  "display",
] as const;
export const SIGNUP_CUSTOM_THEME_BOARDS = [
  "ledger",
  "menu",
  "outline",
  "tiles",
  "tickets",
] as const;
export const SIGNUP_CUSTOM_THEME_MOTIFS = [
  "sprig",
  "star",
  "sun",
  "diamond",
  "stitch",
  "orbit",
] as const;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Validate the same contract at the provider, save, reload and public-render boundaries. */
export function normalizeSignupCustomTheme(value: unknown): SignupCustomTheme | null {
  const raw = record(value);
  const colors = record(raw?.colors);
  if (
    raw?.version !== 1 ||
    !colors ||
    typeof raw.name !== "string" ||
    !raw.name.trim() ||
    raw.name.length > 80 ||
    typeof raw.description !== "string" ||
    raw.description.length > 800 ||
    typeof raw.composition !== "string" ||
    !Object.hasOwn(SIGNUP_COMPOSITIONS, raw.composition) ||
    !SIGNUP_CUSTOM_THEME_BOARDS.some((id) => id === raw.board) ||
    !SIGNUP_CUSTOM_THEME_MOTIFS.some((id) => id === raw.motif) ||
    !SIGNUP_CUSTOM_THEME_FONTS.some((id) => id === raw.fontPair) ||
    typeof raw.reverse !== "boolean" ||
    !["page", "surface", "soft", "ink", "accent", "secondary"].every(
      (key) => typeof colors[key] === "string" && /^#[0-9a-f]{6}$/i.test(colors[key] as string),
    )
  )
    return null;
  const palette = Object.fromEntries(
    ["page", "surface", "soft", "ink", "accent", "secondary"].map((key) => [key, colors[key]]),
  ) as SignupCustomTheme["colors"];
  // Keep text and form controls readable, even if a generated palette misses the brief.
  if (signupColorContrast(palette.accent, "#FFFFFF") < 4.5) palette.accent = "#354B72";
  if (
    [palette.page, palette.surface, palette.soft].some(
      (color) => signupColorContrast(palette.ink, color) < 4.5,
    )
  ) {
    const readableInk = ["#17212B", "#FFFFFF"].find((ink) =>
      [palette.page, palette.surface, palette.soft].every(
        (color) => signupColorContrast(ink, color) >= 4.5,
      ),
    );
    if (!readableInk) return null;
    palette.ink = readableInk;
  }
  return {
    version: 1,
    name: raw.name.trim(),
    description: raw.description.trim(),
    composition: raw.composition as SignupCustomTheme["composition"],
    board: raw.board as SignupCustomTheme["board"],
    motif: raw.motif as SignupCustomTheme["motif"],
    reverse: raw.reverse,
    fontPair: raw.fontPair as SignupCustomTheme["fontPair"],
    colors: palette,
  };
}

export function applySignupCustomTheme(
  form: SignupForm,
  theme: SignupCustomTheme,
  artwork?: SignupHeaderImageAsset,
): SignupForm {
  const customTheme = normalizeSignupCustomTheme(theme);
  if (!customTheme) throw new Error("This theme could not be read. Please generate it again.");
  return {
    ...form,
    appearance: {
      version: 1,
      themeId: form.appearance?.themeId || "clean-clear",
      themeRevision: 1,
      customTheme,
      palette: "original",
      fontPair: customTheme.fontPair,
      headerLayout: "designed",
      slotLayout: ["ledger", "menu"].includes(customTheme.board) ? "rows" : "cards",
      density: form.appearance?.density || "comfortable",
      imagePosition: artwork
        ? { x: 50, y: 50 }
        : form.appearance?.imagePosition || { x: 50, y: 50 },
      imageFit: artwork ? "cover" : form.appearance?.imageFit || "cover",
      imageFilterEnabled: form.appearance?.imageFilterEnabled !== false,
    },
    header: {
      ...form.header,
      ...(artwork ? { backgroundImage: artwork, images: [] } : {}),
    },
  };
}

export type SignupThemeSnapshot = Pick<SignupForm, "appearance"> & {
  backgroundImage: SignupHeaderImageAsset | null | undefined;
  images: NonNullable<SignupForm["header"]>["images"];
};
export type SignupThemeProposal = SignupThemeSnapshot & { details?: SignupThemeDetails };
export function captureSignupTheme(form: SignupForm): SignupThemeSnapshot {
  return {
    appearance: form.appearance,
    backgroundImage: form.header?.backgroundImage,
    images: form.header?.images,
  };
}
export function restoreSignupTheme(form: SignupForm, previous: SignupThemeSnapshot): SignupForm {
  return {
    ...form,
    appearance: previous.appearance,
    header: { ...form.header, backgroundImage: previous.backgroundImage, images: previous.images },
  };
}
