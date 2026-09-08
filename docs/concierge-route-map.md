# Concierge route map and V2 retirement

Updated September 6, 2026. Current `/chat` was verified against production. The code removal below requires deployment to affect the live site; the database deletion has committed.

## Current paths

| Surface | Route | Implementation |
| --- | --- | --- |
| Event creator | `/chat` | `src/app/chat/ConciergeChatClient.tsx` |
| Concierge introduction | `/envitefy-concierge` | Public explainer with example prompts, creation instructions, and authentication continuing to `/chat`. Live Card attribution links here. |
| Draft preview | Preview tab inside `/chat` | `ChatProductPreview.tsx`; Live Cards use `StudioShowcaseLiveCard` with interactive preview controls. |
| Intake and extraction | `/api/creation/intake`, `/api/creation/intake/stream` | `src/lib/concierge/intake.ts` and `extract.ts`; all supplied details are extracted on each message. |
| Current Concierge messaging | `/api/concierge/message`, `/api/concierge/events/[id]/message` | Current creation and owner editing APIs; these were not V2 endpoints. |
| Published Live Card | `/card/[slug-or-id]` | `SharedStudioCardPage` and `StudioLiveCardActionSurface` |
| Public event / owner workspace | `/event/[slug-or-id]` | Existing event dispatcher, category renderers, and `ConciergeEventWebsite` |
| Dynamic event pages | `/e/[slug]`, `/api/event-pages/*` | Independent blueprint renderer and `dynamic_event_pages` storage |
| Retired Studio entry | `/studio` | Permanent redirect to `/envitefy-concierge`; existing showcase bookmarks go to `/showcase/[slug]`, and owner edit bookmarks go to `/event/[id]`. Shared Studio-named rendering components remain in use by current cards. |
| Retired V2 pages | `/concierge-v2` and every nested page | Middleware redirects permanently to `/chat`, dropping old draft IDs and invitation tokens. |

Production `/chat` displays “What are we celebrating?”, celebration choices, Live Card / Flyer/Invitation / Event Page choices, and the Envitefy Concierge sidebar. Historical June 2026 documents that identify V2 as the primary creator are obsolete.

## Removal

The user explicitly requested removal and deletion of V2 database records, superseding the earlier proposal to preserve or migrate saved V2 drafts.

- Removed the V2 creator, saved-drafts editor, event management screens, invitations, parser, sessions, operations, calendar feeds, reminder dispatch, payment webhook, flags, runtime schema setup, manual V2 schema files, demo/backfill scripts, and their tests.
- Removed V2 forms, volunteer actions, and planning sections from the current event website. An audit confirmed no remaining current event website had renderable content in those sections. Normal RSVP, registry, smart signup, and calendar features remain independent and active.
- Extracted the shared schedule reader to `src/lib/event-website-schedule.ts`, preserving existing schedule field aliases and public schedule display.
- Kept the two current `/api/concierge/.../message` APIs. Other removed V2 API routes have no handler after deployment.
- Removed obsolete V2-only implementation documents. Mixed historical UI reports are explicitly marked as historical.

## Database deletion

`scripts/retire-concierge-v2.mjs` committed deletion on **2026-09-07 at 00:22:39 UTC** (September 6 locally), against the database configured for this checkout. This is not independent verification of the deployed Vercel database configuration.

**1,050 rows deleted:**

| Group | Deleted rows |
| --- | ---: |
| V2 sessions | 30 |
| Draft fragments | 346 |
| Published V2 `event_history` records | 7 |
| V2 programs / event pages | 20 / 20 |
| Schedule occurrences | 135 |
| V2 calendar feeds | 2, including the previously active feed |
| Other V2 planning records | 453 |
| Related RSVP responses / tracking records / metrics | 9 / 25 / 3 |

All 36 dedicated V2 tables are empty. The script deletes records only; empty historical table definitions remain. No dynamic page records were linked to these events. No uploaded blobs were deleted.

The transaction verified matching row counts, checked inbound foreign keys, and compared before/after checksums of protected records. It preserved **256 other events, 111 current creation sessions, 64 accounts, 8 OAuth records**, and unrelated RSVP, registry, discovery, conversation, and marketing records. Google/Outlook syncing remains enabled. The full aggregate receipt is `.qa/concierge-v2-deletion.json`; it contains counts and verification results, not credentials or event content.

The cleanup script defaults to a read-only audit. Executing it requires the exact plan fingerprint from that audit; changed target data or dependencies outside the scope cause an abort. It uses a transaction and never drops tables or uses `TRUNCATE CASCADE`. History and dashboard response caches expire after 30 seconds; their process-local caches cannot be invalidated by a separate database script.

## Verification and UI checks

Retirement checks cover anonymous and authenticated redirects, current route preservation, removed runtime paths, schedule normalization, and deletion ordering/scope. Current intake regression coverage includes the screenshot conversation: the first message prefills Livia, age 10, AMC Grand Boulevard, and the movie theme before date/time follow-ups.

- 37 focused retirement, schedule, blueprint, chat upload/preview, and context-extraction tests passed.
- Biome passed for all 25 maintained code/test files checked before commit. `git diff --check` passed.
- No new TypeScript diagnostics in the touched production files. The event dispatcher still has 24 pre-existing diagnostics, confirmed against its HEAD version; the other touched production files had none. Broader compilation remains blocked by existing repository issues.
- Three broader chat/API source guards also fail against HEAD: two expect obsolete preview helpers and one expects a replaced authentication helper. These unrelated guards were not weakened.
- The VS Code diagnostics wrapper could not run because the Chat to CLI bridge was unavailable. Direct TypeScript diagnostics and the baseline comparison were used instead.

Enter the complete `/chat` route for visual verification and use its Chat / Preview switch. The earlier isolated preview fixture used sample artwork and a simplified shell, so it could not establish that the full UI matched the user's session. That fixture was removed. Compare published cards through `/card/...` when checking guest experience parity.
