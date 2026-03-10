import React from "react";
import { GymMeetTitleSize } from "./types";

const TITLE_SIZE_STYLES: Record<GymMeetTitleSize, string> = {
  small: "clamp(1.875rem, 3.5vw, 3.25rem)",
  medium: "clamp(2.25rem, 4vw, 4rem)",
  large: "clamp(2.75rem, 5vw, 5.5rem)",
};

export const normalizeGymMeetTitleSize = (
  value: unknown
): GymMeetTitleSize => {
  return value === "small" || value === "medium" || value === "large"
    ? value
    : "medium";
};

export const getGymMeetTitleSizeStyle = (
  value: unknown
): React.CSSProperties => ({
  fontSize: TITLE_SIZE_STYLES[normalizeGymMeetTitleSize(value)],
});
