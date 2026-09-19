# Chat and fact remediation plan

Plan only. No application files were changed, no paid model calls were made and no new artwork was generated. This workstream covers the conversation and canonical-content causes behind the campaign failures; artwork/rendering and infrastructure issues are assigned to sibling workstreams.

Evidence: 117 review files, including 93 latest cases and historical attempts; 309 distinct case/finding pairs map to the groups below. The companion JSON preserves every original finding ID, case ID, exact review path/pointer, attempt and historical/current scope. Findings can legitimately map to more than one group.

The release strategy is to prevent incorrect state and contradictory generation inputs before a paid image call. Stronger image prompts alone cannot fix a dropped 2 PM clock, a erased title, or a safety note classified as private styling. Existing artwork remains test evidence; it is not represented as repaired.

Status discipline: the companion JSON marks campaign fixes as verified_fix_preserve_guard_and_rerun, historical-only findings as regression replays, and exact related fixed guards separately. These bounded fixes must be retained and checked; they are not automatically open defects or proof that every downstream case is repaired. Freeze and rebase the shared workspace before implementation because source may have changed since this evidence was captured.

## Build order and agent ownership

1. One integration owner defines the backward-compatible typed contract and owns shared draft/extraction files (CHAT-01/02/05/06). Parallel agents should not race edits in fallback.ts or ConciergeChatClient.tsx.
2. A schedule/location agent implements CHAT-03/04 against that contract. A dialogue/privacy agent implements CHAT-08/09/10. A generation adapter agent handles CHAT-07 and the other workstream’s art contract.
3. An independent verifier replays archived evidence and attempts malicious/overbroad model patches; renderer/action owners integrate the same projections. Only accepted, tested contracts feed the later release gate.

## Work packages

### CHAT-01 — Apply user changes as scoped, provenance-backed transactions (P0)

Unrelated turns overwrite event purpose, occasion, theme or approved copy; subsequent appearance preservation can faithfully preserve an already incorrect draft.

**Source ownership**

- `src/lib/concierge/extraction-contract.ts`
- `src/lib/concierge/extract.ts`
- `src/lib/concierge/fallback.ts`
- `src/lib/concierge/artwork-edit-scope.ts`
- `src/lib/concierge/conversation-edits.ts`
- `src/lib/concierge/types.ts`

**Root-cause confidence**

- Confirmed: fallback.ts:3253-3279 permits the current raw message as eventPurpose and places it ahead of previousEventPurpose. Captured venue/end/contact turns become occasion and displace original purpose.
- Confirmed: The existing extraction schema already proposes cited set/clear operations and appearance-only guards; these should be extended rather than replaced by free-form model-owned draft reconstruction.
- To reproduce/validate: The exact normalization step responsible for every title/body replacement needs an offline replay against the current working tree; campaign evidence predates unrelated edits.

**Implementation**

1. Introduce a versioned canonical draft transaction boundary over existing types. A turn produces intent plus field operations citing user/source spans; apply only fields addressed by that turn. Keep normalized state, generated copy and persistence status distinct.
2. Never use an address correction, contact answer, style command, capability question or raw prompt as eventPurpose. Store instructions separately from event facts. Explicit clear and explicit new event remain supported and must not resurrect history.
3. Attach source-message identity, exact source span, provenance, retraction/supersession and field confidence to event facts. User corrections outrank uploads; assistant advice never becomes confirmed fact automatically.
4. Compute dependent title/copy/schedule projections after the transaction, then validate against the original approved facts as well as the previous state. Preserve accepted artwork until a replacement passes its own gate.
5. Record a small transaction receipt with changed fields, rejected fields, unresolved questions and current revision for the response planner. Use revision checks to reject stale async results; do not introduce autosaving.

**Dependencies**

- Agree the canonical contract with CHAT-02 through CHAT-06 before parallel edits to shared draft files.

**Offline fixtures**

- Replay every archived transcript turn in original order with archived extractor responses and injected malformed/overbroad edits.
- For all 93 briefs, exercise room-only, end-only, contact-only, appearance-only, mixed fact/style, explicit clear, duplicate turn, new event, stale response and resume; compare unrelated fields against the original user-approved facts.
- Exercise sources and normal conversation fallback independently, including an unavailable model path.

**Acceptance**

- Zero unrelated canonical field changes across the 93-case mutation matrix.
- No raw correction/prompt string becomes title, purpose, occasion or public description.
- Existing explicit-save and appearance-only fact integrity protections pass unchanged; a saved earlier draft survives Discard.

**Original findings (49 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| appointment--event_page | appointment-specific-details-omitted | open_or_retest_at_observed_scope |
| baby_shower--digital_flyer | baby-shower-supplied-title-not-in-generation-headline | historical_regression_replay |
| baby_shower--live_card | baby-shower-mobile-preview-clipping | open_or_retest_at_observed_scope |
| baseball--digital_flyer | baseball--digital_flyer-missing-clinic-copy | open_or_retest_at_observed_scope |
| baseball--live_card | baseball-clinic-facts-replaced-by-game-day | open_or_retest_at_observed_scope |
| basketball--event_page | basketball-details-and-qa-mismatch | open_or_retest_at_observed_scope |
| basketball--live_card | basketball-live-matchup-instructions-lost | open_or_retest_at_observed_scope |
| birthday--digital_flyer | birthday-guest-controls-hide-required-copy | open_or_retest_at_observed_scope |
| birthday--event_page | birthday-event-page-required-gift-line-missing | open_or_retest_at_observed_scope |
| birthday--live_card | birthday-approved-slogan-not-in-generation-copy | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| birthday--live_card | birthday-theme-prompt-fragment | historical_regression_replay |
| birthday--live_card | birthday-correction-text-becomes-generation-occasion | historical_regression_replay |
| birthday--live_card | birthday-retry-slogan-not-rendered | open_or_retest_at_observed_scope |
| bridal_shower--live_card | bridal-shower-afternoon-copy-lost | open_or_retest_at_observed_scope |
| cheerleading--live_card | cheer-live-guest-instructions-lost | open_or_retest_at_observed_scope |
| dance--live_card | dance-intermediate-copy-placeholder | open_or_retest_at_observed_scope |
| field_trip--event_page | field-trip-preview-headline-raw-prompt | historical_regression_replay |
| field_trip--event_page | field-trip-correction-in-occasion-and-mixed-clock-copy | historical_regression_replay |
| football--digital_flyer | football-arrival-home-away-not-in-generation-facts | historical_regression_replay |
| football--digital_flyer | football-address-correction-changes-category | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| football--digital_flyer | football-theme-changes-on-rsvp-contact | historical_regression_replay |
| football--digital_flyer | football-rsvp-and-team-roles-lost | historical_regression_replay |
| football--digital_flyer | football-home-away-labels-lost | open_or_retest_at_observed_scope |
| football--live_card | football-live-arrival-home-away-lost | open_or_retest_at_observed_scope |
| gender_reveal--event_page | gender-reveal-event-page-purpose-wording-lost | open_or_retest_at_observed_scope |
| gender_reveal--live_card | gender-reveal-invitation-purpose-lost | open_or_retest_at_observed_scope |
| general--event_page | general-descriptive-copy-and-end-omitted | open_or_retest_at_observed_scope |
| general--live_card | general-live-purpose-lost | open_or_retest_at_observed_scope |
| graduation--digital_flyer | graduation-exact-approved-line-missing | open_or_retest_at_observed_scope |
| graduation--event_page | graduation-event-page-exact-line-lost | open_or_retest_at_observed_scope |
| graduation--live_card | graduation-exact-line-lost-after-answer | open_or_retest_at_observed_scope |
| lacrosse--event_page | lacrosse-non-contact-and-gear-omitted | open_or_retest_at_observed_scope |
| open_house--live_card | open-house-purpose-lost-and-end-window-hidden | open_or_retest_at_observed_scope |
| soccer--event_page | soccer-required-gear-note-not-rendered | open_or_retest_at_observed_scope |
| softball--live_card | softball-live-team-and-equipment-lost | open_or_retest_at_observed_scope |
| sport_event--event_page | sport-event-station-and-preparation-details-lost | open_or_retest_at_observed_scope |
| sport_event--live_card | sport-live-station-instructions-lost | open_or_retest_at_observed_scope |
| swimming--event_page | swimming-equipment-and-lane-note-lost | open_or_retest_at_observed_scope |
| swimming--live_card | swim-live-gear-instructions-lost | open_or_retest_at_observed_scope |
| tennis--live_card | tennis-preparation-copy-lost | open_or_retest_at_observed_scope |
| track_field--digital_flyer | track-field-required-activities-equipment-missing | open_or_retest_at_observed_scope |
| track_field--live_card | track-live-activities-and-equipment-lost | historical_regression_replay |
| track_field--live_card | track-retry-activities-equipment-lost | open_or_retest_at_observed_scope |
| volleyball--live_card | volleyball-equipment-copy-lost | open_or_retest_at_observed_scope |
| wedding--live_card | wedding-shared-ceremony-reception-context-lost | open_or_retest_at_observed_scope |
| wrestling--live_card | wrestling-retry-supervision-bring-copy | open_or_retest_at_observed_scope |
| campaign | birthday-approved-slogan-not-in-generation-copy | verified_fix_preserve_guard_and_rerun |
| campaign | campaign-capability-question-memory | verified_fix_preserve_guard_and_rerun |
| campaign | football-address-correction-changes-category | verified_fix_preserve_guard_and_rerun |

### CHAT-02 — Keep output choice, full event identity and semantic category stable (P0)

The requested deliverable becomes a different product, named events become draft placeholders, joint identities are truncated, and activity/audience concepts become birthday or real-estate semantics.

**Source ownership**

- `src/lib/concierge/types.ts`
- `src/lib/concierge/creation-intent.ts`
- `src/lib/concierge/fallback.ts`
- `src/lib/concierge/requirements.ts`
- `src/lib/concierge/public-copy.ts`
- `src/lib/concierge/skins.ts`
- `src/lib/concierge/history-payload.ts`
- `src/app/chat/ConciergeChatClient.tsx`
- `src/app/chat/chat-preview-adapters.ts`

**Root-cause confidence**

- Confirmed: ConciergeEventType lacks an anniversary variant although the category chooser exposes Anniversary; multiple sports map directly to Game Day in history and preview adapters.
- Confirmed: fallback.ts:3003 clears requestedOutputs when a boundary blocks creation; later defaulting can select live_card.
- Confirmed: Category-derived preview prose can create birthday turning wording or generic Game Day framing even when the user described an anniversary or clinic.
- To reproduce/validate: Classify school/property and sports activity semantically before mapping to legacy visual categories; prove exact regression paths offline rather than assuming every variant shares one parser branch.

**Implementation**

1. Treat selected/requested output as explicit independent state, preserved through refusals, questions, corrections and generation. Change it only on explicit product-switch intent, with supported aliases resolved once.
2. Represent semantic event kind and activity separately from legacy renderer/visual category: anniversary milestone differs from birthday age; clinic/practice/scrimmage/watch party differs from game; school open house differs from property listing.
3. Keep full user title authoritative. Derive display titles only when absent; placeholders never outrank a supplied title. Preserve apostrophes, joint names and exact spelling without appending a second possessive.
4. Separate named people, teams/organizations and eligible audience/age ranges. Teens 13+ must become audience eligibility, never honoree Teens or milestone 13.
5. Require requested product, generated product, preview renderer, saved primaryOutput and published renderer to agree. Block generation/publish on known mismatch and surface the actual unresolved field.

**Dependencies**

- CHAT-01
- Rendering/actions workstream must consume semantic capabilities rather than the old visual category alone.

**Offline fixtures**

- Anniversary three formats including both original Event Page attempts; wedding Event Page; housewarming three formats.
- Workshop title plus adults/teens13+, sports station title, school/property open house, noncompetitive clinic, early malformed graduation/bridal-shower possessives.
- Property open house and birthday positive controls ensure appropriate category behavior remains supported; explicitly switch output and explicitly start a new event.

**Acceptance**

- All 93 briefs preserve chosen output and complete supplied title at every stage.
- Anniversary never becomes birthday age; teens remain audience; school never acquires realtor controls.
- A correction cannot change the event semantic kind, subject identity or selected product unless explicitly requested.

**Original findings (34 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| anniversary--digital_flyer | anniversary-birthday-age-copy-published | open_or_retest_at_observed_scope |
| anniversary--event_page | anniversary-event-page-and-title-not-captured | historical_regression_replay |
| anniversary--event_page | anniversary-event-page-becomes-live-card | open_or_retest_at_observed_scope |
| anniversary--event_page | anniversary-identity-replaced-with-event-draft-sam | open_or_retest_at_observed_scope |
| anniversary--live_card | anniversary-core-identity-lost | open_or_retest_at_observed_scope |
| baby_shower--digital_flyer | baby-shower-supplied-title-not-in-generation-headline | historical_regression_replay |
| baseball--event_page | baseball-page-clinic-reframed | open_or_retest_at_observed_scope |
| baseball--live_card | baseball-clinic-facts-replaced-by-game-day | open_or_retest_at_observed_scope |
| bridal_shower--live_card | bridal-shower-initial-preview-copy | open_or_retest_at_observed_scope |
| dance--live_card | dance-intermediate-copy-placeholder | open_or_retest_at_observed_scope |
| field_trip--event_page | field-trip-preview-headline-raw-prompt | historical_regression_replay |
| field_trip--event_page | field-trip-initial-preview-headline-is-brief | open_or_retest_at_observed_scope |
| football--digital_flyer | football-address-correction-changes-category | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| graduation--live_card | graduation-initial-possessive-corrupted | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-negated-birthday-becomes-category | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| housewarming--digital_flyer | housewarming-flyer-request-silently-changed | open_or_retest_at_observed_scope |
| housewarming--event_page | housewarming-negation-refusal-wrong-format | open_or_retest_at_observed_scope |
| open_house--digital_flyer | open_house--digital_flyer-real-estate-rsvp | open_or_retest_at_observed_scope |
| open_house--live_card | open-house-school-routed-to-property | open_or_retest_at_observed_scope |
| open_house--live_card | open-house-request-contract-contradiction | open_or_retest_at_observed_scope |
| soccer--live_card | soccer-live-opening-title-drift | open_or_retest_at_observed_scope |
| sport_event--digital_flyer | sport_event--digital_flyer-lost-stations-and-placeholder | open_or_retest_at_observed_scope |
| sport_event--live_card | sport-live-station-instructions-lost | open_or_retest_at_observed_scope |
| wedding--event_page | wedding-event-page-replaced-by-live-card | open_or_retest_at_observed_scope |
| wedding--live_card | wedding-opening-venue-and-identity-lost | open_or_retest_at_observed_scope |
| workshop--digital_flyer | workshop--digital_flyer-wrong-title-honoree | open_or_retest_at_observed_scope |
| workshop--event_page | workshop-supplied-title-not-applied | historical_regression_replay |
| workshop--event_page | workshop-age-range-person-metadata | historical_regression_replay |
| workshop--event_page | workshop-page-placeholder-title-persists | open_or_retest_at_observed_scope |
| workshop--event_page | workshop-page-audience-materials-omitted | open_or_retest_at_observed_scope |
| workshop--live_card | workshop-placeholder-title-published | open_or_retest_at_observed_scope |
| workshop--live_card | workshop-audience-and-materials-misfiled | open_or_retest_at_observed_scope |
| campaign | football-address-correction-changes-category | verified_fix_preserve_guard_and_rerun |
| campaign | gymnastics-negated-birthday-becomes-category | verified_fix_preserve_guard_and_rerun |

### CHAT-03 — Use one typed schedule for clocks, itinerary and every export (P0)

Correct visible schedule prose coexists with noon/default instants; itinerary strings fill a primary clock field, arbitrary end times appear, later activity clocks disappear, and display/export paths diverge.

**Source ownership**

- `src/lib/concierge/fallback.ts (parseChrono and corrections)`
- `src/lib/concierge/extract.ts`
- `src/lib/concierge/types.ts`
- `src/lib/creation/calendar-validation.ts`
- `src/app/chat/ConciergeChatClient.tsx (buildStudioDetailsFromDraft)`
- `src/app/chat/chat-preview-adapters.ts`
- `src/lib/concierge/history-payload.ts`
- `src/app/studio/studio-workspace-builders.ts`

**Root-cause confidence**

- Confirmed: parseChrono selects the first parsed result and derives startISO even when its hour is not certain; it supplies a two-hour end when first.end is absent.
- Confirmed: buildStudioDetailsFromDraft writes draft.timeText (potentially a whole itinerary) into startTime; history-payload has the same fallback pattern.
- Confirmed: Archived multi-time cards store itinerary prose in startTime and lack calendarStartISO/calendarEndISO; the actual calendar helper returns null for this shape.
- To reproduce/validate: Clock/timezone effects depend on parser reference clock and host timezone; reproduce with frozen time and explicit zone before replacing normalization.

**Implementation**

1. Model event date, timezone, confirmed primary start/end, and labeled schedule entries with audience role/locationId as distinct data. Keep original source text for each value.
2. Choose a primary event clock from explicit event/competition/kickoff/show/meet semantics; arrival, warmup, doors and awards remain schedule entries. Ask one focused question if truly ambiguous. Never silently pick noon or the earliest auxiliary time.
3. Leave unsupplied end null. Treat event-end and segment-end independently; overall6:30PM cannot imply vows2–6:30PM when dinner starts5PM.
4. Resolve local date/time in the explicitly chosen IANA zone and derive instants centrally. Date-only changes retain clock and zone; end-only changes retain start and only update the identified end/return segment.
5. Serialize clean canonical instants separately from human schedule labels. Export calendars from instants, never parse rendered prose; display start/end and itinerary using one locale formatter. Always preserve the supplied year in the factual contract.
6. Maintain backward-compatible migration for saved legacy drafts, validating ambiguous legacy prose rather than inventing missing clocks.

**Dependencies**

- CHAT-01
- CHAT-04
- Guest-action/calendar owner integrates serialization and presentation.

**Offline fixtures**

- Original football Flyer, gymnastics all formats, swimming all formats, dance Flyer, anniversary two-location dinner, field-trip opening and return correction.
- New fixtures use September23,2026; preserve original archived fixtures unchanged for truthful replay. Include noon/midnight,12-hour/24-hour, overnight, multi-day,DST transition/nonexistent/duplicate local clock and date-only change.
- Use clock/timezone-frozen tests; compare Google/Microsoft/ICS semantics and display lines using the same canonical values.

**Acceptance**

- All explicit user clocks match canonical and exported instants; multi-time cases have no noon substitution.
- No unknown end becomes a fabricated timestamp; no whole-event end is attached to a segment without evidence.
- Every known primary end and all supplied labeled itinerary entries reach the visible guest schedule; no duplicate dinner or lost5PM.
- Calendar stays available when canonical times are sufficient, without relying on natural-language parsing.

**Original findings (88 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| anniversary--digital_flyer | anniversary-whole-event-end-assigned-to-vows | open_or_retest_at_observed_scope |
| anniversary--digital_flyer | anniversary-logistics-format | open_or_retest_at_observed_scope |
| anniversary--event_page | anniversary-time-location-pairing-lost | historical_regression_replay |
| anniversary--event_page | anniversary-end-time-disagrees-with-iso | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| anniversary--event_page | anniversary-dinner-time-lost | open_or_retest_at_observed_scope |
| anniversary--live_card | anniversary-dinner-time-lost | open_or_retest_at_observed_scope |
| baby_shower--digital_flyer | baby-shower-logistics-machine-format-and-duplicate-venue | open_or_retest_at_observed_scope |
| baby_shower--event_page | baby-shower-event-page-planning-display | open_or_retest_at_observed_scope |
| baseball--live_card | baseball-display-end-time-missing | open_or_retest_at_observed_scope |
| birthday--digital_flyer | birthday-logistics-format | open_or_retest_at_observed_scope |
| birthday--event_page | birthday-event-page-visible-schedule-location | open_or_retest_at_observed_scope |
| birthday--live_card | birthday-unsupplied-end-time | historical_regression_replay |
| birthday--live_card | birthday-end-not-shown-in-current-schedule-summary | historical_regression_replay |
| birthday--live_card | birthday-generation-contract-loses-year | historical_regression_replay |
| bridal_shower--digital_flyer | bridal-shower-afternoon-tea-wording-missing | open_or_retest_at_observed_scope |
| bridal_shower--digital_flyer | bridal-shower-logistics-format | open_or_retest_at_observed_scope |
| bridal_shower--event_page | bridal-shower-visible-details-incomplete | open_or_retest_at_observed_scope |
| bridal_shower--live_card | bridal-shower-afternoon-copy-lost | open_or_retest_at_observed_scope |
| cheerleading--digital_flyer | cheer-logistics-format | open_or_retest_at_observed_scope |
| dance--digital_flyer | dance--digital_flyer-canonical-noon | open_or_retest_at_observed_scope |
| dance--digital_flyer | dance--digital_flyer-calendar-missing | open_or_retest_at_observed_scope |
| dance--digital_flyer | dance--digital_flyer-schedule-format | open_or_retest_at_observed_scope |
| dance--event_page | dance-page-arrival-doors-lost | open_or_retest_at_observed_scope |
| dance--live_card | dance-arrival-roles-lost | open_or_retest_at_observed_scope |
| dance--live_card | dance-artwork-schedule-promise-contradicts-contract | open_or_retest_at_observed_scope |
| field_trip--digital_flyer | field_trip--digital_flyer-calendar-missing | open_or_retest_at_observed_scope |
| field_trip--digital_flyer | field_trip--digital_flyer-awkward-copy | open_or_retest_at_observed_scope |
| field_trip--event_page | field-trip-corrected-return-stale-display-times | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| field_trip--event_page | field-trip-opening-end-contradicts-return | historical_regression_replay |
| field_trip--live_card | field-trip-live-awkward-bus-copy | open_or_retest_at_observed_scope |
| football--digital_flyer | football-arrival-home-away-not-in-generation-facts | historical_regression_replay |
| football--digital_flyer | football-primary-start-is-noon | historical_regression_replay |
| football--digital_flyer | football-technical-schedule-copy | historical_regression_replay |
| football--digital_flyer | football-canonical-start-noon | open_or_retest_at_observed_scope |
| football--digital_flyer | football-home-away-labels-lost | open_or_retest_at_observed_scope |
| football--digital_flyer | football-flyer-schedule-format | open_or_retest_at_observed_scope |
| football--digital_flyer | football-published-calendar-unavailable | open_or_retest_at_observed_scope |
| football--event_page | football-page-arrival-and-team-roles-lost | open_or_retest_at_observed_scope |
| football--live_card | football-live-arrival-home-away-lost | open_or_retest_at_observed_scope |
| game_day--digital_flyer | game-day-schedule-copy-format | open_or_retest_at_observed_scope |
| game_day--event_page | game-day-event-page-visible-planning | historical_regression_replay |
| game_day--event_page | game-day-page-location-schedule-actions | open_or_retest_at_observed_scope |
| gender_reveal--digital_flyer | gender-reveal-schedule-copy-format | open_or_retest_at_observed_scope |
| gender_reveal--event_page | gender-reveal-event-page-visible-planning | open_or_retest_at_observed_scope |
| graduation--digital_flyer | graduation-logistics-format | open_or_retest_at_observed_scope |
| graduation--event_page | graduation-event-page-visible-planning | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | gymnastics-canonical-start-noon | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | gymnastics-calendar-action-missing | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | gymnastics-qa-end-time-disregarded | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | gymnastics-combined-schedule-format | open_or_retest_at_observed_scope |
| gymnastics--event_page | gymnastics-event-page-canonical-noon-exported | open_or_retest_at_observed_scope |
| gymnastics--event_page | gymnastics-event-page-schedule-entries-incomplete | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-labeled-schedule-not-preserved | historical_regression_replay |
| gymnastics--live_card | gymnastics-primary-start-is-noon | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-generation-date-and-schedule-format | historical_regression_replay |
| gymnastics--live_card | gymnastics-saved-calendar-unavailable | historical_regression_replay |
| gymnastics--live_card | gymnastics-published-calendar-missing | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-promised-schedule-lines-not-structured | open_or_retest_at_observed_scope |
| hockey--digital_flyer | hockey-logistics-format | open_or_retest_at_observed_scope |
| lacrosse--event_page | lacrosse-guest-planning-presentation | open_or_retest_at_observed_scope |
| open_house--digital_flyer | open_house--digital_flyer-duplicated-copy | open_or_retest_at_observed_scope |
| soccer--event_page | soccer-planning-presentation | open_or_retest_at_observed_scope |
| softball--digital_flyer | softball-logistics-format | open_or_retest_at_observed_scope |
| special_event--digital_flyer | special-event-logistics-format | open_or_retest_at_observed_scope |
| sport_event--digital_flyer | sport_event--digital_flyer-logistics-format | open_or_retest_at_observed_scope |
| sport_event--event_page | sport-event-visible-schedule-and-location-format | open_or_retest_at_observed_scope |
| swimming--digital_flyer | swimming--digital_flyer-canonical-noon | open_or_retest_at_observed_scope |
| swimming--digital_flyer | swimming--digital_flyer-calendar-missing | open_or_retest_at_observed_scope |
| swimming--digital_flyer | swimming--digital_flyer-gift-and-schedule-format | open_or_retest_at_observed_scope |
| swimming--event_page | swimming-canonical-start-noon-exported | open_or_retest_at_observed_scope |
| swimming--event_page | swimming-planning-presentation | open_or_retest_at_observed_scope |
| swimming--live_card | swim-live-multi-time-normalization-calendar-missing | open_or_retest_at_observed_scope |
| tennis--live_card | tennis-display-range-truncated | open_or_retest_at_observed_scope |
| track_field--digital_flyer | track-field-logistics-format | open_or_retest_at_observed_scope |
| volleyball--live_card | volleyball-end-display-missing | open_or_retest_at_observed_scope |
| wedding--digital_flyer | wedding-logistics-format | open_or_retest_at_observed_scope |
| workshop--event_page | workshop-page-location-schedule-actions | open_or_retest_at_observed_scope |
| workshop--live_card | workshop-end-display-start-only | open_or_retest_at_observed_scope |
| campaign | anniversary-end-time-disagrees-with-iso | verified_fix_preserve_guard_and_rerun |
| campaign | campaign-end-reply-moves-start | verified_fix_preserve_guard_and_rerun |
| campaign | field-trip-corrected-return-stale-display-times | verified_fix_preserve_guard_and_rerun |
| dance--digital_flyer | runner_finding:389ce650bd229f | open_or_retest_at_observed_scope |
| field_trip--digital_flyer | runner_finding:389ce650bd229f | open_or_retest_at_observed_scope |
| football--digital_flyer | runner_finding:389ce650bd229f | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | runner_finding:389ce650bd229f | open_or_retest_at_observed_scope |
| gymnastics--live_card | runner_finding:389ce650bd229f | open_or_retest_at_observed_scope |
| swimming--digital_flyer | runner_finding:389ce650bd229f | open_or_retest_at_observed_scope |
| swimming--live_card | runner_finding:389ce650bd229f | open_or_retest_at_observed_scope |

### CHAT-04 — Normalize full locations and itinerary roles without dropping or duplicating them (P0)

Main and later venues mix, a time-only correction drops a museum name, dinner can duplicate, and projections lose the center/room or repeat the venue.

**Source ownership**

- `src/lib/concierge/types.ts (ConciergeAdditionalLocation)`
- `src/lib/concierge/fallback.ts (location and stop extraction)`
- `src/lib/concierge/extract.ts`
- `src/lib/concierge/history-payload.ts`
- `src/app/chat/ConciergeChatClient.tsx (additionalLocationNarrative and adapter)`
- `src/app/studio/studio-workspace-builders.ts`

**Root-cause confidence**

- Confirmed: The draft and renderer use venue/location/address plus free-form additionalLocations; archived adapters flatten these differently and calendars can use only the street.
- Confirmed: Same-venue anaphora and untimed duplicated dinner entries are observed before generation, so a new image prompt cannot repair this alone.
- To reproduce/validate: Each duplicate path must be replayed to locate whether extraction merge, narrative assembly or display formatting introduces that duplicate.

**Implementation**

1. Give itinerary entries stable identity and purpose labels linked to normalized location objects (venueName,room,street,locality,mapQuery). Resolve same venue to the active location reference.
2. Apply time-only and room-only edits by path; preserve all untouched venue facts and every later-stop clock.
3. Deduplicate by role/location/time identity, never by venue alone: two activities may intentionally share one venue.
4. Provide shared full-location and concise-display functions. Calendar and Directions receive the complete normalized venue+room+address; display never concatenates an already-complete location twice.

**Dependencies**

- CHAT-01
- CHAT-03
- Actions/renderer owner handles actual Directions controls and public display.

**Offline fixtures**

- Anniversary vow renewal/dinner2PM/5PM/overall6:30PM and all historical missing-time variants; wedding same-venue ceremony/reception without invented reception time; field-trip return-only correction.
- Capture-replay venue fixtures covering street-only, named venue without address, RoomA→RoomB, shared venue and two different stops.

**Acceptance**

- Corrected venue and room survive save/resume and all export adapters exactly once.
- Time-only changes never alter location identity; room correction never removes other venues.
- No fabricated address is required when the host supplies only a venue name.

**Original findings (33 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| anniversary--digital_flyer | anniversary-dinner-duplicated-vow-label-missing | open_or_retest_at_observed_scope |
| anniversary--event_page | anniversary-time-location-pairing-lost | historical_regression_replay |
| anniversary--event_page | anniversary-dinner-time-lost | open_or_retest_at_observed_scope |
| anniversary--live_card | anniversary-dinner-time-lost | open_or_retest_at_observed_scope |
| appointment--event_page | appointment-calendar-venue-name-lost | open_or_retest_at_observed_scope |
| baseball--event_page | baseball-page-location-export | open_or_retest_at_observed_scope |
| bridal_shower--event_page | bridal-shower-calendar-loses-room | open_or_retest_at_observed_scope |
| cheerleading--event_page | cheer-page-location-duplication | open_or_retest_at_observed_scope |
| dance--event_page | dance-page-guest-location-loss | open_or_retest_at_observed_scope |
| dance--live_card | dance-calendar-venue-omission | open_or_retest_at_observed_scope |
| field_trip--event_page | field-trip-venue-name-overwritten | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| football--event_page | football-page-calendar-venue-loss | open_or_retest_at_observed_scope |
| game_day--event_page | game-day-page-location-schedule-actions | open_or_retest_at_observed_scope |
| general--event_page | general-calendar-loses-room-and-venue | open_or_retest_at_observed_scope |
| graduation--live_card | graduation-calendar-drops-venue-room | open_or_retest_at_observed_scope |
| gymnastics--event_page | gymnastics-event-page-venue-duplicated | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-venue-and-organizer-fragments | historical_regression_replay |
| hockey--event_page | hockey-page-venue-export | open_or_retest_at_observed_scope |
| housewarming--live_card | housewarming-live-calendar-drops-room | open_or_retest_at_observed_scope |
| open_house--digital_flyer | open_house--digital_flyer-duplicated-copy | open_or_retest_at_observed_scope |
| softball--event_page | softball-page-calendar-location | open_or_retest_at_observed_scope |
| special_event--event_page | lantern-page-guest-location-loss | open_or_retest_at_observed_scope |
| special_event--live_card | special-live-calendar-room-omission | open_or_retest_at_observed_scope |
| tennis--event_page | tennis-page-calendar-location | open_or_retest_at_observed_scope |
| track_field--event_page | track-page-duplicated-venue | open_or_retest_at_observed_scope |
| track_field--live_card | track-retry-calendar-room-loss | open_or_retest_at_observed_scope |
| volleyball--event_page | volleyball-page-location-export | open_or_retest_at_observed_scope |
| wedding--live_card | wedding-opening-venue-and-identity-lost | open_or_retest_at_observed_scope |
| wedding--live_card | wedding-shared-ceremony-reception-context-lost | open_or_retest_at_observed_scope |
| workshop--event_page | workshop-page-location-schedule-actions | open_or_retest_at_observed_scope |
| wrestling--event_page | wrestling-page-venue-duplication | open_or_retest_at_observed_scope |
| wrestling--live_card | wrestling-retry-calendar-room-loss | open_or_retest_at_observed_scope |
| campaign | field-trip-venue-name-overwritten | verified_fix_preserve_guard_and_rerun |

### CHAT-05 — Promote supplied guest requirements into a public content contract (P0/P1)

The user is understood conversationally but preparation, safety, eligibility, purpose and logistical requirements survive only as design notes or gift metadata, or disappear entirely.

**Source ownership**

- `src/lib/concierge/types.ts`
- `src/lib/concierge/extraction-contract.ts`
- `src/lib/concierge/extract.ts`
- `src/lib/concierge/host-brief.ts`
- `src/lib/concierge/public-copy.ts`
- `src/app/chat/ConciergeChatClient.tsx (buildStudioDetailsFromDraft)`
- `src/lib/concierge/history-payload.ts`
- `src/app/studio/studio-workspace-builders.ts`

**Root-cause confidence**

- Confirmed: Extraction editable fields lack general guest instructions, audience eligibility, activity descriptions and dress code; hostBrief models other planning dimensions, not a complete public guest brief.
- Confirmed: buildStudioDetailsFromDraft leaves audience as Guests and constructs specialInstructions from skin/generation directions; absent typed fields explain why practical information is pushed into theme/tone/gift fields.
- Confirmed: Archived creative plans explicitly exclude supplied instructions as private/unapproved, demonstrating disagreement between fact capture and image contract.
- To reproduce/validate: Source-backed requirement extraction should preserve both semantic facts and verbatim demands; not every sentence in the transcript is intended for public display.

**Implementation**

1. Add typed guest requirements with stable IDs, exact user provenance, content kind, audience, display priority, visibility, obligation (required/optional/prohibited) and copy policy (semantic/verbatim). Do not overload giftPreferenceNote or private style.
2. Capture positive obligations and negative exclusions separately: non-contact session plus no-contact-drills; battery lanterns only plus no open flame; bring gear plus no fabricated assignments. A successful exclusion does not excuse missing positive content.
3. Project a single approved content contract to generation, HTML, overview, save/resume and calendar descriptions. Include all required facts on the appropriate surface without forcing logistics into text-free Event Page hero art.
4. Explicitly allocate presentation per format: Flyer is self-contained, Live Card may use visible artwork plus accessible details, Event Page uses HTML. User demand for prominence must be represented as layout priority rather than a chat-only promise.
5. Prevent paid generation when required content is absent, classified as private without justification, or conflicts with model exclusion instructions. Surface missing facts inline and allow correction without a new art call.
6. Preserve supplied no-gifts/dress/gear/safety facts through style edits and exports; absence of a pictured object is distinct from failure to state a guest instruction.

**Dependencies**

- CHAT-01
- CHAT-02
- CHAT-06
- Image-contract and renderer owners consume requirement IDs and return coverage maps.

**Offline fixtures**

- Every93 immutable/effective brief and all requirement-related historical findings; compare requirement coverage at each stage, not merely prior draft equality.
- Lantern battery/no-open-flame, lacrosse prominent non-contact, hockey player/family gear, workshop13+/materials, field-trip lunch/water, wedding garden formal, football roles/arrival, swimminggear, sports stations, appointment early arrival, school main-office/drop-in, wrestling supervision.
- Negative controls: private address/contact stays private; equipment props in artwork do not count as explicit bring instructions; unknown price/capacity/lanes/scores stay unknown.

**Acceptance**

- 100% supplied required guest facts have a traceable destination in the final content projection; P0 safety/eligibility facts cannot silently drop.
- User-approved safety/guest facts are never excluded as private style or unapproved claims.
- No appearance-only turn, contact answer, calendar export or explicit save drops these requirements.
- Regression suite distinguishes factual data loss, display omission and existing raster limitation so pre-generation guards can be proven without new artwork.

**Original findings (88 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| appointment--digital_flyer | appointment--digital_flyer-arrival-note | open_or_retest_at_observed_scope |
| appointment--event_page | appointment-specific-details-omitted | open_or_retest_at_observed_scope |
| appointment--live_card | appointment-live-arrival-contact-lost | open_or_retest_at_observed_scope |
| baby_shower--event_page | baby-shower-event-page-no-gifts-missing | open_or_retest_at_observed_scope |
| baby_shower--live_card | baby-shower-no-gifts-not-presented | open_or_retest_at_observed_scope |
| baseball--digital_flyer | baseball--digital_flyer-missing-clinic-copy | open_or_retest_at_observed_scope |
| baseball--event_page | baseball-page-clinic-reframed | open_or_retest_at_observed_scope |
| baseball--live_card | baseball-clinic-facts-replaced-by-game-day | open_or_retest_at_observed_scope |
| basketball--digital_flyer | basketball--digital_flyer-missing-sports-copy | open_or_retest_at_observed_scope |
| basketball--live_card | basketball-live-matchup-instructions-lost | open_or_retest_at_observed_scope |
| birthday--digital_flyer | birthday-calendar-drops-no-gifts | open_or_retest_at_observed_scope |
| birthday--event_page | birthday-event-page-required-gift-line-missing | open_or_retest_at_observed_scope |
| birthday--live_card | birthday-retry-calendar-gift-note | open_or_retest_at_observed_scope |
| bridal_shower--digital_flyer | bridal-shower-afternoon-tea-wording-missing | open_or_retest_at_observed_scope |
| bridal_shower--live_card | bridal-shower-afternoon-copy-lost | open_or_retest_at_observed_scope |
| cheerleading--digital_flyer | cheer-required-water-seating-copy-missing | open_or_retest_at_observed_scope |
| cheerleading--event_page | cheer-page-spectator-instructions-lost | open_or_retest_at_observed_scope |
| cheerleading--live_card | cheer-live-guest-instructions-lost | open_or_retest_at_observed_scope |
| dance--digital_flyer | dance--digital_flyer-purpose-gift-copy | open_or_retest_at_observed_scope |
| dance--event_page | dance-page-arrival-doors-lost | open_or_retest_at_observed_scope |
| dance--live_card | dance-arrival-roles-lost | open_or_retest_at_observed_scope |
| field_trip--digital_flyer | field_trip--digital_flyer-preparation-missing | open_or_retest_at_observed_scope |
| field_trip--event_page | field-trip-published-packing-instructions-missing | open_or_retest_at_observed_scope |
| field_trip--live_card | field-trip-live-supplies-gift-field | open_or_retest_at_observed_scope |
| football--digital_flyer | football-arrival-home-away-not-in-generation-facts | historical_regression_replay |
| football--digital_flyer | football-rsvp-and-team-roles-lost | historical_regression_replay |
| football--digital_flyer | football-home-away-labels-lost | open_or_retest_at_observed_scope |
| football--event_page | football-page-arrival-and-team-roles-lost | open_or_retest_at_observed_scope |
| football--live_card | football-live-arrival-home-away-lost | open_or_retest_at_observed_scope |
| game_day--event_page | game-day-event-page-snack-note-omitted | historical_regression_replay |
| game_day--event_page | game-day-page-snack-copy-omitted | open_or_retest_at_observed_scope |
| game_day--live_card | game-day-snack-note-not-presented | open_or_retest_at_observed_scope |
| gender_reveal--digital_flyer | gender-reveal-find-out-together-copy-lost | open_or_retest_at_observed_scope |
| gender_reveal--event_page | gender-reveal-event-page-purpose-wording-lost | open_or_retest_at_observed_scope |
| gender_reveal--live_card | gender-reveal-invitation-purpose-lost | open_or_retest_at_observed_scope |
| general--digital_flyer | general--digital_flyer-purpose-copy | open_or_retest_at_observed_scope |
| general--event_page | general-descriptive-copy-and-end-omitted | open_or_retest_at_observed_scope |
| general--live_card | general-live-purpose-lost | open_or_retest_at_observed_scope |
| hockey--digital_flyer | hockey-required-player-family-copy-missing | open_or_retest_at_observed_scope |
| hockey--event_page | hockey-page-preparation-notes-lost | open_or_retest_at_observed_scope |
| hockey--live_card | hockey-live-preparation-treated-as-style | open_or_retest_at_observed_scope |
| housewarming--event_page | housewarming-calendar-no-gifts-missing | open_or_retest_at_observed_scope |
| housewarming--live_card | housewarming-live-no-gifts-calendar | open_or_retest_at_observed_scope |
| lacrosse--digital_flyer | lacrosse--digital_flyer-non-contact-lost | open_or_retest_at_observed_scope |
| lacrosse--digital_flyer | lacrosse--digital_flyer-equipment-lost | open_or_retest_at_observed_scope |
| lacrosse--event_page | lacrosse-non-contact-and-gear-omitted | open_or_retest_at_observed_scope |
| lacrosse--live_card | lacrosse-live-non-contact-promise-unfulfilled | open_or_retest_at_observed_scope |
| lacrosse--live_card | lacrosse-live-equipment-instructions-not-guest-copy | open_or_retest_at_observed_scope |
| open_house--digital_flyer | open_house--digital_flyer-school-copy-missing | open_or_retest_at_observed_scope |
| open_house--event_page | school-page-instructions-drop-in-lost | open_or_retest_at_observed_scope |
| open_house--live_card | open-house-purpose-lost-and-end-window-hidden | open_or_retest_at_observed_scope |
| soccer--digital_flyer | soccer--digital_flyer-required-equipment | open_or_retest_at_observed_scope |
| soccer--event_page | soccer-required-gear-note-not-rendered | open_or_retest_at_observed_scope |
| soccer--live_card | soccer-live-equipment-note-misfiled | open_or_retest_at_observed_scope |
| softball--digital_flyer | softball-team-and-equipment-copy-missing | open_or_retest_at_observed_scope |
| softball--event_page | softball-page-team-equipment-lost | open_or_retest_at_observed_scope |
| softball--live_card | softball-live-team-and-equipment-lost | open_or_retest_at_observed_scope |
| special_event--digital_flyer | special-event-required-safety-copy-missing | open_or_retest_at_observed_scope |
| special_event--digital_flyer | special-event-safety-copy-edit-contract-conflict | open_or_retest_at_observed_scope |
| special_event--event_page | lantern-page-safety-notice-lost | open_or_retest_at_observed_scope |
| special_event--live_card | special-live-safety-not-canonical | open_or_retest_at_observed_scope |
| sport_event--digital_flyer | sport_event--digital_flyer-lost-stations-and-placeholder | open_or_retest_at_observed_scope |
| sport_event--event_page | sport-event-station-and-preparation-details-lost | open_or_retest_at_observed_scope |
| sport_event--live_card | sport-live-station-instructions-lost | open_or_retest_at_observed_scope |
| swimming--digital_flyer | swimming--digital_flyer-preparation-lost | open_or_retest_at_observed_scope |
| swimming--event_page | swimming-equipment-and-lane-note-lost | open_or_retest_at_observed_scope |
| swimming--live_card | swim-live-gear-instructions-lost | open_or_retest_at_observed_scope |
| tennis--digital_flyer | tennis--digital_flyer-equipment-copy | open_or_retest_at_observed_scope |
| tennis--event_page | tennis-page-preparation-copy-lost | open_or_retest_at_observed_scope |
| tennis--live_card | tennis-preparation-copy-lost | open_or_retest_at_observed_scope |
| track_field--digital_flyer | track-field-required-activities-equipment-missing | open_or_retest_at_observed_scope |
| track_field--event_page | track-page-activities-instructions-lost | open_or_retest_at_observed_scope |
| track_field--live_card | track-live-activities-and-equipment-lost | historical_regression_replay |
| track_field--live_card | track-retry-activities-equipment-lost | open_or_retest_at_observed_scope |
| volleyball--digital_flyer | volleyball--digital_flyer-missing-indoor-equipment | open_or_retest_at_observed_scope |
| volleyball--event_page | volleyball-page-indoor-equipment-lost | open_or_retest_at_observed_scope |
| volleyball--live_card | volleyball-equipment-copy-lost | open_or_retest_at_observed_scope |
| wedding--digital_flyer | wedding-dress-code-and-event-guidance-missing | open_or_retest_at_observed_scope |
| wedding--event_page | wedding-event-page-dress-code-dropped | open_or_retest_at_observed_scope |
| wedding--live_card | wedding-garden-formal-not-delivered | open_or_retest_at_observed_scope |
| wedding--live_card | wedding-shared-ceremony-reception-context-lost | open_or_retest_at_observed_scope |
| workshop--digital_flyer | workshop--digital_flyer-eligibility-materials | open_or_retest_at_observed_scope |
| workshop--event_page | workshop-page-audience-materials-omitted | open_or_retest_at_observed_scope |
| workshop--live_card | workshop-audience-and-materials-misfiled | open_or_retest_at_observed_scope |
| wrestling--digital_flyer | wrestling--digital_flyer-practice-instructions | open_or_retest_at_observed_scope |
| wrestling--event_page | wrestling-page-practice-instructions-lost | open_or_retest_at_observed_scope |
| wrestling--live_card | wrestling-practical-copy-private-style | historical_regression_replay |
| wrestling--live_card | wrestling-retry-supervision-bring-copy | open_or_retest_at_observed_scope |

### CHAT-06 — Keep exact approved copy and language structure independent of generated prose (P0/P1)

Exact slogans and requested bilingual lines are acknowledged but are overwritten, passed as null approvedWording, flattened, or rejected when reintroduced during an edit.

**Source ownership**

- `src/lib/concierge/copy-workflow.ts`
- `src/lib/concierge/types.ts`
- `src/lib/concierge/extract.ts`
- `src/lib/concierge/fallback.ts`
- `src/lib/concierge/public-copy.ts`
- `src/app/chat/ConciergeChatClient.tsx:2065`
- `src/app/studio/studio-workspace-builders.ts`
- `src/lib/studio/product-prompts.ts`

**Root-cause confidence**

- Confirmed: Generation sets approvedWording only when copyStatus is ready; a supplied exact phrase in an ordinary intake turn can be acknowledged yet not enter that approved channel.
- Confirmed: Generic preview body rebuilding overwrites graduation exact wording after an unrelated end/contact turn; baby-shower bilingual phrases persist but line structure collapses later.
- To reproduce/validate: Existing campaign-exact-copy protections need current end-to-end replay; do not assume a passing isolated regex test proves final contract coverage.

**Implementation**

1. Store exact-copy blocks separately with text,language,order,line-break policy,surface requirement,prominence and source reference. User exact text is approved on capture; explicit optional suggestions remain proposed until accepted.
2. Build body text from approved blocks plus fact-derived prose. Never replace an approved block because copyStatus changes or unrelated facts arrive; copyStatus describes proposal state, not whether supplied text exists.
3. Send exact blocks and required fact coverage to image plan/quality checking, saved data and HTML; validators must not mark an actually approved safety line as unauthorized.
4. For Event Pages render required words and language blocks in HTML rather than asking a text-free hero to print them. For existing raster-only text absent from old art, offline tests establish the contract fix but do not claim the old image is repaired.

**Dependencies**

- CHAT-01
- CHAT-05
- Artwork contract/verifier workstream

**Offline fixtures**

- Graduation On to the next adventure across3 formats; Birthday slogan original and retry; baby-shower English/Spanish two-line copy; lantern approved safety line in rejected edit; lacrosse prominent non-contact.
- Unrelated room/contact/end/appearance turns, explicit edit/remove of just one block, multiline bilingual preservation, punctuation/Unicode apostrophes, supported language isolation.

**Acceptance**

- Every user-required exact block reaches final generation and guest contracts unchanged except an explicit user edit.
- Distinct requested lines/languages remain distinct in HTML/export where the contract requires them.
- A plan cannot both require and exclude the same approved text; offline preflight rejects the conflict before any paid request.

**Original findings (11 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| baby_shower--event_page | baby-shower-event-page-bilingual-lines-collapsed | open_or_retest_at_observed_scope |
| birthday--live_card | birthday-approved-slogan-not-in-generation-copy | historical_issue_with_bounded_verified_guard_retest_end_to_end |
| birthday--live_card | birthday-retry-slogan-not-rendered | open_or_retest_at_observed_scope |
| graduation--digital_flyer | graduation-exact-approved-line-missing | open_or_retest_at_observed_scope |
| graduation--event_page | graduation-event-page-exact-line-lost | open_or_retest_at_observed_scope |
| graduation--live_card | graduation-exact-line-lost-after-answer | open_or_retest_at_observed_scope |
| lacrosse--digital_flyer | lacrosse--digital_flyer-non-contact-lost | open_or_retest_at_observed_scope |
| lacrosse--live_card | lacrosse-live-non-contact-promise-unfulfilled | open_or_retest_at_observed_scope |
| special_event--digital_flyer | special-event-required-safety-copy-missing | open_or_retest_at_observed_scope |
| special_event--digital_flyer | special-event-safety-copy-edit-contract-conflict | open_or_retest_at_observed_scope |
| campaign | birthday-approved-slogan-not-in-generation-copy | verified_fix_preserve_guard_and_rerun |

### CHAT-07 — Remove unsupported public defaults and make unknown facts remain unknown (P1)

Generic gift copy is injected even when the host says leave missing details blank; category defaults compete with supplied context and visual preferences.

**Source ownership**

- `src/app/studio/studio-workspace-builders.ts:getRegistryText`
- `src/app/studio/studio-workspace-field-config.ts`
- `src/lib/concierge/public-copy.ts`
- `src/lib/concierge/copy-workflow.ts`
- `src/lib/concierge/types.ts`

**Root-cause confidence**

- Confirmed: getRegistryText unconditionally falls back to Your presence is the best gift for non-Open-House categories; this enters generation even when gift fields are absent.
- Confirmed: Default category prose/visual guidance is built independently of the user content, allowing generic Game Day or gold defaults to compete.
- To reproduce/validate: Visual palette precedence belongs to the artwork workstream; preserve its link here instead of fixing palettes via public gift data.

**Implementation**

1. Use explicit nullable public facts. Remove unsolicited gift-policy fallback; renderer placeholder/help text must never serialize as an event fact.
2. Only derive generic descriptions when no supplied purpose/guest copy exists; placeholders are editing affordances, not approved publication text.
3. Define one precedence order: explicit latest user facts/preferences, retained approved facts, accepted template defaults where applicable, optional suggestions. Never transform unknown price/capacity/court/lanes/partner/score/school/year into assertions.
4. Handle gift preference as its own valid public fact when supplied, including No gifts; do not remove legitimate gift content as a side effect of eliminating defaults.

**Dependencies**

- CHAT-01
- CHAT-05
- Artwork owner removes conflicting palette defaults using the same precedence contract.

**Offline fixtures**

- All generation requests with registryNote fallback, including intermediate-only Live Card occurrences and final visible Flyer occurrences.
- Positive gift/registry/no-gifts cases and intentionally empty registry; unknown price/capacity/lane/score/school/graduation-year controls.

**Acceptance**

- No unsupported gift/registry/public fact is generated or persisted when absent from source.
- Existing explicit gift policy remains visible in intended surfaces and exports.
- Test reporting distinguishes intermediate prompt defects from observed final public assertions.

**Original findings (51 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| anniversary--digital_flyer | anniversary-invented-gift-copy | open_or_retest_at_observed_scope |
| anniversary--live_card | anniversary-unrequested-gift-default | open_or_retest_at_observed_scope |
| appointment--digital_flyer | appointment--digital_flyer-gift-copy | open_or_retest_at_observed_scope |
| appointment--live_card | appointment-live-gift-default | open_or_retest_at_observed_scope |
| baseball--digital_flyer | baseball--digital_flyer-gift-copy | open_or_retest_at_observed_scope |
| baseball--live_card | baseball-generation-contract-conflicts | open_or_retest_at_observed_scope |
| basketball--digital_flyer | basketball--digital_flyer-invented-gift | open_or_retest_at_observed_scope |
| bridal_shower--digital_flyer | bridal-shower-invented-gift-copy | open_or_retest_at_observed_scope |
| bridal_shower--live_card | bridal-shower-gift-default | open_or_retest_at_observed_scope |
| cheerleading--digital_flyer | cheer-invented-gift-copy | open_or_retest_at_observed_scope |
| cheerleading--live_card | cheer-live-gift-default | open_or_retest_at_observed_scope |
| dance--digital_flyer | dance--digital_flyer-purpose-gift-copy | open_or_retest_at_observed_scope |
| dance--live_card | dance-unrequested-gift-default | open_or_retest_at_observed_scope |
| field_trip--digital_flyer | field_trip--digital_flyer-gift-copy | open_or_retest_at_observed_scope |
| football--digital_flyer | football-invented-gift-copy | open_or_retest_at_observed_scope |
| football--live_card | football-live-unsupported-gift-default | open_or_retest_at_observed_scope |
| game_day--live_card | game-day-conflicting-generation-defaults | open_or_retest_at_observed_scope |
| gender_reveal--digital_flyer | gender-reveal-unrequested-gift-copy | open_or_retest_at_observed_scope |
| gender_reveal--live_card | gender-reveal-gift-default | open_or_retest_at_observed_scope |
| general--digital_flyer | general--digital_flyer-gift-format | open_or_retest_at_observed_scope |
| general--live_card | general-live-gift-default | open_or_retest_at_observed_scope |
| graduation--digital_flyer | graduation-invented-gift-copy | open_or_retest_at_observed_scope |
| graduation--live_card | graduation-unsupplied-gift-default | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | gymnastics-invented-gift-copy | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-invented-gift-sentence-in-generation | historical_regression_replay |
| gymnastics--live_card | gymnastics-palette-and-gift-defaults-conflict | open_or_retest_at_observed_scope |
| hockey--digital_flyer | hockey-invented-gift-copy | open_or_retest_at_observed_scope |
| hockey--live_card | hockey-live-gift-default | open_or_retest_at_observed_scope |
| lacrosse--digital_flyer | lacrosse--digital_flyer-gift-callout | open_or_retest_at_observed_scope |
| lacrosse--live_card | lacrosse-live-gift-default | open_or_retest_at_observed_scope |
| soccer--digital_flyer | soccer--digital_flyer-gift-and-overlay | open_or_retest_at_observed_scope |
| softball--digital_flyer | softball-invented-gift-copy | open_or_retest_at_observed_scope |
| softball--live_card | softball-live-gift-default | open_or_retest_at_observed_scope |
| special_event--digital_flyer | special-event-invented-gift-copy | open_or_retest_at_observed_scope |
| special_event--live_card | special-live-gift-default | open_or_retest_at_observed_scope |
| sport_event--digital_flyer | sport_event--digital_flyer-gift-copy | open_or_retest_at_observed_scope |
| sport_event--live_card | sport-live-gift-default | open_or_retest_at_observed_scope |
| swimming--digital_flyer | swimming--digital_flyer-gift-and-schedule-format | open_or_retest_at_observed_scope |
| swimming--live_card | swim-live-gift-default | open_or_retest_at_observed_scope |
| tennis--digital_flyer | tennis--digital_flyer-gift-and-format | open_or_retest_at_observed_scope |
| tennis--live_card | tennis-generation-default-conflicts | open_or_retest_at_observed_scope |
| track_field--digital_flyer | track-field-invented-gift-copy | open_or_retest_at_observed_scope |
| track_field--live_card | track-retry-gift-default | open_or_retest_at_observed_scope |
| volleyball--digital_flyer | volleyball--digital_flyer-gift-copy | open_or_retest_at_observed_scope |
| volleyball--live_card | volleyball-generation-defaults-conflict | open_or_retest_at_observed_scope |
| wedding--digital_flyer | wedding-invented-gift-copy | open_or_retest_at_observed_scope |
| wedding--live_card | wedding-unsupplied-gift-line | open_or_retest_at_observed_scope |
| workshop--digital_flyer | workshop--digital_flyer-gift-overlay | open_or_retest_at_observed_scope |
| workshop--live_card | workshop-unrequested-gift-default | open_or_retest_at_observed_scope |
| wrestling--digital_flyer | wrestling--digital_flyer-gift-copy | open_or_retest_at_observed_scope |
| wrestling--live_card | wrestling-retry-gift-default | open_or_retest_at_observed_scope |

### CHAT-08 — Interpret negated privacy instructions and preserve safe parts of a request (P0)

Do not add a door code triggers an application private-account refusal and deletes output selection; ordinary creation is blocked despite the user asking for omission.

**Source ownership**

- `src/lib/concierge/fallback.ts:isPrivateDataMutationRequest`
- `src/lib/concierge/creation-intent.ts:classifyCreationBoundary`
- `src/lib/concierge/host-privacy.ts`
- `src/lib/concierge/host-brief.ts`
- `src/lib/concierge/extraction-contract.ts`

**Root-cause confidence**

- Confirmed: isPrivateDataMutationRequest tests global presence of a mutation verb and a private-data keyword without negation scope.
- Confirmed: blocksCreation clears requestedOutputs and event identity instead of rejecting only the unauthorized operation.
- To reproduce/validate: Do not weaken actual account/ownership/secret access boundaries; owner-authorized contact formatting differs from another-user data access.

**Implementation**

1. Parse operation polarity and target within clauses: omit/remove/do-not-invent is a constraint, not a request to expose/change a secret.
2. Represent unsafe operations as rejected operations while preserving safe event facts, requested product and valid prior state. Refusal text should identify the actual boundary and continue the safe task when possible.
3. Keep access decisions in server authorization, never in model-provided flags. No prompt or clause classifier can grant access to another account or fabricate a private code.
4. Add mixed-clause and quoted-example cases so a negative clause cannot mask a separate positive unauthorized operation.

**Dependencies**

- CHAT-01
- CHAT-02

**Offline fixtures**

- Housewarming all formats exact opening and follow-up; Do not add/invent/show a door code; keep address private; remove my contact from invitation.
- Positive unauthorized reveal/change-owner/access-token requests remain refused; mixed safe edit plus unauthorized operation preserves safe draft and product.
- Quoted instructions from attachments remain source data, not privileged instructions.

**Acceptance**

- All benign omission fixtures proceed with selected product intact and no private data invented.
- All actual unauthorized account/secret operations remain blocked server-side.
- Safe facts are not discarded when a separate clause is refused.

**Original findings (4 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| housewarming--digital_flyer | housewarming-negated-door-code-false-refusal | open_or_retest_at_observed_scope |
| housewarming--digital_flyer | housewarming-flyer-request-silently-changed | open_or_retest_at_observed_scope |
| housewarming--event_page | housewarming-negation-refusal-wrong-format | open_or_retest_at_observed_scope |
| housewarming--live_card | housewarming-live-negation-refusal | open_or_retest_at_observed_scope |

### CHAT-09 — Make replies, Q&A and questions reflect actual state and supported actions (P0/P1)

The assistant says changes are applied or saved when they are not, promises visible sections that are absent, reopens optional questions, and suggests unsupported or unverified plans.

**Source ownership**

- `src/lib/concierge/persona.ts`
- `src/lib/concierge/capabilities.ts`
- `src/lib/concierge/fallback.ts`
- `src/lib/concierge/requirements.ts`
- `src/lib/concierge/readiness.ts`
- `src/lib/concierge/conversation-state.ts`
- `src/lib/concierge/intake.ts`

**Root-cause confidence**

- Confirmed: persona instructions call currentDraft saved details and instruct repeated facts to be described as already saved; fallback duplicate messages use saved as well despite memory-only progress.
- Confirmed: Persona is a separate prose layer and can correctly understand a requirement without the draft or generation contract storing it.
- Confirmed: The current extraction contract reserves product/host memory/questioning for application code; stronger persona promises cannot mutate those facts.
- To reproduce/validate: Capabilities must be checked against the actual selected renderer and action wiring; generic product facts do not prove a particular journey configured a field.

**Implementation**

1. Build a structured response plan from the committed transaction receipt: applied changes, unresolved facts, pending proposal, capability references and persistence stage. Critical applied/saved/published claims render from this trusted plan, not free-form self-report.
2. Use in this draft for memory-only progress, saved only after successful explicit persistence, published only after successful publish. Save failures keep editing state and preserve navigation intent.
3. When a Q&A asks for an already-supplied note to appear, route it through requirement/copy storage or clearly present it as an unapplied suggestion; do not say included before it is represented.
4. Tie capability answers to versioned executable capabilities for the selected format/category. For school forms/price/registry/assignments, avoid invented future operations and give a real supported route or a clear unresolved limitation.
5. Derive next required question from unresolved typed fields; remember answered/skipped optional fields across factual/style turns. A model reply must not reopen an optional guest-count question or silently discard a supplied end.
6. Test combined query+edit requests: answer the question and apply only supplied facts. Never promote illustrative examples to confirmed events.

**Dependencies**

- CHAT-01 through CHAT-06
- Actions owner supplies tested per-renderer capability declarations.

**Offline fixtures**

- All93 archived Q&A answers, evaluated with exact question-turn state and actual delivered state; keep appropriate-but-unexercised capabilities explicitly unverified.
- Baby Shower, Field Trip, Gymnastics and Workshop saved-before-save claims; field-trip repeated optional guest count and school-form link; gymnastics end-time advice; basketball already-included claim; tennis unsupported assignments.
- Model outage/fallback, successful save, save failure, publish failure, repeat questions, accepted limitations and simultaneous factual plus capability request.

**Acceptance**

- Zero accomplished-action/persistence claims without corresponding successful state receipts.
- Zero required content promises missing from the resulting contract; future optional suggestions are labelled and not silently stored.
- No repeated already-answered or explicitly skipped optional question; required missing facts still ask one concrete question.
- Every capability assertion has a passing behavior test for the selected format, or is explicitly described as unverified/unavailable.

**Original findings (15 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| appointment--event_page | appointment-rsvp-plan-mismatch | open_or_retest_at_observed_scope |
| baby_shower--digital_flyer | baby-shower-claims-saved-before-explicit-save | open_or_retest_at_observed_scope |
| basketball--event_page | basketball-details-and-qa-mismatch | open_or_retest_at_observed_scope |
| dance--live_card | dance-artwork-schedule-promise-contradicts-contract | open_or_retest_at_observed_scope |
| field_trip--event_page | field-trip-school-form-link-unverified | historical_regression_replay |
| field_trip--event_page | field-trip-style-intake-returns-optional-guest-count-question | historical_regression_replay |
| field_trip--event_page | field-trip-claims-save-before-explicit-save | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | gymnastics-qa-end-time-disregarded | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-unsaved-progress-called-saved | historical_regression_replay |
| lacrosse--live_card | lacrosse-live-non-contact-promise-unfulfilled | open_or_retest_at_observed_scope |
| tennis--digital_flyer | tennis--digital_flyer-assignment-language | open_or_retest_at_observed_scope |
| workshop--digital_flyer | workshop--digital_flyer-saved-claim | open_or_retest_at_observed_scope |
| workshop--event_page | workshop-page-placeholder-title-persists | open_or_retest_at_observed_scope |
| wrestling--live_card | wrestling-error-wording-first-generation | historical_regression_replay |
| campaign | campaign-capability-question-memory | verified_fix_preserve_guard_and_rerun |

### CHAT-10 — Separate RSVP enablement, host contact, booking intent and category capability (P0/P1)

No booking form is mistaken for no RSVP/contact; Game Day adapters allow RSVP while erasing supplied organizer/contact; school open house inherits property behavior.

**Source ownership**

- `src/lib/concierge/rsvp-details.ts`
- `src/lib/concierge/fallback.ts:detectRsvpEnabled`
- `src/lib/concierge/extraction-contract.ts`
- `src/lib/concierge/types.ts`
- `src/app/chat/ConciergeChatClient.tsx:buildStudioDetailsFromDraft`
- `src/app/studio/studio-workspace-builders.ts`
- `src/app/studio/studio-workspace-field-config.ts`

**Root-cause confidence**

- Confirmed: Generation sets rsvpEnabled from the explicit setting but hostName/rsvpContact are gated separately by supportsStudioCategoryRsvp; Game Day can therefore carry true plus null contact.
- Confirmed: Appointment evidence conflates no customer booking with contact/RSVP settings; some later public RSVP panels succeed, so generation omission is not universally an endpoint failure.
- To reproduce/validate: A single RSVP boolean cannot express online attendance, external contact-only replies and unrelated appointment booking semantics accurately.

**Implementation**

1. Represent contact information, permission to display it, response mode and booking capability separately. An explicit no-booking instruction must not erase a supplied organizer or contact.
2. Use effective RSVP mode consistently in all adapters, not raw visual category support for one field and explicit override for another.
3. For self-contained Flyers include supplied public contact as requested even when online form is off; hide it only for explicit privacy or exclusion.
4. Resolve genuine contradictory user instructions with one concrete question rather than choosing a default. Backend and renderer capability policy must agree for school and category-specific forms.

**Dependencies**

- CHAT-02
- CHAT-08
- CHAT-09
- Guest-action workstream owns actual category RSVP endpoint/schema repair.

**Offline fixtures**

- All sports/Game Day Flyer contact omissions plus Live Card intermediate-only gaps; appointment allformats with no-booking and later RSVP contact; school vsproperty openhouse.
- RSVP on/off/manual/contact-only/private contact; explicit off followed by contact without explicit enable; venue phone must not become RSVP contact.

**Acceptance**

- Supplied public organizer/contact survives all generation and persistence adapters under the selected mode.
- No-booking never implies unrelated host contact erasure.
- Visible/enabled RSVP form configuration agrees with backend required fields; requests preserve state and give actionable errors on failure.

**Original findings (24 distinct case/finding pairs)**

| Case | Original finding ID | Review scope |
| --- | --- | --- |
| appointment--event_page | appointment-rsvp-plan-mismatch | open_or_retest_at_observed_scope |
| appointment--live_card | appointment-live-arrival-contact-lost | open_or_retest_at_observed_scope |
| baseball--digital_flyer | baseball--digital_flyer-contact-mapping | open_or_retest_at_observed_scope |
| baseball--live_card | baseball-generation-contract-conflicts | open_or_retest_at_observed_scope |
| basketball--digital_flyer | basketball--digital_flyer-missing-contact | open_or_retest_at_observed_scope |
| basketball--live_card | basketball-live-generation-contact-gap | open_or_retest_at_observed_scope |
| football--digital_flyer | football-rsvp-and-team-roles-lost | historical_regression_replay |
| football--digital_flyer | football-rsvp-contact-missing-from-flyer | open_or_retest_at_observed_scope |
| game_day--digital_flyer | game-day-promised-rsvp-contact-missing | open_or_retest_at_observed_scope |
| game_day--live_card | game-day-conflicting-generation-defaults | open_or_retest_at_observed_scope |
| gymnastics--digital_flyer | gymnastics-printed-rsvp-contact-missing | open_or_retest_at_observed_scope |
| gymnastics--live_card | gymnastics-venue-and-organizer-fragments | historical_regression_replay |
| gymnastics--live_card | gymnastics-rsvp-contact-dropped-from-generation | historical_regression_replay |
| lacrosse--digital_flyer | lacrosse--digital_flyer-non-contact-lost | open_or_retest_at_observed_scope |
| open_house--digital_flyer | open_house--digital_flyer-real-estate-rsvp | open_or_retest_at_observed_scope |
| open_house--live_card | open-house-school-routed-to-property | open_or_retest_at_observed_scope |
| soccer--digital_flyer | soccer--digital_flyer-contact-loss | open_or_retest_at_observed_scope |
| sport_event--digital_flyer | sport_event--digital_flyer-contact-dropped | open_or_retest_at_observed_scope |
| tennis--digital_flyer | tennis--digital_flyer-contact-loss | open_or_retest_at_observed_scope |
| tennis--live_card | tennis-generation-default-conflicts | open_or_retest_at_observed_scope |
| volleyball--digital_flyer | volleyball--digital_flyer-contact-loss | open_or_retest_at_observed_scope |
| volleyball--live_card | volleyball-generation-defaults-conflict | open_or_retest_at_observed_scope |
| open_house--digital_flyer | runner_finding:a893de7252dfcd | open_or_retest_at_observed_scope |
| open_house--live_card | runner_finding:a893de7252dfcd | open_or_retest_at_observed_scope |

## Shared verification contract

- Freeze time and use September23,2026 in new ordinary fixtures; preserve the original dates in captured evidence. Dedicated DST/locale boundary fixtures use the dates needed to exercise that boundary.
- Replay extraction, reducer, generation-input building, explicit save/resume, public-content projection and calendar adapters; no network or new art is needed to reproduce the contract failures.
- Compare to original approved user facts and explicit later corrections, not only the previous possibly-corrupt draft.
- Verify original accepted images, rejected candidates and error states separately; previous repair failures do not automatically prove the new prompt works or the old rejection reason.
- Keep correct observed behavior as positive controls: unknown price/capacity/lanes/scores remain absent; source-specific guest actions that passed continue to pass; case-specific claims do not become universal defects.
- Zero P0 contract violations, zero mismatched requested/published products, zero unsupported accomplished-action claims, and complete required guest content are necessary gates. New stochastic art quality and actual-user satisfaction remain unproven until a later authorized validation stage.

See `chat-facts-plan.json` for exact evidence references, all latest Q&A fixture references and handoff boundaries.
