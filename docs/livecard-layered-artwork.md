# Live Card layered artwork

Updated October 2, 2026. This supersedes full-card lettering retries, Review-triggered lettering, mandatory proofreading, and automatic quality upgrades. Saved legacy cards and existing public routes remain compatible.

## Product flow

The three visible steps are Design → Event details → Review. Design collects event type, title, the existing optional opening-line field, description and optional reference. Generate & continue starts a durable background-and-lettering job and opens editable Event details immediately. Event details offers Review invitation. Review offers Publish invitation. Copy guest link and Share invitation reuse the resulting stable public link without publishing again.

Logistics edits, Back, Review, refresh, saves and publication do not request new images. Temporary local text identifies wording whose generated lettering is not ready. Results for earlier wording cannot replace current lettering; compatible completed backgrounds remain usable. Changed wording requires explicit Create updated lettering.

## Assets and request policy

The configured model remains `gpt-image-2.5-flare`. Images generation creates a text-free 1024×1536 background. Images edit receives that background solely as style context and returns one transparent PNG containing coordinated title and opening-line lettering. Normal-font text never substitutes for finished AI lettering.

Title and opening line are distinct structured inputs. Every nonblank opening-line word is mandatory; an empty opening line is absent. Both lines share one lettering request. Image transport uses `maxRetries: 0`; ambiguous responses are never automatically replayed. Initial generation requests one background and one lettering asset. A checker cannot purchase another image.

`card-lettering-composition.ts` rejects opaque rectangles/empty assets, trims the isolated strokes and fits them within x=12–88%, y=18–48%. Local composition retains the decoded original background outside the placement and encodes lossless WebP. Metadata retains the isolated layer and integer placement/canvas dimensions. The helper accepts bounded placement to move/resize an existing layer without an AI call.

Repair lettering explicitly generates only lettering against the retained background. Retry verification checks the exact existing composite and isolated layer with zero image requests. Legacy endpoints remain compatible without automatic repair loops.

## Verification

Generation, checking, composition, upload and publication have independent stages. Checks read the composite and isolated layer. Outcomes are passed, specific quality concern or verification unavailable. Timeouts, malformed/incomplete responses and service errors do not establish defective artwork. Refusals retain their distinct reason and cannot trigger automatic repairs.

Require every word, correct names/numbers, readable contrast and no clipped text. Wrapping, capitalization and typographic quotes may vary; genuinely different/missing words cannot. Aesthetic preference alone does not reject a result. The layered checker does not rejudge whether an unchanged background moved. Failed/unavailable checks retain the candidate, expected and observed wording and specific repair instructions. Publish requires passed validation when metadata is present; old saved records without that metadata retain compatibility.

## Quality and versions

Standard quality remains high. Design offers opt-in Fast generation at medium quality; a reviewed fast card is publishable without a second job. The measurement report records comparable prompts and limitations.

A fast card with compatible isolated lettering offers Generate higher-quality alternative. This explicitly generates a new background, reuses the lettering, composes locally and rechecks readability. The selected card stays unchanged until Apply this version. Keep current version and earlier-version previews preserve alternatives in browser recovery. Stale wording/design prevents application. A higher-quality result is a new visual version, not a pixel-identical upgrade.

Partial Images streaming was measured separately using one request. It is not an automatic draft/final sequence and is not enabled in the durable builder. Early partials provide visual feedback, not verified publishable output.

## Durable jobs and cancellation

`livecard_artwork_jobs` uses the existing PostgreSQL connection and persists owner, revision, mode, attempt, stage, input, assets and outcome. A conditional queued→running claim prevents duplicate dispatch. GET reconnects without generation. Next.js `after` runs claimed work; hosting must support the configured 600-second duration. A terminated running worker is not automatically replayed because provider execution may be ambiguous.

Existing IndexedDB storage retains unsaved form values, artwork, selected step, active job, alternatives and explicit-attempt history under a per-card session key. This is recovery state, not an automatically saved event draft. Clean recovery uses the explicit server save; dirty recovery retains edits. Explicit history saves retain the existing idempotent client draft identifier.

Cancel generation persists an owner-scoped job cancellation. Queued work stops; active workers poll cancellation and check before subsequent stages and final conditional commit. Abort signals reach the OpenAI transport. Back, Review, unmount and refresh only disconnect/reconnect. Cancellation prevents local follow-on work and late active-asset commits. No remote provider cancellation result has been verified, so the UI says provider execution status unknown; it cannot promise computation stopped or charges were avoided.

Progress distinguishes background planning/generation/checking/conversion, lettering, verification retry and readiness. Attempt numbers persist with jobs/lettering. Server timestamps supply elapsed time. After four minutes users can keep editing, reconnect to the same job or explicitly cancel; there are no invented percentages or completion estimates.

## Wording, saves and publication

Proofreading does not gate image generation. `LIVECARD_PROOFREAD_TIMEOUT_MS` defaults to 10,000 ms and accepts 1,000–30,000 ms. The browser uses a 15-second fallback. Failures log actual status, request ID, model, attempt, deadline and elapsed where available. Queue/provider time cannot be separated from the available telemetry. Failure preserves user-confirmed text. Applying a suggestion requires confirmation and creates a new wording revision; concurrent edits remain intact.

Explicit saves upload the background, composite, isolated layer and optional reference. Completed uploads are cached; retries repeat failed uploads only. Publish pins the selected captured version before upload/history submission, so late work cannot replace the submitted version. Share never calls Publish.

Review puts the invitation directly on the pastel surface, with its own rounded corners, shadow, aspect ratio and guest controls. The outer white preview wrapper, inner Live Card heading/icon and Share a link copy are removed. Edit design and navigation remain.

## Guest actions and verification limits

`resolveLiveCardOverlayActions` supplies the configured actions. The enabled QA card has RSVP, Overview, Location, Calendar and Registry; Birthday cards label Registry as Gift List. Logo remains configuration-dependent. Online URLs open the saved online destination, physical venues offer directions and hybrid cards retain both. Registry/Gift List displays its saved message and opens the saved URL.

See [verification and provider measurements](livecard-layered-artwork-verification.md). Browser fixtures use the actual builder/public components with mocked authentication, jobs and history; they do not establish deployed PostgreSQL/worker integration. The reported authenticated development crash remains unresolved without its reproducible action and server/browser stack. No deployment or real guest invitations are included.
