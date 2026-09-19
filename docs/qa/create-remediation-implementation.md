# Envitefy Create implementation and release status

September 19, 2026. Implemented in the shared working tree; **no new artwork, paid model calls, publication or deployment**. New focused event fixtures use **September 23, 2026**. Archived transcript dates and assets remain unchanged.

The captured failures now have substantial code fixes and repeatable offline checks. This is **not completion of every architectural item in the plan or deployment qualification**. The original campaign remains 1 passed / 92 failed; its old images are not relabeled as repaired. The machine-readable [implementation register](create-remediation/implementation.json) links all 584 finding records to the 31 work packages and their current evidence. No individual historical finding is closed solely because a related unit test passes.

Final verification: **1,058/1,058 combined offline checks and 2/2 browser integration checks passed**, with no skips. All **463 original structured-evidence hashes** and **200 archived image hashes** remain unchanged. **All 115 reported TypeScript diagnostics are fixed**, along with one additional generated-route signature mismatch. The application check completes with **zero errors**, and the **production build passes with exit code 0**. No deployment was attempted.

## Implemented behavior

| Area | Change and practical result |
| --- | --- |
| Request understanding | Full titles and selected products survive corrections, questions and injected unrelated model changes. Anniversary, audience age and school/property semantics stay distinct. Polite requests to add required wording are applied. Oversized chat messages fail clearly before processing instead of silently losing trailing facts. |
| Event facts | Canonical event clocks use the event timezone; auxiliary warmup/arrival clocks no longer replace the start. Missing clocks and ends remain missing. Date-only and return-time corrections preserve the remaining schedule. Full venue, room and address reach guest actions. |
| Required wording | Versioned sourced public content retains safety, equipment, eligibility, exact slogans and bilingual lines independently of style notes. Explicit replacement/removal and longer wording are covered. Unrequested gift wording is removed. Overlong generation contracts stop with an actionable error instead of truncating required copy. |
| Honest chat | The real streaming route supplies the previous draft and an actual change receipt. Sentence buffering prevents false save/publication claims leaking between tokens. Replies cannot acknowledge unrelated or unapplied field changes. Capability answers distinguish accepted artwork downloads, static images, actual RSVP and unsupported forms. Generated-draft questions no longer become fake edit acknowledgments. |
| Correct edit destination | Event Page lettering size/contrast/foreground changes update HTML with zero image calls. Repeated larger requests increase to the supported 150% limit and report the limit accurately. Mixed requests separate background changes. Unsupported font/layout operations receive a clear limitation; they do not claim completion. |
| Artwork contracts | Generation and verification share approved/required content, semantic constraints, explicit palette, prohibited fake controls and product geometry. Initial/edit/repair candidates are decoded and checked before acceptance. One targeted repair retains both QA outcomes; failures preserve the accepted artwork. Redacted telemetry records request/contract identifiers and issue codes. |
| Preview and guests | Full artwork remains visible, with controls outside it. Event Page fullscreen preview uses the page renderer and scoped readable typography. Calendar/ICS retain canonical clocks, full location and public instructions. Physical locations have Directions. Flyer downloads use the accepted asset's actual bytes and media extension. |
| RSVP and lifecycle | Client and server share gender-guess rules; failed submission retains the form, retries can succeed, and previews never submit. Cancelled/superseded edits cannot replace accepted artwork or claim success. Existing explicit Save/Publish boundaries remain; no autosaving was added. |
| Reporting and prevention | New report rendering separates quality verdict, review completion and original browser checkpoint. A historical scoped fix cannot close a later failure. CI runs the combined regression suite and isolated browser checks; outbound provider traffic is blocked in the offline runner. |
| Type and build integrity | Removed unreachable legacy discovery/rendering code, corrected preview identities and shared RSVP typing, fixed the map crash and aligned the thread-delete route with Next's promised params. A committed application configuration checks source and fresh generated route contracts. CI runs it, and production builds no longer ignore TypeScript errors. |

Detailed changes, tests, file ownership and limitations: [chat/facts](../../.qa/create-campaign/2026-09-18/implementation/chat-facts.md), [artwork contracts](../../.qa/create-campaign/2026-09-18/implementation/art-contracts.md), [guest flows](../../.qa/create-campaign/2026-09-18/implementation/guest-flows.md), [TypeScript cleanup](../../.qa/create-campaign/2026-09-18/implementation/typescript-cleanup.md).

Independent integration review also caught and corrected accepted Gender Reveal cards inheriting Baby Shower RSVP rules, stale preview selection after a product switch, false no-op edit acknowledgments, precise headline/date receipt comparisons, mixed background/font classification and Q&A wording that disagreed with default gender-guess requirements. Canonical `eventKind` now survives accepted metadata hydration without changing the legacy visual category.

## Verification and its limits

- The durable replay covers **93 original journeys, 31 categories × three outputs**, independent expected facts/public instructions, deliberately faulty normalization and saved payload projection. It works without the local campaign archive. It is not 93 newly generated/published browser journeys.
- Actual component/CSS checks decode **200 archived WebPs**, verify their hashes remain unchanged and measure eight viewport/landscape/short-height layouts. Hero contrast is checked from computed colors. The old anniversary image used in the renderer fixture is deliberately negative historical evidence, not a corrected Workshop invitation.
- A hydrated real RSVP form exercises required selection, the actual request body, HTTP 400 retention, successful retry, zero preview writes and keyboard focus restoration. Backend responses are intercepted; no database or email is contacted.
- The actual streaming route is tested with a faulty streamed persona response; the delivered reply is guarded and the final state agrees. Client handler tests execute supported/unsupported/mixed edits and delayed/cancelled responses.
- Consolidated results are in [remediation-tests.log](../../.qa/create-campaign/2026-09-18/implementation/remediation-tests.log) and [browser-final.log](../../.qa/create-campaign/2026-09-18/implementation/browser-final.log). Counts in individual workstream reports overlap and must not be added together.
- Scoped Biome checks pass. `npm run typecheck` regenerates Next route contracts and checks application source with zero errors; see [compiler evidence](../../.qa/create-campaign/2026-09-18/implementation/application-typecheck-final.log). The committed `tsconfig.application.json` excludes tooling archives and test files from the application check; the regression suites run separately. The VS Code diagnostics bridge is unavailable.
- The [production build](../../.qa/create-campaign/2026-09-18/implementation/production-build.log) completes with exit code 0 and all 137 static pages generated, with TypeScript errors configured to block it. Windows Webpack cache-renaming warnings and Next's edge-runtime static-generation notice were nonfatal. This validates the shared working tree, not a deployed environment.
- [Candidate source hashes](../../.qa/create-campaign/2026-09-18/implementation/candidate-source-manifest.json) identify the affected current files. The workspace includes pre-existing and concurrent changes; this is not an isolated, committed release candidate. Original campaign evidence hashes are checked separately by the implementation manifest builder.

Run the checks again:

```powershell
npm run typecheck
npm run test:create-remediation
npm run test:create-browser
# Require the complete local archive instead of the clean-CI geometry fixture:
$env:REQUIRE_CREATE_CAMPAIGN_ARCHIVES = '1'
npm run test:create-browser
```

CI runs the type check and both test commands on Node 24 with Chromium. The ordinary browser command uses archived assets when available; clean CI uses a small geometry fixture and does not claim the 200-image replay. `npm run build` enforces the same application TypeScript configuration.

## Remaining work before deployment

1. **Complete remaining architecture and acceptance.** Extend the existing scoped edit contract into comprehensive per-field provenance/transaction history; normalize complex itinerary segments and location roles; unify uploaded-source public requirements. Add the full mutation/lifecycle matrix, complex multi-day/DST/locales, and saved preview/public equivalence across all categories. Current fixes cover the captured cases, not every future phrasing or schedule.
2. **Freeze a candidate.** The recorded TypeScript blockers are resolved and the working-tree production build passes. Review concurrent workspace changes and create a reproducible release revision, then run the enforced checks on that revision. Keep `ignoreBuildErrors` disabled.
3. **Finish operational controls.** Add/configure protected attempt retention, provider cost correlation, alerts, source/accepted-asset linkage and a versioned rollout/rollback switch. Do not introduce autosaved drafts or raw private prompt/contact logs. Richer page font/layout controls and general layout-capacity resolution remain explicit enhancements.
4. **Qualify real chat without images.** Use a separately capped text-only run of revised extraction/persona prompts through the real streaming route, with image endpoints blocked. Re-score the 117 Q&A assertions and the 93 representative briefs against the original requirements. Mocked responses cannot establish live model understanding.
5. **Qualify staging and later artwork separately.** Use isolated data and a mail sink for full saved/published/guest ownership flows; verify calendar/maps handoffs, remote downloads and native/mobile behavior. A later small image canary is needed to evaluate actual text, composition and vision recall. No image regeneration is part of this implementation. Real moms, teachers, coaches and gymnasts still need to validate usability and expectations.

The former 115-diagnostic inventory is retained in the [before log](../../.qa/create-campaign/2026-09-18/implementation/application-typecheck-before-cleanup.log). The [cleanup record](../../.qa/create-campaign/2026-09-18/implementation/typescript-cleanup.md) maps every scope to its correction and prevention checks. None remain in the final application check; these were compiler diagnostics, not 115 distinct user-visible bugs.

The earlier additional $30 ledger remains unchanged: recorded usage $26.760582056, remainder $3.239417944. This work added **$0 campaign-provider spend**. These figures do not describe Codex account usage or billing.
