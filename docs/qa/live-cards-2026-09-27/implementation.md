# Live Card core fixes — implementation and regression report

Implemented locally on September 24, 2026 (America/Chicago). No deployment, database migration, provider change, or event-category change. The three persona cards remain private drafts.

## Changes delivered

- Review displays the event-local start/end range, both dates for overnight events, and only the start when no end was supplied. Browser timezone does not change the event's schedule.
- Saved cards, including newly saved drafts, use **Edit your Live Card**. Save confirmations sit beside the controls and clear after an edit. Failed saves preserve input.
- Review and Preview show the actual preparation stage with accessible indeterminate progress and reduced-motion support. **Cancel and keep editing** aborts preparation, preserves completed work, and rejects late responses from earlier attempts. Cancellation is unavailable after persistence begins.
- **Retry design**, **Retry wording**, and **Retry lettering** recover the failed stage using current input. Lettering retries reuse the background, approved wording, and verified venues. Recovery returns to Review or the wording-only Preview; it never silently saves or publishes.
- Design/headline failure responses retain `error` and add optional stage, code, retryable, and normalized issues. Diagnostics record stage, duration, attempt, outcome, and allowlisted checker codes without images, prompts, contacts, or provider responses. Existing quality gates and retry budgets remain: no automatic background retry and one automatic lettering correction at most. The existing background-check outage policy is preserved; lettering still requires verification.
- Location popups show **Get directions**, with the complete venue name in the accessible label and unchanged map destinations.
- Downloads announce **Preparing download…**, then **Download started** after browser initiation. Errors leave the control available to retry. JPEG encoding, PNG fallback, original dimensions, current wording, and QR destinations remain intact; downloading never saves an event.
- Follow-up from the host's screenshots: **Temporary lettering preview** appears above unfinished artwork and in full-screen Preview. It explains that the typing font is temporary and Review creates finished lettering. Editing a finished title or opening line restores the notice; completed or restored approved lettering removes it. A title-field hint explains the same transition. The notice is editor-only and never enters artwork or downloads. Preview measures footer height so the guidance and save controls fit phones and landscape.

School suggestions, new venue-note fields, gift-guidance changes, and model/prompt tuning remain deferred. The RSVP host-phone requirement is unchanged.

## Automated validation

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm run test:create-remediation` | Passed: 1,365 tests. |
| `npm run test:create-browser` | Passed: 5 suites, including guest preview/RSVP, owner mobile preview, and 668 template renderings across 12 layouts. |
| `node --test scripts/livecard-builder-browser.test.mjs` | Passed, including encoding failure/retry, accessible busy status, and download-start feedback. |
| Focused workflow and generation backend tests | Passed: 9 tests. |
| Biome lint for changed TypeScript/test files; `git diff --check` | Passed. |

The focused builder fixture covers explicit draft persistence/reload; successful and failed saves; published-card updates; event/browser timezone differences; wording-only Preview; late responses after cancellation; concurrent edits; targeted retries; full accessible directions; and no unexpected generation, upload, save, or publication. Backend tests cover missing end times, overnight events, first-generation quality failures, invalid images, checker outage, and the bounded lettering correction.

The lettering-guidance follow-up was checked for initial artwork, finished lettering, title/opening-line edits and reversions, and desktop/phone/landscape previews. Existing counters confirm it triggers no generation or save. TypeScript, Biome, the focused builder fixture, all 1,365 remediation tests, and the five Create browser suites were rerun successfully.

Download checks inject an encoding failure, verify that no success is announced, and retry successfully through a controlled pending state. They inspect real JPEG bytes at 2000×3000, current printed wording, and decoded public-card and registry QR destinations. Publication and guest behavior run only against isolated fixtures. No real guest messages or RSVPs were submitted.

The sandbox initially blocked fixture loopback listeners; those checks passed with authorized local-server access. The Playwright-matching Chromium was installed from the official distribution. The optional VS Code lint bridge was unavailable; direct Biome lint passed instead.

## Existing localhost drafts

All three were reopened from their existing saved IDs. Desktop Review showed the original finished artwork, **Edit your Live Card**, disabled private sharing, clean/disabled Save draft, and the complete saved time range. No saved-draft edits, additional generation, saves, or publication were performed during these rechecks.

| Draft | Verified schedule — Sunday, September 27, 2026 | Desktop | Mobile, 390×844 |
| --- | --- | --- | --- |
| [Mia's Woodland Birthday](http://localhost:3000/live-cards?edit=1d767baf-a163-4276-95e5-2064fd5ebf63) | 2–4 PM, Chicago | Passed; woodland artwork intact. | Pending: browser automation blocked. |
| [Room 12 Family Reading Picnic](http://localhost:3000/live-cards?edit=dd56be08-b632-4bdb-b9a4-1cd9138a3a30) | 10 AM–noon, Chicago | Passed; reading-picnic artwork intact; complete Lincoln Park Conservatory directions label. | Pending: browser automation blocked. |
| [Sophie's Garden Bridal Shower](http://localhost:3000/live-cards?edit=fe205a9b-b09a-48a8-a1f3-bbc2ac48f070) | 1–3 PM, Chicago | Passed; conservatory artwork intact. | Passed; preserved artwork/time range and complete Garfield Park Conservatory directions label. |

The local development server stopped during the first recheck, causing a wording-service error; the new **Retry wording** control appeared. The server was restarted and desktop Review then succeeded for all three drafts.

Chrome subsequently reported that another extension interface was blocking automation. The parent/teacher saved-draft mobile checks, temporary QA-tab cleanup, and final viewport reset require Chrome to become available. The isolated fixture separately passed at 320/390-pixel phone widths and landscape; that does not substitute for checking these two actual saved drafts. This limitation is external to the application and was reported to the user.
