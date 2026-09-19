import type { StudioGenerateApiResponse, StudioGenerationDiagnostics } from "./types.ts";
import type { ApprovedArtworkContract } from "./artwork-copy.ts";

const ISSUE_MESSAGES: Record<string, string> = {
  missing_copy: "Required wording is missing.",
  incorrect_title: "The event title, name or milestone is incorrect.",
  unexpected_text: "The artwork contains wording you did not approve.",
  unreadable_text: "Some required lettering is unreadable.",
  essential_clipping: "Essential wording or faces are cut off or covered.",
  faux_controls: "The artwork contains a painted button or other false control.",
  device_frame: "The artwork includes an unwanted device frame.",
  forbidden_footer: "The artwork includes an unwanted footer or control strip.",
  safety_mismatch: "The artwork contradicts a supplied safety instruction.",
  reference_mismatch: "A required subject or supplied reference was not preserved.",
  style_mismatch: "The requested visual direction was not applied.",
  requested_change_not_applied: "A requested image change was not applied.",
  repair_unverified: "The repaired artwork could not be verified.",
  invalid_image: "The generated image could not be decoded.",
  image_geometry_mismatch: "The generated image changed the original shape or resolution.",
};

export function artworkFailureExplanation(diagnostics?: StudioGenerationDiagnostics): string {
  const finalCheck = diagnostics?.checks.at(-1);
  return [...new Set((finalCheck?.issues || []).map((issue) => ISSUE_MESSAGES[issue]).filter(Boolean))].slice(0, 2).join(" ");
}

/** Keeps structured evidence available to the owner UI without printing prompts in logs. */
export class StudioGenerationRequestError extends Error {
  readonly diagnostics?: StudioGenerationDiagnostics;
  readonly artworkContract?: ApprovedArtworkContract;
  readonly code?: string;
  readonly retryable: boolean;

  constructor(message: string, response?: StudioGenerateApiResponse | null) {
    const explanation = artworkFailureExplanation(response?.diagnostics);
    super([message, explanation].filter(Boolean).join(" "));
    this.name = "StudioGenerationRequestError";
    this.diagnostics = response?.diagnostics;
    this.artworkContract = response?.artworkContract;
    this.code = response?.errors?.image?.code || response?.errors?.text?.code;
    this.retryable = response?.errors?.image?.retryable ?? response?.errors?.text?.retryable ?? false;
  }
}
