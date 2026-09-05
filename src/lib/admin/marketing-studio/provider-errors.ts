export type StudioProviderFailure = "rejected" | "ambiguous" | "retryable" | "expired_context";

/** A rejected request can be retried deliberately; ambiguous submissions must never auto-submit. */
export class StudioProviderError extends Error {
  readonly outcome: StudioProviderFailure;
  readonly httpStatus?: number;

  constructor(message: string, outcome: StudioProviderFailure, httpStatus?: number) {
    super(message);
    this.name = "StudioProviderError";
    this.outcome = outcome;
    this.httpStatus = httpStatus;
  }
}
