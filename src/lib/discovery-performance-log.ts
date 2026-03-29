/** Token usage buckets attached to discovery performance (mirrors meet-discovery stages). */
export type DiscoveryTokenUsageForLog = Partial<
  Record<
    string,
    {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      cachedTokens?: number;
    }
  >
>;

export type DiscoveryPerformanceForLog = {
  pdfParseMs: number;
  ocrMs: number;
  ocrPageCount: number;
  gymLayoutScanMs: number;
  gymLayoutAiCalls: number;
  scheduleTextParseMs: number;
  scheduleVisionCalls: number;
  modelParseMs: number;
  persistMs: number;
  tokenUsage?: DiscoveryTokenUsageForLog | null;
};

export type DiscoveryParseLogSummary = {
  timingSteps: Array<{ key: string; ms: number }>;
  slowestStep: { key: string; ms: number } | null;
  tokenTotals: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens: number;
    byStage: Record<
      string,
      {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cachedTokens: number;
      }
    >;
  } | null;
};

const TIMING_KEYS: Array<keyof DiscoveryPerformanceForLog> = [
  "pdfParseMs",
  "ocrMs",
  "gymLayoutScanMs",
  "scheduleTextParseMs",
  "modelParseMs",
  "persistMs",
];

/** Sorted timing breakdown + token rollup for parse completion logs and API `parseSummary`. */
export function summarizeDiscoveryPerformanceForLog(
  performance: DiscoveryPerformanceForLog,
): DiscoveryParseLogSummary {
  const timingSteps = TIMING_KEYS.map((key) => ({
    key: String(key),
    ms: Math.max(0, Math.floor(Number(performance[key]) || 0)),
  })).sort((a, b) => b.ms - a.ms);
  const slowestStep = timingSteps.length > 0 ? timingSteps[0] : null;

  const usage = performance.tokenUsage;
  let tokenTotals: DiscoveryParseLogSummary["tokenTotals"] = null;
  if (usage && typeof usage === "object") {
    const byStage: NonNullable<DiscoveryParseLogSummary["tokenTotals"]>["byStage"] = {};
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    let cachedTokens = 0;
    for (const [stage, vals] of Object.entries(usage)) {
      if (!vals || typeof vals !== "object") continue;
      const v = vals as Record<string, unknown>;
      const p = Math.max(0, Math.floor(Number(v.promptTokens) || 0));
      const c = Math.max(0, Math.floor(Number(v.completionTokens) || 0));
      const t = Math.max(0, Math.floor(Number(v.totalTokens) || 0));
      const ca = Math.max(0, Math.floor(Number(v.cachedTokens) || 0));
      byStage[stage] = {
        promptTokens: p,
        completionTokens: c,
        totalTokens: t,
        cachedTokens: ca,
      };
      promptTokens += p;
      completionTokens += c;
      totalTokens += t;
      cachedTokens += ca;
    }
    if (Object.keys(byStage).length > 0) {
      tokenTotals = { promptTokens, completionTokens, totalTokens, cachedTokens, byStage };
    }
  }

  return { timingSteps, slowestStep, tokenTotals };
}
