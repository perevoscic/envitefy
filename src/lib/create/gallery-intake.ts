import type { CustomEventCategory, CustomEventPage } from "../event-custom-design";
import { validateClientUploadFile } from "../../utils/media-upload-client";
import { createCreationIntake, writeCreationIntake } from "./creation-intake";
import { normalizeCreateCategory, type CreateGuess } from "./create-intent";
import { prepareCreationEditor } from "./editor-handoff";

/** A gallery provides context; source recognition still decides what the uploaded material contains. */
export function galleryCreationGuess(category: CustomEventCategory): CreateGuess {
  const sports: Record<string, string | null> = { gymnastics: "gymnastics", football: "football", soccer: "soccer", cheerleading: "cheerleading", "dance-ballet": "dance", "sport-events": null };
  return category in sports ? { category: "sports", sport: sports[category] } : { category: normalizeCreateCategory(category) || "general", sport: null };
}

export async function stageGalleryInformation(ownerId: string, category: CustomEventCategory, files: File[], selectedDate?: string | null): Promise<string> {
  const invalid = files.map(file => validateClientUploadFile(file, "attachment")).find(Boolean);
  if (invalid) throw new Error(invalid);
  if (!files.length || files.length > 5 || (files.some(file => file.type === "application/pdf" || /\.pdf$/i.test(file.name)) && files.length > 1)) throw new Error("Choose one PDF or up to five photos.");
  const text = selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? `Event date selected: ${selectedDate}` : "";
  const intake = await writeCreationIntake({ ...createCreationIntake(ownerId, { kind: "files", files, text }), guess: galleryCreationGuess(category) });
  return `/create?intake=${encodeURIComponent(intake.id)}&step=recognizing`;
}

/** A host has already explicitly generated and approved this design. Retain it before navigation. */
export async function prepareGalleryCustomEditor(ownerId: string, page: CustomEventPage): Promise<string> {
  const intake = createCreationIntake(ownerId, { kind: "scratch", files: [], text: "" });
  return prepareCreationEditor({ ...intake, guess: galleryCreationGuess(page.category), customPage: page, information: { version: 1, kind: "information", category: page.category, design: page.design, details: page.details } }, { id: "envitefy-custom", title: page.design.name, imageUrl: page.artwork, href: `/event/design/customize?category=${page.category}`, category: page.category, description: page.design.description, style: "Custom", family: "custom" });
}
