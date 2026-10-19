import { classifyCreateSource } from "./classify-source";
import { customCategoryForGuess } from "./create-intent";
import { CreateSourceError, readCreateSource } from "./read-source";
import { generateEventTheme } from "@/lib/event-theme-generation";
import { customEventCategory, normalizeCustomEventInformation, type CustomEventCategory, type CustomEventInformation } from "@/lib/event-custom-design";
import type { CreateClassification } from "./create-intent";

export type CreateExtractionResult = {
  classification: CreateClassification;
  information?: CustomEventInformation;
  sourceText: string;
  accessRequired?: boolean;
  destination?: "snap";
};
export const createExtractionDeps = { read: readCreateSource, classify: classifyCreateSource, information: generateEventTheme };

/** Facts only: no image generation, media upload or history insert. */
export async function extractCreateInformation(input: { files?: File[]; url?: string; text?: string; category?: CustomEventCategory }, signal: AbortSignal, authorize?: (classification: CreateClassification) => Promise<boolean>): Promise<CreateExtractionResult> {
  const source = await createExtractionDeps.read(input, signal);
  signal.throwIfAborted();
  // The actual document is classified independently of the selected category and host styling notes.
  const classification = await createExtractionDeps.classify({ text: source.text || input.text, images: source.text ? undefined : source.images.slice(0, 5) }, signal);
  const sourceText = source.text || input.text?.trim() || "";
  if (authorize && !(await authorize(classification))) return { classification, sourceText, accessRequired: true };
  // Personal appointments keep Snap's private-original and calendar workflow.
  if (!input.category && ["medical-appointments", "appointments"].includes(classification.category)) return { classification, sourceText, destination: "snap" };
  const category = customEventCategory(input.category) || customCategoryForGuess(classification);
  const result = await createExtractionDeps.information({
    mode: "information",
    category,
    prompt: `Read all supplied event facts and sections. Never invent missing details. The following host-authored notes may correct source facts; keep visual styling instructions out of guest-facing wording and retain factual corrections: ${input.text?.trim() || "No additional notes."}`,
    informationText: source.text || input.text,
    informationImages: source.images,
    currentDesign: null,
    referenceImageMode: "use",
  }, signal);
  const information = normalizeCustomEventInformation(result);
  if (!information) throw new CreateSourceError("Your event details could not be read. Your source is kept; please retry.", 502);
  return { classification, information, sourceText };
}
