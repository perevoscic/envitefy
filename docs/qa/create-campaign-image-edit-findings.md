# Create campaign image edit findings

Evidence: campaign `2026-09-18`, field-trip attempt `2026-09-19T04-40-39-855Z` and football attempt `2026-09-19T04-42-36-052Z`. Both first generations passed; both appearance edits failed after one automatic repair. The saved requests and original WebP images were inspected. Rejected candidates and detailed QA issues were not archived, so the exact visual reason for each rejection remains unverified.

## Address instruction corrected

The shared request builder injected a Live Card rule that removed street addresses into every product's artwork edit. This contradicted the Flyer's approved wording, which includes the supplied full address. The builder now applies this rule only to `live_card`. Digital and printable Flyers retain their supplied address in approved artwork text, and Event Pages do not receive an address-removal command. Artwork QA remains unchanged. Behavior regressions cover appearance-only edits and venue corrections for all four products.

## Open: Event Page typography targets the raster hero

The field-trip edit asked for a darker background and larger lettering. The request forwarded both changes to the image provider and image QA even though `productContract("event_page")` requires a text-free hero and the page renders its text in HTML. `buildProductArtworkPrompt` forbids visible typography, while `verifyStudioArtwork` checks every requested font change against the raster result. The original hero was visibly text-free.

This needs product-aware routing: apply hero appearance requests to the image and apply typography requests to the page's HTML presentation, then verify each on its own surface. The bounded address fix does not implement that split and does not establish that Event Page appearance edits now pass. Preserve the request as a campaign failure requiring follow-up; do not relax image QA or report a successful typography change without checking the rendered page.

Relevant code: `src/app/chat/ConciergeChatClient.tsx` (`buildGeneratedDraftImageEditPrompt`), `src/app/studio/studio-workspace-builders.ts` (`buildExistingImageEditInstruction`), `src/lib/studio/product-prompts.ts` (`buildProductArtworkPrompt`), and `src/lib/studio/output-checks.ts` (`verifyStudioArtwork`).

## Validation and existing diagnostics

The 8 new behavior tests reproduce 6 failures without the fix and pass with it. The relevant builder, Live Card edit, product generation and visual instruction tests pass 34/34. `npm run test:create-facts` passes 353/353. Biome reports no errors; its existing optional-chain warning in `studio-workspace-builders.ts:45` is unrelated to this change. The VS Code diagnostics command could not find the editor linter bridge.

Targeted TypeScript diagnostics report no issues in the changed builder. Its dependency graph reports the following two errors. A second compiler pass substituted the builder's exact `HEAD` contents through a read-only compiler host; both errors were identical before and after this fix, confirming they predate it. This is a targeted dependency-graph check, not a claim that the full repository typecheck passes.

- `src/app/studio/studio-types.ts:2`, TS2305: `Module '"@/lib/studio/types"' has no exported member 'LucideIcon'.`
- `src/app/studio/studio-workspace-field-config.ts:181`, TS2322: `Type '"url"' is not assignable to type '"number" | "date" | "time" | "text" | "checkbox" | "textarea" | "select"'.`

These unrelated diagnostics were left unchanged. No paid provider calls or services were started for the fix or its validation.
