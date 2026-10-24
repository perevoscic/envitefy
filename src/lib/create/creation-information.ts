import { emptyCustomEventDetails, type CustomEventInformation } from "../event-custom-design";
import type { CreationIntake } from "./creation-intake";
import { customCategoryForGuess } from "./create-intent";

export function informationForCreation(intake: CreationIntake): CustomEventInformation {
  return intake.information || { version: 1, kind: "information", category: intake.guess ? customCategoryForGuess(intake.guess) : "general", design: { version: 1, name: "Event page", description: "", layout: "banner", font: "editorial", colors: { page: "#ffffff", surface: "#ffffff", ink: "#251f3d", accent: "#675cf4" } }, details: emptyCustomEventDetails() };
}

