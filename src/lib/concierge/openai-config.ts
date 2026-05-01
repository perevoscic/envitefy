const DEFAULT_OPENAI_CONCIERGE_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENAI_CONCIERGE_FAST_MODEL = "gpt-5.4-nano";
const DEFAULT_OPENAI_CONCIERGE_TIMEOUT_MS = 8_000;

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

export function isEnvFlagEnabled(value: unknown): boolean {
  const normalized = cleanString(value)?.toLowerCase();
  return Boolean(normalized && TRUE_VALUES.has(normalized));
}

export function resolveConciergeOpenAiModel(override?: unknown): string {
  const explicit = cleanString(override) || cleanString(process.env.OPENAI_CONCIERGE_MODEL);
  if (explicit) return explicit;
  if (isEnvFlagEnabled(process.env.CONCIERGE_FAST_MODEL_ENABLED)) {
    return (
      cleanString(process.env.OPENAI_CONCIERGE_FAST_MODEL) || DEFAULT_OPENAI_CONCIERGE_FAST_MODEL
    );
  }
  return DEFAULT_OPENAI_CONCIERGE_MODEL;
}

export function resolveConciergeOpenAiTimeoutMs(): number {
  const configured = Number(process.env.OPENAI_CONCIERGE_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(Math.max(Math.round(configured), 1), 60_000);
  }
  return DEFAULT_OPENAI_CONCIERGE_TIMEOUT_MS;
}

export async function runWithConciergeOpenAiTimeout<T>(
  work: (signal: AbortSignal) => Promise<T>,
  timeoutMs = resolveConciergeOpenAiTimeoutMs(),
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`OPENAI_CONCIERGE_TIMEOUT_${timeoutMs}MS`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([work(controller.signal), timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
