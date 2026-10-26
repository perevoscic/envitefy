import { classifyCreateSource } from "./classify-source";
import { customCategoryForGuess } from "./create-intent";
import { CreateSourceError, readCreateSource, type ReadCreateSourceResult } from "./read-source";
import { generateEventTheme } from "@/lib/event-theme-generation";
import { customEventCategory, normalizeCustomEventInformation, type CustomEventCategory, type CustomEventInformation } from "@/lib/event-custom-design";
import type { CreateClassification } from "./create-intent";
import { isSchoolMemoText } from "../school-memo";

export type CreateExtractionResult = {
  classification: CreateClassification;
  information?: CustomEventInformation;
  sourceText: string;
  discoveryEventId?: string;
  accessRequired?: boolean;
  destination?: "snap";
};
export const createExtractionDeps = { read: readCreateSource, classify: classifyCreateSource, information: generateEventTheme };

/** Facts only, with an optional authorized handoff into a private sports import. */
export async function extractCreateInformation(input: { files?: File[]; url?: string; text?: string; sourceText?: string; category?: CustomEventCategory }, signal: AbortSignal, authorize?: (classification: CreateClassification) => Promise<boolean>, options?: {
  onStage?: (stage: string) => void;
  prepareSports?: (source: ReadCreateSourceResult, classification: CreateClassification) => Promise<string | undefined>;
}): Promise<CreateExtractionResult> {
  options?.onStage?.("reading");
  const source = await createExtractionDeps.read(input.sourceText ? { text: input.sourceText } : input, signal, { onStage: options?.onStage });
  signal.throwIfAborted();
  const sourceText = source.text || input.sourceText?.trim() || input.text?.trim() || "";
  // The actual document is classified independently of the selected category and host styling notes.
  options?.onStage?.("classifying");
  const classification = await createExtractionDeps.classify({ text: sourceText, images: sourceText ? undefined : source.images.slice(0, 5) }, signal);
  if (authorize && !(await authorize(classification))) return { classification, sourceText, accessRequired: true };
  // Memos contain several personal calendar items, rather than one public event
  // page. Keep the exact upload in the existing Snap document/review workflow.
  if (!input.category && isSchoolMemoText(sourceText))
    return { classification, sourceText, destination: "snap" };
  // Personal appointments keep Snap's private-original and calendar workflow.
  if (!input.category && ["medical-appointments", "appointments"].includes(classification.category)) return { classification, sourceText, destination: "snap" };
  // The specialty parser owns sports facts. Reuse this server-read source instead
  // of planning a generic page and asking the browser to upload it a second time.
  if (options?.prepareSports) {
    const discoveryEventId = await options.prepareSports(source, classification);
    if (discoveryEventId) return { classification, sourceText, discoveryEventId };
  }
  const category = customEventCategory(input.category) || customCategoryForGuess(classification);
  options?.onStage?.("extracting_details");
  const result = await createExtractionDeps.information({
    mode: "information",
    category,
    prompt: `Read all supplied event facts and sections. Never invent missing details. The following host-authored notes may correct source facts; keep visual styling instructions out of guest-facing wording and retain factual corrections: ${input.text?.trim() || "No additional notes."}`,
    informationText: sourceText,
    informationImages: source.images,
    currentDesign: null,
    referenceImageMode: "use",
  }, signal);
  const information = normalizeCustomEventInformation(result);
  if (!information) throw new CreateSourceError("Your event details could not be read. Your source is kept; please retry.", 502);
  return { classification, information, sourceText };
}
