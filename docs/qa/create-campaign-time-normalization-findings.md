# Create campaign: canonical time normalization

Recorded September 19, 2026. Read-only reproduction; no application changes were made during the broad live baseline.

## Confirmed failure

The gymnastics opening explicitly supplies a 2 PM competition, 1 PM warmup and 4 PM awards on November 20, 2026. The original fallback extraction resolves the main start correctly to `2026-11-20T20:00:00.000Z` (2 PM America/Chicago). The live opening draft instead stores `2026-11-20T18:00:00.000Z` (noon), while its display text correctly retains all three labeled times. The wrong start survives explicit save, resume and publication.

Evidence: `.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/attempts/2026-09-19T05-05-44-168Z/result.json`, opening and published fact snapshots. Its bound independent review describes the separate missing Calendar defect caused by invitation metadata.

## Actual parser reproduction

Run under the observed `America/Chicago` process timezone using the real exported `fallbackExtractConciergeDraft`, `parseChrono`, `normalizeEventScheduleText` and `chrono-node` functions. No provider calls are needed.

1. Read the recorded opening from `result.transcript[0].text` and call `fallbackExtractConciergeDraft({ message: opening, requestedOutputs: ['live_card'] })`.
2. Read `result.facts[0].draft.dateText` and `timeText` and concatenate them with a space, matching `src/lib/concierge/extract.ts:745`.
3. Call `parseChrono(combined, { ...fallback, startISO: null, endISO: null, currentQuestion: null })`.
4. Inspect `chrono.parse(normalizeEventScheduleText(combined), new Date(), { forwardDate: true })`, including `start.isCertain('hour')` for each match.

| Input | First chrono match | Explicit hour? | parseChrono start |
| --- | --- | --- | --- |
| Actual complete opening | Friday, November 20, 2026 at 2:00 PM | Yes, 14 | `2026-11-20T20:00:00.000Z` |
| Friday, November 20, 2026 Warmup: 1 PM; Competition: 2 PM; Awards: 4 PM | Friday, November 20, 2026 | No; implied 12 | `2026-11-20T18:00:00.000Z` |
| Friday, November 20, 2026 Competition: 2 PM | Friday, November 20, 2026 | No; implied 12 | `2026-11-20T18:00:00.000Z` |
| Friday, November 20, 2026 at 2 PM | Friday, November 20, 2026 at 2 PM | Yes, 14 | `2026-11-20T20:00:00.000Z` |

For the labeled itinerary, chrono returns later independent `1 PM`, `2 PM` and `4 PM` matches anchored to the reference day, rather than to the November event date. Selecting the first later clock would incorrectly choose warmup as the main start.

## Source trace

- `src/lib/concierge/extract.ts:744–747` reparses model display fields and unconditionally assigns both resulting ISO fields to the model patch.
- `src/lib/concierge/fallback.ts:2235–2268` selects the first non-relative result, constructs `first.start.date()`, and returns its ISO even when `first.start.isCertain('hour')` is false. It also invents a two-hour end when no end was parsed.
- For the recorded itinerary, this turns an implied date-only noon into a canonical fact and overwrites the correctly parsed fallback start. A retained display time does not make the returned ISO valid.

The reconstruction reproduces the live value exactly. It does not establish that every time defect has this cause or justify changing unrelated scheduling logic during the baseline.

## Narrow safe correction strategy

Keep display itinerary text separate from canonical primary start/end facts. Only replace canonical instants when parsing supplies explicit, relevant time evidence from the user's request. A date-only chrono result must not replace a verified start with implied noon or replace a supplied end with a default duration.

When the model merely reformats `dateText` or `timeText`, preserve the original request's verified canonical start/end. Do not simply select the first clock from a multi-part itinerary: competition may follow warmup or arrival. Preserve explicit end-only corrections and allow genuine start changes. For a date-only correction, combine the changed calendar date with the verified primary clock in the event timezone, including ambiguity handling, rather than inheriting the parser's implied hour. Ask for a primary start if none can be established.

Suggested focused regressions before implementation:

- Gymnastics 1 PM warmup / 2 PM competition / 4 PM awards across all three outputs.
- Football 1:30 PM arrival / 2 PM kickoff, including labeled display text.
- A faulty or merely reformatted model patch must not move the verified primary start.
- An explicit primary-start correction must still apply.
- A date-only move must retain the verified primary local clock and respect timezone/DST ambiguity.
- An end-only correction must preserve the primary start and synchronize displayed ranges and return stops.
- A missing or ambiguous primary time must stay unknown or request clarification instead of producing noon.

After a fix, replay the frozen transcripts offline, run the Create fact-integrity suite and targeted TypeScript diagnostics, then perform a narrowly metered live retest. Keep the original campaign attempts and findings available for comparison.

## Later live confirmation: swimming calendar exports

The swimming Event Page attempt `2026-09-19T05-57-27-234Z` extends the observed impact to actual calendar exports. Its visible page correctly lists warm-up at 1 PM and the meet at 2 PM on January 25, 2027, in America/Chicago. Canonical `startISO` is instead `2027-01-25T18:00:00.000Z`, and Google, Outlook and the local ICS all use that instant: noon Chicago. The supplied 4 PM end remains correct (`22:00Z`).

Evidence under `.qa/create-campaign/2026-09-18/cases/swimming--event_page/attempts/2026-09-19T05-57-27-234Z/`:

- `result.json`: `/facts/0/draft/startISO`, `/facts/5/draft/startISO`, `/facts/5/draft/endISO`, `/guestText`.
- `guest-actions.json`: the first three action URLs.
- `guest-calendar.ics`: `DTSTART:20270125T180000Z` and `DTEND:20270125T220000Z`.
- Bound independent review: `reviews/swimming--event_page.json`, finding `swimming-canonical-start-noon-exported`.

The wrong export is directly observed; the earlier parser reproduction supplies the matching normalization mechanism. Include this case in the focused fix and Calendar/ICS retest.

## September 23 continuation

The later Swimming Live Card and Flyer keep warmup at 1 PM and meet at 2 PM in visible wording, but store the primary start as `2026-09-23T17:00:00.000Z`: noon America/Chicago. Their published Calendar action is absent, so these cases establish incorrect canonical data and a missing action, not an observed wrong external export. The Dance Flyer likewise stores noon despite a visible 2 PM show and has no Calendar handoff. See the bound reviews in `reviews/swimming--live_card.json`, `reviews/swimming--digital_flyer.json` and `reviews/dance--digital_flyer.json` under the campaign directory.

The new Football Live Card and Event Page retain the correct 2 PM start. This variation is why the fix must cover the actual normalization path and all formats rather than assuming a category always fails or always succeeds. Original attempts remain available; changing later test dates did not rewrite them.
