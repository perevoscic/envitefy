import type { ReactNode } from "react";
import type { BirthdayExperienceEvent, BirthdayExperienceTheme } from "../BirthdayExperienceHero";

export type BirthdaySceneProps = {
  theme: BirthdayExperienceTheme;
  event: BirthdayExperienceEvent;
  preview?: boolean;
  actions?: ReactNode;
  onRsvpClick?: () => void;
};
