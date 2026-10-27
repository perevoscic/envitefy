import { readableSchoolMemoText, readableSchoolMemoSections } from "../school-memo-typography.server";
import { schoolMemoSections } from "../school-memo-content";
import { recognizeSchoolSource, schoolStarterSections } from "../school-events";
import { classifyCreateSource } from "./classify-source";
import { customCategoryForGuess } from "./create-intent";
import { CreateSourceError, readCreateSource, type ReadCreateSourceResult } from "./read-source";
import { generateEventTheme } from "@/lib/event-theme-generation";
import { emptyCustomEventDetails, customEventCategory, normalizeCustomEventInformation, type CustomEventCategory, type CustomEventInformation } from "@/lib/event-custom-design";
import type { CreateClassification } from "./create-intent";
import { isSchoolMemoText, schoolMemoLocation } from "../school-memo";
import { extractSchoolMemo } from "../ocr/school-memo";

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
export async function extractCreateInformation(input: { files?: File[]; url?: string; text?: string; sourceText?: string; category?: CustomEventCategory; timezone?: string }, signal: AbortSignal, authorize?: (classification: CreateClassification) => Promise<boolean>, options?: {
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
  // The entry point owns the workflow: a school document stays in Create's
  // native General Event editor, with a separate aggregate of calendar dates.
  if ((!input.category || input.category === "general") && isSchoolMemoText(sourceText)) {
    options?.onStage?.("extracting_details");
    const schedule = await extractSchoolMemo(sourceText, input.timezone || "UTC", 60_000);
    signal.throwIfAborted();
    if (!schedule) throw new CreateSourceError("Your school memo could not be read. Please retry.", 502);
    const place = schoolMemoLocation(sourceText);
    let sections;
    try {
      const readableSource = await readableSchoolMemoText(sourceText);
      const notes = schoolMemoSections(readableSource);
      sections = sourceText.length > 12_000 ? await readableSchoolMemoSections(notes) : notes;
    }
    catch { throw new CreateSourceError("We could not make the memo text readable. Your source is kept; please retry.", 502); }
    signal.throwIfAborted();
    return {
      classification: { category: "school", schoolTemplate: "weekly-memo", sport: null, confidence: "high", alternatives: [] },
      sourceText,
      information: {
        version: 1,
        kind: "information",
        category: "general",
        design: {
          version: 1, name: "School memo", description: "School news and dates",
          layout: "editorial", font: "editorial",
          colors: { page: "#fffaf0", surface: "#ffffff", ink: "#29263b", accent: "#657e6a" },
        },
        details: {
          ...emptyCustomEventDetails(),
          title: schedule.title,
          timezone: schedule.timezone,
          scanSchedule: schedule,
          schoolTemplate: "weekly-memo",
          venue: place.venue || "",
          location: place.location || "",
          sections,
        },
      },
    };
  }
  // Personal appointments keep Snap's private-original and calendar workflow.
  if (!input.category && ["medical-appointments", "appointments"].includes(classification.category)) return { classification, sourceText, destination: "snap" };
  // The specialty parser owns sports facts. Reuse this server-read source instead
  // of planning a generic page and asking the browser to upload it a second time.
  if (options?.prepareSports) {
    const discoveryEventId = await options.prepareSports(source, classification);
    if (discoveryEventId) return { classification, sourceText, discoveryEventId };
  }
  const school = classification.category === "school" ? recognizeSchoolSource(sourceText) : null;
  const category = customEventCategory(input.category) || customCategoryForGuess(classification);
  options?.onStage?.("extracting_details");
  const result = await createExtractionDeps.information({
    mode: "information",
    category,
    prompt: `Read all supplied event facts and sections. ${school?.kind ? `This is a School & classroom ${school.kind}. Preserve destination, transportation, packing, permission deadlines, activities, agenda and check-in details in labelled sections where printed. Teacher/organizer names are hosts, never venues. Do not turn this single school activity into a weekly memo or merge secondary deadlines into its main date.` : ""} Never invent missing details. The following host-authored notes may correct source facts; keep visual styling instructions out of guest-facing wording and retain factual corrections: ${input.text?.trim() || "No additional notes."}`,
    informationText: sourceText,
    informationImages: source.images,
    currentDesign: null,
    referenceImageMode: "use",
  }, signal);
  const information = normalizeCustomEventInformation(result);
  if (!information) throw new CreateSourceError("Your event details could not be read. Your source is kept; please retry.", 502);
  if (school?.kind && category === "general") {
    information.details.schoolTemplate = school.kind;
    if (!information.details.sections.length) information.details.sections = schoolStarterSections(school.kind);
  }
  return { classification, information, sourceText };
}
