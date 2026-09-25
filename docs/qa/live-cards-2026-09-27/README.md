# Live Card persona walkthroughs — September 27, 2026 events

Three agent personas used the signed-in **http://localhost:3000** desktop UI to create three fictional Live Cards. This is simulated usability feedback, not a study with recruited parents, teachers or bridesmaids. The existing account was used; no separate user accounts were created.

Original walkthroughs tested September 24, 2026 (America/Chicago), against workspace commit `82fe70f9`. All cards were explicitly saved as **private drafts**, with generated background and finished title lettering. Publishing and guest communications were outside that save-only run. No application code was changed during the original walkthroughs.

The approved core fixes have since been implemented locally. See the [implementation and regression report](implementation.md) for automated coverage, saved-draft rechecks, and remaining browser verification limits. The findings below preserve the original observations.

## Saved cards

All events are **Sunday, September 27, 2026**, in Chicago local time.

| Persona | Saved Live Card | Time | App-resolved venue | Result |
| --- | --- | --- | --- | --- |
| Parent | [Mia's Woodland Birthday](http://localhost:3000/live-cards?edit=1d767baf-a163-4276-95e5-2064fd5ebf63) | 2–4 PM | Maggie Daley Park, 337 E Randolph St, Chicago, IL 60601 | Saved; final lettering and facts verified after reload. |
| Teacher | [Room 12 Family Reading Picnic](http://localhost:3000/live-cards?edit=dd56be08-b632-4bdb-b9a4-1cd9138a3a30) | 10 AM–noon | Lincoln Park Conservatory, 2391 N Stockton Dr., Chicago, IL 60614 | Saved; final lettering, schedule, notes and RSVP verified after reload. |
| Bridesmaid | [Sophie's Garden Bridal Shower](http://localhost:3000/live-cards?edit=fe205a9b-b09a-48a8-a1f3-bbc2ac48f070) | 1–3 PM | Garfield Park Conservatory, 300 N. Central Park Ave., Chicago, IL 60624 | Saved; final lettering, facts, RSVP and registry verified after reload. |

All hosts and contact details are fictional. The bridesmaid's registry is an explicitly labeled `example.com` QA placeholder. Venue choices are test scenarios, not reservations.

## What worked

- **Editing during generation:** Generate & continue immediately opened editable Event details. Concurrent edits survived background generation and retries.
- **Distinct artwork:** Each final card matched its scenario: woodland birthday, storybook reading picnic, and romantic conservatory shower. Agents visually checked the finished wording, scene, readable lettering and guest controls.
- **Venue preparation:** All three venue names resolved in Review without requiring a branch choice. The UI displayed Chicago local time.
- **Required-field guidance:** RSVP and registry requirements appeared as compact correction links. Optional message and practical-notes disclosures kept the form manageable.
- **Guest previews:** Overview, Location, RSVP and Calendar were exercised on all cards; Gift Registry was also exercised on the bridal shower. The full schedule and entered notes were preserved. Draft Share stayed disabled.
- **Explicit saving:** Each save changed the editor URL to a saved event ID. Parent and bridesmaid observed an explicit saved confirmation; the teacher found that feedback less conspicuous. All three cards reopened in Event details with finished artwork and their saved facts.

## Errors encountered

| Persona | Observed error | Recovery and impact |
| --- | --- | --- |
| Teacher | First background attempt: “The background included unwanted lettering or did not match the design. Your previous artwork is unchanged; please try again.” | One manual Retry design with the same brief succeeded. All entered facts remained. The error does not distinguish the rejection reason, and there was no previous artwork. |
| Parent | First Review attempt: “The generated lettering is clipped or overlaps the guest controls. We tried correcting it once. Your card is unchanged. Please try again.” | One manual Review retry succeeded. The first attempt failed by approximately 88 seconds; retry succeeded within approximately 49 seconds. Original background and form remained intact. |
| Bridesmaid | No blocking application error observed. | Background ready within approximately 35 seconds; Review completed within approximately 79 seconds; save acknowledged within approximately 12 seconds. |

These are **observed quality-check rejections**, not independent proof of what was wrong with rejected images, which the UI did not show. Two of the three scenarios required a manual retry in this small run; this is not a measured production failure rate. Timings are approximate observation bounds, not server instrumentation.

## Improvements in priority order

| Priority | Finding | Suggested improvement |
| --- | --- | --- |
| High | Background or lettering checks interrupted two scenarios and added another generation wait. | Investigate the rejected outputs/checker decisions and improve first-pass generation. Keep the working preservation behavior. Give a specific, actionable retry reason; use first-generation error copy when no earlier artwork exists. |
| Medium | Review begins with generic preparation wording; navigation, Preview and Save are unavailable during the wait. | Show venue, wording and lettering stages consistently, and offer a safe return to editing before persistence. Preserve the existing indeterminate progress rather than inventing percentages. |
| Medium | Review's When summary omits the end time, although Overview, Calendar and saved fields retain it. | Show the complete event-local date and time range in the final review summary. This is a display omission, not data loss. |
| Medium | A teacher has no School/classroom event type; General event suggestions do little to support a family reading picnic. | Add education-relevant starting ideas or a suitable category. Keep a custom brief available. |
| Low | Directions labels shrink multiword venues to “Maggie,” “Lincoln,” and “Garfield.” | Use the complete recognizable venue name, or “Get directions.” |
| Low | Gift guidance appears in Overview but not beside the Gift Registry link. | Include the gift note in the registry popup, or explain its destination at entry. |
| Low | Reopening a saved card still uses “Create your Live Card.” | Use an edit heading and a subtle saved-draft indicator. |

The teacher also preferred school email over a required host phone. This conflicts with the current deliberate phone-required RSVP policy, so it is a product-research question rather than a regression or an automatic change request. Meeting/access notes were successfully preserved in Overview; a teacher might expect those notes alongside the venue too.

## Persona feedback

- **Parent:** The birthday artwork and simple sections worked well. The lettering rejection was the main interruption; preserving all details made retry safe. Clear caregiver instructions and the full schedule were visible in guest previews.
- **Teacher:** Editing during generation was productive, and the final reading-picnic card looked appropriate. School-focused suggestions, clearer retry explanations and work-contact flexibility would improve confidence.
- **Bridesmaid:** The finished conservatory artwork and expressive lettering suited the occasion. Full end-time review, better preparation status and gift guidance beside the registry would make final checking easier.

Detailed walkthroughs: [Parent](parent.md), [Teacher](teacher.md), [Bridesmaid](bridesmaid.md).

## Supporting source observations

These source checks explain UI observations; they do not replace the browser walkthroughs.

- `src/app/live-cards/LiveCardBuilder.tsx:1067` builds the Review date summary from the start instant only.
- `src/lib/live-card-locations.ts:101` selects the first non-article word for the Directions short name; `src/components/studio/StudioLiveCardActionSurface.tsx:1149` uses that short name in the button label.
- `src/lib/shared-card-generation.ts:133` uses the same combined background-check failure message even for a first generation.
- `src/lib/shared-card-headline.ts:56` maps checker issues to the lettering error; its generation flow performs one bounded correction before returning a failed check to the UI.
- `src/components/studio/StudioLiveCardActionSurface.tsx:1203` renders the registry panel without the card's gift-note field.

## Coverage limits

- Desktop Chrome and one existing signed-in account only; no mobile, separate-account isolation, anonymous guest, or full accessibility audit.
- No publication, actual guest RSVP, invitation/email, external registry/directions launch, or calendar save was performed.
- Download invitation was clicked for each card without a visible application error. Completed files, JPEG bytes, printed wording and QR destinations were **not verified**: macOS Downloads access/browser-internal-page restrictions prevented that check. A click is not evidence that the file completed.
- Chrome extension/debugger interruptions occurred during setup and observations. These are recorded separately from application errors.
- Initial production Design pages were opened before the user redirected testing to localhost; all generation and saving in this run used the local app UI.
