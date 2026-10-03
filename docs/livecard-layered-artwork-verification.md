# Live Card implementation evidence

Local QA, October 2, 2026. No production deployment, remote event creation or guest emails were performed. Real OpenAI experiments generated local files only. This report distinguishes implementation evidence from unverified deployment behavior.

## Retained behavior

Existing OpenAI image requests already disabled SDK retries and used a 180-second timeout. Text-free backgrounds, explicit draft saves, unsaved-navigation protection, successful-upload caching, idempotent history creation, online/physical destination separation and saved Registry gift messages were retained. The confirmed defect was the automatic second/third full-card lettering edit in `shared-card-headline.ts`; that loop was removed.

## Request counts

Inspection of the previous lettering loop established up to three paid full-card edits per lettering preparation. The reported roughly 100-second run was not reproduced with its exact inputs and is not a measured baseline.

Current real-provider full workflows used one background image request, one isolated lettering image request, two visual-check requests, zero automatic repairs, zero uploads and zero publications. Checker rejection tests confirm that no additional image request follows. Verification retry uses the exact same image; explicit wording repair requests lettering only. The explicit higher-quality background alternative reuses compatible lettering with zero lettering requests.

## Real-provider measurements

All image experiments used the configured `gpt-image-2.5-flare`, 1024×1536 PNG provider output, WebP application assets, and disabled transport retries.

| Experiment | Background | Lettering | Checks | Total elapsed | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Normal card, high, complete workflow | 1 | 1 | 2 | 46.721 s | Passed, both exact strings |
| Normal card, medium, complete workflow | 1 | 1 | 2 | 32.931 s | Passed, both strings; typographic wrapping/case accepted |
| Normal card, explicit high lettering retest | 0 | 1 | 1 | 21.526 s | Passed |
| No opening line, explicit high lettering retest | 0 | 1 | 1 | 20.814 s | Passed, title only |
| Reference-photo card, explicit high lettering retest | 0 | 1 | 1 | 19.001 s | Passed, opening/title preserved |

The retests reused backgrounds from three initial experiments whose lettering was rejected by deterministic transparency checks. Each initial experiment used one background and one lettering request and stopped; none automatically retried. Real outputs exposed conflicting scene-preservation language in the first layered prompt. After removing that conflict, three explicitly invoked retests produced isolated transparent layers. Earlier evidence files show `repair: 0` because the script did not yet count explicit QA retests; the table above identifies them accurately as explicit retests. The script now records these as repair requests.

High normal stage times: background request 16.108 s, background check 2.711 s, conversion 1.709 s, lettering request 20.528 s, composition 0.800 s, lettering check 2.678 s. Other time includes planning/application/file processing. The first background was available approximately 22.7 s after start, before lettering completed.

Medium normal stage times: background request 10.496 s, background check 3.028 s, conversion 3.680 s, lettering request 10.980 s, composition 0.775 s, lettering check 2.736 s. The first background was available approximately 18.4 s after start. These background-availability figures derive from the recorded total minus subsequent stages, including small application/file overhead; they are not provider timing claims.

These full runs had equivalent user direction/wording but independently planned scene details. A smaller controlled prototype used identical lettering prompt/reference: high took 18.313 s and medium 12.641 s, each one Images edit. Transparent pixel fractions were 0.620 and 0.513 respectively. Both printed the required opening/title, and the inspected compositions had usable contrast without opaque panels. One sample per configuration cannot establish a general speed improvement or failure rate.

High normal request IDs: `req_4cbeeac62c924236bbfbff1cdaf83492` (background), `req_dd0cec986d274bf18106cec532d8426e` (lettering). Available image usage: 624+2,181 input tokens and 1,372+1,372 output tokens. The controlled prototype reported 3,024 total tokens high and 1,995 medium. Actual billed dollar costs were not available. Full high evidence includes input revision, QA job ID, attempt, endpoint, model, quality, request IDs and usage. Earlier trials lacked the later request-ID capture and should not be described as fully instrumented.

Raw images and JSON are local under `output/livecard-provider-evidence/` and `output/lettering-probe/`. QA scripts are explicit opt-in tools, not called from product workflows.

## Partial preview experiment

One separate high-quality streaming background request returned partials at 8.796 and 13.474 s and completed at 17.451 s. Request ID `req_935a324a235a4a06acf351f6c3a854e4`; usage 41 input / 1,551 output / 1,592 total tokens. Its prompt differed from the complete workflow, so these timings/usage are not a comparable cost or speed improvement. Partials demonstrate earlier feedback from a single request. They are not treated as verified publishable assets. An initial malformed probe omitted the model and returned HTTP 400 before generation; it was corrected explicitly, not automatically retried by the application.

## Tests and browser evidence

- Existing creation remediation suite: 1,376 passed, zero failed/skipped, after the shared provider/quality and structured-check changes (the original 1,375 plus one new checker-outcome test).
- Focused worker/composition/headline tests: 18 passed. They cover duplicate dispatch, checker rejection, same-image verification, background reuse, isolated transparency, exact pixel preservation, local placement, queued cancellation, cancellation before completion and ambiguous-running-job non-replay. The composition checks also reject an inset opaque panel surrounded by transparent margins. Separately, 13 shared-design tests passed, including persisted placement bounds.
- `livecard-job-browser.test.mjs` passed with actual builder/public guest components. It checks refresh reconnect without POST duplication, high default/explicit medium selection, explicit higher-quality alternative, preservation until application, alternative recovery, retained earlier version, Review without generation/publication, selected-version publication, controlled upload failure/retry, and the configured five guest actions on online/physical/hybrid cards. Upload retry made four attempts for three distinct assets; only the failed asset repeated. History publication occurred once.
- The corrected existing Birthday Registry assertion navigates to the actual Gift List action and verifies the saved message and exact opened destination. Its broader existing browser suite passed after migration to the explicitly requested generation/proofreading/publication behavior. It retained venue retries/branch choices, concurrent edits, save failures, unsaved navigation, downloads and decoded QR destinations, mobile/landscape layouts, accessible controls and reduced motion. The run reported zero browser runtime errors.
- Targeted Biome lint passed across 16 changed application files, including the temporary wording preview component. Application typecheck passed. Both browser suites passed after the mock preview changes; the job browser also verifies four-minute reconnect, selected-version availability during an alternative job, Copy guest link and Share invitation with no repeated publication.

An additional real check recomposed the saved medium lettering on the previously generated high background using its saved layout. Composition took 0.713 s and validation 3.505 s; both exact wording blocks passed the new structured-finding contract. Counts were zero background, zero lettering and one verification request. Inspecting real cropped layers also exposed a local reuse defect: their transparent fractions were lower after trimming. Composition now accepts already validated cropped layers with bounded placement, while independently rejecting opaque crop panels. No new image was generated to repair that application defect.

## Changed files

- Builder/progress/layout: `src/app/live-cards/LiveCardBuilder.tsx`, `DesignGenerationProgress.tsx`, `PublishProgress.tsx`, `design-generation-progress.module.css`, `livecard-builder.module.css`.
- API/durable work: `src/app/api/livecard-builder/jobs/route.ts` (new), `src/app/api/livecard-builder/headline/route.ts`, `src/lib/livecard-artwork-jobs.ts` (new).
- Assets/model/wording: `src/lib/card-lettering-composition.ts` (new), `shared-card-headline.ts`, `shared-card-generation.ts`, `shared-card-design.ts`, `livecard-builder.ts`, `livecard-assistance.ts`, `livecard-generation-failure.ts`, `src/lib/studio/openai.ts`, `openai-image-stream.ts`, `output-checks.ts`.
- Tests/fixture: `scripts/build-livecard-builder-fixture.mjs`, `scripts/livecard-builder-browser.test.mjs`, `scripts/livecard-job-browser.test.mjs` (new), `scripts/livecard-artwork-jobs.test.cjs` (new), `scripts/card-lettering-composition.test.cjs` (new), `scripts/livecard-headline-progress.test.cjs`, `src/lib/shared-card-headline.test.ts`, `src/lib/shared-card-design.test.ts`, `src/lib/studio/output-checks.test.mjs`.
- Explicit QA tools: `scripts/livecard-provider-evidence.cjs`, `probe-livecard-lettering.cjs`, `probe-livecard-partial-preview.cjs`, `verify-livecard-lettering-probe.cjs`, `verify-livecard-reused-layer.cjs` (all new).
- Specification: `AGENTS.md`, `docs/livecard-shared-artwork.md`, `docs/livecard-layered-artwork.md` (new), this report (new). Local evidence logs are in `artifacts/livecard-layered-*.log` and `artifacts/livecard-provider-high.log`; raster/JSON outputs stay under `output/`.

The browser uses a local fixture shell and mocked authentication/jobs/history/uploads. Its published view is the actual `SharedStudioCardPage` with captured published metadata. It is not a deployed public event/database integration test. No invitations were sent.

## Build and crash investigation

The first production build compiled/typechecked and generated all 147 pages, then encountered Windows `EBUSY` while copying an edge chunk into standalone output. The repository's existing build retry completed. This file-lock failure is separate from the reported browser crash. Subsequent production builds passed, including the build after the layering, structured checker, quality/version, recovery and mock-preview changes; its compilation took 4.2 minutes, all 147 pages generated, and the process exited 0. The final recovery-button/selected-version availability refinements were also verified in the component browser and typecheck.

Development Next.js 15.5.25 navigation to `/live-cards` initially timed out at the browser's 60-second load deadline while `/landing` compilation took 90.6 s. That attempt established neither a builder defect nor the reported crash. After compilation, development and production navigation/reload returned HTTP 200 with no page/console errors. A final production smoke also passed navigation/reload and confirmed unauthenticated job GET returns HTTP 401 with the expected sign-in response. Runtime versions: Node v24.21.0, Next.js 15.5.25, React 19.2.8. Signed-out requests reached `/` through middleware, so authenticated generation was not exercised. Historical logs contain an unlocated `SyntaxError: Unexpected end of JSON input` on unrelated routes; there is no evidence tying that trace to the reported incident. The original crash remains unresolved/not reproduced.

## Integration limits

Cancellation was verified with controlled worker/browser races and provider transport abort wiring. Provider computation stopping or charge avoidance was not verified. The UI reports unknown provider execution.

The configured database is remote and was not identified as staging, so QA did not create its job table or run real job CRUD. SQL schema permissions, owner-scoped queries, Next.js `after` hosting lifetime and production recovery still require an authenticated staging integration run. A terminated running worker deliberately does not automatically replay an ambiguous paid request. Durable job data has no new retention cleanup policy in this change.
