import assert from "node:assert/strict";
import test from "node:test";

import { summarizeDiscoveryPerformanceForLog } from "./discovery-performance-log.ts";

test("summarizeDiscoveryPerformanceForLog sorts timings and rolls up tokens", () => {
  const perf = {
    pdfParseMs: 1000,
    ocrMs: 500,
    ocrPageCount: 0,
    gymLayoutScanMs: 9000,
    gymLayoutAiCalls: 0,
    scheduleTextParseMs: 2000,
    scheduleVisionCalls: 0,
    modelParseMs: 3000,
    persistMs: 100,
    tokenUsage: {
      parse: { promptTokens: 10, completionTokens: 5, totalTokens: 15, cachedTokens: 0 },
      gymLayoutVision: {
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
        cachedTokens: 30,
      },
    },
  };
  const s = summarizeDiscoveryPerformanceForLog(perf);
  assert.equal(s.slowestStep?.key, "gymLayoutScanMs");
  assert.equal(s.slowestStep?.ms, 9000);
  assert.deepEqual(
    s.timingSteps.map((t) => t.key),
    ["gymLayoutScanMs", "modelParseMs", "scheduleTextParseMs", "pdfParseMs", "ocrMs", "persistMs"],
  );
  assert.equal(s.tokenTotals?.totalTokens, 135);
  assert.equal(s.tokenTotals?.promptTokens, 110);
  assert.equal(s.tokenTotals?.byStage.parse?.totalTokens, 15);
});
