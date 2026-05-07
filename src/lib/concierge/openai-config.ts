const DEFAULT_OPENAI_CONCIERGE_MODEL = "gpt-5.4";
const DEFAULT_OPENAI_CONCIERGE_CHAT_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENAI_CONCIERGE_FAST_MODEL = DEFAULT_OPENAI_CONCIERGE_CHAT_MODEL;
const DEFAULT_OPENAI_CONCIERGE_PREMIUM_MODEL = "gpt-5.5";
const DEFAULT_OPENAI_CONCIERGE_PERSONA_MODEL = DEFAULT_OPENAI_CONCIERGE_CHAT_MODEL;
const DEFAULT_OPENAI_CONCIERGE_TIMEOUT_MS = 3_000;
const DEFAULT_OPENAI_CONCIERGE_PERSONA_TIMEOUT_MS = 2_200;
const DEFAULT_OPENAI_CONCIERGE_STREAM_FIRST_TOKEN_TIMEOUT_MS = 2_200;

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

export function resolveConciergeOpenAiChatModel(override?: unknown): string {
  return (
    cleanString(override) ||
    cleanString(process.env.OPENAI_CONCIERGE_CHAT_MODEL) ||
    cleanString(process.env.OPENAI_CONCIERGE_FAST_MODEL) ||
    DEFAULT_OPENAI_CONCIERGE_CHAT_MODEL
  );
}

export function resolveConciergeOpenAiPremiumModel(override?: unknown): string {
  return (
    cleanString(override) ||
    cleanString(process.env.OPENAI_CONCIERGE_PREMIUM_MODEL) ||
    DEFAULT_OPENAI_CONCIERGE_PREMIUM_MODEL
  );
}

export function resolveConciergeOpenAiExtractionModel({
  override,
  premium = false,
}: {
  override?: unknown;
  premium?: boolean;
} = {}): string {
  const explicit =
    cleanString(override) || cleanString(process.env.OPENAI_CONCIERGE_EXTRACTION_MODEL);
  if (explicit) return explicit;
  if (premium) return resolveConciergeOpenAiPremiumModel();
  return resolveConciergeOpenAiModel();
}

export function resolveConciergeOpenAiPlannerModel({
  override,
  premium = false,
  simple = false,
}: {
  override?: unknown;
  premium?: boolean;
  simple?: boolean;
} = {}): string {
  const explicit = cleanString(override) || cleanString(process.env.OPENAI_CONCIERGE_PLANNER_MODEL);
  if (explicit) return explicit;
  if (premium) return resolveConciergeOpenAiPremiumModel();
  if (simple) {
    return (
      cleanString(process.env.OPENAI_CONCIERGE_SIMPLE_ACTION_MODEL) ||
      resolveConciergeOpenAiChatModel()
    );
  }
  return resolveConciergeOpenAiModel();
}

function resolveBoundedTimeoutMs(value: unknown, fallback: number): number {
  const configured = Number(value);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(Math.max(Math.round(configured), 1), 60_000);
  }
  return fallback;
}

export function resolveConciergeOpenAiTimeoutMs(): number {
  return resolveBoundedTimeoutMs(
    process.env.OPENAI_CONCIERGE_TIMEOUT_MS,
    DEFAULT_OPENAI_CONCIERGE_TIMEOUT_MS,
  );
}

export function resolveConciergeOpenAiPersonaModel(override?: unknown): string {
  return (
    cleanString(override) ||
    cleanString(process.env.OPENAI_CONCIERGE_PERSONA_MODEL) ||
    cleanString(process.env.OPENAI_CONCIERGE_CHAT_MODEL) ||
    cleanString(process.env.OPENAI_CONCIERGE_FAST_MODEL) ||
    DEFAULT_OPENAI_CONCIERGE_PERSONA_MODEL
  );
}

export function resolveConciergeOpenAiPersonaTimeoutMs(): number {
  return resolveBoundedTimeoutMs(
    process.env.OPENAI_CONCIERGE_PERSONA_TIMEOUT_MS,
    DEFAULT_OPENAI_CONCIERGE_PERSONA_TIMEOUT_MS,
  );
}

export function resolveConciergeStreamFirstTokenTimeoutMs(): number {
  return resolveBoundedTimeoutMs(
    process.env.OPENAI_CONCIERGE_STREAM_FIRST_TOKEN_TIMEOUT_MS,
    DEFAULT_OPENAI_CONCIERGE_STREAM_FIRST_TOKEN_TIMEOUT_MS,
  );
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
