# Guest experience, reporting and release remediation plan

This is a plan only. It reuses captured requests, drafts and the 200 archived image artifacts. It makes no provider calls and generates no new artwork. The master plan combines these groups with extraction, prompt and image-verification work; prompt edits alone cannot repair missing guest controls or CSS.

The completed baseline is 93 reviewed cases: 1 passed the full quality bar and 92 require fixes. All 93 published locally and passed explicit save/resume; 83 delivered a distinct appearance edit and 56 passed complete technical guest checks. These are synthetic persona sessions.

Every group below has exact case/finding IDs and historical review paths in [guest-release-plan.json](guest-release-plan.json). Historical copies are provenance, not additional unique bugs. The root inventory is the exhaustive cross-workstream checklist.

## GR01 · P1 · Show the complete accepted artwork at every preview size

**Owner:** Preview/UI agent. **Dependencies:** Approved product/output and artwork geometry contract from prompt/artwork workstream.

The dialog computes width and height independently, forces a 90%-viewport height, and overrides its image to object-fit:cover. A narrow box therefore crops an intact 2:3 composition; a no-horizontal-overflow check misses this. Source and guest images often remain correct. Portrait Event Page hero recropping is a separate output-layout issue, not evidence that all art is defective.

**Modules:** `src/app/chat/ChatProductPreview.tsx`, `src/components/ArtworkPreviewDialog.tsx`, `src/components/ArtworkPreviewDialog.module.css`, `src/components/studio/StudioShowcaseLiveCard.tsx`, `src/components/studio/LiveCardArtworkFrame.tsx`, `src/components/EventPreviewViewport.tsx`.

Implementation:

- Derive the fitted artwork rectangle from the verified intrinsic dimensions and available bounds; use contain for complete text-bearing artwork. Keep poster versus overlay-text contracts explicit.
- For native mobile EventPreviewViewport preserve full-width native CSS, no scale/device padding or reserved hero toolbar band. Let event content scroll underneath floating controls as the standing product rule requires.
- Preserve composition/aspect intent through accepted appearance edits. A text-free Event Page background can crop only within its approved focal/subject safe zone; do not require raster text that belongs in page HTML.

No-cost regression replay:

- Replay all archived 2:3 Live Cards into the actual dialog at 320, 360, 390, 430, 768 and 1440 CSS px, portrait/landscape and 200% zoom.
- Assert image rendered bounds match contain math and all four source edges remain visible; inspect screenshot diffs for birthday, gymnastics, football, anniversary, workshop, wrestling and hockey.
- Replay landscape and portrait Field Trip Event Page assets with a fixed focal point and verify the subject is not silently cut off.

Acceptance:

- Zero newly clipped approved text or required composition edges on archived text-bearing assets.
- Preview and guest artwork contain the same accepted asset/version; no hidden crop override.
- Device switching/closing preview changes no draft, accepted artwork, selected format or persistence state.

Mapped findings: 32 in latest reviews, 1 historical-only review IDs and 0 raw/control records.

- `anniversary--live_card::anniversary-mobile-preview-clipping` — The phone creation preview clips the enlarged Event draft headline
- `appointment--live_card::appointment-live-preview-crop-contrast` — Phone creation preview clips Family Portrait and action labels have weak contrast
- `baby_shower--event_page::baby-shower-event-page-preview-contrast` — The artwork-only preview hides the published headline contrast and crop
- `baby_shower--live_card::baby-shower-mobile-preview-clipping` — The creation phone preview clips both exact bilingual lines
- `baseball--live_card::baseball-mobile-preview-title-crop` — Phone creation preview clips the title on all three lines

## GR02 · P1 · Preview the real Event Page and enforce actual title contrast

**Owner:** Preview/UI agent. **Dependencies:** Canonical event view model; GR04, GR06 and GR07 action/data contracts.

Chat currently previews only the hero img. Publication adds navigation, HTML title, body, planning and actions, including observed dark-on-dark titles. The component already declares text-white: investigate computed styles/global unlayered heading/theme rules rather than merely adding that same class.

**Modules:** `src/app/chat/ChatProductPreview.tsx`, `src/components/concierge/ConciergeEventWebsite.tsx`, `src/app/event/[id]/page.tsx`, `src/components/EventPreviewViewport.tsx`, `src/app/globals.css`.

Implementation:

- Extract one typed Event Page view model and reuse the real renderer for in-memory preview and publication; preview mode must inhibit writes, not hide content or actions.
- Scope heading/theme styles so themed hero foreground wins correctly without broad global !important patches. Set explicit local surface/foreground tokens and a tested legibility overlay.
- Keep HTML title, body, schedule, RSVP and location in the preview so creators can review the exact deliverable. Preserve the artwork-first hero and category individuality.

No-cost regression replay:

- Mount archived Event Page props through both preview and public adapters; compare normalized DOM text, critical links, computed colors and screenshot crops.
- Dark/light app themes, all 31 families, dark edited artwork and mobile/desktop. Use loaded production CSS so cascade bugs cannot hide in component-only tests.

Acceptance:

- All required guest text/actions visible in preview and publication with identical values.
- Computed text contrast at least 4.5:1 for normal text and 3:1 for large text across approved hero surfaces; visually review image-backed text.
- No claim of new image-model reliability from these renderer-only checks.

Mapped findings: 43 in latest reviews, 2 historical-only review IDs and 1 raw/control records.

- `appointment--event_page::appointment-preview-and-title-contrast` — The preview hides the published page's hard-to-read title
- `appointment--live_card::appointment-live-preview-crop-contrast` — Phone creation preview clips Family Portrait and action labels have weak contrast
- `baby_shower--event_page::baby-shower-event-page-preview-contrast` — The artwork-only preview hides the published headline contrast and crop
- `baseball--event_page::baseball-page-title-preview` — Dark published heading is absent from image-only preview
- `baseball--live_card::baseball-mobile-preview-title-crop` — Phone creation preview clips the title on all three lines

## GR03 · P1 · Keep guest controls readable and clear of required artwork copy

**Owner:** Preview/UI agent. **Dependencies:** GR01; Artwork safe-zone and no-fake-controls validator from artwork workstream.

Guest Share/Close and bottom actions cover real names, RSVP contacts, no-gifts wording, address or footer content on some complete Flyers/Cards. White labels lack contrast on pale artwork. Some accepted rasters contain imitation controls under the real UI. Prompt safe zones alone cannot correct host controls placed over required text.

**Modules:** `src/components/studio/StudioLiveCardActionSurface.tsx`, `src/components/studio/StudioShowcaseLiveCard.tsx`, `src/components/ArtworkPreviewDialog.module.css`, `src/components/concierge/ConciergeEventWebsite.tsx`, `src/lib/studio/product-contract.ts`, `src/lib/studio/prompts.ts`.

Implementation:

- For self-contained Flyers, render real controls outside the artwork surface or in a collapsible layer that does not obscure essential content; keep the full composition intact.
- For Live Cards, use the explicit composition safe-zone contract and contrasting button surfaces; validate actual control/text intersections at runtime preview sizes.
- Ensure one genuine toolbar, 44px product tap targets, accessible names, keyboard focus and pointer pass-through outside interactive elements.
- Upstream prompt contract forbids painted Share/RSVP/More controls; verifier flags archived examples. If an existing raster contains a fake button, clearly treat it as failed evidence—do not pretend a UI-only change removes it.

No-cost regression replay:

- Replay Birthday and Baby Shower exact no-gifts copy, Gymnastics address, Volleyball Room B/address, Wrestling/Anniversary headings and pale Bridal Shower/Hockey labels.
- Measure real control bounding boxes against known required-copy regions; keyboard navigation must never move focus entirely behind persistent UI. Perform manual screenshots because raster letters are not DOM accessibility nodes.

Acceptance:

- Zero overlap of actual controls with required text in all 93 archived compositions where required-copy regions are known.
- All interactive targets meet 44×44 px product rule and accessible name/focus behavior.
- Action label and control contrast verified against their real surface; shadow alone does not establish contrast.

Mapped findings: 25 in latest reviews, 1 historical-only review IDs and 1 raw/control records.

- `anniversary--digital_flyer::anniversary-guest-controls-overlap-footer` — Guest controls overlap title, RSVP and lower copy
- `appointment--live_card::appointment-live-preview-crop-contrast` — Phone creation preview clips Family Portrait and action labels have weak contrast
- `baby_shower--digital_flyer::baby-shower-guest-controls-obscure-no-gifts` — Published guest controls cover the supplied No gifts, please note
- `baby_shower--live_card::baby-shower-generated-faux-controls` — Accepted artwork contains a fake heart/share/more toolbar behind the real actions
- `baseball--digital_flyer::baseball--digital_flyer-phone-copy` — Dense logistics remain small after larger-lettering edit

## GR04 · P1 · Render complete, readable schedules and nonduplicated locations

**Owner:** Guest contract agent. **Dependencies:** Canonical clock/schedule repair from root workstream; Canonical locations and required guest-copy contract.

Live Card Overview passes eventDate/startTime without endTime; Event Page visible summaries often omit a valid end. Location joining deduplicates only complete identical strings, so venue prefix plus full venue/address repeats the venue. Image copy contains mixed 12/24-hour time, ISO dates, technical timezone strings and redundant itinerary wording.

**Modules:** `src/components/studio/StudioLiveCardActionSurface.tsx`, `src/components/concierge/ConciergeEventWebsite.tsx`, `src/lib/event-website-schedule.ts`, `src/lib/live-card-locations.ts`, `src/app/chat/ConciergeChatClient.tsx`, `src/app/studio/studio-workspace-builders.ts`, `src/app/event/[id]/page.tsx`.

Implementation:

- Introduce one locale-aware display formatter over canonical event timezone, date and start/end; never parse display strings back into authoritative event facts.
- Represent venue/room/street/city and itinerary stops structurally, deduplicate identical components once and retain distinct legitimate stops.
- Carry arrival/doors/departure/return/competition times as labelled secondary items, not repetitions of the primary event range.
- Format exact same approved logistics for page/Card/Flyer prompt payloads: one human-readable date, consistent clock style, clear timezone label when relevant; no machine timezone/ISO boilerplate.

No-cost regression replay:

- Assert supplied 2–4 PM and 2–3 PM appear as ranges, unknown end remains absent, and September 23 is displayed consistently.
- Replay Anniversary vow/dinner, Field Trip departure/return, school drop-in, graduation and Game Day; preserve separate timings and addresses exactly once.
- Assert prompt logistics text is normalized before any model call and render archived pages with the new formatter; no new raster generation.

Acceptance:

- Known event end displayed in every relevant summary; no invented end, overlap or duplicated stop.
- Venue+Room B+street address represented exactly once and all original distinct locations retained.
- Locale/timezone consistent across chat recap, preview, public details and Calendar. Existing raster formatting defects stay marked unresolved until valid delivery path replaces them.

Mapped findings: 40 in latest reviews, 3 historical-only review IDs and 0 raw/control records.

- `anniversary--digital_flyer::anniversary-logistics-format` — Dense logistics use mixed time formats and repeated venue
- `appointment--digital_flyer::appointment--digital_flyer-mobile-logistics` — Small logistics and overlay placement weaken phone readability
- `baby_shower--digital_flyer::baby-shower-logistics-machine-format-and-duplicate-venue` — The flyer prints mixed time formats and repeats the venue
- `baby_shower--event_page::baby-shower-event-page-planning-display` — The visible schedule omits 4 PM and Where repeats the venue
- `baseball--digital_flyer::baseball--digital_flyer-phone-copy` — Dense logistics remain small after larger-lettering edit

## GR05 · P0 · Unify Calendar/ICS payloads and restore Calendar availability

**Owner:** Guest contract agent. **Dependencies:** Root canonical primary-time and content-preservation repairs; GR04 location/display formatter.

Verified failures include wrong canonical noon exported by Gymnastics/Swimming Event Pages, omitted venue/Room B from all provider payloads, missing no-gifts/bring-list/safety descriptions, and absent Calendar on valid schedule-based published Cards/Flyers. The LiveCard builder selects street OR venue rather than composing both. Wrong export must not be claimed when no Calendar was rendered.

**Modules:** `src/lib/live-card-calendar.ts`, `src/lib/calendar-description.ts`, `src/lib/calendar-date-time.ts`, `src/utils/calendar-links.ts`, `src/app/api/ics/route.ts`, `src/app/event/[id]/page.tsx`, `src/components/studio/StudioLiveCardActionSurface.tsx`, `src/app/chat/ConciergeChatClient.tsx`.

Implementation:

- Use a shared calendar event projection from authoritative instants, event timezone, canonical composed location, required public instructions and labelled itinerary; both page and Card paths call it.
- Prefer explicit event timezone/instants, never viewer timezone for a known event; treat viewer-zone/unknown-end fallback as a contract decision, not silent invented facts.
- Drive action availability from valid canonical calendar facts, not a display startTime regex. Keep planned missing details explicit and request clarification if required.
- Escape/fold ICS correctly and preserve Unicode/multiline notes; keep Google/Outlook/ICS semantically identical.

No-cost regression replay:

- Decode Google dates/ctz/location/details, Outlook start/end/location/body and parsed ICS DTSTART/DTEND/LOCATION/DESCRIPTION for all 93 archived saved payloads.
- Golden expected records come from the approved original/effective brief, never just a previous wrong draft. September 23, Chicago 2–4 PM, room correction, required safety/gear/no-gifts and itinerary need explicit assertions.
- Replay publication where Calendar vanished (Gymnastics Live/Flyer, Football Flyer, Dance Flyer, Swimming Live/Flyer, Field Trip Flyer) and assert the real button/menu exists and yields valid links.
- Add future timezone/DST/overnight/multiday cases as new coverage; label these preventive tests rather than campaign-observed bugs.

Acceptance:

- All 93 canonical calendar fixtures agree with approved facts; available-action fixtures show the expected Calendar control.
- Zero wrong instants, missing required venue/room or required practical description among affected cases; all three providers agree.
- External provider UI acceptance and account OAuth remain separate staging followups; captured URLs are not evidence of completed external events.

Mapped findings: 34 in latest reviews, 3 historical-only review IDs and 7 raw/control records.

- `anniversary--event_page::anniversary-end-time-disagrees-with-iso` — Confirmed 6:30 PM end remains 4 PM in the canonical timestamp
- `appointment--event_page::appointment-calendar-venue-name-lost` — Calendar location drops Maple Community Center
- `baseball--event_page::baseball-page-location-export` — Calendar omits venue and room and no directions action exists
- `birthday--digital_flyer::birthday-calendar-drops-no-gifts` — Calendar handoffs drop the explicit no-gifts instruction
- `birthday--event_page::birthday-event-page-required-gift-line-missing` — The explicitly required No gifts, please. line disappears from the guest page and calendars

## GR06 · P1 · Offer Directions for every approved physical location

**Owner:** Guest contract agent. **Dependencies:** GR04 canonical location composition.

Event Pages show physical addresses with no Directions action. Some Cards have valid Google/maps/search?query links incorrectly flagged by the earlier checker; those are not product failures.

**Modules:** `src/components/concierge/ConciergeEventWebsite.tsx`, `src/lib/live-card-locations.ts`, `src/lib/directions.ts`, `src/app/event/[id]/page.tsx`, `scripts/lib/create-campaign-guest.mjs`.

Implementation:

- Reuse canonical location actions for Event Pages; render a labelled Directions link per distinct physical stop, including room/venue in visible context.
- Encode query/destination safely and suppress the action for an unprovided/nonphysical location. Retain accessibility labels that name the destination.
- Keep checker URL support aligned with actual supported Maps forms and retain historical false-negative annotations.

No-cost regression replay:

- Exercise each real Event Page Directions link with archived single/multilocation payloads; parse approved /maps/search query and /maps/dir destination forms.
- Assert no invented location or duplicate dinner/return action; ensure corrected Room B is present when supplied.

Acceptance:

- Every approved physical Event Page location exposes a working encoded handoff.
- Historical valid Maps checker failures remain infrastructure-only and do not inflate product defect counts.
- External navigation/route quality remains explicitly untested until controlled staging checks.

Mapped findings: 27 in latest reviews, 1 historical-only review IDs and 27 raw/control records.

- `appointment--event_page::appointment-directions-missing` — The appointment page has no directions action
- `baby_shower--event_page::baby-shower-event-page-directions-missing` — Guests have no directions control for the supplied address
- `baseball--event_page::baseball-page-location-export` — Calendar omits venue and room and no directions action exists
- `basketball--event_page::basketball-guest-planning-controls` — The page omits the end and directions while duplicating the venue
- `birthday--event_page::birthday-event-page-directions-absent` — The full physical address has no guest directions action

## GR07 · P0 · Make RSVP UI, mode and endpoint requirements one contract

**Owner:** Guest contract agent. **Dependencies:** Root capability/intent/negation and approved content contract; GR08 contextual category routing.

Gender Reveal Event Page sends no required genderGuess and receives HTTP 400. Appointment plan and rendered RSVP mode disagree. Game Day generation suppresses supplied organizer/contact even while RSVP is enabled, so self-contained sports Flyers lack promised contact.

**Modules:** `src/components/EventRsvpPrompt.tsx`, `src/components/studio/StudioLiveCardActionSurface.tsx`, `src/components/concierge/ConciergeEventWebsite.tsx`, `src/app/api/events/[id]/rsvp/route.ts`, `src/lib/gender-reveal.ts`, `src/lib/live-card-rsvp.ts`, `src/app/studio/studio-workspace-builders.ts`, `src/app/studio/studio-workspace-field-config.ts`.

Implementation:

- Build one validated RSVP configuration/field schema and share it between draft, guest renderer and endpoint; category defaults must not introduce an invisible required answer.
- Render and submit configured genderGuess or explicitly configure it optional; preserve entered fields on errors, announce an actionable error, and show success only after confirmed persistence.
- Separate no-booking-form from no-RSVP intent. Use explicit selected mode and do not let assistant plans contradict it.
- Use effective RSVP support consistently for organizer/contact serialization and Flyer copy. Preserve supplied contact through initial generation, appearance edits and save/resume.

No-cost regression replay:

- Replay real Gender Reveal guest Yes/No/Maybe with required and optional guesses against the isolated endpoint/database; confirm persisted response, validation error and no duplicate writes on retry.
- Compare Event Page and Live Card RSVP configuration for the same draft, including informational appointment and school open house.
- Assert all supplied sports Flyer contact details survive generation payload, approved copy and export metadata without provider calls.

Acceptance:

- No form can require a field it cannot collect; all configured anonymous responses persist successfully and failures remain recoverable.
- RSVP mode and actual contact agree with the host approved intent through all transitions.
- Email tests use the local sink now; a real Zoho SMTP staging test is separate and must preserve standing provider, signature and public-link rules.

Mapped findings: 12 in latest reviews, 3 historical-only review IDs and 0 raw/control records.

- `appointment--event_page::appointment-rsvp-plan-mismatch` — The delivered RSVP form contradicts the assistant's informational-only plan
- `baseball--digital_flyer::baseball--digital_flyer-contact-mapping` — Image loses organizer and RSVP contact retained by draft
- `basketball--digital_flyer::basketball--digital_flyer-missing-contact` — Confirmed RSVP contact is absent from self-contained artwork
- `birthday--digital_flyer::birthday-guest-controls-hide-required-copy` — Guest action controls obscure the RSVP contact and no-gifts instruction
- `football--digital_flyer::football-theme-changes-on-rsvp-contact` — RSVP follow-up replaces the theme with a generic sport label

## GR08 · P1 · Separate school/community open houses from property listings

**Owner:** Guest contract agent with prompt agent. **Dependencies:** Root semantic subtype/negation contract; define context before wiring GR07 RSVP.

isOpenHouseLiveCard matches the words open house and unconditionally selects Property/Realtor. Generation defaults likewise demand real-estate marketing despite explicit school/not-for-sale context. The latest school Event Page routes correctly; preserve that positive control.

**Modules:** `src/components/studio/StudioLiveCardActionSurface.tsx`, `src/app/studio/studio-workspace-builders.ts`, `src/app/studio/studio-workspace-field-config.ts`, `src/lib/studio/prompts.ts`, `src/lib/concierge/extract.ts`, `src/app/chat/ConciergeChatClient.tsx`.

Implementation:

- Add/derive explicit approved open-house context (school/community/property); use real-estate actions only on positive property/listing evidence, never the bare phrase open house.
- Prompt, generation builder and guest action renderer must consume that same context. Ask one clarifying question when ambiguous instead of fabricating a listing.
- School/community uses event information/RSVP and retains main-office/drop-in/teacher instructions; property listings retain authorized realtor/logo/tour controls.

No-cost regression replay:

- Replay the three archived school formats, an explicit property listing positive control and an ambiguous open house; compare prompt constraints and rendered actions.
- No Property/Realtor label, listing requirement or suppressed RSVP for school context. Preserve correct current Event Page behavior.

Acceptance:

- School fixtures route consistently across all three formats, the property positive control retains property features, and ambiguous cases ask for clarification.
- No fabricated listing facts or agent contact.

Mapped findings: 3 in latest reviews, 0 historical-only review IDs and 0 raw/control records.

- `open_house--live_card::open-house-school-routed-to-property` — School open house uses real-estate controls and suppresses the normal RSVP flow
- `open_house--live_card::open-house-request-contract-contradiction` — Generation instructions demand real-estate marketing despite the school brief
- `open_house--digital_flyer::open_house--digital_flyer-real-estate-rsvp` — School open house receives Property/Realtor controls instead of RSVP

## GR09 · P1 · Deliver a real downloadable Flyer file

**Owner:** Preview/UI agent with export owner. **Dependencies:** GR01 complete composition; Accepted artifact/revision contract from artwork workstream.

The inspected owner and guest flows expose Preview/Open/Share/Dashboard but no Download. composeFlyerExport already exists and returns inline PNG with dimensions/DPI; absence of the control does not prove corrupt export or an absent export engine.

**Modules:** `src/app/chat/ChatProductPreview.tsx`, `src/app/card/[id]/page.tsx`, `src/components/studio/StudioLiveCardActionSurface.tsx`, `src/lib/studio/flyer-export.ts`, `src/lib/studio/product-contract.ts`, `src/app/studio/studio-workspace-api.ts`.

Implementation:

- Wire a clearly labelled Download Flyer action to the accepted verified export in preview and published owner flow, with guest access according to product sharing rules.
- Use a same-origin authorized streaming/download endpoint or verified blob download with correct Content-Disposition, sanitized filename and content type. Do not copy a rendered browser screenshot or include UI chrome.
- Keep generation originals/archives under standing WebP delivery cleanup; downloadable format is an explicit product contract, not permission to retain unverified PNG temporary files.
- Track the accepted artwork revision so rejected edits cannot be downloaded as final.

No-cost regression replay:

- Use archived WebPs to exercise the actual export/download click, capture file bytes, decode, verify format/dimensions/aspect/DPI for the requested contract and verify no UI buttons are baked into the export.
- Validate wrong/expired URLs, cross-origin art, interrupted downloads and restricted draft access without network providers.

Acceptance:

- Download is discoverable within one action from the Flyer result and yields a verified file for all 31 Flyer cases.
- The file contains the entire accepted composition with correct filename/content type; no invalid blob or navigation-only substitute.
- Do not claim image content defects are fixed merely by downloading it.

Mapped findings: 30 in latest reviews, 0 historical-only review IDs and 0 raw/control records.

- `anniversary--digital_flyer::anniversary-download-affordance-missing` — No discoverable Download action for the requested Flyer
- `appointment--digital_flyer::appointment--digital_flyer-download` — Download is absent from the downloadable-Flyer flow
- `baseball--digital_flyer::baseball--digital_flyer-download` — No discoverable Flyer download in inspected flow
- `basketball--digital_flyer::basketball--digital_flyer-download` — No Download action in inspected Flyer flow
- `birthday--digital_flyer::birthday-download-affordance-missing` — No discoverable Download action for the requested Flyer

## GR10 · P1 · Keep save status truthful and mobile navigation predictable

**Owner:** Chat state agent with Preview/UI agent. **Dependencies:** Root assistant claim/commit-state contract.

Some replies call in-memory progress saved when recorders show zero writes. The mobile drawer intercepting the composer was fixed and behavior checked; duplicate Open navigation controls remain observed. All 93 latest journeys passed explicit save/resume, so this is not evidence of 93 persistence failures.

**Modules:** `src/app/chat/ConciergeChatClient.tsx`, `src/lib/concierge/intake.ts`, `src/components/UnsavedProgressProvider.tsx`, `src/app/sidebar-context.tsx`, `src/app/left-sidebar.tsx`, `src/app/left-sidebar.controller.ts`.

Implementation:

- Feed the assistant explicit in-memory/saved/published state and reserve Saved wording for acknowledged successful writes; describe factual edits as updated until saved.
- Retain explicit Save/Discard/Keep editing behavior and saved draft identity. No autosave on opening, turns, artwork generation, pagehide or tab changes.
- Consolidate duplicate mobile menu controls while preserving existing drawer open/close, focus and inert behavior.

No-cost regression replay:

- Replay unsaved Saved-claim findings with the write recorder and model response fixtures; assert no Saved claim before an explicit acknowledgment.
- Save failure keeps the editor open; Discard restores the last saved state; Resume opens the matching editor with accepted artwork; the navigation destination is retained.
- Test fresh mobile, desktop resized to mobile, explicit opening, Escape, focus restoration and the keyboard composer; retain the closed drawer regression.

Acceptance:

- No assistant/UI save claim without a successful persistence acknowledgment for the same revision.
- No implicit draft writes throughout 93 replay flows; explicit Save/Resume remains passing.
- Exactly one visible Open navigation control at mobile breakpoints; the closed drawer does not intercept pointer or focus.

Mapped findings: 5 in latest reviews, 0 historical-only review IDs and 0 raw/control records.

- `baby_shower--digital_flyer::baby-shower-claims-saved-before-explicit-save` — The assistant describes unsaved progress as a saved schedule
- `field_trip--event_page::field-trip-claims-save-before-explicit-save` — The assistant calls the time saved before an explicit draft save
- `workshop--digital_flyer::workshop--digital_flyer-saved-claim` — Assistant calls the unsaved draft saved
- `campaign::campaign-desktop-mobile-sidebar` — Resizing desktop to mobile opened navigation over the composer
- `campaign::campaign-duplicate-mobile-navigation` — Mobile chat exposes two Open navigation controls

## GR11 · P1 · Make reports, review status and infrastructure results unambiguous

**Owner:** QA/integration agent. **Dependencies:** Exhaustive inventory with historical/current/fixed status; All workstream test evidence.

The report mixes a reconciled quality failure with the raw last stage needs_review, which looks unfinished even after independent review. Historical Maps false negatives, local capture/503 failures, timeouts, budget deferrals and quality rejections must remain separate. Historical first-cycle limitations are already explicitly labelled historical; that text is not a current coverage bug.

**Modules:** `scripts/lib/create-campaign-report.mjs`, `scripts/lib/create-campaign-reconciliation.mjs`, `scripts/lib/create-campaign-guest.mjs`, `scripts/lib/create-campaign-network.mjs`, `scripts/lib/create-campaign-timeout.mjs`, `scripts/lib/create-campaign-browser.mjs`, `scripts/lib/create-campaign-budget.mjs`, `scripts/lib/create-campaign-execution.mjs`.

Implementation:

- Show separate Technical journey (published/recovered/interrupted), Review (complete/pending), Quality verdict, Last checkpoint and Open defect count. Explain failed means quality failed, not necessarily failed publication.
- Derive Review complete from exact attemptId/resultFinishedAt bound reviews; preserve the raw stage in evidence only or label it Last automation checkpoint.
- Retain provider, verifier, fallback and capture status per attempt. A preserved original after a rejected edit is recovery, not a successful redesign.
- Keep bounded response/CDP capture timeouts, stale-lock recovery, ledger reservations and isolated email/media; add regression replays for each previous failure.

No-cost regression replay:

- Use report fixtures for published+review complete+quality failed, passed, pending review, original retained after rejected edit, budget deferred and capture interruption; expect human-readable labels.
- Re-run the 127-test harness suite and extend failure injection; validate Maps search links correctly, exact attempt binding, all review/evidence paths and JSON pointers, and asset checksums.
- Retry without doubling charges/refunds; abort leaves no pending network/CDP promises and records an explicit stopped status; zero external model requests during offline playback.

Acceptance:

- The screenshot example Birthday row reads Published / Review complete / Needs fixes, with the underlying needs_review checkpoint clearly explained.
- Every finding maps to an issue and test; no original evidence is overwritten, and no historical failure is counted as current quality without latest reproduction.
- All ledger reservations settle; recorded spending is distinguished from Codex usage and invoice reconciliation.

Mapped findings: 16 in latest reviews, 5 historical-only review IDs and 94 raw/control records.

- `anniversary--event_page::anniversary-event-page-and-title-not-captured` — Explicit Event Page request becomes Live Card with a generic title
- `anniversary--event_page::anniversary-maps-checker-false-negative` — The directions checker rejects valid Google Maps search links
- `anniversary--live_card::anniversary-maps-checker-false-negative` — The raw guest directions check rejects two valid Google Maps search handoffs
- `baby_shower--digital_flyer::baby-shower-maps-checker-false-negative` — The directions checker rejects a valid Google Maps search link
- `baby_shower--live_card::baby-shower-maps-checker-false-negative` — The raw directions check rejects a valid search URL

## Preventive followups; do not report these as observed campaign bugs

### UF-G01 · Full accessibility and keyboard/screen-reader journeys

New coverage; contrast/overlap observed, comprehensive accessibility certification was not performed

- Keyboard-only Create/generate/edit/preview/save/publish/RSVP with accessible labels, focus order, focus restoration, error announcements and dialogs.
- 200% zoom and 320 CSS px reflow, touch orientation, safe areas and reduced motion; provide accessible HTML equivalents for essential raster facts.

### UF-G02 · Provider integrations and real delivery

Untested external completion

- Controlled Zoho SMTP signup/RSVP confirmation to an authorized test inbox with public links, shared signature and no production recipients.
- Controlled Calendar OAuth/provider import and Maps navigation; the campaign captured URLs and locally fetched ICS only.

### UF-G03 · Timezones, DST and complex schedules

Preventive breadth beyond the main Chicago event matrix

- Event timezone different from viewer, DST missing/repeated hour, all-day, overnight, multiday, locale format and actual schedule occurrence identity.

### UF-G04 · Real user sessions and unsupported capability discovery

Synthetic personas do not establish customer satisfaction

- Observe actual moms, teachers, coaches, gymnasts and general users completing their own tasks and explaining expectations.
- Reference upload fidelity, existing-event redesign, signup-form capability handoff, download quality and interruption recovery remain explicit coverage extensions.

### UF-G05 · Draft/privacy/ownership and interrupted writes

Existing controls require release regression, not a new campaign allegation

- Draft/private site access, owner versus guest actions, RSVP idempotency, network retry, save conflict/session expiry and failed publication preserving in-memory progress.
- Never equate entered email/phone with proof of ownership. Preserve existing private-link/cookie authorization and isolated test mail.

### UF-G06 · Real browser compatibility and production performance

Local dev latency is not production performance

- Chromium, WebKit/Safari and Firefox on defined supported devices; verify download and ICS handoff where browser behavior varies.
- Run production-build performance and asset-loading checks without reusing local Next compilation timings as production latency evidence.

## Deployment gates

### G0 · Candidate and evidence baseline

Freeze an exact candidate commit and dependency lock, independently check current conflicts/diagnostics, and save component/source hashes and immutable case evidence. The existing campaign source snapshot remains historical.

### G1 · Offline contract and complete matrix

Every observed issue has a failing-before/passing-after behavior fixture or an explicit not-fixed disposition. All 93 cases pass canonical fact, output and required-copy contracts plus faulty-model cases. All fixtures respect the date policy; future event examples use 2026-09-23.

### G2 · Artifact reuse end-to-end

Replay 93 cases with archived artwork and recorded provider responses through real app save/resume, publication and anonymous guest actions. No outbound model calls; all Calendar/RSVP/Directions/Download acceptance checks pass. Rejected artwork remains rejected unless independently verified; delivery success cannot erase content failure.

### G3 · UI and accessibility

Zero observed blocking crop/overlap/contrast issues across defined viewports and themes; preview/public parity; actual download bytes validated; critical keyboard paths and focus clear. Headline OCR alone cannot guarantee mobile legibility.

### G4 · Candidate correctness checks

Run npm run test:create-facts, npm run test:create-campaign, affected Calendar/RSVP/layout behavior suites, Biome and actual TypeScript/editor diagnostics. Build alone is insufficient because ignoreBuildErrors is enabled. Resolve or explicitly baseline preexisting type/source-guard failures; no regressions in changed areas.

### G5 · Controlled staging and deployment

Smoke-test production configuration, Zoho-only mail, public URLs, auth/draft privacy, DB migration compatibility and readiness, and rollback/canary controls. Zero open P0/P1 observed defects; every other issue is closed or explicitly accepted with scope and exact risk. Do not claim deployment readiness merely because 93 journeys published.

### G6 · Model reliability claim boundary

Offline prompt/contract fixes can be accepted without new art. A claim of improved fresh generation quality requires a separate bounded live qualification after the user chooses to resume art generation; never silently spend the remaining campaign allowance. Until then, report future model quality as not revalidated and keep fail-closed acceptance/publication checks.

### G7 · After release

Monitor anonymized contract violations, corrections, quality rejections, restored-original events, save/publish/RSVP/download failures and latency by output/category; alert on fact/output/safety-copy loss, route failure or false Saved claims. Preserve versioned prompts/contracts and rollback controls; model HTTP 200 alone is not quality.

## Suggested agent sequencing

Use one coordinator and at most three active specialists at a time. First freeze the shared canonical contract. Then run the extraction/prompt owner, Preview/UI owner and Guest contract owner in parallel with explicit file ownership. The coordinator owns the campaign ledger/report, evidence inventory and integration. After integration, a separate reviewer checks all affected cases and cannot mark their own implementation as independently verified. Avoid simultaneous edits to the large chat client, event dispatcher or shared studio builder; merge those adapters through the coordinator.

Accessibility guidance uses the ui-ux-pro-max skill. Existing repository rules control native mobile preview, hero overlays, explicit saves, artwork format/cleanup, branding and Zoho email. No existing user preferences are changed by this plan.

