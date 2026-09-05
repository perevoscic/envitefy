# Concierge improvements — September 4, 2026

Implemented locally in response to the birthday and family-reunion conversations recorded in this directory.

## What changed

| Observed failure | Change |
| --- | --- |
| “I'll share it myself” and requests for wording triggered a Facebook refusal. | Removed the duplicate intake guard in the browser. Shared intent handling distinguishes direct external-action requests from questions, negations and self-sharing. Old refusal boundaries are cleared on subsequent valid requests. |
| Product comparisons added unwanted formats. | Format questions preserve the current selection. Explicit choices replace it; removals and additional deliverables are handled separately. Model output cannot silently add products. |
| Exact title corrections became the whole complaint or lost one twin. | Parse the requested title separately, preserve confirmed titles and paired honorees through later turns, reject instruction-like model titles, and keep the preview headline aligned. |
| Concierge promised household or per-activity RSVP fields that this chat could not configure. | Added a shared capability contract and grounded answers for standard RSVP, family counts, per-activity attendance, capacity/waitlists, snack slots and address-release limitations. These describe the current chat path, not every specialized Envitefy builder. |
| Concierge could not explain Generate versus Publish. | The prompt and grounded answers explain the two steps. Buttons now say “Generate draft preview” and “Publish event.” |
| A ready draft blocked further conversation. | The composer remains available alongside a collapsible review of actual saved fields. The selected format stays visible. |
| Customers could neither type a correction nor interrupt a slow reply. | Typing remains enabled during ordinary replies. A Stop response button cancels streaming, preserves the next typed message and prevents a cancelled stream from applying a later state update. Server cancellation is checked before finalizing the draft; it does not undo work already saved. |
| Repeated “still ready” replies ignored corrections and questions. | The persona answers the latest question before asking for more details, uses the actual draft for confirmations, and receives a larger bounded history. Real changes refresh the deterministic ready summary too. |
| Format names and opening copy gave little guidance. | Added concise format descriptions, clearer empty-state guidance and context-sensitive composer text. |

The product marketing catalog now describes the supported chat workflow and its standard RSVP fields. The logo and existing model configuration edits were preserved.

## Live browser verification

Used a fresh authenticated conversation at `http://localhost:3000/chat`. Its saved draft is `session_mtni8kuq`; no event was published and no artwork generation was started in this implementation pass.

1. Asked about twins Alex and Sam, dinosaur/space themes, self-sharing in WhatsApp and family RSVP counts. The reply immediately explained the standard fields and the unavailable adult/child fields. There was no irrelevant external-action refusal and no format was automatically selected.
2. Selected only Event Page, requested the exact title **Alex & Sam's 9th Birthday**, supplied October 18, 2026, 2:30–4:30 PM, Grant Park in Chicago, no gifts and RSVP off. The sidebar displayed the exact title. Expanded review displayed that title, the date/time, location, RSVP Off and the gift note. Only Event Page was selected.
3. Asked whether Generate makes the event live. The concierge correctly explained that preview generation and publishing are separate.
4. Began a wording request, typed a correction during the response and clicked Stop response. The reply stopped, the typed correction remained, and the composer returned to Send.
5. Asked for a short opening line while keeping the title and date. It answered: “Join Alex and Sam for a 9th birthday adventure where dinosaurs roam and rockets soar.” The saved title and date stayed unchanged.

Desktop layout was inspected visually. Mobile device sizes, full artwork generation and publication were not exercised in this pass.

## Validation

- **45 focused checks passed**: recorded conversation repairs, persona behavior, golden conversations, fast paths and upload regressions. The new repair suite contains ten behavior checks, including the eleven recorded customer messages as fixtures.
- **Biome passed** for all 18 edited code/test files checked.
- The broader legacy run had **110 passes and 29 failures**: 27 existing date-sensitive conversation/RSVP failures and two existing preview source-shape guards (`ChatOutputPreviewSurface` and the `hasRsvp` declaration). Original-code comparison reproduced the 20 fallback failures; the seven e2e and two preview failures were also present before implementation. Intentional copy and product-selection assertions were updated to match the new behavior.
- `tsc --noEmit` still reports repository errors, including three existing errors in the fallback test file. It reported no errors in the edited runtime files. An existing untrusted-copy typing error in `public-copy.ts` was corrected by narrowing values to strings.
- `npm run lint:vscode` could not run because the Chat to CLI diagnostics bridge is unavailable. The tool requests reloading the editor with `chatToCli.enableDiagnosticsLinter` enabled.

The capability contract should be updated whenever the chat's actual form and publishing paths change. Prompt grounding reduces unsupported promises; it is not a guarantee that every possible model response will be correct.

Original evidence: [birthday conversation](agent-conversation.md), [family reunion conversation](family-reunion-dialogue.md), [findings](findings.md).
