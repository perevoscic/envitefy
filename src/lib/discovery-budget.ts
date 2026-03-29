export type DiscoveryBudgetMode = "core" | "enrich";
export type DiscoveryBudgetSource = "file" | "url";

export const DEFAULT_DISCOVERY_CORE_BUDGET_MS = 25_000;
export const DEFAULT_DISCOVERY_ENRICH_BUDGET_MS = 45_000;
export const DEFAULT_DISCOVERY_URL_CORE_BUDGET_MS = 35_000;
export const DEFAULT_DISCOVERY_URL_ENRICH_BUDGET_MS = 60_000;

const DEFAULT_DISCOVERY_FILE_PARSE_TIMEOUT_MS = 45_000;
const DEFAULT_DISCOVERY_URL_PARSE_TIMEOUT_BUFFER_MS = 45_000;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = Number.parseInt(safeString(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function resolveDiscoveryBudget(
  mode: DiscoveryBudgetMode,
  sourceType: DiscoveryBudgetSource = "file",
  env: Record<string, string | undefined> = process.env
): number {
  const legacyRaw =
    mode === "enrich" ? env.DISCOVERY_ENRICH_BUDGET_MS : env.DISCOVERY_CORE_BUDGET_MS;
  const sourceSpecificRaw =
    sourceType === "url"
      ? mode === "enrich"
        ? env.DISCOVERY_URL_ENRICH_BUDGET_MS
        : env.DISCOVERY_URL_CORE_BUDGET_MS
      : legacyRaw;
  const fallback =
    sourceType === "url"
      ? mode === "enrich"
        ? DEFAULT_DISCOVERY_URL_ENRICH_BUDGET_MS
        : DEFAULT_DISCOVERY_URL_CORE_BUDGET_MS
      : mode === "enrich"
      ? DEFAULT_DISCOVERY_ENRICH_BUDGET_MS
      : DEFAULT_DISCOVERY_CORE_BUDGET_MS;

  return parsePositiveInt(sourceSpecificRaw) ?? parsePositiveInt(legacyRaw) ?? fallback;
}

export function resolveDiscoveryClientParseTimeoutMs(
  sourceType: DiscoveryBudgetSource,
  env: Record<string, string | undefined> = process.env
): number {
  if (sourceType !== "url") {
    return DEFAULT_DISCOVERY_FILE_PARSE_TIMEOUT_MS;
  }
  return (
    resolveDiscoveryBudget("core", "url", env) +
    resolveDiscoveryBudget("enrich", "url", env) +
    DEFAULT_DISCOVERY_URL_PARSE_TIMEOUT_BUFFER_MS
  );
}
