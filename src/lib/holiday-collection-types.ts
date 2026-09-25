export type HolidayDateRule =
  | { kind: "fixed"; month: number; day: number; duration?: number }
  | { kind: "weekday"; month: number; weekday: number; occurrence: number }
  | { kind: "easter"; offset?: number }
  | { kind: "calendar"; calendar: "hebrew" | "chinese" | "islamic-umalqura" | "persian"; month: string; day: number; duration?: number; eve?: boolean }
  | { kind: "window"; start: readonly [number, number]; end: readonly [number, number] }
  | { kind: "dates"; dates: Readonly<Record<string, string>>; fallback: readonly [number, number] };

export type HolidayCollection = {
  id: string;
  name: string;
  kind: "Federal holidays" | "Celebrations" | "Religious & cultural" | "Seasonal activities";
  aliases: string;
  date: HolidayDateRule;
  palettes: readonly string[];
  purpose: "volunteers" | "celebration" | "potluck" | "meeting";
  designs: readonly { slug: string; name: string; scene: string }[];
};
