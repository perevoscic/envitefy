export const DEFAULT_OCR_MODEL = "gpt-5.1";
export const OPENAI_TIMEOUT_MS = 25_000;
export const OCR_TOTAL_BUDGET_MS = 35_000;

export function clampTimeoutMs(ms: number, maxMs: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(0, Math.min(maxMs, Math.floor(ms)));
}

export function remainingBudgetMs(startedAt: number, totalMs: number, reserveMs = 0): number {
  const elapsed = Date.now() - startedAt;
  return Math.max(0, totalMs - elapsed - Math.max(0, reserveMs));
}

export function resolveOcrModel(fastMode = false): string {
  if (fastMode) {
    return process.env.OPENAI_OCR_FAST_MODEL || "gpt-5.1-mini";
  }
  return process.env.OPENAI_OCR_MODEL || DEFAULT_OCR_MODEL;
}
