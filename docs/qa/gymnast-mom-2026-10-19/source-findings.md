# Supporting source diagnostics

These findings support the browser journey; they are not claimed as live account or browser reproductions. The diagnostic runs callbacks extracted from the current TypeScript AST with offline transport and UI state setters. It performs no provider, account, database, or event writes. SHA-256 hashes in the output identify the source inspected.

Run from the repository root:

```sh
node docs/qa/gymnast-mom-2026-10-19/source-diagnostics.cjs
```

Exit code 0 means the characterization diagnostics ran successfully. The assertions reproduce known defects, so it is not a release readiness test.

## P1: A date-only March 6–8 packet becomes midnight to March 7 at 18:00

The live browser audit imported the Gasparilla parent packet and observed Date `2026-03-06`, Time `00:00`, End date `2026-03-07`, End time `18:00`, Display Date `March 6-8, 2026`, and timezone `America/Chicago`. The packet's venue is Tampa Convention Center, Tampa, Florida; the only provided clock fact was doors opening at 7 AM, not a canonical competition/session start or end.

An offline reconstruction with the actual source functions produces exactly those editor values from date-only March 6 and March 8 inputs and an absent parsed timezone:

1. `toIsoOrNull` turns a date-only string into midnight UTC (`src/lib/meet-discovery/core.ts:951`).
2. `hasExplicitIsoTimeComponent` correctly rejects midnight as an explicit start (`core.ts:8096`), but `hasExplicitDiscoveryStartTime` falls back to `hasAnyDiscoveryTimeSignal` (`core.ts:8117`). That broader test includes the ISO start and end themselves. Its clock regex matches the minutes/seconds in `T00:00:00`, so it mistakenly labels synthesized midnight as an explicit competition time (`core.ts:8104`).
3. Mapping consequently retains `00:00`, `2026-03-06T00:00Z`, and `2026-03-08T00:00Z` (`core.ts:9744`–`9782`).
4. Editor start hydration extracts the UTC clock text directly (`src/app/event/gymnastics/customize/page.tsx:1291`). End hydration instead calls the browser-local `eventLocalDateParts` helper (`customize/page.tsx:1344`), whose `getDate`/`getHours` convert March 8 midnight UTC to March 7 at 18:00 in Chicago (`src/lib/event-guest-planning.ts:110`).
5. A missing parsed timezone falls back to the event shell's hard-coded `America/Chicago` (`src/lib/discovery/persist.ts:69`, `core.ts:9782`). This is wrong for Tampa, which uses `America/New_York`.

This source reconstruction matches the live values without accessing the event database or the model's raw response. The initial provider response is therefore not asserted. Separate failures are established: treating synthetic midnight as an explicit event clock, hydrating start/end in inconsistent zones, and inheriting a fixed Chicago timezone when the parsed zone is absent. The display range remains March 6–8, hiding the disagreement until the parent opens Event basics or uses a calendar.

Suggested remedy: keep date-only ranges distinct from timed events; exclude generated ISO placeholders from evidence for explicit clock times; hydrate both endpoints in the event's timezone; and derive or request confirmation of the venue's timezone instead of silently retaining a fixed zone.

## P1: Leaving a gymnastics import cancels it permanently

The gymnastics gallery header and manual gymnastics editor still embed `GymnasticsLauncher`, rather than the durable unified import client. Its lifetime cleanup sends a cancel request whenever the component unmounts, even without a Cancel click. The server records cancellation and hides the unsaved event shell.

- Entry: `src/components/gym-meet-templates/GymnasticsGalleryHeader.tsx:39`, `src/app/event/gymnastics/customize/page.tsx:2022`.
- Cause: `src/components/event-create/GymnasticsLauncher.tsx:251`.
- Consequence: `src/app/api/discovery/[eventId]/cancel/route.ts:31`.
- Offline observation: unmount with an in-progress import called `POST /api/discovery/offline-in-progress-meet/cancel` and erased the local ID.
- Browser reproduction: start importing a meet from the gymnastics gallery, wait for the intake response, navigate to another in-app page, then return. The import should resume; the current cleanup cancels it.
- Suggested remedy: reserve persistent cancellation for an explicit Cancel action and use the durable intake key/recovery flow at these entry points.

## P1: A transient progress error loses identity and retry creates a second import

The legacy launcher ends polling on the first network/server failure, clears its event ID, and supplies no `clientIntakeId` on intake requests. Retrying the same URL creates a fresh event while the original work may still run.

- Request: `src/components/event-create/GymnasticsLauncher.tsx:370`.
- Poll failure: `src/components/event-create/GymnasticsLauncher.tsx:421`.
- ID clearing: `src/components/event-create/GymnasticsLauncher.tsx:560` (file path also clears at 514).
- Offline observation: one failed status read followed by retry issued two intake POSTs, ran `offline-meet-1` and `offline-meet-2`, and opened the second. Neither intake carried a recovery key; no cancellation request was sent.
- Browser reproduction: import a public meet URL; after the intake response, interrupt one status request, restore connectivity, and retry. Check whether Drafts contains more than one import or whether the first import continues separately.
- Suggested remedy: retain the source and event identity after transient failures, retry bounded status failures, and resume through the shared durable intake client.

## P2: Preview calendars and the nested imported event ignore the selected timezone

The gymnastics payload and preview builders interpret Date/Time in the browser's zone. `creationNativePayload` repairs the top-level fields before saving, but the preview and `builderDraft.event` retain the wrong instant. The shared guest calendar calculation consumes the preview's wrong `startISO` ahead of its correct local date/time.

- Payload conversion: `src/app/event/gymnastics/customize/page.tsx:1699`.
- Preview conversion: `src/app/event/gymnastics/customize/page.tsx:2720`.
- Repair boundary: `src/lib/create/editor-handoff.ts:24`, called by `src/components/events/useEventPageEditor.ts:144`.
- Guest calendar precedence: `src/components/SimpleTemplateView.tsx:874`.
- Offline observation: for January 16, 2027 at 08:00 in Los Angeles, a Chicago browser yields preview/calendar and nested-builder `14:00Z`, two hours early. The final top-level save correctly yields `16:00Z`.
- Browser reproduction: choose an event timezone different from the browser, open Preview and inspect Add to calendar, then compare with the explicitly saved page.
- Scope: a wrong final top-level calendar save is **not** established. Published guest impact needs live verification. This report distinguishes that repaired value from the remaining preview/nested inconsistency.
- Suggested remedy: use the shared event-local timezone parser in the source builder, preview builder and nested event payload.

## Additional observations

- URL timeout errors instruct ordinary users to check their “local Next server” or “Next server logs” (`GymnasticsLauncher.tsx:195`). These messages should explain retry/recovery using user-facing language.
- The gallery launcher file input allows one PDF/JPG/PNG and omits WebP/multiple photo selection (`GymnasticsLauncher.tsx:600`), while the unified Upload tool accepts WebP and up to five photos. This is an inconsistent capability rather than a verified data loss bug.

## Focused checks run

- 28/28 passed: `bun test src/lib/create/run-sport-discovery.test.ts src/lib/create/read-source.test.ts src/lib/create/extract-information.test.ts src/lib/ocr/gymnastics-schedule.test.ts src/lib/meet-discovery.test.ts`.
- 10/11 passed: Node tests for the legacy launcher, diagnostics, runtime guards and gymnastics product routing. `src/components/event-create/launcher-runtime-guards.test.mjs:18` fails because it asserts the retired time-based `resolveGymnasticsUrlParseProgress(...)` source expression. Current code uses server-stage progress, so this assertion appears stale; the failure is not evidence of a user-facing runtime exception.
- Source diagnostics completed successfully and saved `source-diagnostics.results.json`.

No application changes were made by this supporting audit. Existing workspace changes were left intact.
