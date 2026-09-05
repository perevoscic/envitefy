# Hotel discovery implementation — September 5, 2026

Event URL and PDF inputs now share hotel extraction and source evidence. This change is wired into the existing gymnastics discovery paths: discovery v2, inline enrichment, and the explicit enrichment API.

## Collection and storage

- Read actual PDF annotation URLs with page numbers and nearby text from PDF coordinates, alongside page text. Preserve booking query parameters and fragments.
- Parse hotel sections into separate records; stop at unrelated sections such as Local Attractions. Preserve hotel names, addresses, rate qualifiers, distance, parking, breakfast, deadlines, phones, booking instructions, links, and notes.
- Follow relevant hotel-list pages, preferring an organizer's hotel hub over a vendor link. Keep original source, followed URLs, PDF page, and redirect provenance. Reject explicit mismatched event years in target/redirect paths.
- Use Firecrawl v2 markdown retrieval, then Playwright, then the existing optional Browser Use integration. Source-grounded Astra extraction handles difficult layouts when configured; fields require quotations inside the hotel's source block. No autonomous Firecrawl agent job is submitted.
- Default overall budget: 25 seconds; caller override capped at 60 seconds. Follow at most three target pages. Propagate cancellation and close browser resources. Keep known facts and fallback links when enrichment fails.
- Save schema version 3 at `event_history.data.discoverySource.travelAccommodation`, with `complete`, `partial`, `link_only`, or `unavailable` status, evidence, source history, conflicts, attempts, and check time. No database migration is needed.
- Preserve conflicting source values in evidence and leave the disputed field empty. Normalize only unambiguous, complete calendar dates into `reservationDeadlineISO`; keep published wording.
- Atomically update only the nested accommodation state, preserving other discovery metadata. Invalidate both history and dashboard caches.
- Project hotel records into the event's logistics cards. Keep field baselines to preserve host edits, explicit clears, and deleted cards on rediscovery. Public copy uses those projected facts. Address and booking instructions are rendered with the reservation action.

## Validation

- 20 targeted behavior tests passed, including a real headless Chromium DOM extraction and a browser-generated PDF with an embedded reservation hyperlink.
- Existing sample-PDF text extraction passed; eight relevant source/wiring checks passed.
- Read-only live Playwright extraction of the [Fright Invite event](https://usacompetitions.com/south-florida-fright-invite/) succeeded: one Fort Lauderdale Marriott Coral Springs hotel, $162 plus tax per night, October 2, 2026 reservation deadline, full Marriott group reservation URL, and no attraction text. Result: `artifacts/fright-invite-hotels-live.json`.
- Biome lint passed on the touched application files. The VS Code diagnostic bridge is unavailable; the direct compiler check still reports the 76 existing diagnostics in `src/lib/meet-discovery/core.ts` and no diagnostics in the other touched modules.
- The broader renderer suite reports 24 passes and 21 failures. Loading its unchanged HEAD implementation produces the same 21 failing test names; there are no new renderer failures. Logs: `artifacts/travel-renderer-tests.log` and `artifacts/travel-renderer-baseline-tests.log`.
- Astra and Firecrawl request behavior was verified with mocked responses. Live paid-model extraction, authenticated event save, and production deployment were not exercised. The live browser result does not establish hotel room availability.

Run targeted checks with `node scripts/run-travel-tests.mjs`; it also accepts explicit test paths. The nine previously deferred UI/auth structural failures remain outside this change.

API references checked: [Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra), [Firecrawl scrape API](https://docs.firecrawl.dev/api-reference/endpoint/scrape).
