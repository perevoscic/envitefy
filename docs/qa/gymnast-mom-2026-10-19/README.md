# Gymnastics parent journey QA October 19 2026

## Fix follow-up — October 19, 2026

The four requested defects (F2, F3, F4 and F8) are fixed in the working tree. The findings below retain the original audit evidence.

| Issue | Change and verification |
| --- | --- |
| Import dates and Florida timezones | Date-only imports keep literal local dates and no invented clocks. The editable final day stays inclusive; calendar exports use an exclusive end. Venue timezone resolution uses the existing address geocoder and geographic boundaries, leaving an unresolved zone empty instead of defaulting to Chicago. Event-local preview, saving, nested builder data and hydration share the same conversion. Actual-PDF regressions cover both packets, DST, explicit midnight, missing zones and manual clears. |
| Venue instructions disappear after save/reopen | Template editors receive saved discovery metadata separately from editable snapshot fields and preserve import identity. Saves also synchronize edited venue/address and section data with the nested builder, retaining omitted values and intentional clears. The browser regression checks the saved guest renderer and reopened editor, including the Coffee Bar instructions. |
| Hotels action opens an awards vendor | Accommodation classification now requires evidence from the link itself. Rendering also filters previously saved incorrect fallback links. The reopened Xcel draft has eight Book Hotel links and no `a-1awards.com` link. |
| Signup Close is clipped | The dialog centers when it fits and starts within the scrollable viewport when taller. Browser coverage checks signup/login at 390×568, 320×480, 667×375 and 1280×900, including the full 44px Close target, scrolling, Escape and reopening. |

Both existing synthetic private drafts were explicitly corrected and verified after a fresh reload on localhost:3001:

- Gasparilla: March 6–8, 2026, `America/New_York`, empty start/end clocks. Venue guidance and the deliberately empty welcome message remain intact.
- Xcel: April 10–12, 2026, `America/New_York`, empty start/end clocks. All eight hotel booking cards remain.

Existing ambiguous authored dates are not automatically rewritten. The two test drafts were corrected explicitly; nothing was published. Live screenshots: [Gasparilla dates](gasparilla-fixed-reopened.png), [Xcel dates](xcel-fixed-reopened.png), [retained venue guidance](venue-guidance-fixed-reopened.png), [signup at 390×568](signup-close-fixed-390x568.png). Reopened DOM evidence: [Gasparilla](gasparilla-fixed-reopened.txt), [Xcel](xcel-fixed-reopened.txt).

Final verification: `test:unified-create` **166 passed**, `test:event-editor` **42 passed**, `test:calendar` **36 passed**, `test:cohosts` **43 passed**, `test:signup-hosts` **48 passed**, and `test:create-browser` **8 passed**. Typecheck and targeted lint passed. Browser test fixtures use mocked transport; they do not create accounts, send emails or call paid providers. The broader `test:create-remediation` run has **828 passed / 2 failed**: a cursor-bind assertion and an extensionless Live Card module import. Both failures reproduce unchanged against HEAD in an isolated temporary fixture. A separate legacy gymnastics-renderer run has **24 passed / 21 failed**, with the identical failing names and count against its HEAD renderer baseline. Other findings in this audit remain outside this four-item follow-up.

## Original audit

A new gymnastics parent can create an account, import real meet PDFs and save private drafts. The resulting pages are not yet reliable enough to replace the packets: session schedules disappear, calendar fields disagree with the visible date range, and reopening a saved import hides useful venue instructions.

## Journey and outcome

The synthetic adult persona was **Megan QA Gym Mom**, using `qa.gymmom.20261019.40321230@example.com`. Signup used the actual form, recorded the approved legal acceptance, created the account and signed in. No existing user account was used. The generated password is kept only in `/private/tmp/envitefy-gymmom-test-account.json`, with owner-only file permissions, outside the repository.

The browser first used the existing localhost:3000 app. After its auth requests stalled, the test continued on an independently started localhost:3101 server using the app's configured backend. That test server has been stopped; the original server was left running.

| Meet | Source and entry | Result |
| --- | --- | --- |
| Women’s Gasparilla Classic | Four-page parent information PDF, gymnastics gallery Upload packet | Imported, previewed, explicitly saved as a private draft, reopened and edited |
| Florida Xcel Bronze Silver Gold State Championships | Five-page information and schedule PDF, general `/create` Upload | Recognized as gymnastics, retained through interruption, resumed the same import, opened and explicitly saved as a private draft |

Saved event IDs are `44dd1c61-3be2-4194-a291-30b41de5fe52` and `5952f2d4-7dd3-43b3-9a23-96022190f0e7`. Nothing was published or shared with guests.

Tests covered desktop and 390px phone layouts, signup, file selection, automatic recognition, import progress, recovery, editing, full-screen preview, calendar chooser, explicit draft saving and reload. An intentional empty welcome message survived saving and reload. The calendar chooser opened, but the Apple Calendar handoff could not be verified in the test browser; no calendar-save success is claimed.

## Highest priority findings

### F1 Session schedules are omitted by the product contract

**P1 product gap, confirmed in the browser and source.** The Xcel packet has **31 distinct competition sessions**: R01–R09, W01–W11 and B01–B11. The completed page has no Sessions or Schedule section and none of those session codes. A parent cannot find her gymnast's warm-up or competition session, although eight detailed hotel cards are present.

This is intentional in the current extraction contract, rather than a random OCR miss. `ParseResult` has no schedule collection, the parser prompt forbids moving session grids into other fields, and the renderer filters `schedule_grid` pages. Existing tests explicitly assert that schedule extraction remains absent. This conflicts with the gymnastics landing's promise to organize schedules, warm-ups and rotations.

Reproduce by uploading the Xcel PDF, waiting for the completed editor, and comparing page 2 of the packet with the rendered sections. Decide the intended parent experience before changing the retired contract: a retained, clearly labeled original schedule is the minimum useful fallback.

Source: `src/lib/meet-discovery/core.ts`, `src/lib/meet-discovery/contract-regression.test.mjs:33`, `src/components/gym-meet-templates/buildGymMeetDiscoveryContent.ts:1115`. Evidence: [completed Xcel editor](xcel-completed-editor.txt), [source packet](../../Xcel-BSG-State-2026-Info-Schedule-Updated-3.22-Afternoon.pdf).

### F2 Calendar dates shift while the visible date range looks correct

**P1, confirmed in both imports; Gasparilla persisted through save and reload.**

| Field | Gasparilla | Xcel |
| --- | --- | --- |
| Printed and displayed range | March 6–8, 2026 | April 10–12, 2026 |
| Editor start | March 6 at 00:00 | April 10 at 00:00 |
| Editor end | **March 7 at 18:00** | **April 11 at 19:00** |
| Editor timezone | **America/Chicago** | **America/Chicago** |
| Venue | Tampa, Florida | Gainesville, Florida |

The interface marks Event basics Done despite the mismatch. Both Florida venues need Eastern time, not the shell's Chicago default. Date-only input becomes midnight UTC; clock detection then mistakes text inside that synthetic ISO value for a real clock. Start hydration reads literal ISO text while end hydration uses the browser's local date getters. The resulting end date falls on the previous evening. The source diagnostic reproduces the exact Gasparilla values without provider calls.

Use one event-local date representation throughout extraction, hydration, preview and save. Preserve date-only ranges without inventing session clocks, and derive or request the venue timezone instead of silently inheriting Chicago.

Source: `src/lib/meet-discovery/core.ts` functions `hasAnyDiscoveryTimeSignal` and `hasExplicitDiscoveryStartTime`; `src/lib/event-guest-planning.ts:110`; `src/lib/discovery/persist.ts:70`; gymnastics editor date hydration. Evidence: [Gasparilla imported fields](gasparilla-imported-dates.png), [fields after save and reload](gasparilla-dates-after-save-reload.png), [Xcel imported fields](xcel-imported-dates.png), [executable diagnostics](source-diagnostics.cjs), [results](source-diagnostics.results.json).

### F3 Saving and reopening hides imported venue guidance

**P1 visible content loss, confirmed live and through isolated source execution.** Save the Gasparilla import without changing its content, then reload. The editor redirects to the template route and changes what the parent sees:

| Before saving | After reopening |
| --- | --- |
| Venue Details with East, Central and West Hall guidance and Coffee Bar entrance instructions | Venue Details and those instructions missing |
| Short bulleted family overview | One long paragraph |
| Spectator policies inside Admission | Separate Safety Policy section |
| Parking links in Documents | Same links repeated in Travel and Documents |

Save draft uses `buildTemplateDraftPayload` and adds `templateEditor.snapshot`. The snapshot carries `data`, `advancedState` and `themeId`, without the loaded discovery metadata. The template wrapper removes `edit` from the parameters exposed to the native editor, so its discovery hydration does not run and it selects the manual rendering path.

The source data survives the outgoing save in the isolated reproduction. This establishes content disappearing from the reopened page, **not permanent database deletion**. Preserve the discovery identity and hydrate its metadata when reopening; compare the rendered content before and after saving.

Source: `src/components/events/useEventPageEditor.ts:199`, `src/lib/template-draft-handoff.ts:80`, `src/components/templates/TemplateEditorContext.tsx:113` and `:136`, `src/app/event/gymnastics/customize/page.tsx:639`. Evidence: [before save](gasparilla-before-save.txt), [after save](gasparilla-after-save.txt).

### F4 The hotel action points to an awards vendor

**P2, confirmed in the completed Xcel page.** The Hotels & Travel action points to `https://a-1awards.com/`. Parents looking for accommodation would leave for an awards supplier. The actual hotel cards and reservation links are also present, making this extra action misleading.

An isolated execution of the current annotation labeling and resource classification functions reproduces a plausible cause: an unrelated unlabeled link on a page containing a host-hotel phrase becomes Host Hotels, receives 0.96 confidence, and is selected as the travel fallback. The exact live link provenance was not inspected; the observed wrong destination is established independently. Require link-specific evidence before treating a resource as a hotel or applying it as a fallback.

Source: `src/lib/meet-discovery/core.ts:4507`, hotel context fallback at `:4557`, resource classification and travel fallback selection. Evidence: search for `a-1awards.com` in [completed Xcel editor](xcel-completed-editor.txt).

### F5 Important parent information is dropped without an original packet fallback

**P2, confirmed in Gasparilla's rendered page.** The packet's Sunday March 8 daylight-saving warning, official results/live-scoring links and visitor-guide destination are absent from the imported page. Its Documents section contains parking links but no original uploaded packet action. A parent cannot use the page to recover the omitted guidance. Keep important alerts and source destinations, and retain a clearly labeled original packet link when the page does not cover every useful item.

Evidence: [packet text](2026wgaspparentinfo.pdf.txt), [imported page before saving](gasparilla-before-save.txt), [saved page](gasparilla-after-save.txt).

## Other confirmed defects and usability findings

| ID | Priority and evidence | Parent impact and reproduction |
| --- | --- | --- |
| F6 | P1, isolated execution of actual launcher cleanup | Leaving a gymnastics-gallery import sends persistent cancellation without clicking Cancel. Start an import and navigate away after intake. See `GymnasticsLauncher.tsx:251` and the unmount diagnostic. |
| F7 | P2, isolated execution of actual launcher retry | One failed status request erases the recovery ID; retry creates another event without a durable intake key while the original may still run. See the retry diagnostic. The general `/create` path has stronger recovery. |
| F8 | P2, live phone screenshot | At 390×568, signup's Close control spans y=-41.17 to y=2.83. Nearly all of its 44px target is above the screen, and the dialog title is clipped. At 390×667 it fits. Use safe centering or top alignment when the dialog is taller than the viewport. `AuthModal.tsx:120`; [screenshot](signup-close-clipped-390x568.png). |
| F9 | P2, live local stall plus source | Signup remained Creating for over five minutes with no timeout/recovery message. The localhost runtime also stalled on its session endpoint, so this does not establish a production outage. The form's fetch chain has no application timeout. [Signup diagnostics](signup-diagnostics.md). |
| F10 | P2, isolated actual signup handler | One-character passwords and malformed emails both return 200 and reach mocked persistence. Native browser email validation covers ordinary form entry, but server validation is absent. Five isolated cases ran without account writes. [Evidence](signup-handler-evidence.json). |
| F11 | P2, live recovery sidebar | The interrupted second upload appeared twice in Drafts: once under the filename, linked directly to its server shell, and once under the recognized title, linked to its intake. This is duplicate presentation of one piece of work, not proof of two independently created meets. [Screenshot](duplicate-draft-entries.png). |
| F12 | P2, source-backed timezone reproduction | An 08:00 Los Angeles meet previews as 14:00Z in a Chicago browser, two hours early. Shared saving repairs the top-level value to 16:00Z, but the preview and nested builder event remain wrong. Published guest-calendar impact was not tested. [Diagnostic results](source-diagnostics.results.json). |

Lower-priority observations: signup field names disappear after values replace their placeholders; the gallery importer accepts one PDF/JPG/PNG while general Upload also accepts WebP and multiple photos; legacy timeout messages refer parents to Next server logs; the Xcel admission text repeats prices and the session-assignment link caption contains an entire warning paragraph. Owner signup notification email is awaited after account insertion and can delay success during slow SMTP delivery; that latency risk was identified in source, not reproduced with a slow SMTP server.

## What worked

- Account creation and automatic login from the gymnastics landing selected gymnastics preferences and opened its gallery.
- Both uploads retained their explicit 2026 year and recognized the correct meet title, venue and address after hydration.
- Gasparilla retained admission prices, arrival guidance, dietary exceptions, parking instructions and traffic warnings.
- Xcel retained eight structured hotel cards with rates, deadlines, telephone numbers and booking links.
- General upload recovery reused the existing server import identity after interruption.
- Both explicit Save draft requests succeeded. The saved empty welcome message remained empty after reload.
- Full-screen preview removed editing controls, and calendar provider selection was available.

## Automated verification and limits

Final focused runs: **75 tests passed and one failed**. Signup/onboarding/access passed 28; gymnastics source/import checks passed 37; legacy launcher/routing passed 10 with one failed source guard. The failure expects a removed time-based progress expression in `launcher-runtime-guards.test.mjs:18`; it is a stale assertion, not evidence of a runtime crash. Details are in [test results](test-results.json), [signup log](signup-tests.txt) and [gymnastics log](gymnastics-tests.txt).

Run the isolated reproductions from the repository root:

```sh
node docs/qa/gymnast-mom-2026-10-19/source-diagnostics.cjs
node docs/qa/gymnast-mom-2026-10-19/signup-handler-diagnostics.mjs
```

These characterize defects using actual source callbacks with mocked transport/persistence. They make no provider calls and are not release-readiness tests. Source hashes accompany their results. Packet hashes are in [source packets](source-packets.json).

This was a local working-tree audit, with HEAD `ba81f4eb138e63f57dc7d9f6635a8422c34cb19b` at the final check. Application files changed concurrently during the journey, causing repeated Fast Refresh and delayed hydration. Initial default Xcel fields later populated correctly and are therefore not reported as permanently lost. General-editor opening interruptions and the local server's cold compilation delays are not classified as production failures. No publication, guest RSVP, co-host invitation or external calendar persistence was tested.

No application fixes were made during the original QA pass. The follow-up above records the subsequent fixes. Temporary verification servers and their generated TypeScript includes were cleaned up; unrelated workspace changes were preserved.
