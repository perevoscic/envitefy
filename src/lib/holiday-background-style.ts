import type { CSSProperties } from "react";
import type { HolidayBackgroundPreset } from "./holiday-backgrounds";

/** Literal authored colors are independent of application appearance. */
export function holidayBackgroundStyle(background: HolidayBackgroundPreset): CSSProperties {
  return {
    backgroundColor: background.page,
    color: background.ink,
    "--holiday-page": background.page,
    "--holiday-ink": background.ink,
    "--holiday-accent": background.accent,
    "--holiday-surface": background.surface,
    "--holiday-secondary": background.secondary,
  } as CSSProperties;
}
