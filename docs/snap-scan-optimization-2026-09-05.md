# Snap scan optimization — September 5, 2026

Implemented and tested with the supplied `september 28th.jpg`. Automatic extraction now uses `gpt-5.6-luna` and makes no copywriting call. Phone numbers, emails, URLs, addresses, names, footer notes and other printed details remain part of extraction. The full transcript and evidence contract remain intact.

## Changes

- The extraction instructions are now 837 words / 6,015 characters. Repeated instructions and long examples were consolidated; no event fields were removed. Image preprocessing, resolution and compression settings were preserved.
- Shared evidence definitions use JSON Schema references: the schema sent to OpenAI shrank from 8,763 to 5,388 characters. A regression test expands the references and verifies exact equality with the original validation schema.
- Automatic scanning no longer requests copywriting. An explicit `rewrite=1` request still supports that operation. Existing deterministic description formatting remains.
- Scan accounting and diagnostic queue insertion commit atomically, once per user/scan-attempt ID. Preview generation runs through Next.js `after()` with a durable Postgres queue and a protected scheduled retry endpoint. Jobs use leases, bounded retries and the existing 30-day diagnostic retention window. Durable image bytes are still enqueued before the response; this is not an untracked background promise.
- Scan-specific table/index creation and counter-column setup moved to a migration. Event saving and linking to the scan remain synchronous.
- The saved row immediately populates the sidebar. Automatic saves no longer force history/dashboard refreshes during navigation. Dashboard data refreshes when needed on the dashboard. A later refinement preserves other sidebar rows when an older history request finishes after a save, while rejecting reads across cache resets.
- New timings separate session lookup, address enrichment, and accounting/queue insertion. The response exposes `Server-Timing`; `timing=1` also includes the timing object.
- Fixed an existing birthday-title formatter that duplicated an age when a printed theme separated “8th” from “Birthday”.

## Real flyer results

The final prebuilt browser test used the complete original flyer, normal OpenAI extraction, normal image upload, a temporary account, actual database saving and navigation to the event page. It checked the visible event heading, stored details, accounting, background preview and subsequent network requests.

| Final browser measurement | Time |
| --- | ---: |
| Upload selected → visible event heading | **8.648 s** |
| OCR request | 6.415 s |
| Image upload | 0.836 s |
| Save event | 0.610 s |
| Save completed → visible event heading | **0.748 s** |
| Redundant history/dashboard refreshes after saving | **0** |

The initial `/snap` page opening took 3.207 seconds, before selecting the flyer. These are local measurements from a production build, separate from development compilation; they are not production latency guarantees or a broad model-quality evaluation.

Confirmed details: Livia’s **8th Flippin’ Awesome Birthday Party**, September 28, **3:30–5:30 PM**, **US Gold Gymnastics**, **12432 Emerald Coast Pkwy, Miramar Beach, FL 32550**, and **Veronica / 850-960-1214**. The application resolved the unprinted year and converted the times to UTC with the event timezone. A separate offline pipeline test confirms preservation of both a phone number and an email address.

### Tokens and API cost

| Measurement | Previous scan | Luna scan |
| --- | ---: | ---: |
| Extraction input tokens | 8,492 | **4,888** |
| Automatic copywriting calls | 1 | **0** |
| Measured total model cost | $0.023777 | **about $0.00169** |

That is approximately **42% fewer extraction input tokens** and **93% lower model cost** in this example. About $0.00169 is **0.17 cents**, not 17 cents. The standalone Luna comparison used 591 output tokens; the final browser extraction used 592. These figures exclude hosting, database and blob-storage charges. Rates: [official OpenAI pricing](https://developers.openai.com/api/docs/pricing).

### What happened to the unexplained 3.6 seconds?

The old measurement did not time those operations individually, so its exact split cannot be reconstructed. In the final prebuilt scan, the handler recorded:

| Backend stage | Milliseconds |
| --- | ---: |
| Image preprocessing | 90 |
| Model extraction and validation | 5,366 |
| Session lookup | 422 |
| Atomic accounting and durable queue insertion | 466 |
| Other parsing/normalization and handler work | 63 |
| Address enrichment, copywriting, schedule extraction and skin inference | 0 |
| Total handler | **6,407** |

The newly separated work beyond preprocessing/model extraction was **951 ms**. The diagnostic preview was completed after the response, and the saved scan remained linked to its event with exactly one counter increment.

## Validation and operation

- **55 targeted offline checks passed**, including the one-call scan behavior, phone/email retention, schema equivalence, evidence validation and birthday-title regression.
- PostgreSQL integration checks passed using temporary tables and rollback: duplicate attempts count once, failures roll back accounting, preview failures retry, expired leases recover, and previews preserve saved-event links.
- The prebuilt full-flyer browser check passed and a screenshot was captured. All test accounts, events and uploaded assets were removed.
- The retry endpoint returned **401** without authentication and **200** with the configured secret.
- Biome passed. Direct TypeScript checks found **zero errors in the changed files**. The VS Code diagnostics bridge is unavailable; the broader dependency check still reports 76 existing errors in `meet-discovery/core.ts`. The deferred UI/auth tests were not changed.
- A Windows packaging lock interrupted the first production build; the repository’s retry build completed successfully. The subsequent small sidebar race refinement was separately checked with Biome and TypeScript.

The configured database migration has been applied. Other deployment environments must apply `node scripts/migrate-scan-diagnostics.mjs` before running this code and provide `CRON_SECRET`. Vercel retries `/api/internal/scan-diagnostics` every minute; self-hosted installations need an equivalent authenticated scheduler. This task did not deploy the application.

Evidence: `artifacts/snap-prebuilt-benchmark.json`, `artifacts/snap-prebuilt-result.png`, `artifacts/snap-prebuilt-server.log`, `artifacts/snap-ocr-luna-2026-09-05.json`, `artifacts/snap-optimization-tests.log`, and `artifacts/snap-diagnostics-integration.log`.
