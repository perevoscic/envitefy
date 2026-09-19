# Envitefy Create experience campaign

The campaign covers 31 creation families across Live Card, Flyer/Invitation, and Event Page: 93 conversations. Each has one realistic synthetic persona (mom, teacher, coach, gymnast, or general user), a fixed brief, missing details, a capability question, a factual correction, and two authorized artwork operations. These are agent simulations, not interviews with real customers.

The six pilots are birthday Live Card, field-trip Event Page, football Flyer/Invitation, gymnastics Live Card, anniversary Event Page, and baby-shower Flyer/Invitation. Sign-up-form requests are separate capability probes, not an additional output included in the 93.

## September 19 completion

All **93 category/output combinations** now have live attempts. Every latest attempt includes accepted initial artwork, verified explicit save/resume, local publication and an anonymous guest journey. **83** have a successful distinct appearance edit; **56** pass the complete technical guest-action checks. Independent review still identifies substantial prompt, content and usability defects; publication alone is not a pass.

The fresh $30 continuation recorded **$26.760582056**, leaving **$3.239417944** with no unsettled reservations. Lifetime recorded API cost is **$56.005981929**. The final report is `.qa/create-campaign/2026-09-18/index.html`; `additional-30/results-summary.md` breaks down results by persona, output and case. `additional-30/continuation-integrity-check.json` verifies the original 49 results remain available, all future-date briefs are bound to September 23, and the allowance was not exceeded.

### Additional $30 continuation

The user subsequently authorized a fresh $30 to finish the 44 untouched combinations. The continuation keeps the original ledger and frozen briefs, with a cumulative target of $59.245399873: the $29.245399873 already recorded plus exactly $30. The unused portion of the earlier allowance is not added on top. `additional-30/authorization.json` records this authorization, the frozen 44-case queue, and hashes of all 49 prior case results. The first queue skipped those prior results. After all 93 crosses were attempted, a targeted batch completed the previously interrupted Workshop Event Page, budget-deferred Game Day Event Page, and quality-blocked Track/Field, Birthday and Wrestling Live Cards. Original attempts and reviews remain archived. The report separates this continuation's cost from lifetime campaign cost.

```powershell
node scripts/create-experience-campaign.mjs --resume --all --breadth-first --untested-only --budget-policy=metered --budget-usd=59.245399873
```

The increase was accepted with `--allow-budget-increase` and an explicit `--budget-increase-reason`; subsequent resumes use the accepted ledger target without repeating the increase. The ledger is authoritative, and the manifest changes only after durable acceptance. The earlier stop below remains historical evidence.

The user then requested **September 23, 2026** for all future test event dates. The first three new journeys had already finished, so their original dates and evidence remain intact. The remaining 41 conversations use September 23, retaining their existing times and America/Chicago timezone. This is a recorded campaign override, not a rewrite of historical prompts. Per-attempt `scenario.json` records the exact effective brief; the campaign date policy also applies to later retests unless explicitly changed.

### Historical first $30 stop

The earlier $30 total campaign stopped with $29.245399873 recorded and no unsettled reservations. The remaining $0.754600127 could not cover the next request estimate. The exact blocker was the Game Day Event Page appearance-edit verifier (`gpt-6-astra`, `/v1/chat/completions`, turn 5) at `2026-09-19T06:33:50.788Z`. Its second image was delivered with automatic verification unavailable; downstream save/resume, publication and guest checks still ran. That archived attempt remains budget-deferred; its later retry is evaluated separately.

At that earlier stop, 49 of 93 combinations and all 31 families had live attempts. Forty-seven had accepted initial artwork, verified explicit save/resume, local publication and anonymous guest journeys; 43 had a distinct successful edit. Twenty-eight passed complete technical guest-action checks after correcting the Maps URL checker. Forty-four combinations were untouched. The completed continuation above supersedes those coverage counts.

Recorded costs include conservative usage bounds and earlier attempts, repairs and harness interruptions; they are not a provider invoice or Codex subscription usage. The report retains the exact queue, all prior attempts, artifact gallery, Q&A reviews, scored dimensions and known limitations. The original stop verified 104 WebP archives; `artifact-delivery-check.json` records the expanded final count and checks hashes, decoding, dimensions and temporary-original cleanup.

## Run commands

```powershell
npm run qa:create:plan
npm run qa:create:offline
npm run qa:create:run
npm run qa:create:resume -- --conversation-only
npm run qa:create:run -- --case=birthday--live_card
npm run qa:create:run -- --cases=workshop--event_page,game_day--event_page --phase=retest --event-date=2026-09-23
npm run qa:create:report
npm run qa:create:run -- --responsive-audit
npm run qa:create:resume -- --all --breadth-first --untested-only --budget-policy=metered
npm run test:create-campaign
npm run test:create-facts
```

The default run ID is `2026-09-18`. Use that same ID when resuming this campaign: creating another run must not reset its allowance. `--all` selects the full matrix; otherwise only the six pilots are selected. `--cases=<id>,<id>` selects an explicit ordered retry batch; duplicates, unknown IDs and combining it with `--case` are rejected. `--untested-only` excludes every existing case result regardless of verdict. `--start-at=<case-id>` begins at that case while retaining earlier evidence. `--breadth-first` keeps the six pilots first, then covers each remaining family once before the remaining crosses. `--event-date=2026-09-23` records the persistent future-attempt date policy. `--headed` shows the browser; `--phase=retest` or `--phase=contingency` attributes calls to those phases. Review evidence before repeating a case because each retry uses the same ledger. Explicit budget-transition flags and an authorization reason preserve every prior charge; subsequent resumes do not reset the allowance.

## Isolation and cost control

The runner creates a disposable local PostgreSQL cluster, regular non-admin accounts, loopback Blob storage, and captured `.eml` messages. It runs its own Next server on port 3108 behind a port-3107 proxy. The existing development server and configured remote database are not used. It signs in through the real credentials endpoint and interacts with `/chat` using Playwright.

Prerequisites are installed project dependencies, Chromium for Playwright, FFmpeg/FFprobe, PostgreSQL 17 or 18 binaries (`CAMPAIGN_PG_BIN` can supply a path), and an OpenAI key in the normal local environment. Windows may require permission to launch the owned PostgreSQL process. Secrets and database files remain in the ignored campaign runtime folder.

Only the local gateway holds the real OpenAI key. It serializes paid requests and reconciles reported usage into an append-only journal. Missing usage retains the reservation, including across restarts. Models, prompts, image size and image quality are preserved; requests explicitly use Standard service tier.

The default strict policy reserves a conservative maximum and enforces the original $6 baseline, $3 retest, and $1 contingency allocations. Optional metered mode preserves all prior spend, pools those allocations under the authorized total target, and reserves explicit estimates before sending. Observed costs replace estimates after responses finish. The final request can exceed the target; the estimate is not a guaranteed dollar bound. Missing usage, uncertain provider errors, quota failures, or a reached target stop further paid work. Ordinary rate limits are reported separately from exhausted account funds. Journal totals may include conservative usage-based costs rather than invoice-exact charges.

**Strict-policy limitation:** the verified conservative bound for Astra exceeds this allowance, and Flare documentation does not establish a guaranteed maximum charge per image request. Strict mode blocks these requests before billing. The completed continuation used metered policy with the authorized cumulative $59.245399873 target. `--conversation-only` collects partial conversation evidence; it cannot validate the complete extraction, artwork, publication, or guest journey. Model fallback or a campaign budget error is not a model-quality pass.

## Evidence and review

Output lives in `.qa/create-campaign/2026-09-18/`:

- `manifest.json`: frozen scenarios and initial source snapshot.
- `baseline/`: original working-tree patch and original offline evidence.
- `budget-journal.jsonl` and `ledger.json`: durable reservations, charges, and blockers.
- `execution.json` and `executions/`: current and archived checkpoints, exact stopping request, latest UI stage/turn, attempted cases, and remaining queue.
- `cases/<id>/result.json`: latest adjudicated browser result. Prior results are archived before replacement.
- `cases/<id>/attempts/<timestamp>/`: separate transcripts, screenshots, generation inputs and artifacts for each new attempt.
- `reviews/<id>.json`: independent review, Q&A evidence and partial scores.
- `offline-fact-matrix.json`: deterministic fact-preservation evidence, explicitly separate from live results.
- `campaign-review.json`, `report.md`, and `index.html`: findings, limitations, complete matrix and artifact gallery.

Reviews compare canonical draft/generation inputs with what the person requested, not just the assistant's reassuring reply. Verify Q&A claims against the implementation and actual guest behavior when available. Record time to reply, repeated questions, unsupported assumptions, lost details, visual fidelity, mobile usability, explicit save behavior, and completion. Keep scores absent when the relevant stage was not exercised.

The browser runner contains generation, appearance edits, real fullscreen desktop/mobile previews, explicit save/resume, publication and anonymous guest checks. It validates calendar/directions handoff URLs, local calendar files and one synthetic RSVP through supported guest forms. It blocks unrelated mutations and external navigation. Unsupported controls remain incomplete. These later stages still require a real isolated app run; local fixture tests verify harness mechanics only. External deliveries and completion in calendar/maps providers are outside this isolated run.

Passing requires independent review and complete supporting evidence: preserved event facts and saved artwork, two distinct verified image archives, decoded responsive previews, explicit persistence boundaries and supported guest actions. A successful request or reassuring assistant reply does not satisfy those checks.

An artwork operation counts only if a new successful artifact is observed; an earlier image cannot satisfy a failed redesign. Generated raster evidence is converted to verified WebP with FFmpeg quality 85/compression 6, preserving dimensions and transparency, before its exact source is removed. Screenshots and user reference images are separate from generated artwork. Conversion failures retain the source for recovery. Active Blob originals cannot be removed before their application URLs are migrated.

## Regression fixes from this campaign

- End/return-time replies preserve the event's start and timezone, reject the superseded old time, and handle ambiguous/invalid end times without silently moving the start.
- Venue corrections keep the full address and room, strip the rejected venue, and avoid treating a time correction as a location.
- Deterministic capability-question regressions preserve the checked event facts and copy; actual edits phrased politely as questions still apply. Later live results still expose omissions in other normalization paths.
- The tested exact-copy regressions carry quoted wording into approved canonical copy and the real studio generation input. Birthday and bilingual live cases provide supporting successes; the graduation live cases still lose their requested slogan and remain open defects.
- Explicit end/return corrections override stale model values in the normalizer and synchronize visible return schedules.
- Inherited category-picker labels, venue names, and explicitly rejected occasions cannot reclassify an existing event.
- Mobile navigation defaults closed even when the session starts on desktop; resizing no longer opens the drawer over the composer. Browser checks cover fresh mobile, resizing, explicit opening and Escape-close.
- Flyer artwork edits preserve the full approved address. The automatic address-removal instruction is now limited to Live Cards, avoiding a contradiction with Flyer quality checks. See `create-campaign-image-edit-findings.md` for the regression evidence and remaining Event Page typography issue.

The report carries additional observed defects and the current verification status. Passing the deterministic matrix establishes only the specific invariants checked; it does not establish that all 93 outputs are correct or visually satisfactory.

An explicit appearance quality rejection can now continue through preview, save/resume, publication and guest checks with the verified original artwork. This is labeled recovery, retains the failed edit finding, and cannot pass the two-artwork-operation requirement. Rejected final candidates are archived separately as unaccepted evidence. Internal edit-intake replies are separate from the messages actually rendered in chat.

## Validation

Run the campaign unit tests and `test:create-facts` after parser changes. Run Biome and the editor diagnostics bridge for edited TypeScript. If the bridge is unavailable, record that limitation and run targeted TypeScript diagnostics; a Next build alone is insufficient because this repository ignores build type errors.

The frozen initial briefs predate an improvement that explicitly names each category and uses `.invalid` RSVP addresses. Do not grade a model against category information absent from the actual prompt. New manifests include those improvements; the original evidence remains unchanged.

The historical first cycle ran six partial live conversations for $0.2107, with no generated artwork. Its campaign harness suite had 46 passing tests. The later authorized metered run exercises real artwork, edits, save/resume, publishing and anonymous guest actions; consult the report checkpoint for current coverage and spending.

All 93 deterministic capability-question and appearance-preservation checks pass. The Create fact suite passes 353 tests and the expanded campaign harness passes **127**. All 14 harness files changed in the continuation pass Biome lint. The Flyer address behavior tests pass all eight cases, including six that failed before the scoped fix. These regression results do not establish that observed live journeys meet their briefs.

The continuation also repaired an unbounded browser-response capture wait after a local development-server interruption. Browser response completion and body capture now have a 240-second deadline; closing capture rejects pending reads and bounds cleanup. Timeout/cancellation and large streamed-response fixtures pass. The interrupted Hockey attempt remains classified as infrastructure evidence, and a separate retry completes its journey; this harness repair is not a product fix.

Targeted checks report no diagnostics in the changed builder or campaign media adapter. Two builder dependency errors reproduce with a read-only substitution of the original HEAD builder; see `builder-type-diagnostics.json` in the run folder. This is not a full repository typecheck. The editor diagnostics bridge was unavailable. Biome reports no errors and three preexisting optional-chain warnings across the seven changed application files. One existing sidebar source-shape test still expects an old padding string in the unchanged chat client; the other five guards and the browser layout checks pass.

After the final paid run checkpoint at 14:43 UTC, the shared chat client and its snap-upload test were modified at 14:55 UTC and contained merge-conflict markers. This campaign did not make or resolve those edits. Campaign-scoped whitespace checks passed, while the whole-workspace check failed when inspected. `additional-30/post-run-workspace-check.json` records hashes, timestamps and marker locations. The final source archive explicitly includes campaign-owned files and records the baseline and current commits, even when shared-workspace commits advance. Unrelated later changes are excluded from that archive; the captured browser results do not validate the later whole checkout.

See `create-campaign-follow-up.md` for prioritized fixes, concrete acceptance checks and the remaining test plan. Independently reviewed live defects remain open even when deterministic checks or persistence checks pass.
