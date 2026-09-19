# Prompt, artwork and edit-contract remediation plan

This is a plan for code and prompt fixes using the existing campaign evidence. No new art is required now. Longer prompts alone will not resolve contradictory copy rules, wrong canonical facts or preview CSS. Build one explicit approved contract and use it at every boundary.

Observed campaign coverage remains31 families × three outputs =93 cases. Tests of printable_flyer are a clearly separate future offline extension for an existing supported code path; this plan does not claim that printable was live-tested or add it to the93-case results.

The JSON companion maps each group to finding IDs, cases, latest and historical review files and their exact evidence paths. A mapped historical rejection remains a historical reliability finding even when the latest retry succeeded; it is not counted again as a latest failure.

## Sequence and ownership

1. Canonical facts/requirements and identity/format.
2. ART-01 shared compiled contract.
3. ART-02 product-aware routing and ART-06 copy formatting.
4. ART-03 verification policy with ART-04 repair/diagnostics.
5. ART-05 semantic bounds and ART-07 geometry/assets.
6. Shared renderer/guest action fixes.
7. Offline matrix and captured-asset browser release checks.
8. Explicit release decision with live-provider limitations recorded.

One agent should own the new shared specification/types and coordinate its interfaces before parallel edits. After that, one agent can own copy/contracts, one edit/verifier/repair, and one shared preview/guest rendering; a separate reviewer can replay the matrix when code settles. Do not have agents rewrite the same large chat or studio file concurrently. Merge in dependency order and require independent acceptance evidence.

## ART-01 — Compile one approved content contract before planning, generation, edits and verification (P0)

Dependencies: Canonical fact/provenance workstream; Requested format and event identity workstream.

Source modules: `src/lib/studio/types.ts`, `src/lib/studio/artwork-copy.ts`, `src/lib/studio/product-contract.ts`, `src/lib/studio/product-prompts.ts`, `src/lib/studio/output-checks.ts`, `src/app/studio/studio-workspace-builders.ts`, `src/app/chat/ConciergeChatClient.tsx`.

**Confirmed causes and limits**

- approvedArtworkText(event, live_card) returns only artworkHeadlineBlocks; explicitly approved slogan is not included, even when creativePlan promises it.
- Flyer expected-copy list is derived from a subset of event fields. The archived Lantern reproduction proves its explicitly required safety text is excluded and would be marked unexpected_text if rendered.
- PRIVATE_DIRECTION is prohibited from becoming guest copy. Practical facts wrongly assigned there become unavailable to image/page copy, even though chat acknowledged them.
- CreativePlan.textPlacement is free text validated only for nonempty value; it can promise copy not permitted by the artwork whitelist.
- Limit: The Lantern conflict does not prove the missing final vision issue list; it proves a contradictory application contract.
- Limit: Correcting a whitelist alone cannot prove a future provider will spell and place the text correctly.

**Implementation**

1. Introduce a typed, versioned creation specification built from canonical approved facts: content blocks have stable IDs, purpose (identity, schedule, eligibility, preparation, safety, contact, gift), exact/semantic wording requirement, source turn/evidence, importance, and intended surfaces. Separate visual direction and private notes.
2. Compile product-specific ArtworkSpec, PageSpec and GuestActionSpec from that one specification. Live Card defaults to headline imagery plus actual detail panels; explicit show-this-line-on-the-card requests add an approved artwork block. Flyer includes all supplied essential logistics/contact and required copy. Event Page raster stays text-free while required copy goes into HTML.
3. Make the creative plan select block IDs and layout treatment instead of inventing or excluding factual text through textPlacement prose. Assert planned text, generation text and verifier text agree before a paid call. Missing required fields or mutually incompatible surface instructions return a concrete local resolution state.
4. Do not silently remove an explicit artwork request to satisfy the headline default. If the request exceeds the supported format, offer a concrete composition or format choice and accurately describe where each line will appear; preserve all content while unresolved.
5. Bind copy contract/version/hash to accepted artwork and edit request. Appearance-only edits retain the approved content contract; factual or exact-copy corrections produce an explicit delta. Keep source evidence independent of model prose.
6. Preserve the already fixed Flyer street-address edit behavior and fact-preservation guards. Fix upstream fact assignment rather than printing private guidance wholesale.

**Offline regression evidence**

- Replay birthday latest opening/request: Ready, set, celebrate! is a required artwork block, appears in the compiled image/verifier payload exactly once and cannot be lost by headline normalization.
- Replay Lantern Flyer request and archived expected-copy reproduction: both battery-only/no-open-flame clauses are in required artwork and guest copy; adding the correct safety line is not unexpected_text, omitting it is missing_copy.
- Use Lacrosse non-contact requirement, Hockey equipment/warm layers, Workshop eligibility/materials, Field Trip lunch/water and bilingual Baby Shower fixtures across the observed 31 families × three products (93 cases). Add printable_flyer as a separate future offline coverage extension; it was not part of the observed93. Assert intended surface coverage, not a requirement to place every note in every raster.
- Mock a creative plan that excludes a required safety line or promises a line absent from the compiled contract; reject locally with zero image calls. Mock only visual motifs to ensure they never become event facts.
- Exercise correction, Q&A, appearance edit, save/resume and publish with a fake provider returning existing assets; inspect the same contract and required content at every boundary.

**Acceptance**

- No required content is silently lost or reclassified as private style/gift metadata.
- Planner, image generator, verifier, page renderer and action builders refer to one approved content version.
- Every explicit on-artwork line is either supported and required or remains visibly unresolved before generation; no false promise.

Mapped evidence: 19 unique case/finding pairs across 16 cases. See art-contracts-plan.json#/issueGroups/0/findings. Historical and latest occurrences are preserved separately.

## ART-02 — Route each requested change to its real surface (P0)

Dependencies: ART-01; Published/preview shared-renderer workstream.

Source modules: `src/app/chat/ConciergeChatClient.tsx`, `src/app/studio/studio-workspace-builders.ts`, `src/lib/concierge/artwork-edit-scope.ts`, `src/lib/concierge/visual-direction.ts`, `src/lib/studio/product-contract.ts`, `src/lib/studio/product-prompts.ts`, `src/lib/studio/output-checks.ts`, `src/lib/studio/generate.ts`.

**Confirmed causes and limits**

- The captured Field Trip Event Page edit forwards larger lettering to image generation/verification while event_page artwork forbids all text.
- verifyStudioArtwork explicitly checks every requested font change against the raster; it does not exclude HTML-only typography requests.
- Chat builds visible time/date/location replacements without a product-surface argument. Studio has a partial Live Card address exception, not a complete surface routing model.
- Limit: Other rejected Event Page edits are consistent with this conflict but their exact QA issue lists were not preserved. Do not claim one cause explains every rejection.
- Limit: football-flyer-address-removal-contradiction is a historical defect with a later scoped source fix and recorded offline regression checks (docs/qa/create-campaign-image-edit-findings.md). Retain it as a fixed-behavior guard requiring fresh regression on the integrated revision; do not label it an observed latest failure.

**Implementation**

1. Parse an edit into independent typed deltas: event facts/copy, raster imagery, artwork lettering, page typography/layout and guest actions. Resolve target using selected product and accepted artworkTextMode; do not use one giant free-text edit for every surface.
2. For Event Pages, darker background edits the raster or configured hero treatment; larger readable lettering changes HTML typography/foreground. A typography-only edit makes zero image calls. For Flyers and Live Cards, lettering changes can remain raster edits when text belongs to that artwork.
3. Send only image-target requirements into requestedArtworkRequirements and image QA. Test page typography/contrast on the actual page; report completion per requested delta rather than saying the entire request succeeded because one image changed.
4. Keep in-memory accepted state and proposed state separate. Commit every validated compatible delta together; if image edit fails, retain prior accepted image/facts and explain which requested part remains unapplied. Do not make a user repeat a valid factual correction because an appearance operation failed.
5. Use product/accepted content policy for visible address, date and time corrections. Preserve uploaded source wording when its explicit contract includes logistics; do not apply new-card headline defaults to unrelated existing artwork.

**Offline regression evidence**

- Replay the actual Field Trip darker/larger request and assert text-free image prompt contains no font requirement, PageSpec contains larger readable type and mock image QA checks only background change.
- Across four products test fact-only, style-only, wording-only, mixed edit, new-event and new-design requests; count provider calls and inspect only permitted deltas.
- With existing hero/card assets, browser-test rendered heading size and contrast, full approved copy and truthful per-delta completion after one branch fails.
- Retain real builder address regression tests so Flyer location correction preserves its full address while Live Card metadata and source-artwork policy remain consistent.

**Acceptance**

- No image is rejected for an HTML-only font requirement.
- HTML-only changes require no raster generation.
- Every completed requested change is verified on the surface where it is visible; unsuccessful changes remain explicit.

Mapped evidence: 14 unique case/finding pairs across 11 cases. See art-contracts-plan.json#/issueGroups/1/findings. Historical and latest occurrences are preserved separately.

## ART-03 — Make quality decisions consistent with required copy and prohibited interface chrome (P0)

Dependencies: ART-01; ART-02.

Source modules: `src/lib/studio/output-checks.ts`, `src/lib/studio/artwork-copy.ts`, `src/lib/studio/generate.ts`, `src/lib/studio/prompts.ts`, `src/lib/studio/product-prompts.ts`, `src/lib/studio/types.ts`.

**Confirmed causes and limits**

- Accepted Baby Shower and Gymnastics artwork visibly contains fake buttons despite prompt exclusions; output-check schema has no explicit interface-chrome violation.
- Live Card edit verification skips deterministic compareArtworkText and asks only to preserve prior wording. A required line missing from the original may remain missing.
- Edit prompt preserves bottom strips/icons; verifier says not to flag pre-existing defects. Together these policies can preserve previously accepted false controls.
- isLayoutReview downgrades any Live Card failure containing only unsafe_placement to needs_review, so critical text/action obstruction needs separate severity and real-render evaluation.
- Limit: Existing archived rasters establish observed false accepts; mocked verifier tests do not establish future vision detection accuracy.
- Limit: Do not erase the distinction between harmless decorative edge overlap and actual clipped essential content.

**Implementation**

1. Have QA consume ArtworkSpec and edit delta directly. Add typed requirement results with stable IDs, region, observed evidence, expected value, issue severity and concrete repair instruction; include faux_controls/device_frame/forbidden_footer independently from lettering.
2. Retain deterministic missing/unexpected wording checks as a layer, but compare required content and explicit correction deltas on edits too. Preserve valid existing source wording without reimposing an unrelated new-card whitelist; do not silently bless an old required-copy defect.
3. Do not allow preservation instructions to override essential factual correctness, exact required wording or no-fake-controls contract. Keep initial candidate defects distinct from new edit regressions and surface both accurately.
4. Treat missing/wrong facts, required safety copy, fake actionable controls and essential clipping as blocking. Classify aesthetic/harmless decorative observations separately; avoid passing critical defects through a generic unsafe_placement warning.
5. Represent unavailable/incomplete/refused checker outcomes distinctly and persist their reasons. Do not report passed; prohibit silent publication of known blocked artifacts. Unknown review state must remain visible and require an explicit review choice, rather than appearing equivalent to an automatic pass.
6. Keep typography normalization permissive for case, decorative punctuation and line breaks, while preserving names/contact/URL punctuation and associations via structured evidence. Tests must protect bilingual strings and repeated legitimately distinct blocks.

**Offline regression evidence**

- Create a human-labeled fixture manifest for accepted Baby Shower/Gymnastics fake controls, rejected Wrestling faux footer and Track logistics strip using existing WebPs only; record exact regions and expected issue kind.
- Mock QA responses against those labels to prove orchestration blocks/repairs fake controls, cannot downgrade missing safety text to needs_review, and does not count repair-unverified as success.
- Verify that current no-fake-controls exclusions occur in both generation and verification contracts and preservation policy excludes forbidden UI pixels; exercise behavior through parsed request/result objects rather than source-string-only tests.
- Run deterministic copy comparison tests with birthday slogan, bilingual text, address/contact punctuation, reordered lines and source edit deltas. Absent requested text fails even when source also omitted it.
- Render existing accepted images with actual action layers to measure obstruction separately from provider composition checks.

**Acceptance**

- Known annotated false accepts cannot pass the application decision policy when QA reports their evidence.
- No rejected candidate is exported, saved as accepted, or called a successful redesign.
- Quality warnings remain visible through save/resume/share; known critical defects cannot be published as passed.

Mapped evidence: 6 unique case/finding pairs across 6 cases. See art-contracts-plan.json#/issueGroups/2/findings. Historical and latest occurrences are preserved separately.

## ART-04 — Diagnose failures and perform one targeted, safe repair with truthful recovery (P0)

Dependencies: ART-01; ART-02; ART-03; Network/cancellation and harness workstreams.

Source modules: `src/lib/studio/generate.ts`, `src/lib/studio/output-checks.ts`, `src/lib/studio/types.ts`, `src/lib/studio/generation-response.ts`, `src/lib/studio/generation-progress.ts`, `src/app/chat/ConciergeChatClient.tsx`.

**Confirmed causes and limits**

- generate.ts receives issues and repairInstructions but returns only a generic image_quality_failed message; the campaign could not recover exact final rejection reasons.
- First-generation failure wording can say requested visual changes when no edit was requested.
- A rejected repair preserves the accepted original, which is correct, but a completed publish can then be confused with a completed requested redesign.
- Existing pipeline already limits automatic repair to one and refuses to accept a failed image merely because repair verification became unavailable; preserve those protections.
- Limit: A darkened rejected candidate does not prove the checker was wrong; all required changes and exact QA evidence must be inspected.
- Limit: Development-server compilation/transport/capture failures are infrastructure, not proof of image quality failure.

**Implementation**

1. Record a bounded, versioned GenerationAttempt with request/contract ID, accepted source hash, candidate hash, stage, provider request ID, typed QA results for first and repaired candidate, targeted repair instructions, outcome and cost. Retain private raw evidence only in protected diagnostics; expose concise user-facing reasons without provider prompts or contact data in logs.
2. Use stage-specific first-generation/edit/refusal/transport/verifier-unavailable/export messages. Name the unresolved requirement (for example required slogan missing) and offer retry of that operation while retaining draft and prior accepted art.
3. Build repair instructions from typed requirement failures and original immutable facts. For edits preserve original accepted source while applying precise delta and diagnosed repair; for initial generation use current candidate. Avoid blindly appending contradictory free-text prompts.
4. Keep one automatic repair cap, cancellation and idempotent operation IDs. A user retry is separate and visible; never silently loop paid calls or mutate settled accepted state after cancellation.
5. Persist accepted, rejected and unverified assets as distinct states. UI preview may show a labeled work-in-progress candidate but only accepted result can replace the saved artifact. Report successful recovery separately from successful redesign.
6. Block contradictory specs locally before the provider, with actionable correction instead of spending a generation and repair cycle on an impossible contract.

**Offline regression evidence**

- Replay archived initial Birthday/Wrestling/Track rejection and Birthday/Appointment/Event Page edit rejection through fake providers; assert one repair maximum, stable accepted image/fact hashes and correct stage-specific messages.
- Inject failed, incomplete, refused, timed-out and unavailable vision results; simulate repair failure, export failure, stream truncation, navigation/cancellation and delayed success. Assert no false success, stale replacement or autosave.
- Mock first candidate failed then repaired passed; verify diagnostics preserve both candidates and only repaired accepted output is exported.
- Round-trip generation diagnostics through response serialization and save/resume without leaking private prompts or authentication/contact details into general logs.

**Acceptance**

- Every failure is attributable to a stage and concrete requirement or known unavailable check.
- A recovered original never counts as successful appearance edit.
- One automatic repair maximum, no background duplicate paid call, preserved approved draft/source on every failure branch.

Mapped evidence: 34 unique case/finding pairs across 14 cases. See art-contracts-plan.json#/issueGroups/3/findings. Historical and latest occurrences are preserved separately.

## ART-05 — Preserve explicit subjects, activities and palette over category defaults (P1)

Dependencies: Canonical context/category workstream; ART-01; ART-03.

Source modules: `src/lib/studio/product-prompts.ts`, `src/lib/studio/product-contract.ts`, `src/lib/studio/output-checks.ts`, `src/lib/concierge/visual-direction.ts`, `src/lib/studio/theme-normalization.ts`, `src/app/studio/studio-workspace-builders.ts`.

**Confirmed causes and limits**

- Sport Event accepted art adds prominent unrelated sports equipment beyond basketball/soccer stations.
- Shoes/water/gear pictured as props do not convey the actual instruction to bring them; required guest instructions need textual coverage as well.
- Requested focal subjects, explicit exclusions and correction semantics are handled in multiple prompt helpers rather than a single compiled requirement list.
- Football and Game Day Flyer requests retain supplied navy/silver or green/cream in userIdea while guidance.colorPalette injects incompatible category-default navy/gold; accepted art shows gold accents. This is bounded palette drift, not a wrong-event claim.
- Limit: The archived artwork does not establish a universal failure to obey exclusions; many cases correctly depict their sport and palette.
- Limit: Do not infer open flames from ambiguous lantern glow or require text on a deliberately text-free Event Page hero.

**Implementation**

1. Give the specification allowed focal activities/subjects and explicit prohibited substitutions. Differentiate optional decoration from imagery that implies an offered station, venue feature, score, tournament or service.
2. Validate creativePlan focal subjects against known activities before image generation; visual inspiration from a sport/wedding theme must never reclassify event facts.
3. Use explicit subject corrections and scoped exclusions without flattening negation. Keep approved copy stable when theme changes; mark actual event replacement separately.
4. Keep provider/theme normalization from changing approved content. Treat requested gear instructions as text requirements, not satisfied by merely drawing the object.
5. Resolve visual precedence once: explicit user palette and latest intentional change override template/category defaults. Supply one consistent palette contract to planner/generator/verifier; use category colors only when unspecified. Keep same palette edits must preserve the approved colors while allowing requested luminance/contrast adjustments.

**Offline regression evidence**

- Replay Sport Event station list and reject a mock plan adding tennis/volleyball as activities; allow clearly decorative unspecified texture without inventing an activity.
- Replay softball yellow-ball, cheer pom-poms, supervised wrestling, non-contact Lacrosse and no-scores/brackets briefs; inspect planned subject/activity constraints.
- Use existing correct assets as positive controls and review labels for known wrong imagery; exercise correction patterns use X not Y and that is X not Y, plus typo-tolerant lettering edits.
- Replay Football navy/silver and Game Day green/cream request1/request2: compiled guidance/creative plan no longer injects navy/gold defaults. Test unspecified palette still permits category defaults and explicit later palette correction replaces the earlier approved value.

**Acceptance**

- No plan claims or visually proposes unsupplied event activities or substitutes a different occasion.
- Instruction coverage requires readable guest text, not merely a depicted prop.
- Explicit palette has no contradictory category default in any generation/edit/QA input.
- Previously correct sport/palette examples remain valid.

Mapped evidence: 11 unique case/finding pairs across 11 cases. See art-contracts-plan.json#/issueGroups/4/findings. Historical and latest occurrences are preserved separately.

## ART-06 — Compose concise, readable, deterministic approved copy (P1)

Dependencies: Canonical times/itineraries/venue workstream; RSVP and gift default workstream; ART-01.

Source modules: `src/lib/studio/artwork-copy.ts`, `src/lib/studio/output-checks.ts`, `src/app/studio/studio-workspace-builders.ts`, `src/lib/studio/product-prompts.ts`.

**Confirmed causes and limits**

- flyerTextBlocks concatenates raw date, startTime, endTime and timezone; captured inputs produce 2:00 PM–16:00 and America/Chicago rather than a consistently formatted guest schedule.
- Location deduplication is exact-string only, so venueName plus venueAddress containing that name repeats venue and Room B.
- Required copy competes with generic repeated boilerplate and unrequested gift wording; small type after larger-lettering edits is not proof of user error.
- Limit: Full-resolution assets can retain small lettering even when browser framing is correct. Deterministic copy length controls reduce risk but do not prove every future raster is readable.

**Implementation**

1. Format display strings from canonical dates/times/timezone using locale-aware structured functions; preserve explicit language and time convention, separate primary event range from arrival/warmup/return segments.
2. Deduplicate factual blocks by stable semantic identity, not substring deletion or raw word count; preserve distinct supplied stops/times and two intentionally similar names.
3. Remove boilerplate duplicates and all unsupplied gift/contact defaults before planning. Protect exact wording and essential guest instructions; do not shorten them silently to fit art.
4. Give copy blocks role/priority and supported layout capacity; choose a readable layout or explain a real format limit rather than making every block tiny.
5. Keep exact source wording when explicitly requested, including meaningful accents/punctuation; presentation formatting must not change factual content.

**Offline regression evidence**

- Snapshot compiled display blocks for every archived Flyer; no mixed 12/24-hour clock, duplicate venue/Room B or technical timezone label unless explicitly requested.
- Replay Anniversary dinner duplicate, Field Trip repeated departure, Open House duplicate title/venue and Birthday no-gifts line; verify exactly one meaningful block per fact while all requested instructions survive.
- Use existing Flyer assets for mobile visual annotations and real full-resolution preview tests; distinguish pre-existing small raster lettering from DOM action overlap.

**Acceptance**

- One normalized, accurate display string per fact/segment; no raw prompt/correction fragments in guest copy.
- Required user wording and logistics take precedence over optional decoration or generated filler.
- No gift/contact claim without user-supplied or explicitly approved source.

Mapped evidence: 24 unique case/finding pairs across 23 cases. See art-contracts-plan.json#/issueGroups/5/findings. Historical and latest occurrences are preserved separately.

## ART-07 — Preserve product geometry and verify asset/export lifecycle (P1)

Dependencies: ART-02; Download/renderer workstream; Diagnostics/evidence workstream.

Source modules: `src/lib/studio/openai.ts`, `src/lib/studio/generate.ts`, `src/lib/studio/flyer-export.ts`, `src/lib/studio/generation-response.ts`, `src/lib/media-upload.ts`, `scripts/lib/create-campaign-artwork.mjs`.

**Confirmed causes and limits**

- Initial Event Page image generation requests landscape but postOpenAiImageEdit always uses resolveImageSize(), default portrait, even though options already contains size. The archived Field Trip edit changes 1536×1024 to1024×1536.
- composeFlyerExport contains full artwork and encodes PNG, while campaign archived and verified WebP assets separately. Production/download output and campaign archival are distinct paths.
- Campaign final artifact verification passed for200 WebP archives with no leftover temporary originals. This is an existing passing control, not an uncorrected campaign conversion bug.
- Limit: Changed Event Page geometry is a follow-up risk, not a standalone failed user outcome in the review; final bus/museum remain recognizable.
- Limit: The campaign did not exercise actual Flyer download; no claim of a corrupt downloaded file is supported.

**Implementation**

1. Pass explicit product/output dimensions through initial generation, edits and repairs; honor options.size in OpenAI edit API and stream branch. Preserve accepted source geometry unless a requested format/aspect change is explicit.
2. Validate candidate dimensions and final composition before acceptance. Avoid silent aspect changes or cropping in export; use supported contain layouts and separate intentional hero crop configuration.
3. Keep original model output, accepted delivery asset, rejected candidates and downloadable rendition linked by hashes and state. Browser thumbnails must not replace full-resolution download sources.
4. For newly generated Envitefy assets follow existing standing WebP conversion/verification/exact-original cleanup rule. Keep diagnostic metadata and only delete exact originals after verified replacement; never delete unrelated uploads or evidence.
5. Specify download rendering separately: requested print dimensions/density or share image rendition, correct MIME/extension and decoded dimensions. Preserve full composition, transparency and intended colors.

**Offline regression evidence**

- Mock initial/edit/repair provider calls for all four products and assert consistent requested dimensions including streamed edit; use existing landscape/portrait assets to test validation.
- Decode existing assets and verify export corner/edge markers preserve full composition with contain fit. Test print dimensions1500×2100 at300DPI using local transforms without new art generation.
- Exercise direct download with existing verified WebP/source artifacts; inspect bytes/MIME/name/dimensions rather than merely clicking a link.
- Retain artifact-delivery-check and exact originals-to-WebP provenance invariants. Simulate conversion/decode failure and confirm original retained.

**Acceptance**

- Edits/repairs cannot silently change product orientation.
- Accepted preview, saved artwork and download refer to the intended approved artifact.
- Generated asset cleanup occurs only after actual replacement verification.

Mapped evidence: 2 unique case/finding pairs across 2 cases. See art-contracts-plan.json#/issueGroups/6/findings. Historical and latest occurrences are preserved separately.

## Work required outside prompts

**Crop, overlap and contrast must be fixed in real renderer as well as prompts — Preview/guest UX workstream.** Live Card preview requests2:3 and contain, but dialog CSS fixes90%-viewport height while independently capping width, then a more-specific object-fit:cover rule crops both sides. This is not explained solely by a legacy9:16 mode. Event Page preview omits HTML title; Flyer actions sit on copy. Reuse actual published renderer, preserve full composition for standalone art, choose readable real controls and keep them outside Flyer artwork. No prompt alone can repair these CSS/DOM defects.

**Factual extraction and canonical state must precede image fixes — Chat/facts workstream.** Wrong title/occasion/time/format, inferred honoree/age, practical notes in gift/style fields, RSVP contact nulling and gift defaults must be corrected before compiling the art contract. Visual QA against already-wrong metadata is not user-intent QA.

**QA failures and reviewer false positives require adjudication — Evidence/release workstream.** Do not count Maps query parser false negatives, source-only portrait risk, infrastructure capture failures or text-free Event Page assets as generated-art defects. Preserve exact attempts and evidence; no cumulative-count claims from duplicate historical findings.

## What can be established without generating new art

- Canonical requirement coverage and prompt/checker agreement.
- Product-aware routing and provider-call avoidance for DOM-only edits.
- Deterministic copy/date/location formatting.
- Repair caps, rollback/cancellation, quality state transitions and diagnostics.
- Actual renderer layout/contrast/action behavior with archived artwork.
- Asset integrity and download framing with existing files.

These checks do not establish:

- A future image provider will obey revised prompts.
- A future vision checker will detect all defects.
- Production provider latency/cost/reliability.
- User satisfaction or zero future bugs.

After offline gates pass, reuse annotated historical assets for a separately authorized vision-only evaluation if needed; no image regeneration is required for that evaluation. New generation canaries remain deferred until user requests them. Do not claim stochastic art-generation quality is live-validated from mocks.

A release candidate can therefore have strong deterministic guarantees and known regressions repaired without new art. It must not be labeled proven against every future provider output. Keep schema validation, concrete required-copy checks, conservative quality states, actionable recovery and regression fixtures in the deployed path so a model deviation does not silently become a published incorrect invitation.
