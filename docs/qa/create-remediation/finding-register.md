# Complete Create campaign finding register

**584/584 recorded case/finding keys mapped; 93/93 cases covered; 28 fix packages plus 3 execution packages.** No application fix has been implemented by this plan.

These are observations, not 584 distinct root-cause bugs. Current and historical findings, raw runner assertions, verified guards and operational stops retain separate classifications. A historical record is not automatically a current defect. A fixed unit-level guard does not close a later end-to-end failure.

[Main plan](../create-campaign-remediation-plan.md) · [Task manifest](tasks.json) · [Full data and evidence pointers](finding-register.json) · [Validation](coverage-validation.json) · [Q&A](qa-register.md)

Disposition labels below are planning classifications. All implementations remain planned. Detailed reproduction, code ownership and acceptance criteria are in the linked work packages.

Historical references to a mutable current result are rebound to retained results by the original review timestamp; original paths remain in JSON. See coverage-validation.json for every correction and any unbound historical screenshot limitation.

## anniversary--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **anniversary-birthday-age-copy-published** — Published anniversary invitation says Sam is turning 25 | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /findings/0 |
| **anniversary-dinner-duplicated-vow-label-missing** — Dinner appears twice while the vow-renewal label disappears | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-04](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /findings/1 |
| **anniversary-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /findings/6 |
| **anniversary-guest-controls-overlap-footer** — Guest controls overlap title, RSVP and lower copy | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /findings/5 |
| **anniversary-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /findings/3 |
| **anniversary-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /findings/4 |
| **anniversary-whole-event-end-assigned-to-vows** — Assistant assigns the overall 6:30PM end to the vow-renewal segment | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/anniversary--digital_flyer/result.json) /findings/0 |

## anniversary--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **anniversary-dinner-time-lost** — The separate dinner venue survives but its supplied 5 PM time is lost | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page.json) /findings/2 |
| **anniversary-end-time-disagrees-with-iso** — Confirmed 6:30 PM end remains 4 PM in the canonical timestamp | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page-before-1789792444404.json) /findings/2 |
| **anniversary-event-page-and-title-not-captured** — Explicit Event Page request becomes Live Card with a generic title | Historical only; historical_regression_replay | [CHAT-02](chat-facts-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page-before-1789792444404.json) /findings/0 |
| **anniversary-event-page-becomes-live-card** — The requested Event Page is silently replaced with a Live Card | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page.json) /findings/0 |
| **anniversary-identity-replaced-with-event-draft-sam** — Elena and Sam's 25th anniversary becomes Event draft for Sam | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page.json) /findings/1 |
| **anniversary-maps-checker-false-negative** — The directions checker rejects valid Google Maps search links | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page.json) /findings/3 |
| **anniversary-time-location-pairing-lost** — Dinner replaces the main venue and loses its supplied 5 PM time | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page-before-1789792444404.json) /findings/1 |
| **execution-journey_incomplete-b69d2805** — Unexpected token '<', "<!DOCTYPE "... is not valid JSON | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/anniversary--event_page/result-before-1789794472489.json) /failure |
| **runner_finding:42628ae7feaca9** — Unexpected token '<', "<!DOCTYPE "... is not valid JSON | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/anniversary--event_page/result-before-1789794472489.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/anniversary--event_page/result.json) /findings/0 |

## anniversary--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **anniversary-core-identity-lost** — The published anniversary card says Event draft and Sam, omitting Elena and the 25th anniversary | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--live_card.json) /findings/0 |
| **anniversary-dinner-time-lost** — The promised 5 PM dinner time is absent from the saved schedule | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--live_card.json) /findings/1 |
| **anniversary-maps-checker-false-negative** — The raw guest directions check rejects two valid Google Maps search handoffs | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--live_card.json) /findings/4 |
| **anniversary-mobile-preview-clipping** — The phone creation preview clips the enlarged Event draft headline | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--live_card.json) /findings/2 |
| **anniversary-unrequested-gift-default** — Generation adds a gift preference despite the request to leave unknown details blank | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--live_card.json) /findings/3 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/anniversary--live_card/result.json) /findings/0 |

## appointment--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **appointment--digital_flyer-arrival-note** — Early-arrival instruction is dropped from the appointment reminder | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--digital_flyer.json) /findings/0 |
| **appointment--digital_flyer-download** — Download is absent from the downloadable-Flyer flow | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--digital_flyer.json) /findings/2 |
| **appointment--digital_flyer-gift-copy** — Confirmed appointment receives unrequested gift wording | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--digital_flyer.json) /findings/1 |
| **appointment--digital_flyer-mobile-logistics** — Small logistics and overlay placement weaken phone readability | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--digital_flyer.json) /findings/3 |

## appointment--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **appointment-calendar-venue-name-lost** — Calendar location drops Maple Community Center | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--event_page.json) /findings/2 |
| **appointment-directions-missing** — The appointment page has no directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--event_page.json) /findings/4 |
| **appointment-preview-and-title-contrast** — The preview hides the published page's hard-to-read title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--event_page.json) /findings/1 |
| **appointment-rsvp-plan-mismatch** — The delivered RSVP form contradicts the assistant's informational-only plan | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-09](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--event_page.json) /findings/3 |
| **appointment-specific-details-omitted** — The page loses the Rivera-family and early-arrival instructions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--event_page.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/appointment--event_page/result.json) /findings/0 |

## appointment--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **appointment-live-arrival-contact-lost** — The confirmed arrival instruction and supplied organizer/contact do not reach the card | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--live_card.json) /findings/0 |
| **appointment-live-edit-rejected** — Requested darker/larger edit fails and the original image is published | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--live_card.json) /findings/1 |
| **appointment-live-gift-default** — Generation adds gift wording to a portrait appointment | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--live_card.json) /findings/3 |
| **appointment-live-preview-crop-contrast** — Phone creation preview clips Family Portrait and action labels have weak contrast | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--live_card.json) /findings/2 |
| **runner_finding:3324af452c7db4** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/appointment--live_card/result.json) /findings/0 |

## baby_shower--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **baby-shower-claims-saved-before-explicit-save** — The assistant describes unsaved progress as a saved schedule | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-09](chat-facts-plan.md), [GR10](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer.json) /findings/2 |
| **baby-shower-guest-controls-obscure-no-gifts** — Published guest controls cover the supplied No gifts, please note | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer.json) /findings/0 |
| **baby-shower-logistics-machine-format-and-duplicate-venue** — The flyer prints mixed time formats and repeats the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer.json) /findings/1 |
| **baby-shower-maps-checker-false-negative** — The directions checker rejects a valid Google Maps search link | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer.json) /findings/3 |
| **baby-shower-supplied-title-not-in-generation-headline** — Supplied flyer title is acknowledged but replaced by Event draft | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md), [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer-before-1789794602945.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/baby_shower--digital_flyer/result.json) /findings/0 |

## baby_shower--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **baby-shower-event-page-bilingual-lines-collapsed** — The promised separate bilingual lines are joined into one paragraph | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--event_page.json) /findings/2 |
| **baby-shower-event-page-directions-missing** — Guests have no directions control for the supplied address | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--event_page.json) /findings/4 |
| **baby-shower-event-page-edit-rejected** — The requested darker appearance edit fails after repair | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--event_page.json) /findings/1 |
| **baby-shower-event-page-no-gifts-missing** — The no-gifts instruction is stored but not published | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--event_page.json) /findings/0 |
| **baby-shower-event-page-planning-display** — The visible schedule omits 4 PM and Where repeats the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--event_page.json) /findings/5 |
| **baby-shower-event-page-preview-contrast** — The artwork-only preview hides the published headline contrast and crop | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--event_page.json) /findings/3 |
| **runner_finding:67dc3cd42990ba** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/baby_shower--event_page/result.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/baby_shower--event_page/result.json) /findings/1 |

## baby_shower--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **baby-shower-generated-faux-controls** — Accepted artwork contains a fake heart/share/more toolbar behind the real actions | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-03](art-contracts-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--live_card.json) /findings/0 |
| **baby-shower-maps-checker-false-negative** — The raw directions check rejects a valid search URL | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--live_card.json) /findings/3 |
| **baby-shower-mobile-preview-clipping** — The creation phone preview clips both exact bilingual lines | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--live_card.json) /findings/1 |
| **baby-shower-no-gifts-not-presented** — No gifts, please is retained in data but omitted from the guest presentation path | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--live_card.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/baby_shower--live_card/result.json) /findings/0 |

## baseball--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **baseball--digital_flyer-contact-mapping** — Image loses organizer and RSVP contact retained by draft | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--digital_flyer.json) /findings/1 |
| **baseball--digital_flyer-download** — No discoverable Flyer download in inspected flow | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--digital_flyer.json) /findings/3 |
| **baseball--digital_flyer-gift-copy** — Unrequested gift sentiment displaces useful clinic content | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--digital_flyer.json) /findings/2 |
| **baseball--digital_flyer-missing-clinic-copy** — Age range, equipment and clinic activities are omitted | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--digital_flyer.json) /findings/0 |
| **baseball--digital_flyer-phone-copy** — Dense logistics remain small after larger-lettering edit | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [GR03](guest-release-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--digital_flyer.json) /findings/4 |

## baseball--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **baseball-page-clinic-reframed** — Skills clinic becomes Game Day and loses equipment and age instructions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--event_page.json) /findings/0 |
| **baseball-page-edit-rejected** — Requested visual edit fails and original is retained | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--event_page.json) /findings/1 |
| **baseball-page-location-export** — Calendar omits venue and room and no directions action exists | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--event_page.json) /findings/3 |
| **baseball-page-title-preview** — Dark published heading is absent from image-only preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--event_page.json) /findings/2 |
| **runner_finding:3ed4561634e85d** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/baseball--event_page/result.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/baseball--event_page/result.json) /findings/1 |

## baseball--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **baseball-clinic-facts-replaced-by-game-day** — Clinic eligibility and equipment instructions disappear under game-day defaults | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-02](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--live_card.json) /findings/0 |
| **baseball-display-end-time-missing** — The saved display summary omits the known 4 PM end | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--live_card.json) /findings/3 |
| **baseball-generation-contract-conflicts** — Generation defaults conflict with the clinic brief and supplied palette | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [CHAT-07](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--live_card.json) /findings/2 |
| **baseball-maps-checker-false-negative** — The Maps action has a correct destination despite a false checker result | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--live_card.json) /findings/4 |
| **baseball-mobile-preview-title-crop** — Phone creation preview clips the title on all three lines | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--live_card.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/baseball--live_card/result.json) /findings/0 |

## basketball--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **basketball--digital_flyer-download** — No Download action in inspected Flyer flow | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--digital_flyer.json) /findings/3 |
| **basketball--digital_flyer-invented-gift** — Sports flyer adds unrequested gift messaging | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--digital_flyer.json) /findings/2 |
| **basketball--digital_flyer-missing-contact** — Confirmed RSVP contact is absent from self-contained artwork | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--digital_flyer.json) /findings/1 |
| **basketball--digital_flyer-missing-sports-copy** — Promised opponent, practice clarification and shoes never reach flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--digital_flyer.json) /findings/0 |
| **basketball--digital_flyer-phone-format** — Guest chrome overlaps heading and small logistics retain awkward formatting | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [GR03](guest-release-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--digital_flyer.json) /findings/4 |

## basketball--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **basketball-details-and-qa-mismatch** — The assistant claims scrimmage details are included when the page omits them | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--event_page.json) /findings/0 |
| **basketball-edit-rejected** — The appearance edit is rejected after repair | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--event_page.json) /findings/1 |
| **basketball-guest-planning-controls** — The page omits the end and directions while duplicating the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [GR04](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--event_page.json) /findings/3 |
| **basketball-preview-and-dark-title** — The preview hides the final page's low-contrast title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--event_page.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/basketball--event_page/result.json) /findings/1 |
| **runner_finding:f36010b0a7a60b** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/basketball--event_page/result.json) /findings/0 |

## basketball--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **basketball-live-generation-contact-gap** — Generation contract drops supplied coach contact and adds gift wording | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--live_card.json) /findings/2 |
| **basketball-live-matchup-instructions-lost** — Opponent and practice instructions disappear from guest content | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--live_card.json) /findings/0 |
| **basketball-live-title-framing** — Phone preview crops title and published controls overlap the team name | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--live_card.json) /findings/1 |

## birthday--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **birthday-calendar-drops-no-gifts** — Calendar handoffs drop the explicit no-gifts instruction | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--digital_flyer.json) /findings/3 |
| **birthday-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--digital_flyer.json) /findings/1 |
| **birthday-guest-controls-hide-required-copy** — Guest action controls obscure the RSVP contact and no-gifts instruction | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [GR03](guest-release-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--digital_flyer.json) /findings/2 |
| **birthday-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--digital_flyer.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--digital_flyer/result.json) /findings/0 |

## birthday--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **birthday-event-page-directions-absent** — The full physical address has no guest directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--event_page.json) /findings/2 |
| **birthday-event-page-preview-not-final-page** — Preview shows only artwork while the published page adds unreadable headline styling | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--event_page.json) /findings/1 |
| **birthday-event-page-required-gift-line-missing** — The explicitly required No gifts, please. line disappears from the guest page and calendars | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--event_page.json) /findings/0 |
| **birthday-event-page-visible-schedule-location** — Visible planning details omit the end time and repeat the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--event_page.json) /findings/3 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--event_page/result.json) /findings/0 |

## birthday--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **birthday-approved-slogan-not-in-generation-copy** — Acknowledged exact wording is absent from canonical generation copy | Historical only; historical_regression_replay | [ART-01](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789791561469.json) /findings/0 |
| **birthday-artwork-quality-rejection-after-repair** — The birthday card is not delivered after generation and one repair | Historical only; historical_regression_replay | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789828685459.json) /findings/0 |
| **birthday-correction-text-becomes-generation-occasion** — The generation occasion is overwritten by the full address-correction instruction | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789828685459.json) /findings/3 |
| **birthday-end-not-shown-in-current-schedule-summary** — The captured schedule summary shows only the start after the end is supplied | Historical only; observation_requires_reproduction | [CHAT-03](chat-facts-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789792748127.json) /findings/3 |
| **birthday-generation-budget-block** — Generation deferred by campaign cost guard | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789791561469.json) /findings/3 |
| **birthday-generation-contract-loses-year** — The generation request drops the supplied year and mixes clock formats | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789828685459.json) /findings/4 |
| **birthday-generation-response-capture-evicted** — The campaign loses the generation response before it can verify the artwork | Historical only; infrastructure_or_operational_control | [ART-04](art-contracts-plan.md), [ART-07](art-contracts-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789792748127.json) /findings/0 |
| **birthday-retry-appearance-rejected** — Requested darker and larger artwork edit is not delivered | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card.json) /findings/1 |
| **birthday-retry-calendar-gift-note** — Calendar handoff omits the requested no-gifts line | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card.json) /findings/3 |
| **birthday-retry-phone-crop** — Phone creation preview cuts off turning 7 | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card.json) /findings/2 |
| **birthday-retry-slogan-not-rendered** — Approved slogan is missing from artwork despite explicit composition plan | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [ART-03](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card.json) /findings/0 |
| **birthday-theme-prompt-fragment** — Theme carries a stray instruction fragment and repetition | Historical only; historical_regression_replay | [ART-06](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789791561469.json) /findings/1 |
| **birthday-unsupplied-end-time** — An end time was assigned before the user supplied one | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789791561469.json) /findings/2 |
| **execution-generation-2e72842b** — generation_failed: No real generated artwork returned | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789791561469.json) /failure |
| **execution-harness_interaction-03c6da40** — locator.waitFor: Timeout 45000ms exceeded. Call log: [2m  - waiting for getByRole('button', { name: 'Essential only', exact: true }) to be visible[22m  | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789792132452.json) /failure |
| **execution-journey_incomplete-2e72842b** — generation_failed: No real generated artwork returned | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789792748127.json) /failure |
| **execution-opening-c3932bca** — locator.click: Timeout 20000ms exceeded. Call log: [2m  - waiting for getByRole('button', { name: 'Send', exact: true })[22m [2m    - locator resolved to <button disabled type="submit" aria-label="Send" data-state="closed" class="inline-flex size-11 items-center justify-center rounded-full text-[#5c5be5] transition hover:bg-[#f1ebff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-50">…</button>[22m [2m  - attempting click action[22m [2m    2 × waiting for element to be visible, enabled and stable[22m [2m      - element is not enabled[22m [2m    - retrying click action[22m [2m    - waiting 20ms[22m [2m    2 × waiting for element to be visible, enabled and stable[22m [2m      - element is not enabled[22m [2m    - retrying click action[22m [2m      - waiting 100ms[22m [2m    36 × waiting for element to be visible, enabled and stable[22m [2m       - element is not enabled[22m [2m     - retrying click action[22m [2m       - waiting 500ms[22m  | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789785919182.json) /failure |
| **runner_finding:1ee659fca90a96** — locator.click: Timeout 20000ms exceeded. Call log: [2m  - waiting for getByRole('button', { name: 'Send', exact: true })[22m [2m    - locator resolved to <button disabled type="submit" aria-label="Send" data-state="closed" class="inline-flex size-11 items-center justify-center rounded-full text-[#5c5be5] transition hover:bg-[#f1ebff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a98dff] disabled:cursor-not-allowed disabled:opacity-50">…</button>[22m [2m  - attempting click action[22m [2m    2 × waiting for element to be visible, enabled and stable[22m [2m      - element is not enabled[22m [2m    - retrying click action[22m [2m    - waiting 20ms[22m [2m    2 × waiting for element to be visible, enabled and stable[22m [2m      - element is not enabled[22m [2m    - retrying click action[22m [2m      - waiting 100ms[22m [2m    36 × waiting for element to be visible, enabled and stable[22m [2m       - element is not enabled[22m [2m     - retrying click action[22m [2m       - waiting 500ms[22m  | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789785919182.json) /findings/0 |
| **runner_finding:5f5bb55caf3459** — locator.waitFor: Timeout 45000ms exceeded. Call log: [2m  - waiting for getByRole('button', { name: 'Essential only', exact: true }) to be visible[22m  | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789792132452.json) /findings/0 |
| **runner_finding:d012fbfc4d53cf** — Evidence capture: response.text: Protocol error (Network.getResponseBody): Request content was evicted from inspector cache Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation. | Historical only; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789792748127.json) /findings/0 |
| **runner_finding:e203e3b3f10268** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result.json) /findings/0 |
| **runner_finding:e2a5da58b388b5** — generation_failed: No real generated artwork returned | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/birthday--live_card/result-before-1789791561469.json) /findings/0 |

## bridal_shower--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **bridal-shower-afternoon-tea-wording-missing** — Requested afternoon-tea wording is not carried into the invitation | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--digital_flyer.json) /findings/0 |
| **bridal-shower-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--digital_flyer.json) /findings/3 |
| **bridal-shower-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--digital_flyer.json) /findings/1 |
| **bridal-shower-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--digital_flyer.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/bridal_shower--digital_flyer/result.json) /findings/0 |

## bridal_shower--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **bridal-shower-calendar-loses-room** — Calendar exports omit the corrected venue and room | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--event_page.json) /findings/3 |
| **bridal-shower-dark-hero-title** — Published hero uses very dark title text on a dark image | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--event_page.json) /findings/1 |
| **bridal-shower-no-directions-control** — The Event Page displays an address without a directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--event_page.json) /findings/4 |
| **bridal-shower-preview-is-artwork-only** — Fullscreen Event Page previews show only artwork | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--event_page.json) /findings/0 |
| **bridal-shower-visible-details-incomplete** — Guest copy omits afternoon tea and the supplied 4 PM end | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--event_page.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/bridal_shower--event_page/result.json) /findings/0 |

## bridal_shower--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **bridal-shower-action-contrast** — White guest action labels and icons have weak contrast over the pale tea setting | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--live_card.json) /findings/1 |
| **bridal-shower-afternoon-copy-lost** — The promised afternoon-tea supporting sentence becomes generic bridal-shower copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--live_card.json) /findings/0 |
| **bridal-shower-gift-default** — Leaving registry blank still injects an unsupported gift preference into generation | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--live_card.json) /findings/3 |
| **bridal-shower-initial-preview-copy** — The opening preview headline contains a malformed possessive | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--live_card.json) /findings/2 |
| **bridal-shower-maps-false-negative** — Raw directions check rejects the correct Google Maps search handoff | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--live_card.json) /findings/4 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/bridal_shower--live_card/result.json) /findings/0 |

## campaign

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **anniversary-end-time-disagrees-with-iso** — anniversary-end-time-disagrees-with-iso | Latest evidence; bounded_verified_fix_retest_guard | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /verifiedFixes/anniversary-end-time-disagrees-with-iso |
| **birthday-approved-slogan-not-in-generation-copy** — birthday-approved-slogan-not-in-generation-copy | Latest evidence; bounded_verified_fix_retest_guard | [ART-01](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /verifiedFixes/birthday-approved-slogan-not-in-generation-copy |
| **campaign-capability-question-memory** — Capability questions changed event facts and titles | Latest evidence; bounded_verified_fix_retest_guard | [CHAT-01](chat-facts-plan.md), [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /findings/2 |
| **campaign-desktop-mobile-sidebar** — Resizing desktop to mobile opened navigation over the composer | Latest evidence; bounded_verified_fix_retest_guard | [GR10](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /findings/0 |
| **campaign-duplicate-mobile-navigation** — Mobile chat exposes two Open navigation controls | Latest evidence; observed_product_issue_reproduce_and_fix | [GR10](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /findings/1 |
| **campaign-end-reply-moves-start** — End-time replies could replace the approved start | Latest evidence; bounded_verified_fix_retest_guard | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /findings/3 |
| **field-trip-corrected-return-stale-display-times** — field-trip-corrected-return-stale-display-times | Latest evidence; bounded_verified_fix_retest_guard | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /verifiedFixes/field-trip-corrected-return-stale-display-times |
| **field-trip-venue-name-overwritten** — field-trip-venue-name-overwritten | Latest evidence; bounded_verified_fix_retest_guard | [CHAT-04](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /verifiedFixes/field-trip-venue-name-overwritten |
| **football-address-correction-changes-category** — football-address-correction-changes-category | Latest evidence; bounded_verified_fix_retest_guard | [CHAT-01](chat-facts-plan.md), [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /verifiedFixes/football-address-correction-changes-category |
| **gymnastics-negated-birthday-becomes-category** — gymnastics-negated-birthday-becomes-category | Latest evidence; bounded_verified_fix_retest_guard | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/campaign-review.json) /verifiedFixes/gymnastics-negated-birthday-becomes-category |

## cheerleading--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **cheer-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--digital_flyer.json) /findings/4 |
| **cheer-guest-controls-overlap-footer** — Guest controls overlap the lower Flyer copy | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--digital_flyer.json) /findings/3 |
| **cheer-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--digital_flyer.json) /findings/1 |
| **cheer-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--digital_flyer.json) /findings/2 |
| **cheer-required-water-seating-copy-missing** — The Flyer omits both supplied participant instructions | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--digital_flyer.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/cheerleading--digital_flyer/result.json) /findings/0 |

## cheerleading--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **cheer-page-location-duplication** — Guest location repeats venue and room and has no directions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR04](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--event_page.json) /findings/2 |
| **cheer-page-spectator-instructions-lost** — Water and spectator seating instructions never reach guests | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--event_page.json) /findings/0 |
| **cheer-page-title-preview-mismatch** — Published title is dark on dark while preview hides page text | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--event_page.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/cheerleading--event_page/result.json) /findings/0 |

## cheerleading--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **cheer-live-gift-default** — Generation adds gift wording to a cheer showcase | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--live_card.json) /findings/2 |
| **cheer-live-guest-instructions-lost** — Water and spectator seating instructions vanish despite confirmation | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--live_card.json) /findings/0 |
| **cheer-live-mobile-title-crop** — Creation phone preview cuts all three title lines | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--live_card.json) /findings/1 |

## dance--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **dance--digital_flyer-calendar-missing** — Published Flyer has no guest Calendar action | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--digital_flyer.json) /findings/1 |
| **dance--digital_flyer-canonical-noon** — Visible2PM show has noon canonical start | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--digital_flyer.json) /findings/0 |
| **dance--digital_flyer-download** — Download Flyer is absent from inspected flow | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--digital_flyer.json) /findings/3 |
| **dance--digital_flyer-purpose-gift-copy** — Performance detail becomes boilerplate and unrequested gift copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--digital_flyer.json) /findings/2 |
| **dance--digital_flyer-schedule-format** — Long schedule prose stays too small on phone | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--digital_flyer.json) /findings/4 |
| **runner_finding:389ce650bd229f** — Anonymous guest check failed: calendar | Latest evidence; raw_assertion_requires_adjudication | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/dance--digital_flyer/result.json) /findings/0 |

## dance--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **dance-page-arrival-doors-lost** — Promised performer and audience arrival instructions disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--event_page.json) /findings/0 |
| **dance-page-dark-title-preview** — Image-only preview conceals poor published title contrast | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--event_page.json) /findings/1 |
| **dance-page-guest-location-loss** — Calendar loses venue and room and no directions action is offered | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--event_page.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/dance--event_page/result.json) /findings/0 |

## dance--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **dance-arrival-roles-lost** — Performer arrival and audience doors are acknowledged but disappear from the delivered event | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /findings/0 |
| **dance-artwork-schedule-promise-contradicts-contract** — Chat promises schedule text in artwork while the generated product excludes it | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /findings/1 |
| **dance-calendar-venue-omission** — Calendar exports lose Maple Community Center and Room B | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /findings/2 |
| **dance-intermediate-copy-placeholder** — Early preview headline contains the raw opening sentence | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /findings/4 |
| **dance-maps-checker-false-negative** — A valid Maps search handoff is reported as missing | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /findings/6 |
| **dance-mobile-preview-crops-art** — Mobile creation preview crops Dance Studio lettering and dancer composition | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /findings/3 |
| **dance-unrequested-gift-default** — An unrequested gift preference enters the generated invitation metadata | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /findings/5 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/dance--live_card/result.json) /findings/0 |

## field_trip--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **field_trip--digital_flyer-awkward-copy** — Repeated departure wording overwhelms the mobile Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--digital_flyer.json) /findings/2 |
| **field_trip--digital_flyer-calendar-missing** — Guest Calendar action is missing despite valid canonical trip times | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--digital_flyer.json) /findings/1 |
| **field_trip--digital_flyer-download** — Download Flyer is not discoverable | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--digital_flyer.json) /findings/4 |
| **field_trip--digital_flyer-gift-copy** — Unrequested gift wording appears on a school trip | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--digital_flyer.json) /findings/3 |
| **field_trip--digital_flyer-preparation-missing** — Packed lunch and water bottle instructions disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--digital_flyer.json) /findings/0 |
| **runner_finding:389ce650bd229f** — Anonymous guest check failed: calendar | Latest evidence; raw_assertion_requires_adjudication | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--digital_flyer/result.json) /findings/0 |

## field_trip--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-harness_interaction-72e0bf86** — harness_interaction: The style request was not found in the rendered chat | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result-before-1789794003187.json) /failure |
| **execution-journey_incomplete-2e72842b** — generation_failed: No real generated artwork returned | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result-before-1789792839852.json) /failure |
| **execution-journey_incomplete-cefa12e0** — appearance_edit_failed: new_generation_failed_or_missing_artifact | Historical only; execution_stop_classify_and_retest | [ART-04](art-contracts-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result-before-1789793713083.json) /failure |
| **field-trip-appearance-edit-quality-rejection** — The requested appearance edit is rejected after one repair | Historical only; historical_regression_replay | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789793713083.json) /findings/0 |
| **field-trip-claims-save-before-explicit-save** — The assistant calls the time saved before an explicit draft save | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-09](chat-facts-plan.md), [GR10](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /findings/5 |
| **field-trip-corrected-return-stale-display-times** — Return-time correction leaves contradictory schedule fields | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789792236452.json) /findings/0 |
| **field-trip-correction-in-occasion-and-mixed-clock-copy** — The generation brief contains correction instructions and produces a mixed-format schedule | Historical only; historical_regression_replay | [ART-06](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789793713083.json) /findings/4 |
| **field-trip-initial-preview-headline-is-brief** — The initial preview headline exposes a partially stripped user request | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /findings/4 |
| **field-trip-no-directions-action** — The published locations have no Directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /findings/3 |
| **field-trip-opening-end-contradicts-return** — The opening draft assigns an 11 AM end despite the supplied 2:30 PM return | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789793713083.json) /findings/2 |
| **field-trip-page-lettering-sent-to-text-free-image-edit** — The page-lettering request is routed into a text-free hero image edit | Historical only; historical_regression_replay | [ART-02](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789793713083.json) /findings/1 |
| **field-trip-portrait-hero-geometry-observation** — The edit changes landscape artwork to portrait, then the guest hero crops it | Latest evidence; observation_requires_reproduction | [ART-02](art-contracts-plan.md), [ART-07](art-contracts-plan.md), [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /findings/6 |
| **field-trip-preview-headline-raw-prompt** — Preview headline disagrees with the correctly extracted title | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md), [CHAT-02](chat-facts-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789792236452.json) /findings/1 |
| **field-trip-preview-is-not-published-layout** — Fullscreen Event Page preview shows only artwork, hiding the eventual page design | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /findings/2 |
| **field-trip-published-hero-contrast-fails** — The published hero title is nearly black on the darkened artwork | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /findings/1 |
| **field-trip-published-packing-instructions-missing** — The published page omits the supplied water-bottle and packed-lunch instructions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /findings/0 |
| **field-trip-school-form-link-unverified** — Suggested school-form link needs a verified supported path | Historical only; observation_requires_reproduction | [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789792236452.json) /findings/3 |
| **field-trip-style-intake-returns-optional-guest-count-question** — The style-intake response reopens a guest-count question already declared optional | Historical only; observation_requires_reproduction | [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789793713083.json) /findings/5 |
| **field-trip-venue-name-overwritten** — Time-only correction removes the primary museum name | Historical only; historical_regression_replay | [CHAT-04](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789792236452.json) /findings/2 |
| **runner_finding:26c4577263564f** — appearance_edit_failed: new_generation_failed_or_missing_artifact | Historical only; infrastructure_or_operational_control | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result-before-1789793713083.json) /findings/0 |
| **runner_finding:26d447942fb29b** — harness_interaction: The style request was not found in the rendered chat | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result-before-1789794003187.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result.json) /findings/0 |
| **runner_finding:d012fbfc4d53cf** — Evidence capture: response.text: Protocol error (Network.getResponseBody): Request content was evicted from inspector cache Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation. | Historical only; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result-before-1789792839852.json) /findings/0 |
| **runner_finding:e2a5da58b388b5** — generation_failed: No real generated artwork returned | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/field_trip--event_page/result-before-1789792839852.json) /findings/1 |

## field_trip--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **field-trip-live-awkward-bus-copy** — Saved bus logistics contain mechanical wording and a redundant time range | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--live_card.json) /findings/2 |
| **field-trip-live-mobile-title-crop** — The phone creation preview cuts off Nature Museum | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--live_card.json) /findings/0 |
| **field-trip-live-supplies-gift-field** — Lunch and water instructions are stored as gifts and omitted from calendar text | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--live_card.json) /findings/1 |

## football--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-harness_interaction-72e0bf86** — harness_interaction: The style request was not found in the rendered chat | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--digital_flyer/result-before-1789794206752.json) /failure |
| **execution-journey_incomplete-cefa12e0** — appearance_edit_failed: new_generation_failed_or_missing_artifact | Historical only; execution_stop_classify_and_retest | [ART-04](art-contracts-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--digital_flyer/result-before-1789792956048.json) /failure |
| **football-address-correction-changes-category** — Address-only correction changes football into game day | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md), [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789792296373.json) /findings/1 |
| **football-arrival-home-away-not-in-generation-facts** — Acknowledged game logistics are missing from canonical generation details | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md), [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789792296373.json) /findings/0 |
| **football-canonical-start-noon** — Canonical kickoff is noon instead of the supplied 2 PM | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/0 |
| **football-flyer-address-removal-contradiction** — The baseline flyer edit instructs removal of an approved street address | Historical only; historical_regression_replay | [ART-02](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789794206752.json) /findings/1 |
| **football-flyer-download-affordance-missing** — The downloadable Flyer flow has no discoverable Download action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/8 |
| **football-flyer-schedule-format** — The rendered schedule conflates arrival wording and the end clock | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/4 |
| **football-home-away-labels-lost** — The confirmed home/away roles disappear from the Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/2 |
| **football-invented-gift-copy** — Both Flyers display an unrequested gift sentence | Latest evidence + historical; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/3 |
| **football-palette-default-conflict** — Gold category defaults compete with the requested navy/silver palette | Latest evidence + historical; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/5 |
| **football-primary-start-is-noon** — The canonical start is noon while the approved kickoff is 2 PM | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789794206752.json) /findings/2 |
| **football-published-calendar-unavailable** — Published Flyer guest view has no Calendar action | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/6 |
| **football-published-flyer-controls-cover-copy** — Published card controls obscure the complete Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/7 |
| **football-rsvp-and-team-roles-lost** — Supplied RSVP contact and away/home roles do not reach the flyer | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789794206752.json) /findings/4 |
| **football-rsvp-contact-missing-from-flyer** — The supplied RSVP contact is absent from the delivered Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /findings/1 |
| **football-style-edit-quality-rejected** — A requested appearance edit fails after repair | Historical only; historical_regression_replay | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789794206752.json) /findings/0 |
| **football-technical-schedule-copy** — Guest schedule copy mixes formats and attaches the end to the arrival sentence | Historical only; historical_regression_replay | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789794206752.json) /findings/6 |
| **football-theme-changes-on-rsvp-contact** — RSVP follow-up replaces the theme with a generic sport label | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789792296373.json) /findings/2 |
| **runner_finding:26c4577263564f** — appearance_edit_failed: new_generation_failed_or_missing_artifact | Historical only; infrastructure_or_operational_control | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--digital_flyer/result-before-1789792956048.json) /findings/0 |
| **runner_finding:26d447942fb29b** — harness_interaction: The style request was not found in the rendered chat | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--digital_flyer/result-before-1789794206752.json) /findings/0 |
| **runner_finding:389ce650bd229f** — Anonymous guest check failed: calendar | Latest evidence; raw_assertion_requires_adjudication | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--digital_flyer/result.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--digital_flyer/result.json) /findings/0 |

## football--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **football-page-arrival-and-team-roles-lost** — Football page drops arrival time and home/away roles | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--event_page.json) /findings/0 |
| **football-page-calendar-venue-loss** — Calendar exports drop the venue name | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--event_page.json) /findings/3 |
| **football-page-directions-missing** — Venue has no directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--event_page.json) /findings/2 |
| **football-page-preview-contrast** — Strong-contrast request ends with a dark heading on a dark hero | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--event_page.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--event_page/result.json) /findings/0 |

## football--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-harness_interaction-03c6da40** — locator.waitFor: Timeout 45000ms exceeded. Call log: [2m  - waiting for getByRole('button', { name: 'Essential only', exact: true }) to be visible[22m  | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--live_card/result-before-1789820126508.json) /failure |
| **football-live-arrival-home-away-lost** — Family arrival time and home/away status disappear before generation | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-03](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--live_card.json) /findings/0 |
| **football-live-mobile-preview-crops-title** — The phone creation preview cuts off both team names | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--live_card.json) /findings/1 |
| **football-live-unsupported-gift-default** — Generation injects an unsupported gift preference into a youth football game | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--live_card.json) /findings/2 |
| **runner_finding:5f5bb55caf3459** — locator.waitFor: Timeout 45000ms exceeded. Call log: [2m  - waiting for getByRole('button', { name: 'Essential only', exact: true }) to be visible[22m  | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/football--live_card/result-before-1789820126508.json) /findings/0 |

## game_day--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **game-day-download-affordance-missing** — No discoverable Download action is offered for the requested downloadable Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--digital_flyer.json) /findings/3 |
| **game-day-palette-guidance-conflict** — Category defaults add gold to the requested forest-green/cream palette | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--digital_flyer.json) /findings/2 |
| **game-day-promised-rsvp-contact-missing** — Flyer omits the RSVP contact that the assistant explicitly promised to show | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--digital_flyer.json) /findings/0 |
| **game-day-schedule-copy-format** — Flyer mixes clock formats and repeats the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--digital_flyer.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/game_day--digital_flyer/result.json) /findings/0 |

## game_day--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **game-day-event-page-directions-absent** — The published venue has no directions action | Historical only; historical_regression_replay | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page-before-1789828408357.json) /findings/2 |
| **game-day-event-page-preview-title-contrast** — The published heading is hard to read and absent from the preview | Historical only; historical_regression_replay | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page-before-1789828408357.json) /findings/1 |
| **game-day-event-page-snack-note-omitted** — The optional bring-a-snack instruction never reaches guests | Historical only; historical_regression_replay | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page-before-1789828408357.json) /findings/0 |
| **game-day-event-page-visible-planning** — The visible end time is omitted and the venue repeats | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page-before-1789828408357.json) /findings/3 |
| **game-day-page-dark-title-preview** — Image-only previews conceal the dark published heading | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page.json) /findings/2 |
| **game-day-page-edit-rejected** — Appearance edit is rejected after repair; original is published | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page.json) /findings/1 |
| **game-day-page-location-schedule-actions** — Venue repeats and visible schedule lacks its end time and directions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md), [GR04](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page.json) /findings/3 |
| **game-day-page-snack-copy-omitted** — Optional bring-a-snack note is stored but not shown to guests | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence + historical; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/game_day--event_page/result.json) /findings/1 |
| **runner_finding:9f330c013706a4** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/game_day--event_page/result.json) /findings/0 |

## game_day--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **game-day-conflicting-generation-defaults** — Game Day defaults contradict the supplied visual palette and drop contact fields from generation | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [CHAT-07](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--live_card.json) /findings/2 |
| **game-day-maps-false-negative** — The raw checker rejects the valid Room B Maps search handoff | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--live_card.json) /findings/3 |
| **game-day-mobile-preview-clipping** — The creation phone preview cuts off Neighbors and Game Day and crops spectators | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--live_card.json) /findings/0 |
| **game-day-snack-note-not-presented** — Bring a snack if you want survives as a gift preference but is absent from guest copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--live_card.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/game_day--live_card/result.json) /findings/0 |

## gender_reveal--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **gender-reveal-download-affordance-missing** — The requested downloadable Flyer has no discoverable Download action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--digital_flyer.json) /findings/4 |
| **gender-reveal-find-out-together-copy-lost** — Requested discover-together wording disappears before generation | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--digital_flyer.json) /findings/0 |
| **gender-reveal-guest-controls-cover-copy** — Published overlay controls cover the Flyer footer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--digital_flyer.json) /findings/3 |
| **gender-reveal-schedule-copy-format** — Schedule exposes mixed clock formats and a technical timezone | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--digital_flyer.json) /findings/2 |
| **gender-reveal-unrequested-gift-copy** — Both Flyers add an unrequested gift sentence | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--digital_flyer.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gender_reveal--digital_flyer/result.json) /findings/0 |

## gender_reveal--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **gender-reveal-event-page-directions-absent** — No guest directions action is rendered | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--event_page.json) /findings/3 |
| **gender-reveal-event-page-preview-contrast** — Artwork-only preview conceals a hard-to-read published headline | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--event_page.json) /findings/2 |
| **gender-reveal-event-page-purpose-wording-lost** — The promised find-out-together wording is replaced by generic event copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--event_page.json) /findings/1 |
| **gender-reveal-event-page-rsvp-impossible-guess** — Event Page RSVP requires a category answer that its form cannot collect | Latest evidence; observed_product_issue_reproduce_and_fix | [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--event_page.json) /findings/0 |
| **gender-reveal-event-page-visible-planning** — Visible details omit the end time and repeat the venue name | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--event_page.json) /findings/4 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gender_reveal--event_page/result.json) /findings/0 |

## gender_reveal--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **gender-reveal-gift-default** — A gift preference is added to generation despite unknown-details instruction | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--live_card.json) /findings/2 |
| **gender-reveal-invitation-purpose-lost** — The request to invite guests to find out together becomes private style guidance | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--live_card.json) /findings/1 |
| **gender-reveal-maps-false-negative** — The checker rejects a correct Maps search destination | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--live_card.json) /findings/3 |
| **gender-reveal-mobile-preview-clipping** — The mobile creation preview crops the headline and Morgan's name | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--live_card.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gender_reveal--live_card/result.json) /findings/0 |

## general--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **general--digital_flyer-download** — No discoverable Download Flyer action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--digital_flyer.json) /findings/2 |
| **general--digital_flyer-gift-format** — Unrequested gift copy and repetitive logistics reduce the simple gathering clarity | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--digital_flyer.json) /findings/1 |
| **general--digital_flyer-purpose-copy** — Tea-and-conversation purpose is omitted | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--digital_flyer.json) /findings/0 |

## general--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **general-calendar-loses-room-and-venue** — Calendar exports discard the corrected Room B and venue name | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--event_page.json) /findings/2 |
| **general-descriptive-copy-and-end-omitted** — The page drops neighborhood tea context and shows only the start time | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--event_page.json) /findings/1 |
| **general-directions-missing** — The Event Page provides no directions control | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--event_page.json) /findings/3 |
| **general-preview-and-contrast** — Artwork-only previews hide the low-contrast published heading | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--event_page.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/general--event_page/result.json) /findings/0 |

## general--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **general-live-gift-default** — Generation adds an unrequested gift preference | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--live_card.json) /findings/2 |
| **general-live-mobile-title-crop** — Phone creation preview clips Neighbors | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--live_card.json) /findings/1 |
| **general-live-purpose-lost** — Confirmed tea gathering becomes generic guest copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--live_card.json) /findings/0 |

## graduation--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **graduation-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--digital_flyer.json) /findings/3 |
| **graduation-exact-approved-line-missing** — Exact requested line is absent from both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--digital_flyer.json) /findings/0 |
| **graduation-guest-controls-overlap-footer** — Guest actions cover the lower gift-copy line | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--digital_flyer.json) /findings/4 |
| **graduation-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--digital_flyer.json) /findings/1 |
| **graduation-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--digital_flyer.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/graduation--digital_flyer/result.json) /findings/0 |

## graduation--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **graduation-event-page-directions-absent** — The physical venue has no directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--event_page.json) /findings/2 |
| **graduation-event-page-exact-line-lost** — The exact approved graduation line disappears after the factual reply | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--event_page.json) /findings/0 |
| **graduation-event-page-preview-title-contrast** — The actual dark-on-dark heading is concealed by artwork-only preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--event_page.json) /findings/1 |
| **graduation-event-page-visible-planning** — The page hides the confirmed end and duplicates the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--event_page.json) /findings/3 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/graduation--event_page/result.json) /findings/0 |

## graduation--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **graduation-calendar-drops-venue-room** — Calendar destinations omit the venue name and corrected room | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--live_card.json) /findings/2 |
| **graduation-exact-line-lost-after-answer** — The explicitly required line is lost after an unrelated factual answer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--live_card.json) /findings/0 |
| **graduation-initial-possessive-corrupted** — The first preview headline contains a doubled possessive | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--live_card.json) /findings/3 |
| **graduation-maps-checker-false-negative** — The Maps handoff is valid despite the raw false flag | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--live_card.json) /findings/5 |
| **graduation-preview-clips-title** — The mobile creation preview clips the word Graduation | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--live_card.json) /findings/1 |
| **graduation-unsupplied-gift-default** — The generation input adds unrequested gift wording | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--live_card.json) /findings/4 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/graduation--live_card/result.json) /findings/0 |

## gymnastics--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **gymnastics-calendar-action-missing** — Published Flyer has no Calendar action | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/1 |
| **gymnastics-canonical-start-noon** — Stored competition start is noon rather than2PM | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/0 |
| **gymnastics-combined-schedule-format** — Three promised schedule lines are compressed into one mixed-format block | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/5 |
| **gymnastics-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/7 |
| **gymnastics-guest-controls-overlap-footer** — Guest controls overlap street-address and footer copy | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/6 |
| **gymnastics-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/4 |
| **gymnastics-printed-rsvp-contact-missing** — Supplied RSVP email is absent from the Flyer artwork | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/2 |
| **gymnastics-qa-end-time-disregarded** — Q&A incorrectly suggests dropping the supplied end time | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /findings/3 |
| **runner_finding:389ce650bd229f** — Anonymous guest check failed: calendar | Latest evidence; raw_assertion_requires_adjudication | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--digital_flyer/result.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--digital_flyer/result.json) /findings/0 |

## gymnastics--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **gymnastics-event-page-canonical-noon-exported** — All calendars export noon despite the confirmed 2 PM competition start | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--event_page.json) /findings/0 |
| **gymnastics-event-page-directions-absent** — The corrected venue has no directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--event_page.json) /findings/3 |
| **gymnastics-event-page-preview-title-contrast** — Published black-on-navy headline is hidden by artwork-only preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--event_page.json) /findings/2 |
| **gymnastics-event-page-schedule-entries-incomplete** — The promised separate schedule entries and event ending are not rendered | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--event_page.json) /findings/1 |
| **gymnastics-event-page-venue-duplicated** — The published Where block repeats the venue and room | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--event_page.json) /findings/4 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--event_page/result.json) /findings/0 |

## gymnastics--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-harness_maintenance-241f63a5** — harness_maintenance: Campaign stopped before publish | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/result-before-1789794344165.json) /failure |
| **execution-journey_incomplete-2e72842b** — generation_failed: No real generated artwork returned | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/result-before-1789793062689.json) /failure |
| **gymnastics-creation-preview-title-clipped** — The phone creation preview cuts off the event title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /findings/2 |
| **gymnastics-fake-buttons-in-artwork** — Generated imitation controls are layered under real guest actions | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-03](art-contracts-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /findings/3 |
| **gymnastics-generation-date-and-schedule-format** — The generation copy loses the year and treats the whole itinerary as a start time | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789794344165.json) /findings/4 |
| **gymnastics-invented-gift-sentence-in-generation** — Generation injects a gift message into a meet whose gift details were left blank | Historical only; historical_regression_replay | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789794344165.json) /findings/2 |
| **gymnastics-labeled-schedule-not-preserved** — Warmup and awards are acknowledged but omitted from generation facts | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789792360199.json) /findings/1 |
| **gymnastics-maps-checker-false-negative** — The recorded Maps failure is a checker false negative | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /findings/6 |
| **gymnastics-mobile-preview-clips-headline** — The mobile preview crops the gymnastics headline at both horizontal edges | Historical only; historical_regression_replay | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789794344165.json) /findings/0 |
| **gymnastics-negated-birthday-becomes-category** — Explicit gymnastics request remains a birthday draft | Historical only; historical_regression_replay | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789792360199.json) /findings/0 |
| **gymnastics-palette-and-gift-defaults-conflict** — Generic game-day defaults add gold and gift wording | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /findings/5 |
| **gymnastics-primary-start-is-noon** — The canonical start remains noon instead of the supplied 2 PM competition | Latest evidence + historical; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /findings/0 |
| **gymnastics-promised-schedule-lines-not-structured** — The promised separate schedule lines remain a single time string | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /findings/4 |
| **gymnastics-published-calendar-missing** — Calendar is present in the creation preview but absent on the published card | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /findings/1 |
| **gymnastics-rsvp-contact-dropped-from-generation** — The supplied RSVP email is omitted from both generation requests | Historical only; historical_regression_replay | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789794344165.json) /findings/3 |
| **gymnastics-saved-calendar-unavailable** — Saved Live Card metadata cannot produce a calendar action | Historical only; historical_regression_replay | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789794344165.json) /findings/5 |
| **gymnastics-unsaved-progress-called-saved** — Assistant calls in-memory progress a saved draft | Historical only; historical_regression_replay | [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789792360199.json) /findings/3 |
| **gymnastics-venue-and-organizer-fragments** — Sentence fragments are accepted as venue and RSVP organizer | Historical only; historical_regression_replay | [CHAT-04](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789792360199.json) /findings/2 |
| **runner_finding:389ce650bd229f** — Anonymous guest check failed: calendar | Latest evidence; raw_assertion_requires_adjudication | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/result.json) /findings/1 |
| **runner_finding:8cc4f2ccc72763** — harness_maintenance: Campaign stopped before publish | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/result-before-1789794344165.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/result.json) /findings/0 |
| **runner_finding:d012fbfc4d53cf** — Evidence capture: response.text: Protocol error (Network.getResponseBody): Request content was evicted from inspector cache Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation. | Historical only; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/result-before-1789793062689.json) /findings/0 |
| **runner_finding:e2a5da58b388b5** — generation_failed: No real generated artwork returned | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/gymnastics--live_card/result-before-1789793062689.json) /findings/1 |

## hockey--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **hockey-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--digital_flyer.json) /findings/3 |
| **hockey-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--digital_flyer.json) /findings/1 |
| **hockey-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--digital_flyer.json) /findings/2 |
| **hockey-required-player-family-copy-missing** — Promised protective-gear and warm-layer instructions are missing | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--digital_flyer.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/hockey--digital_flyer/result.json) /findings/0 |

## hockey--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **hockey-page-dark-title-preview** — Image-only preview hides the poorly contrasted published title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--event_page.json) /findings/1 |
| **hockey-page-preparation-notes-lost** — Protective-gear and warm-layer instructions do not reach guests | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--event_page.json) /findings/0 |
| **hockey-page-venue-export** — Calendar drops venue and room and page has no directions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--event_page.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/hockey--event_page/result.json) /findings/0 |

## hockey--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-harness_interaction-fcb6bd13** — Browser generation response capture stalled after local development server errors. Owned runner stopped after every paid request settled. The incomplete generation has no archived image and is not eligible for visual quality scoring. | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/hockey--live_card/result-before-1789825753290.json) /failure |
| **hockey-live-action-label-contrast** — Guest labels sit on bright scratched ice | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--live_card.json) /findings/2 |
| **hockey-live-gift-default** — Generation substitutes gift copy for rink preparation | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--live_card.json) /findings/3 |
| **hockey-live-preparation-treated-as-style** — Required protective gear and warm-layer note remain only in styling fields | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--live_card.json) /findings/0 |
| **hockey-live-title-crop-overlap** — Preview crop and floating controls obscure the event title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--live_card.json) /findings/1 |

## housewarming--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **housewarming-flyer-request-silently-changed** — The requested Digital Flyer becomes a title-only Live Card | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-08](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--digital_flyer.json) /findings/1 |
| **housewarming-negated-door-code-false-refusal** — Do not add a door code wrongly triggers a private-account refusal | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-08](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--digital_flyer.json) /findings/0 |
| **housewarming-requested-download-unavailable** — The final flow has no discoverable downloadable Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--digital_flyer.json) /findings/2 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/housewarming--digital_flyer/result.json) /findings/0 |

## housewarming--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **housewarming-calendar-no-gifts-missing** — No-gifts instruction is absent from calendar exports | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--event_page.json) /findings/2 |
| **housewarming-mobile-preview-crops-title** — Mobile editor preview crops the enlarged title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--event_page.json) /findings/1 |
| **housewarming-negation-refusal-wrong-format** — Benign privacy constraint is refused and Event Page becomes Live Card | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-08](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--event_page.json) /findings/0 |

## housewarming--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **housewarming-live-calendar-drops-room** — All Calendar exports omit the corrected community center and Room B | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--live_card.json) /findings/1 |
| **housewarming-live-negation-refusal** — Do not add a door code incorrectly triggers a private-account refusal | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-08](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--live_card.json) /findings/0 |
| **housewarming-live-no-gifts-calendar** — No-gifts wording is retained in data but omitted from Calendar descriptions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--live_card.json) /findings/2 |

## lacrosse--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **lacrosse--digital_flyer-download** — Flyer Download is missing from inspected controls | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--digital_flyer.json) /findings/3 |
| **lacrosse--digital_flyer-equipment-lost** — Required bring list never appears | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--digital_flyer.json) /findings/1 |
| **lacrosse--digital_flyer-gift-callout** — Unrequested gift badge receives prominence instead of protected note | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--digital_flyer.json) /findings/2 |
| **lacrosse--digital_flyer-non-contact-lost** — Explicit non-contact note is absent before and after redesign | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--digital_flyer.json) /findings/0 |

## lacrosse--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **lacrosse-guest-planning-presentation** — The page omits the end/directions and repeats the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--event_page.json) /findings/2 |
| **lacrosse-non-contact-and-gear-omitted** — The promised prominent non-contact note and gear instructions are missing | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--event_page.json) /findings/0 |
| **lacrosse-preview-and-heading-contrast** — Image-only previews conceal a barely readable published headline | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--event_page.json) /findings/1 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/lacrosse--event_page/result.json) /findings/0 |

## lacrosse--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **lacrosse-live-equipment-instructions-not-guest-copy** — Stick, water and mouthguard appear as objects but not attendee instructions | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--live_card.json) /findings/1 |
| **lacrosse-live-gift-default** — Intermediate content includes gift wording instead of required note | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--live_card.json) /findings/3 |
| **lacrosse-live-non-contact-promise-unfulfilled** — Promised prominent non-contact line never appears | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md), [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--live_card.json) /findings/0 |
| **lacrosse-live-preview-crop** — Mobile creation preview cuts Lacrosse and Skills Day | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--live_card.json) /findings/2 |

## open_house--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **open_house--digital_flyer-download** — No discoverable Download Flyer action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--digital_flyer.json) /findings/2 |
| **open_house--digital_flyer-duplicated-copy** — Duplicated title/venue and mixed time formats crowd the Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--digital_flyer.json) /findings/3 |
| **open_house--digital_flyer-real-estate-rsvp** — School open house receives Property/Realtor controls instead of RSVP | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md), [GR08](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--digital_flyer.json) /findings/0 |
| **open_house--digital_flyer-school-copy-missing** — School-entry and drop-in instructions are omitted | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--digital_flyer.json) /findings/1 |
| **runner_finding:a893de7252dfcd** — Guest probe did not recognize the enabled anonymous RSVP form | Latest evidence; infrastructure_or_operational_control | [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/open_house--digital_flyer/result.json) /findings/0 |

## open_house--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/open_house--event_page/result.json) /findings/0 |
| **school-page-instructions-drop-in-lost** — School instructions and drop-in window disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--event_page.json) /findings/0 |
| **school-page-location-duplication-directions** — Location repeats the venue and offers no directions | Latest evidence; observed_product_issue_reproduce_and_fix | [GR04](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--event_page.json) /findings/2 |
| **school-page-title-preview-contrast** — Published school heading is dark on dark and absent from preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--event_page.json) /findings/1 |

## open_house--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **open-house-maps-checker-false-negative** — Directions handoff exists despite the checker reporting false | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--live_card.json) /findings/4 |
| **open-house-mobile-preview-crops-title** — Mobile fullscreen preview clips the title on both sides | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--live_card.json) /findings/3 |
| **open-house-purpose-lost-and-end-window-hidden** — School purpose and visible drop-in window do not reach the saved detail copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--live_card.json) /findings/2 |
| **open-house-request-contract-contradiction** — Generation instructions demand real-estate marketing despite the school brief | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [GR08](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--live_card.json) /findings/1 |
| **open-house-school-routed-to-property** — School open house uses real-estate controls and suppresses the normal RSVP flow | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md), [GR08](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--live_card.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/open_house--live_card/result.json) /findings/1 |
| **runner_finding:a893de7252dfcd** — Guest probe did not recognize the enabled anonymous RSVP form | Latest evidence; infrastructure_or_operational_control | [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/open_house--live_card/result.json) /findings/0 |

## soccer--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **soccer--digital_flyer-contact-loss** — Coach and RSVP contact are not printed | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--digital_flyer.json) /findings/1 |
| **soccer--digital_flyer-download** — Requested downloadable Flyer has no Download action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--digital_flyer.json) /findings/3 |
| **soccer--digital_flyer-gift-and-overlay** — Invented gift copy collides with guest action bar | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--digital_flyer.json) /findings/2 |
| **soccer--digital_flyer-required-equipment** — Required shin guards and water disappear from final flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--digital_flyer.json) /findings/0 |

## soccer--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/soccer--event_page/result.json) /findings/0 |
| **soccer-planning-presentation** — The guest page omits the end/directions and repeats the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--event_page.json) /findings/2 |
| **soccer-preview-and-hero-contrast** — The image-only preview hides the published low-contrast headline | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--event_page.json) /findings/1 |
| **soccer-required-gear-note-not-rendered** — Required shin guards and water never reach the guest page | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--event_page.json) /findings/0 |

## soccer--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **soccer-live-equipment-note-misfiled** — Required shin guards and water are kept as gift preference and omitted from Calendar | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--live_card.json) /findings/1 |
| **soccer-live-opening-title-drift** — Opening confirmation rewrites the supplied Match title | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--live_card.json) /findings/2 |
| **soccer-live-preview-crop** — Creation phone preview cuts both title lines | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--live_card.json) /findings/0 |

## softball--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/softball--digital_flyer/result.json) /findings/0 |
| **softball-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--digital_flyer.json) /findings/4 |
| **softball-guest-controls-overlap-footer** — Guest controls cover the RSVP email and lower copy | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--digital_flyer.json) /findings/3 |
| **softball-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--digital_flyer.json) /findings/1 |
| **softball-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--digital_flyer.json) /findings/2 |
| **softball-team-and-equipment-copy-missing** — Confirmed team name and equipment instructions disappear from the Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--digital_flyer.json) /findings/0 |

## softball--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/softball--event_page/result.json) /findings/0 |
| **softball-page-calendar-location** — Calendar omits venue and room while page has no directions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--event_page.json) /findings/2 |
| **softball-page-dark-heading-preview** — Dark published title is hidden from image-only preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--event_page.json) /findings/1 |
| **softball-page-team-equipment-lost** — Maple Comets and equipment instructions disappear from guest content | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--event_page.json) /findings/0 |

## softball--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **softball-live-action-label-legibility** — White action labels blend into bright chalk and ground | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--live_card.json) /findings/2 |
| **softball-live-gift-default** — Intermediate invitation adds unsolicited gift wording | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--live_card.json) /findings/3 |
| **softball-live-preview-crop** — Creation phone preview cuts Softball and Team Practice | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--live_card.json) /findings/1 |
| **softball-live-team-and-equipment-lost** — Maple Comets and equipment instructions are not retained | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--live_card.json) /findings/0 |

## special_event--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:2250a7944ae02c** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/special_event--digital_flyer/result.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/special_event--digital_flyer/result.json) /findings/1 |
| **special-event-download-affordance-missing** — No discoverable Download action is offered | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--digital_flyer.json) /findings/4 |
| **special-event-invented-gift-copy** — An unrequested gift sentence replaces scarce copy space | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--digital_flyer.json) /findings/2 |
| **special-event-logistics-format** — Visible date/time and location copy remain unnecessarily dense | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--digital_flyer.json) /findings/3 |
| **special-event-required-safety-copy-missing** — Published Flyer omits the explicitly required battery-only/no-flames instruction | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--digital_flyer.json) /findings/0 |
| **special-event-safety-copy-edit-contract-conflict** — An edit candidate with the required safety line conflicts with expected-copy validation | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [ART-03](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md), [CHAT-06](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--digital_flyer.json) /findings/1 |

## special_event--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **lantern-page-dark-title-preview** — Image-only preview hides the dark published heading | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--event_page.json) /findings/2 |
| **lantern-page-edit-rejected** — Appearance edit is rejected and the original is published | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--event_page.json) /findings/1 |
| **lantern-page-guest-location-loss** — Calendar omits venue and room; page has no directions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--event_page.json) /findings/3 |
| **lantern-page-safety-notice-lost** — Promised prominent safety notice is absent from the page | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--event_page.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/special_event--event_page/result.json) /findings/1 |
| **runner_finding:f5e1c6d8c51aa6** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/special_event--event_page/result.json) /findings/0 |

## special_event--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **special-live-calendar-room-omission** — Calendar exports discard the confirmed center and Room B | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--live_card.json) /findings/1 |
| **special-live-gift-default** — Generation inserts unsolicited gift wording instead of required safety copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--live_card.json) /findings/3 |
| **special-live-mobile-title-crop** — Phone creation preview clips Lantern Evening | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--live_card.json) /findings/2 |
| **special-live-safety-not-canonical** — Safety instruction reaches the final raster but remains absent from canonical guest text | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--live_card.json) /findings/0 |

## sport_event--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **sport_event--digital_flyer-contact-dropped** — Supplied RSVP contact is lost before Flyer generation | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--digital_flyer.json) /findings/1 |
| **sport_event--digital_flyer-download** — Requested downloadable Flyer has no discoverable Download action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--digital_flyer.json) /findings/3 |
| **sport_event--digital_flyer-gift-copy** — Unrequested gift copy is printed on the sports Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--digital_flyer.json) /findings/2 |
| **sport_event--digital_flyer-logistics-format** — Dense logistics mix clock formats and duplicate the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--digital_flyer.json) /findings/4 |
| **sport_event--digital_flyer-lost-stations-and-placeholder** — Activity instructions are replaced by a draft placeholder | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--digital_flyer.json) /findings/0 |

## sport_event--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:0e10a5fe4128b9** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/sport_event--event_page/result.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/sport_event--event_page/result.json) /findings/1 |
| **sport-event-appearance-edit-fails** — The requested appearance edit fails after the built-in repair attempt | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--event_page.json) /findings/1 |
| **sport-event-missing-directions** — The full Event Page has no directions action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--event_page.json) /findings/4 |
| **sport-event-preview-and-hero-contrast** — Artwork-only previews hide the published page's low-contrast heading | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--event_page.json) /findings/2 |
| **sport-event-station-and-preparation-details-lost** — The page replaces the supplied skills-afternoon details with generic Game Day copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--event_page.json) /findings/0 |
| **sport-event-visible-schedule-and-location-format** — Visible planning details omit the end time and duplicate the venue | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--event_page.json) /findings/3 |

## sport_event--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **sport-live-extra-sports-and-overlay** — Artwork adds unrequested sports and published top controls cover lettering | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--live_card.json) /findings/2 |
| **sport-live-gift-default** — Sports generation injects unsupported gift wording | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--live_card.json) /findings/3 |
| **sport-live-mobile-cropped-title** — The creation phone preview clips every title line | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--live_card.json) /findings/1 |
| **sport-live-station-instructions-lost** — Named stations, bring-water and no-experience-needed instructions disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-02](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--live_card.json) /findings/0 |

## swimming--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:389ce650bd229f** — Anonymous guest check failed: calendar | Latest evidence; raw_assertion_requires_adjudication | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/swimming--digital_flyer/result.json) /findings/0 |
| **swimming--digital_flyer-calendar-missing** — Dated swim Flyer has no guest Calendar action | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--digital_flyer.json) /findings/1 |
| **swimming--digital_flyer-canonical-noon** — Correct visible swim times coexist with a noon canonical start | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--digital_flyer.json) /findings/0 |
| **swimming--digital_flyer-download** — Download Flyer is not available in inspected flow | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--digital_flyer.json) /findings/4 |
| **swimming--digital_flyer-gift-and-schedule-format** — Unrequested gift copy and raw schedule formatting remain | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--digital_flyer.json) /findings/3 |
| **swimming--digital_flyer-preparation-lost** — Goggles, towel and water instructions disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--digital_flyer.json) /findings/2 |

## swimming--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/swimming--event_page/result.json) /findings/0 |
| **swimming-canonical-start-noon-exported** — Calendar exports start at noon despite 1 PM warmup and 2 PM meet start | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--event_page.json) /findings/0 |
| **swimming-equipment-and-lane-note-lost** — The page omits goggles, towel, water and the unavailable-lanes note | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--event_page.json) /findings/1 |
| **swimming-planning-presentation** — The page hides the end time, repeats the venue and has no directions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--event_page.json) /findings/3 |
| **swimming-preview-and-contrast** — The complete-page preview is missing and the published title lacks contrast | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--event_page.json) /findings/2 |

## swimming--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:389ce650bd229f** — Anonymous guest check failed: calendar | Latest evidence; raw_assertion_requires_adjudication | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/swimming--live_card/result.json) /findings/0 |
| **swim-live-gear-instructions-lost** — Goggles, towel and water instructions disappear from guest copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--live_card.json) /findings/1 |
| **swim-live-gift-default** — Generated copy adds an unsolicited gift preference | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--live_card.json) /findings/3 |
| **swim-live-mobile-preview-title-crop** — Phone creation preview cuts Swim Team and Family Meet | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--live_card.json) /findings/2 |
| **swim-live-multi-time-normalization-calendar-missing** — Warmup/meet schedule produces a noon canonical start and no published Calendar action | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--live_card.json) /findings/0 |

## tennis--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **tennis--digital_flyer-assignment-language** — Assistant introduces an unconfirmed future assignment plan | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--digital_flyer.json) /findings/3 |
| **tennis--digital_flyer-contact-loss** — Confirmed Coach Alex contact is absent from Flyer image | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--digital_flyer.json) /findings/1 |
| **tennis--digital_flyer-download** — No Flyer Download action in inspected flow | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--digital_flyer.json) /findings/4 |
| **tennis--digital_flyer-equipment-copy** — Racket and water instructions are lost | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--digital_flyer.json) /findings/0 |
| **tennis--digital_flyer-gift-and-format** — Unrequested gift text and cramped logistics reduce readiness | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--digital_flyer.json) /findings/2 |

## tennis--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/tennis--event_page/result.json) /findings/0 |
| **tennis-page-calendar-location** — Calendar loses venue and room and no directions action is available | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--event_page.json) /findings/2 |
| **tennis-page-preparation-copy-lost** — Beginner welcome and equipment instructions are replaced by generic Game Day copy | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--event_page.json) /findings/0 |
| **tennis-page-title-preview** — Published dark title lacks contrast and is not represented in preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--event_page.json) /findings/1 |

## tennis--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/tennis--live_card/result.json) /findings/0 |
| **tennis-display-range-truncated** — Guest summary retains only the start time despite a known end time | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--live_card.json) /findings/3 |
| **tennis-generation-default-conflicts** — Default generation fields conflict with the user's palette and supplied contacts | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [CHAT-07](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--live_card.json) /findings/2 |
| **tennis-maps-checker-false-negative** — Maps search destination is correct despite raw false status | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--live_card.json) /findings/4 |
| **tennis-phone-preview-crops-heading** — Mobile fullscreen creation preview clips Beginner and Afternoon | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--live_card.json) /findings/1 |
| **tennis-preparation-copy-lost** — Racket-and-water guidance is lost after being acknowledged | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--live_card.json) /findings/0 |

## track_field--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/track_field--digital_flyer/result.json) /findings/0 |
| **track-field-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--digital_flyer.json) /findings/3 |
| **track-field-guest-title-obstructed** — Guest Share and Close controls overlap the Flyer title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--digital_flyer.json) /findings/4 |
| **track-field-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--digital_flyer.json) /findings/1 |
| **track-field-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--digital_flyer.json) /findings/2 |
| **track-field-required-activities-equipment-missing** — The promised activity list and equipment instructions never reach the Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--digital_flyer.json) /findings/0 |

## track_field--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/track_field--event_page/result.json) /findings/0 |
| **track-page-activities-instructions-lost** — Promised sprint and long-jump list and equipment instructions disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--event_page.json) /findings/0 |
| **track-page-duplicated-venue** — On-page venue repeats and no directions action is provided | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--event_page.json) /findings/2 |
| **track-page-title-preview** — Near-black heading on dark track is hidden from image-only preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--event_page.json) /findings/1 |

## track_field--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-journey_incomplete-2e72842b** — generation_failed: No real generated artwork returned | Historical only; execution_stop_classify_and_retest | [ART-04](art-contracts-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/track_field--live_card/result-before-1789828535478.json) /failure |
| **runner_finding:e2a5da58b388b5** — generation_failed: No real generated artwork returned | Historical only; infrastructure_or_operational_control | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/track_field--live_card/result-before-1789828535478.json) /findings/0 |
| **track-live-activities-and-equipment-lost** — Promised activity list and equipment reminders do not reach generation content | Historical only; historical_regression_replay | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card-before-1789828535478.json) /findings/2 |
| **track-live-initial-generation-rejected** — No usable card is delivered after generation and repair | Historical only; historical_regression_replay | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card-before-1789828535478.json) /findings/0 |
| **track-live-rejected-candidate-logistics-strip** — Rejected candidate prints a footer strip of logistics contrary to its image contract | Historical only; historical_regression_replay | [ART-03](art-contracts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card-before-1789828535478.json) /findings/1 |
| **track-retry-activities-equipment-lost** — Promised activity and bring-list text is absent from the delivered card data | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card.json) /findings/0 |
| **track-retry-calendar-room-loss** — Calendar exports omit the corrected center and Room B | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card.json) /findings/1 |
| **track-retry-gift-default** — Intermediate copy adds unsolicited gift wording | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card.json) /findings/3 |
| **track-retry-preview-crop** — Phone creation preview clips Track and Field | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card.json) /findings/2 |

## volleyball--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **volleyball--digital_flyer-contact-loss** — RSVP contact in draft is missing from artwork | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-10](chat-facts-plan.md), [GR07](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--digital_flyer.json) /findings/1 |
| **volleyball--digital_flyer-download** — Download Flyer remains absent | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--digital_flyer.json) /findings/4 |
| **volleyball--digital_flyer-gift-copy** — Unrequested gift sentiment is added to sports practice | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--digital_flyer.json) /findings/3 |
| **volleyball--digital_flyer-guest-overlay** — Published guest buttons obscure location text | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--digital_flyer.json) /findings/2 |
| **volleyball--digital_flyer-missing-indoor-equipment** — Promised indoor wording and required equipment are omitted | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--digital_flyer.json) /findings/0 |

## volleyball--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:2e7c5787e42707** — Requested appearance edit was rejected after the app's repair attempt; downstream checks continue with the original artwork. | Latest evidence; raw_assertion_requires_adjudication | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/volleyball--event_page/result.json) /findings/0 |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/volleyball--event_page/result.json) /findings/1 |
| **volleyball-page-dark-title-preview** — Image-only previews conceal poorly contrasted published heading | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--event_page.json) /findings/2 |
| **volleyball-page-edit-rejected** — Requested visual edit fails and original is published | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-02](art-contracts-plan.md), [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--event_page.json) /findings/1 |
| **volleyball-page-indoor-equipment-lost** — Promised indoor practice wording and equipment notes are replaced by Game Day | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--event_page.json) /findings/0 |
| **volleyball-page-location-export** — Calendar omits venue name and page offers no directions | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--event_page.json) /findings/3 |

## volleyball--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/volleyball--live_card/result.json) /findings/0 |
| **volleyball-end-display-missing** — Known end time is absent from the display summary | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--live_card.json) /findings/3 |
| **volleyball-equipment-copy-lost** — Promised footwear and knee-pad instructions never reach the finished card | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--live_card.json) /findings/0 |
| **volleyball-generation-defaults-conflict** — Category defaults contradict the requested practice/palette and blank facts | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [CHAT-07](chat-facts-plan.md), [CHAT-10](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--live_card.json) /findings/2 |
| **volleyball-maps-checker-false-negative** — Correct Maps search handoff is rejected by the checker | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--live_card.json) /findings/4 |
| **volleyball-preview-crops-text** — The phone creation preview crops Volleyball and Open Practice | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--live_card.json) /findings/1 |

## wedding--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_requires_adjudication | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/wedding--digital_flyer/result.json) /findings/0 |
| **wedding-download-affordance-missing** — No discoverable Download action for the requested Flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--digital_flyer.json) /findings/4 |
| **wedding-dress-code-and-event-guidance-missing** — Garden-formal dress code and ceremony/reception guidance are omitted | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--digital_flyer.json) /findings/0 |
| **wedding-guest-controls-overlap-footer** — Guest controls overlap the lower Flyer copy | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--digital_flyer.json) /findings/3 |
| **wedding-invented-gift-copy** — Unrequested gift wording appears on both Flyers | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--digital_flyer.json) /findings/1 |
| **wedding-logistics-format** — Dense logistics use mixed time formats and repeated venue | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-06](art-contracts-plan.md), [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--digital_flyer.json) /findings/2 |

## wedding--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/wedding--event_page/result.json) /findings/0 |
| **wedding-event-page-dress-code-dropped** — Garden formal is acknowledged but omitted from the generated event contract and calendars | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--event_page.json) /findings/1 |
| **wedding-event-page-replaced-by-live-card** — An explicit Event Page request is published as a Live Card | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--event_page.json) /findings/0 |
| **wedding-map-query-checker-false-negative** — The harness rejects a valid captured Maps search query | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--event_page.json) /findings/2 |

## wedding--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/wedding--live_card/result.json) /findings/0 |
| **wedding-creation-preview-crops-flourishes** — The creation preview crops the outer name flourishes | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--live_card.json) /findings/3 |
| **wedding-garden-formal-not-delivered** — The confirmed garden-formal dress code disappears from event details | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--live_card.json) /findings/0 |
| **wedding-maps-checker-false-negative** — The Maps search destination is valid despite the raw failed flag | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--live_card.json) /findings/5 |
| **wedding-opening-venue-and-identity-lost** — The opening draft replaces the real venue with an anaphoric phrase | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--live_card.json) /findings/1 |
| **wedding-shared-ceremony-reception-context-lost** — The shared ceremony-and-reception context is not retained in guest details | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-01](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--live_card.json) /findings/2 |
| **wedding-unsupplied-gift-line** — Generation inserts an unrequested gift message | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--live_card.json) /findings/4 |

## workshop--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **workshop--digital_flyer-download** — No discoverable Download action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--digital_flyer.json) /findings/4 |
| **workshop--digital_flyer-eligibility-materials** — Adult eligibility, age13+ and materials-provided details disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--digital_flyer.json) /findings/1 |
| **workshop--digital_flyer-gift-overlay** — Unrequested gift wording is added and then obscured by guest controls | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--digital_flyer.json) /findings/3 |
| **workshop--digital_flyer-saved-claim** — Assistant calls the unsaved draft saved | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-09](chat-facts-plan.md), [GR10](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--digital_flyer.json) /findings/2 |
| **workshop--digital_flyer-wrong-title-honoree** — Supplied workshop title becomes Workshop draft and Teens | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--digital_flyer.json) /findings/0 |

## workshop--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-journey_incomplete-bd930766** — Invalid intake response | Historical only; execution_stop_classify_and_retest | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/workshop--event_page/result-before-1789828236729.json) /failure |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/workshop--event_page/result.json) /findings/0 |
| **runner_finding:beabf78122d243** — Invalid intake response | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/workshop--event_page/result-before-1789828236729.json) /findings/0 |
| **workshop-age-range-person-metadata** — Audience age becomes a person and milestone | Historical only; historical_regression_replay | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page-before-1789828236729.json) /findings/1 |
| **workshop-page-audience-materials-omitted** — Age eligibility and provided materials disappear from the guest page | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [CHAT-02](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page.json) /findings/1 |
| **workshop-page-dark-title-preview** — Image-only previews hide the poorly contrasted published title | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page.json) /findings/2 |
| **workshop-page-location-schedule-actions** — Venue is duplicated, Directions is missing and visible schedule omits the end | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [CHAT-04](chat-facts-plan.md), [GR04](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page.json) /findings/3 |
| **workshop-page-placeholder-title-persists** — Published title stays Workshop draft despite an explicit promise to fix it | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md), [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page.json) /findings/0 |
| **workshop-style-intake-503** — Style edit blocked by an intake transport failure | Historical only; infrastructure_or_operational_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page-before-1789828236729.json) /findings/2 |
| **workshop-supplied-title-not-applied** — Supplied workshop name remains Workshop draft | Historical only; historical_regression_replay | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page-before-1789828236729.json) /findings/0 |

## workshop--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/workshop--live_card/result.json) /findings/0 |
| **workshop-audience-and-materials-misfiled** — Eligibility becomes an honoree while materials information is treated as private styling | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-01](art-contracts-plan.md), [ART-05](art-contracts-plan.md), [CHAT-02](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--live_card.json) /findings/1 |
| **workshop-end-display-start-only** — The promised 2–4 PM window is reduced to a start-only display | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-03](chat-facts-plan.md), [GR04](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--live_card.json) /findings/3 |
| **workshop-maps-checker-false-negative** — Directions checker rejects a valid captured Google Maps search URL | Latest evidence; corrected_checker_result_preserve_control | [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--live_card.json) /findings/5 |
| **workshop-mobile-preview-crop** — Phone creation preview crops Workshop lettering at both edges | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--live_card.json) /findings/2 |
| **workshop-placeholder-title-published** — A supplied event title is replaced by 'Workshop draft' through publication | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-02](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--live_card.json) /findings/0 |
| **workshop-unrequested-gift-default** — An unsupplied gift message is inserted into generation metadata | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--live_card.json) /findings/4 |

## wrestling--digital_flyer

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **wrestling--digital_flyer-download** — No discoverable Download Flyer action | Latest evidence; observed_product_issue_reproduce_and_fix | [GR09](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--digital_flyer.json) /findings/3 |
| **wrestling--digital_flyer-gift-copy** — Unrequested gift sentiment is inserted into practice flyer | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--digital_flyer.json) /findings/1 |
| **wrestling--digital_flyer-mobile-overlap** — Guest controls overlap heading and footer copy | Latest evidence; observed_product_issue_reproduce_and_fix | [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--digital_flyer.json) /findings/2 |
| **wrestling--digital_flyer-practice-instructions** — Supervision and preparation instructions disappear | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--digital_flyer.json) /findings/0 |

## wrestling--event_page

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **runner_finding:9d76037322492d** — Anonymous guest check failed: directions | Latest evidence; raw_assertion_corroborated_by_review | [GR06](guest-release-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/wrestling--event_page/result.json) /findings/0 |
| **wrestling-page-dark-title-preview** — Dark published heading is barely legible and absent from preview | Latest evidence; observed_product_issue_reproduce_and_fix | [GR02](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--event_page.json) /findings/1 |
| **wrestling-page-practice-instructions-lost** — Supervised-practice and preparation details never reach guests | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--event_page.json) /findings/0 |
| **wrestling-page-venue-duplication** — On-page venue repeats and no directions action is available | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR04](guest-release-plan.md), [GR06](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--event_page.json) /findings/2 |

## wrestling--live_card

| Finding / observation | Scope and disposition | Work packages | Source |
| --- | --- | --- | --- |
| **execution-journey_incomplete-2e72842b** — generation_failed: No real generated artwork returned | Historical only; execution_stop_classify_and_retest | [ART-04](art-contracts-plan.md), [GR11](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/wrestling--live_card/result-before-1789828848251.json) /failure |
| **runner_finding:e2a5da58b388b5** — generation_failed: No real generated artwork returned | Historical only; infrastructure_or_operational_control | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/cases/wrestling--live_card/result-before-1789828848251.json) /findings/0 |
| **wrestling-candidate-faux-controls** — The unaccepted candidate includes a fake Calendar/Clock/Location bar | Historical only; historical_regression_replay | [ART-03](art-contracts-plan.md), [GR03](guest-release-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card-before-1789828848251.json) /findings/1 |
| **wrestling-error-wording-first-generation** — First-generation error incorrectly refers to requested visual changes | Historical only; historical_regression_replay | [ART-04](art-contracts-plan.md), [CHAT-09](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card-before-1789828848251.json) /findings/3 |
| **wrestling-initial-generation-quality-failure** — Initial artwork generation fails after repair and blocks the requested Live Card | Historical only; historical_regression_replay | [ART-04](art-contracts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card-before-1789828848251.json) /findings/0 |
| **wrestling-practical-copy-private-style** — Equipment instructions are treated as private visual notes | Historical only; historical_regression_replay | [ART-01](art-contracts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card-before-1789828848251.json) /findings/2 |
| **wrestling-retry-calendar-room-loss** — Calendar omits the corrected community center and Room B | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-04](chat-facts-plan.md), [GR05](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card.json) /findings/1 |
| **wrestling-retry-gift-default** — Generation introduces an unsolicited gift message | Latest evidence; observed_product_issue_reproduce_and_fix | [CHAT-07](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card.json) /findings/3 |
| **wrestling-retry-phone-crop** — Creation phone preview clips Wrestling and Technique Session | Latest evidence; observed_product_issue_reproduce_and_fix | [GR01](guest-release-plan.md), [GR03](guest-release-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card.json) /findings/2 |
| **wrestling-retry-supervision-bring-copy** — Supervision and bring-list text is retained only as design guidance | Latest evidence; observed_product_issue_reproduce_and_fix | [ART-05](art-contracts-plan.md), [CHAT-01](chat-facts-plan.md), [CHAT-05](chat-facts-plan.md) | [evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card.json) /findings/0 |

## Narrative engineering diagnostics

These four additional entries preserve diagnostic/verification notes outside the structured finding arrays. They are not added to the 584 case/finding count and are not asserted to still exist on the current checkout.

- **ENG-01: Historical TS2305: LucideIcon import/export mismatch** — historical_diagnostic_requires_fresh_reproduction. Reproduce on the isolated baseline; repair the concrete icon type import/export if still failing and typecheck all affected consumers. Owner: REL-01/REL-03. [Source](../../../docs/qa/create-campaign-image-edit-findings.md).
- **ENG-02: Historical TS2322: url field missing from configuration type union** — historical_diagnostic_requires_fresh_reproduction. Reproduce, align supported field types and actual renderer behavior, then typecheck and exercise URL fields. Owner: REL-01/REL-03. [Source](../../../docs/qa/create-campaign-image-edit-findings.md).
- **ENG-03: Editor diagnostics bridge unavailable during the historical address fix** — verification_gap_not_product_bug. Attempt the editor diagnostics tool on the frozen baseline; if unavailable, record that limitation and require independent compiler/lint evidence without claiming the editor check ran. Owner: REL-01/REL-03. [Source](../../../docs/qa/create-campaign-image-edit-findings.md).
- **ENG-04: Existing optional-chain lint warning in studio-workspace-builders.ts** — historical_nonblocking_lint_warning_not_confirmed_product_bug. Recheck current lint; resolve under the affected-file cleanup if present or record disappearance with exact revision. Do not count a warning as a functional campaign failure. Owner: REL-01/REL-03. [Source](../../../docs/qa/create-campaign-image-edit-findings.md).