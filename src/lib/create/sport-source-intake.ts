import { intakeDiscovery } from "@/lib/discovery/intake";
import type { DiscoveryDocument } from "@/lib/discovery/types";
import { customCategoryForGuess, discoveryTargetForSport, normalizeCreateSport, type CreateClassification, type CreateGuess } from "./create-intent";
import { getCreationTemplates } from "./template-selection";
import type { CustomEventCategory } from "@/lib/event-custom-design";
import type { ReadCreateSourceResult } from "./read-source";

export const sportSourceIntakeDeps = { intake: intakeDiscovery, templates: getCreationTemplates };

export function sportsGuessForExtraction(classification: CreateClassification, category?: CustomEventCategory, sport?: string): CreateGuess | null {
  if (!category) return classification.category === "sports" && classification.confidence === "high" && classification.sport ? classification : null;
  const fixedSports: Partial<Record<CustomEventCategory, string>> = { gymnastics: "gymnastics", football: "football", soccer: "soccer", cheerleading: "cheerleading", "dance-ballet": "dance" };
  const fixedSport = fixedSports[category];
  const selected = normalizeCreateSport(fixedSport || sport || (classification.category === "sports" ? classification.sport : null));
  const guess: CreateGuess = { category: "sports", sport: selected };
  return selected && customCategoryForGuess(guess) === category ? guess : null;
}

/** Build only from evidence read on this server; request fields cannot seed a document. */
export function discoveryDocumentFromCreateSource(source: ReadCreateSourceResult, files: File[]): DiscoveryDocument {
  const pages = source.pages?.map(page => ({ pageNumber: page.pageNumber, text: page.text })) || [{ pageNumber: 1, text: source.text }];
  const links = source.links || [];
  return {
    sourceType: files.some(file => file.type === "application/pdf" || /\.pdf$/i.test(file.name)) ? "pdf" : "image",
    documentTypeHints: [], pageCount: source.pageCount, hasEmbeddedText: !source.usedOcr, ocrUsed: !!source.usedOcr,
    pages, textBlocks: pages.map(page => ({ id: `page-${page.pageNumber}`, ...page, role: "full_text" })),
    tables: [], links: links.map(link => ({ label: link.label || "Source link", url: link.url })), resources: [], evidence: [],
    extractionMeta: {
      sourceReadVersion: 1, reusedCreateSource: true, extractedText: source.text,
      sourceBranding: source.sourceBranding,
      pages, accommodationPageTexts: pages, usedOcr: !!source.usedOcr,
      annotationLinks: links, discoveredLinks: links,
    },
  };
}

export async function prepareSportsSourceIntake(params: {
  userId: string; clientIntakeId: string; source: ReadCreateSourceResult; guess: CreateGuess;
  files: File[]; text: string; url?: string; signal: AbortSignal; onStage?: (stage: string) => void;
}): Promise<string> {
  params.signal.throwIfAborted();
  const target = discoveryTargetForSport(params.guess.sport!);
  const template = sportSourceIntakeDeps.templates(params.guess)[0];
  const values = { workflow: target.workflow, activityProfile: target.activityProfile, text: params.text, clientIntakeId: params.clientIntakeId, pageTemplateId: template?.id };
  let request: Request;
  let sourceForm: FormData | undefined;
  if (params.files.length) {
    const form = new FormData();
    for (const file of params.files) form.append("file", file);
    for (const [key, value] of Object.entries(values)) if (value) form.set(key, value);
    sourceForm = form;
    request = new Request("https://envitefy.invalid/api/discovery/intake", { method: "POST", headers: { "content-type": "multipart/form-data" }, signal: params.signal });
  } else request = new Request("https://envitefy.invalid/api/discovery/intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, url: params.url }), signal: params.signal });
  const result = await sportSourceIntakeDeps.intake({
    request, sourceForm, userId: params.userId,
    document: params.files.length ? discoveryDocumentFromCreateSource(params.source, params.files) : undefined,
    validatedUrl: params.source.url, onStage: params.onStage,
  });
  if (!result.ok) throw new Error(result.error);
  return result.eventId;
}
