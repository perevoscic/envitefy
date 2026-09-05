# Snap OCR failure and measured cost — September 5, 2026

The failed upload of `september 28th.jpg` reached the OCR endpoint. OpenAI rejected
the primary extraction, color fallback, and text fallback with HTTP 429. The
provider body reported `credit_balance_exhausted` and `insufficient_quota`.
The route incorrectly returned HTTP 422 / `OCR_UNREADABLE` and told the user to
try a clearer image. This failure occurred before the flyer could be extracted.

The OCR client now classifies quota, authentication/access, rate-limit, network,
and other HTTP failures. The route returns an appropriate service error instead
of blaming image quality. Quota, access, and rate-limit failures stop immediate
fallback attempts; ordinary empty extraction still uses image/text fallbacks.
A provider failure is preserved if later fallback output is empty. Arbitrary
provider error bodies are no longer logged by the text fallback.

After the user added API credits, a live invocation of the actual OCR request
handler with their original JPEG succeeded with HTTP 200 in 7.125 seconds. Session
and persistence boundaries were isolated for this check; no event was created.
The handler extracted Livia's 8th birthday, September 28 at 3:30–5:30 PM, and US
Gold Gymnastics. The year 2026 is the application's inferred upcoming year; the
flyer does not print a year. This was a pipeline check, not a browser interaction.

## Actual request usage and estimated API charges

Using the September 5 standard short-context rates from
[OpenAI pricing](https://developers.openai.com/api/docs/pricing):

| Step | Model | Input tokens | Output tokens | Estimated USD |
| --- | --- | ---: | ---: | ---: |
| Image extraction | gpt-5.6-terra | 8,492 | 558 | $0.023680 |
| Birthday description rewrite | gpt-5.6-luna | 359 | 21 | $0.000097 |
| Total | | | | $0.023777 |

Both calls reported zero cached tokens. No image fallback or Astra escalation
was needed. This is about 2.4 US cents per comparable scan, or $23.78 per 1,000.
Actual charges vary with token usage, caching, additional attempts, and model.
This covers the OCR pipeline's model calls, not image generation or hosting.
Measurement: `artifacts/snap-ocr-cost-2026-09-05.json`.

## Validation

- 51 targeted checks passed, including 12 new behavioral checks exercising the
  actual request handler with mocked provider errors and isolated storage.
- Biome passed for all five changed OCR source/test files.
- Direct TypeScript validation reported zero diagnostics in the changed files.
  The imported dependency graph still reports the 76 existing diagnostics in
  `src/lib/meet-discovery/core.ts`.
- `npm run lint:vscode` could not run because the Chat to CLI diagnostics bridge
  was unavailable; the direct TypeScript compiler was used as the fallback.
- The previously deferred nine UI/auth structural tests were not changed.
