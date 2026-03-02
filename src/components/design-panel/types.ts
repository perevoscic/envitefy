export type HexColor = `#${string}`;

export type ButtonStyle = "solid" | "outline";

export type ThemeTokens = {
  bg: HexColor;
  surface: HexColor;
  text: HexColor;
  mutedText: HexColor;
  heading: HexColor;
  navText: HexColor;
  navActive: HexColor;
  navActiveBg: HexColor;
  primary: HexColor;
  accent: HexColor;
  buttonBg: HexColor;
  buttonText: HexColor;
  link: HexColor;
  linkHover: HexColor;
  icon: HexColor;
  iconMuted: HexColor;
  border: HexColor;
  borderHover: HexColor;
  focus: HexColor;
  chipBg: HexColor;
  chipText: HexColor;
  chipBorder: HexColor;
  titleFont: string;
  buttonStyle: ButtonStyle;
};

export type PaletteDefinition = {
  id: string;
  name: string;
  primary: HexColor;
  accent: HexColor;
  background: HexColor;
  text?: HexColor;
  button?: HexColor;
  surface?: HexColor;
  card?: HexColor;
  success?: HexColor;
  supportsDarkMode?: boolean;
  darkModeOverrides?: Partial<Pick<PaletteDefinition, "background" | "text" | "surface" | "card" | "button" | "primary" | "accent">>;
  recommended?: boolean;
};

export type TitleFontOption = {
  id: string;
  label: string;
  stack: string;
};

export type HistoryStack<T> = {
  past: T[];
  present: T;
  future: T[];
};

export type DerivedThemeResult = {
  tokens: ThemeTokens;
  adjustedForReadability: boolean;
};
