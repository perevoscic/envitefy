import {
  DerivedThemeResult,
  HexColor,
  HistoryStack,
  PaletteDefinition,
  ThemeTokens,
  TitleFontOption,
} from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toRgb = (hex: string) => {
  const clean = hex.replace("#", "").trim();
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;
  const n = Number.parseInt(normalized, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
};

const toHex = (r: number, g: number, b: number): HexColor => {
  const value = (v: number) =>
    clamp(Math.round(v), 0, 255)
      .toString(16)
      .padStart(2, "0");
  return `#${value(r)}${value(g)}${value(b)}`;
};

const mix = (a: string, b: string, weight = 0.5): HexColor => {
  const aa = toRgb(a);
  const bb = toRgb(b);
  return toHex(
    aa.r * (1 - weight) + bb.r * weight,
    aa.g * (1 - weight) + bb.g * weight,
    aa.b * (1 - weight) + bb.b * weight
  );
};

const relativeLuminance = (hex: string) => {
  const { r, g, b } = toRgb(hex);
  const values = [r, g, b].map((v) => v / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
};

const contrastRatio = (foreground: string, background: string) => {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
};

export const pickReadableTextColor = (bgHex: string): HexColor => {
  const lightChoice: HexColor = "#FFFFFF";
  const darkChoice: HexColor = "#0F172A";
  const lightContrast = contrastRatio(lightChoice, bgHex);
  const darkContrast = contrastRatio(darkChoice, bgHex);
  return lightContrast > darkContrast ? lightChoice : darkChoice;
};

const ensureReadable = (foreground: HexColor, background: HexColor) => {
  if (contrastRatio(foreground, background) >= 4.5) {
    return { color: foreground, adjusted: false };
  }
  return { color: pickReadableTextColor(background), adjusted: true };
};

const DEFAULT_TITLE_FONT = "'Playfair Display', 'Times New Roman', Georgia, serif";

export const deriveTokensFromPalette = (
  palette: PaletteDefinition,
  options?: {
    darkMode?: boolean;
    titleFont?: string;
    buttonStyle?: "solid" | "outline";
  }
): DerivedThemeResult => {
  const applied =
    options?.darkMode && palette.darkModeOverrides
      ? { ...palette, ...palette.darkModeOverrides }
      : palette;

  const isRegalHeritage = applied.id === "regal-heritage";
  const baseBackground = (isRegalHeritage ? "#FFFFFF" : applied.background) as HexColor;
  const baseSurface = (applied.surface || applied.card || "#FFFFFF") as HexColor;
  const baseText = applied.text || pickReadableTextColor(baseBackground);
  const baseButton = applied.button || applied.primary;
  const baseBorder = mix(baseBackground, applied.primary, isRegalHeritage ? 0.16 : 0.22);
  const baseBorderHover = isRegalHeritage ? applied.accent : mix(applied.accent, applied.primary, 0.2);
  const baseMuted = mix(baseText, baseBackground, 0.55);
  const baseLink = applied.primary;
  const baseHeading = applied.primary;
  const navText = mix(applied.primary, baseText, 0.18);
  const navActive = applied.primary;
  const navActiveBg = isRegalHeritage
    ? mix(applied.primary, "#ffffff", 0.94)
    : mix(applied.primary, baseBackground, 0.9);
  const icon = applied.primary;
  const iconMuted = mix(applied.primary, baseBackground, 0.55);
  const chipBg = mix(applied.primary, "#ffffff", isRegalHeritage ? 0.93 : 0.86);
  const chipText = applied.primary;
  const chipBorder = mix(applied.primary, "#ffffff", isRegalHeritage ? 0.76 : 0.62);
  const focus = applied.accent;
  const linkHover = isRegalHeritage ? applied.accent : mix(applied.accent, applied.primary, 0.35);

  const textCheck = ensureReadable(baseText, baseBackground);
  const buttonTextCheck = ensureReadable(
    pickReadableTextColor(baseButton),
    baseButton
  );
  const linkCheck = ensureReadable(baseLink, baseBackground);

  const tokens: ThemeTokens = {
    bg: baseBackground,
    surface: baseSurface,
    text: textCheck.color,
    mutedText: baseMuted,
    heading: baseHeading,
    navText,
    navActive,
    navActiveBg,
    primary: applied.primary,
    accent: applied.accent,
    buttonBg: baseButton,
    buttonText: buttonTextCheck.color,
    link: linkCheck.color,
    linkHover,
    icon,
    iconMuted,
    border: baseBorder,
    borderHover: baseBorderHover,
    focus,
    chipBg,
    chipText,
    chipBorder,
    titleFont: options?.titleFont || DEFAULT_TITLE_FONT,
    buttonStyle: options?.buttonStyle || "solid",
  };

  return {
    tokens,
    adjustedForReadability: textCheck.adjusted || buttonTextCheck.adjusted || linkCheck.adjusted,
  };
};

export const applyTheme = (tokens: ThemeTokens, root?: HTMLElement | null) => {
  if (typeof document === "undefined") return;
  const target = root || document.documentElement;
  target.style.setProperty("--bg", tokens.bg);
  target.style.setProperty("--surface", tokens.surface);
  target.style.setProperty("--text", tokens.text);
  target.style.setProperty("--muted-text", tokens.mutedText);
  target.style.setProperty("--color-heading", tokens.heading);
  target.style.setProperty("--color-nav-text", tokens.navText);
  target.style.setProperty("--color-nav-active", tokens.navActive);
  target.style.setProperty("--color-nav-active-bg", tokens.navActiveBg);
  target.style.setProperty("--primary", tokens.primary);
  target.style.setProperty("--accent", tokens.accent);
  target.style.setProperty("--button-bg", tokens.buttonBg);
  target.style.setProperty("--button-text", tokens.buttonText);
  target.style.setProperty("--link", tokens.link);
  target.style.setProperty("--link-hover", tokens.linkHover);
  target.style.setProperty("--color-icon", tokens.icon);
  target.style.setProperty("--color-icon-muted", tokens.iconMuted);
  target.style.setProperty("--border", tokens.border);
  target.style.setProperty("--color-border-hover", tokens.borderHover);
  target.style.setProperty("--color-focus", tokens.focus);
  target.style.setProperty("--chip-bg", tokens.chipBg);
  target.style.setProperty("--chip-text", tokens.chipText);
  target.style.setProperty("--chip-border", tokens.chipBorder);
  target.style.setProperty("--button-style", tokens.buttonStyle);
  target.style.setProperty("--title-font", tokens.titleFont);

  const styleId = "envitefy-simple-design-title-style";
  let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `
[data-role="page-title"],
h1.page-title {
  font-family: var(--title-font);
}
`;
};

export const createHistory = <T,>(initial: T): HistoryStack<T> => ({
  past: [],
  present: initial,
  future: [],
});

export const pushHistory = <T,>(stack: HistoryStack<T>, next: T): HistoryStack<T> => ({
  past: [...stack.past, stack.present].slice(-40),
  present: next,
  future: [],
});

export const undoHistory = <T,>(stack: HistoryStack<T>): HistoryStack<T> => {
  if (!stack.past.length) return stack;
  const previous = stack.past[stack.past.length - 1];
  return {
    past: stack.past.slice(0, -1),
    present: previous,
    future: [stack.present, ...stack.future],
  };
};

export const redoHistory = <T,>(stack: HistoryStack<T>): HistoryStack<T> => {
  if (!stack.future.length) return stack;
  const [next, ...rest] = stack.future;
  return {
    past: [...stack.past, stack.present].slice(-40),
    present: next,
    future: rest,
  };
};

export const exportThemeJson = (tokens: ThemeTokens) => JSON.stringify(tokens, null, 2);

export const PROFESSIONAL_GASPARILLA_PALETTES: PaletteDefinition[] = [
  {
    id: "regal-heritage",
    name: "The Regal Heritage",
    primary: "#2D1B4E",
    accent: "#D4AF37",
    background: "#F8FAFC",
    text: "#0F172A",
    success: "#0D9488",
    recommended: true,
    supportsDarkMode: true,
    darkModeOverrides: {
      background: "#0F172A",
      text: "#E2E8F0",
      surface: "#1E293B",
      button: "#D4AF37",
    },
  },
  {
    id: "midnight-elite",
    name: "The Midnight Elite",
    primary: "#1E293B",
    accent: "#6366F1",
    background: "#FFFFFF",
    button: "#0F172A",
  },
  {
    id: "coastal-professional",
    name: "The Coastal Professional",
    primary: "#134E4A",
    accent: "#FDE68A",
    background: "#F1F5F9",
  },
  {
    id: "crimson-spirit",
    name: "The Crimson Spirit",
    primary: "#991B1B",
    accent: "#E2E8F0",
    background: "#F9FAFB",
    button: "#DC2626",
  },
  {
    id: "emerald-arena",
    name: "The Emerald Arena",
    primary: "#064E3B",
    accent: "#A7F3D0",
    background: "#F0FDFA",
    button: "#059669",
  },
  {
    id: "electric-podium",
    name: "The Electric Podium",
    primary: "#0F172A",
    accent: "#22D3EE",
    background: "#F8FAFC",
    button: "#0891B2",
    supportsDarkMode: true,
    darkModeOverrides: {
      background: "#020617",
      text: "#E2E8F0",
      surface: "#1E293B",
      button: "#22D3EE",
    },
  },
  {
    id: "rosewood-classic",
    name: "The Rosewood Classic",
    primary: "#4C0519",
    accent: "#FEF3C7",
    background: "#FFFBEB",
    button: "#BE123C",
  },
  {
    id: "azure-flow",
    name: "The Azure Flow",
    primary: "#1E3A8A",
    accent: "#7DD3FC",
    background: "#F0F9FF",
    button: "#2563EB",
  },
  {
    id: "lavender-luxe",
    name: "The Lavender Luxe",
    primary: "#581C87",
    accent: "#F1F5F9",
    background: "#FAF5FF",
    button: "#9333EA",
  },
];

export const TITLE_FONT_OPTIONS: TitleFontOption[] = [
  { id: "playfair", label: "Playfair Display", stack: "'Playfair Display', 'Times New Roman', Georgia, serif" },
  { id: "cormorant", label: "Cormorant Garamond", stack: "'Cormorant Garamond', Garamond, serif" },
  { id: "montserrat", label: "Montserrat", stack: "'Montserrat', 'Helvetica Neue', Arial, sans-serif" },
  { id: "poppins", label: "Poppins", stack: "'Poppins', 'Helvetica Neue', Arial, sans-serif" },
  { id: "inter", label: "Inter", stack: "'Inter', 'Helvetica Neue', Arial, sans-serif" },
  { id: "anton", label: "Anton", stack: "'Anton', Impact, 'Arial Black', sans-serif" },
  { id: "bebas", label: "Bebas Neue", stack: "'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif" },
  { id: "oswald", label: "Oswald", stack: "'Oswald', 'Arial Narrow', Arial, sans-serif" },
  { id: "teko", label: "Teko", stack: "'Teko', 'Bebas Neue', 'Arial Narrow', sans-serif" },
  { id: "rajdhani", label: "Rajdhani", stack: "'Rajdhani', 'Roboto Condensed', sans-serif" },
  { id: "orbitron", label: "Orbitron", stack: "'Orbitron', 'Audiowide', sans-serif" },
  { id: "righteous", label: "Righteous", stack: "'Righteous', 'Baloo', cursive" },
  { id: "dancing", label: "Dancing Script", stack: "'Dancing Script', 'Brush Script MT', cursive" },
  { id: "kaushan", label: "Kaushan Script", stack: "'Kaushan Script', 'Brush Script MT', cursive" },
  { id: "great-vibes", label: "Great Vibes", stack: "'Great Vibes', 'Times New Roman', serif" },
  { id: "allura", label: "Allura", stack: "'Allura', 'Brush Script MT', cursive" },
  { id: "parisienne", label: "Parisienne", stack: "'Parisienne', 'Brush Script MT', cursive" },
  { id: "pacifico", label: "Pacifico", stack: "'Pacifico', 'Brush Script MT', cursive" },
  { id: "courgette", label: "Courgette", stack: "'Courgette', 'Brush Script MT', cursive" },
  { id: "satisfy", label: "Satisfy", stack: "'Satisfy', 'Brush Script MT', cursive" },
  { id: "sacramento", label: "Sacramento", stack: "'Sacramento', 'Brush Script MT', cursive" },
  { id: "yellowtail", label: "Yellowtail", stack: "'Yellowtail', 'Brush Script MT', cursive" },
];
