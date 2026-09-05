import { readFile, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), true);

const boundaries = {
  "next-auth": "export const getServerSession = async () => null;",
  "@/lib/auth": "export const authOptions = {};",
  "@/lib/cors": "export const corsJson = (_request, body, init) => Response.json(body, init);",
  "@/lib/media-upload": "export const processBufferUpload = async () => { throw new Error('Unexpected media upload'); };",
  "@/lib/scan-attempts": "export const recordCompletedScanAttempt = async () => { throw new Error('Unexpected database write'); };",
};
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (boundaries[specifier]) return {
      url: `data:text/javascript,${encodeURIComponent(boundaries[specifier])}`,
      shortCircuit: true,
    };
    return nextResolve(specifier, context);
  },
});
const { handleOcrRequest } = await import("../src/lib/ocr/pipeline.ts");
hooks.deregister();

const rates = {
  "gpt-5.6-terra": { input: 2, cached: 0.2, output: 12 },
  "gpt-5.6-luna": { input: 0.2, cached: 0.02, output: 1.2 },
  "gpt-6-astra": { input: 10, cached: 1, output: 50 },
};
const requests = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url) !== "https://api.openai.com/v1/chat/completions") {
    throw new Error("Live scan check permits only the existing OpenAI OCR endpoint");
  }
  const request = JSON.parse(init.body);
  const startedAt = Date.now();
  const response = await realFetch(url, init);
  const payload = await response.clone().json().catch(() => null);
  const usage = payload?.usage;
  const rate = rates[request.model];
  const cached = usage?.prompt_tokens_details?.cached_tokens || 0;
  const costUsd = usage && rate
    ? ((usage.prompt_tokens - cached) * rate.input + cached * rate.cached + usage.completion_tokens * rate.output) / 1_000_000
    : null;
  requests.push({ model: request.model, responseModel: payload?.model, status: response.status,
    durationMs: Date.now() - startedAt, responseFormat: request.response_format?.type || "text",
    usage, costUsd, errorCode: payload?.error?.code });
  return response;
};

try {
  const bytes = await readFile("G:/Develop_Cloud/_Envitefy/Sample-Flyers/september 28th.jpg");
  const form = new FormData();
  form.set("file", new File([bytes], "september 28th.jpg", { type: "image/jpeg" }));
  const response = await handleOcrRequest(new Request("http://localhost/api/ocr?fast=0&skin=0&timing=1", {
    method: "POST", body: form,
  }));
  const result = await response.json();
  const fields = result.fieldsGuess || {};
  const report = {
    date: new Date().toISOString(), status: response.status, code: result.code,
    error: result.error, ocrSource: result.ocrSource, timing: result.timing,
    event: { title: fields.title, start: fields.start, end: fields.end, timezone: fields.timezone,
      venue: fields.venue, birthdayAge: fields.birthdayAge, category: result.category },
    requests, estimatedApiCostUsd: requests.reduce((sum, request) => sum + (request.costUsd || 0), 0),
    priceSource: "https://developers.openai.com/api/docs/pricing",
  };
  await writeFile("artifacts/snap-ocr-cost-2026-09-05.json", JSON.stringify(report, null, 2));
  console.log("SCAN_COST_REPORT", JSON.stringify(report, null, 2));
  if (!response.ok) process.exitCode = 1;
} finally {
  globalThis.fetch = realFetch;
}
