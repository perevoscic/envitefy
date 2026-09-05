# Snap latency analysis — September 5, 2026

## Finding

The successful browser attempt for `september 28th.jpg` shows a 5.869-second
OpenAI extraction inside a 24.127-second OCR HTTP request. Additional operations
then run sequentially before the event opens. The model is only one component
of the user-visible wait. Optimizing this sequencing is the first opportunity
to improve speed while keeping the same model, image bytes, and fact checks.

This is an analysis of current code and recorded local development logs. No
additional paid API calls or processing changes were made for this analysis.
These measurements do not establish current production latency or percentiles.

## Recorded successful browser attempt

Attempt: `scan_5fe2f49c-b90a-4d68-9ecd-7e7a576a7641`.
Evidence: `artifacts/concierge-review-2026-09-05/dev-server-restored.log`,
lines 9749–9883; corresponding navigation and calendar result in the error log.

| Stage | Recorded duration | Interpretation |
| --- | ---: | --- |
| `/api/ocr?fast=0&skin=0` | 24.127 s | HTTP request duration, including work outside the handler's timer |
| OCR handler, inside that request | 11.290 s | Not additional to the preceding row |
| Image preprocessing, inside handler | 0.121 s | Not a major delay for this JPEG |
| Primary OCR stage, inside handler | 5.964 s | OpenAI extraction itself reported 5.869 s |
| Description rewrite, inside handler | 1.591 s | Additional sequential model call |
| Other handler work, by subtraction | 3.614 s | Not individually timed; includes parsing, session, preview and database work |
| `/api/upload`, after OCR | 6.936 s | Includes a logged 2.3 s development compilation |
| `/api/history`, after media storage | 5.353 s | Includes a logged 3 s development compilation |
| `/api/events/calendar/auto`, after saving | 30.004 s | Returned `needs_connection`; no supported calendar connected |
| First event-page request, after navigation | 32.233 s | Coincides with a 17.3 s development compilation and other refresh requests |
| Subsequent requests for that event page | Typically 0.7–1.2 s | Shows the cold development request is not the warm-page baseline |

The OCR HTTP request exceeds the handler timer by 12.837 s. Compilation is
visible in the same interval; upload/dispatch/runtime overhead may also
contribute. Existing instrumentation cannot assign that whole difference to
one cause. The sequential endpoint durations total about 98.7 s in this
particular development run, excluding client gaps. That is not a production
SLA or a measurement of the user's most recent post-pause attempt.

Calendar sync is already disabled in current source by
`src/config/calendar-sync.ts`. `Dashboard.tsx` gates the calendar request on
that flag. The 30-second calendar delay is historical and must not be counted
as a still-active delay in the updated client bundle.

The earlier isolated live OCR check took 7.125 s: 5.417 s extraction stage,
1.256 s rewrite, 0.114 s preprocessing. It used the actual request handler and
provider, but isolated session/storage boundaries. It excluded media upload,
event persistence, navigation, and browser rendering. It therefore measured
neither the full authenticated OCR request nor the complete user journey.

## Current request sequence

`Dashboard.tsx` prepares the image, uploads it to `/api/ocr`, waits for the
complete response, then calls `uploadMediaFile` with the same source file,
waits for `/api/history`, optionally waits for calendar sync, and navigates.

Key locations:

- `src/components/Dashboard.tsx:937`: client image preparation.
- `src/components/Dashboard.tsx:961`: OCR request.
- `src/components/Dashboard.tsx:1279`: transition from OCR to creation.
- `src/components/Dashboard.tsx:1488`: media upload after extraction.
- `src/components/Dashboard.tsx:1770`: event save after media upload.
- `src/components/Dashboard.tsx:1809`: calendar-sync gate.
- `src/components/Dashboard.tsx:2003`: navigation after the preceding work.

The original, display, and thumbnail blob writes already run together in
`src/lib/media-upload.ts:400`. Parallelizing those writes again is not an
available improvement; the missed overlap is between media processing/storage
and OCR itself.

## Recommended order, retaining extraction quality

1. **Measure a prebuilt application and add complete stage timings.** The
   development compiler is a large measured contributor. Benchmark cold and
   warm production builds separately, with the same flyer and device/network.
   Record preparation, transfer, handler, extraction, rewrite, session,
   diagnostic write, storage, save, navigation and first useful render under
   one attempt ID. Add p50/p95 only after collecting multiple attempts.
   `Server-Timing` plus browser timings would expose the current unmeasured
   3.614 s inside the handler and overhead outside it.

2. **Upload once and overlap OCR with media storage.** Reuse one validated image
   buffer for extraction and the existing original/display/thumbnail storage.
   Those branches are independent; wait for both before committing a complete
   event. Preserve original image bytes, processing quality, ownership checks,
   and persisted-media requirements. Use an attempt ID for idempotency and
   clean up unclaimed media on failed/cancelled scans. This hides the shorter
   branch's duration instead of adding both durations. The exact saving needs
   a benchmark; the recorded 6.936 s includes development compilation.

3. **Move diagnostic work out of the response path.** The OCR handler awaits a
   troubleshooting JPEG, session lookup, scan-attempt insert and counter update
   before returning. `ensureScanAttemptsSchema` also performs eight sequential
   schema/index/backfill queries on the first call in each module lifetime;
   counter updates have their own schema guard. Put schema work in migrations.
   Keep required authorization, event persistence and usage accounting reliable;
   queue bulky diagnostic previews through a durable job or transactional
   outbox. Do not replace these writes with an untracked promise. This does not
   change extracted facts; its exact savings are not yet isolated.

4. **Keep optional copy polishing off the wait for initial event facts.** The
   rewrite cost 1.591 s in the browser run and 1.256 s in the isolated check.
   It can overlap media storage. If it runs after initial display, show the
   source description or existing deterministic sentence first and apply a
   version-checked update so user edits are preserved. Keeping exactly the same
   polished text at first display still requires waiting for this call; removing
   it changes prose behavior even though OCR fact quality remains unchanged.

5. **Make post-save navigation lightweight.** Seed the client from the event
   returned by `/api/history`; deduplicate dashboard/sidebar refreshes and
   prefetch the event route after the ID is available. Split template-specific
   dependencies if production bundle traces justify it. Preserve authentication,
   passcode and ownership checks. When calendar sync is restored, use a reliable
   background job with visible status instead of blocking event opening on it.

6. **Avoid repeated venue discovery for flyers without street addresses.**
   `enrichOcrVenueAddress` serially tries query variants and Google New/Legacy,
   Mapbox and Nominatim, with individual 3.5–4 s timeouts. It can also run again
   in the public event renderer when an address is still missing. Save/cached
   lookup outcomes with venue and geographic context, share in-flight work,
   and enrich after initial display with a pending state. Preserve evidence
   and user corrections. This was not the cause for this flyer: its printed
   street address already triggers the skip condition.

## Lower-priority or quality-sensitive changes

- The 1.2-second minimum scan animation is real, but its time is already elapsed
  on a six-second extraction. Removing it helps fast cases, not this slow run.
- Client recompression is skipped for this 1.4 MB JPEG because it is below the
  3.75 MiB threshold. Extra downscaling would not address the measured delay and
  may damage small-text recognition. Server preprocessing took only 0.121 s.
- Skin selection and schedule extraction were both zero in this run. No OCR
  fallback or Astra escalation occurred. They are not explanations for this wait.
- Shortening the 2,810-word prompt and the schema is valuable for cost, but
  latency improvement must be measured. Preserve evidence, source wording and
  all relevant fields. OpenAI's latency guide cautions that input-token
  reductions usually produce smaller latency gains than request/output changes.
- Switching from Terra to Luna, reducing image detail, shortening timeouts, or
  deleting extraction safeguards cannot be presented as quality-neutral. Test
  those separately after fixing sequencing; they are not required for the
  improvements above.

## Acceptance checks for implementation

Use the existing model, prompt and image settings for the first comparison.
Check event title/theme, supported age, date/year handling, start/end time,
venue/address, RSVP, source evidence, original media and final rendered output.
Include upload failure, OCR failure, cancellation, duplicate submission,
background retry and user edits during enrichment. Report time to useful event
content separately from time until optional enrichment completes.

Reference: [OpenAI latency optimization](https://developers.openai.com/api/docs/guides/latency-optimization).
