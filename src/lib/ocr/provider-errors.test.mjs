import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, beforeEach, test } from "node:test";
import sharp from "sharp";
import { getOcrFailureResponse } from "./failure.ts";
import {
  fetchWithTimeout,
  llmExtractEventFromImage,
  llmExtractVisibleTextFromImage,
  OpenAiOcrError,
} from "./openai.ts";

// Keep the real request handler, image processing, OCR calls and parsing. Isolate
// app session/storage boundaries so these tests cannot read or write user data.
const boundaryModules = {
  "next-auth": "export const getServerSession = async () => null;",
  "@/lib/auth": "export const authOptions = {};",
  "@/lib/cors": "export const corsJson = (_request, body, init) => Response.json(body, init);",
  "@/lib/media-upload":
    "export const processBufferUpload = async () => { throw new Error('Unexpected media upload'); };",
  "@/lib/scan-attempts":
    "export const recordCompletedScanAttempt = async () => { throw new Error('Unexpected database write'); };",
};
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (boundaryModules[specifier])
      return {
        url: `data:text/javascript,${encodeURIComponent(boundaryModules[specifier])}`,
        shortCircuit: true,
      };
    return nextResolve(specifier, context);
  },
});
const { handleOcrRequest } = await import("./pipeline.ts");
hooks.deregister();

const previousKey = process.env.OPENAI_API_KEY;
beforeEach(() => {
  process.env.OPENAI_API_KEY = "offline-test-key";
});
afterEach(() => {
  if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousKey;
});

const flyer = await sharp({ create: { width: 64, height: 64, channels: 3, background: "white" } })
  .jpeg()
  .toBuffer();

function scanRequest(turbo = false) {
  const form = new FormData();
  form.set("file", new File([new Uint8Array(flyer)], "flyer.jpg", { type: "image/jpeg" }));
  return new Request(`http://localhost/api/ocr?fast=1&skin=0&turbo=${turbo ? 1 : 0}`, {
    method: "POST",
    body: form,
  });
}

const failures = [
  {
    status: 429,
    body: { error: { code: "credit_balance_exhausted", type: "insufficient_quota" } },
    detail: "OPENAI_QUOTA_EXCEEDED",
    code: "OCR_PROVIDER_QUOTA_EXCEEDED",
    responseStatus: 503,
    calls: 1,
  },
  {
    status: 429,
    body: { error: { type: "insufficient_quota" } },
    detail: "OPENAI_QUOTA_EXCEEDED",
    code: "OCR_PROVIDER_QUOTA_EXCEEDED",
    responseStatus: 503,
    calls: 1,
  },
  {
    status: 429,
    body: { error: { code: "rate_limit_exceeded" } },
    detail: "OPENAI_RATE_LIMITED",
    code: "OCR_RATE_LIMITED",
    responseStatus: 429,
    calls: 1,
  },
  {
    status: 401,
    body: { error: { code: "invalid_api_key" } },
    detail: "OPENAI_ACCESS_DENIED",
    code: "OCR_PROVIDER_ACCESS_DENIED",
    responseStatus: 503,
    calls: 1,
  },
  {
    status: 403,
    body: null,
    detail: "OPENAI_ACCESS_DENIED",
    code: "OCR_PROVIDER_ACCESS_DENIED",
    responseStatus: 503,
    calls: 1,
  },
  {
    status: 503,
    body: null,
    detail: "OPENAI_HTTP_ERROR",
    code: "OCR_PROVIDER_UNAVAILABLE",
    responseStatus: 502,
    calls: 3,
  },
];

for (const failure of failures) {
  test(`scan returns ${failure.code} for ${JSON.stringify(failure.body)} (HTTP ${failure.status})`, async (t) => {
    t.mock.method(console, "error", () => {});
    t.mock.method(console, "log", () => {});
    const fetchMock = t.mock.method(globalThis, "fetch", async () =>
      failure.body
        ? Response.json(failure.body, { status: failure.status })
        : new Response("Upstream unavailable", { status: failure.status }),
    );
    const response = await handleOcrRequest(scanRequest());
    const result = await response.json();
    assert.equal(response.status, failure.responseStatus);
    assert.equal(result.code, failure.code);
    assert.equal(result.detail, failure.detail);
    assert.doesNotMatch(result.error, /clearer image|not read enough/i);
    assert.equal(fetchMock.mock.callCount(), failure.calls);
  });
}

test("turbo scan also stops immediately when provider credits are exhausted", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "log", () => {});
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json(failures[0].body, { status: 429 }),
  );
  const response = await handleOcrRequest(scanRequest(true));
  assert.equal((await response.json()).code, "OCR_PROVIDER_QUOTA_EXCEEDED");
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("both structured and visible-text OCR preserve quota errors", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "log", () => {});
  t.mock.method(globalThis, "fetch", async () => Response.json(failures[0].body, { status: 429 }));
  for (const extract of [llmExtractEventFromImage, llmExtractVisibleTextFromImage]) {
    await assert.rejects(
      extract(flyer, "image/jpeg"),
      (error) =>
        error instanceof OpenAiOcrError &&
        error.code === "OPENAI_QUOTA_EXCEEDED" &&
        error.status === 429,
    );
  }
});

test("network failures and timeouts remain provider errors", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("fetch failed");
  });
  await assert.rejects(fetchWithTimeout("https://api.openai.com", {}, 100), {
    code: "OPENAI_NETWORK_ERROR",
  });
  t.mock.method(
    globalThis,
    "fetch",
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
      }),
  );
  await assert.rejects(fetchWithTimeout("https://api.openai.com", {}, 5), {
    code: "OPENAI_TIMEOUT",
  });
  assert.equal(getOcrFailureResponse(true, "OPENAI_TIMEOUT").status, 504);
});

test("empty model output still tries image and text fallbacks before reporting unreadable", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "log", () => {});
  t.mock.method(console, "info", () => {});
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      choices: [{ finish_reason: "stop", message: { content: '{"text":""}' } }],
    }),
  );
  const response = await handleOcrRequest(scanRequest());
  assert.equal(response.status, 422);
  assert.equal((await response.json()).code, "OCR_UNREADABLE");
  assert.equal(fetchMock.mock.callCount(), 3);
});

test("a provider failure is not hidden by a later empty extraction", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "log", () => {});
  t.mock.method(console, "info", () => {});
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () =>
    ++calls === 1
      ? new Response("Unavailable", { status: 503 })
      : Response.json({
          choices: [{ finish_reason: "stop", message: { content: '{"text":""}' } }],
        }),
  );
  const response = await handleOcrRequest(scanRequest());
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "OCR_PROVIDER_UNAVAILABLE");
});

test("an unconfigured scan retains its configuration error", async (t) => {
  delete process.env.OPENAI_API_KEY;
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "log", () => {});
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Must not call provider");
  });
  const response = await handleOcrRequest(scanRequest());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "OCR_NOT_CONFIGURED");
  assert.equal(fetchMock.mock.callCount(), 0);
});
