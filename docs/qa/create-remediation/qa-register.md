# Q&A regression register

All 117 assertions from current and historical reviews are retained. Positive answers are regression requirements, not new defect claims. Owners: CHAT-09 and REL-02, with the corresponding capability/renderer work package when needed.

## QA-001 — anniversary--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--digital_flyer.json) /qaResults/0

**Question:** Can the page show the vow renewal and dinner as two different locations without mixing up the times?

**Recorded answer:** Yes. An Event Page is the clearest fit: it can present a schedule with separate entries for the vow renewal, 2:00–6:30 PM at Maple Community Center, Room A, and dinner at 5:00 PM at Example Garden Room, each with its own address. That avoids implying both events occur at one venue.

Your current Flyer/Invitation can still be designed with the same clearly labeled two-location schedule, but it is a single piece of artwork rather than a full guest-facing page.

**Expected:** Keep the two supplied locations and times distinct and preserve the anniversary milestone.

**Recorded verdict:** partially correct capability explanation; supplied-fact handling fails

## QA-002 — anniversary--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page-before-1789792444404.json) /qaResults/0

**Question:** Can the page show the vow renewal and dinner as two different locations without mixing up the times?

**Recorded answer:** undefined

**Expected:** See original review.

**Recorded verdict:** correct_capability_but_state_not_preserved

## QA-003 — anniversary--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page-before-1789794472489.json) /qaResults/0

**Question:** Can the page show the vow renewal and dinner as two different locations without mixing up the times?

**Recorded answer:** undefined

**Expected:** See original review.

**Recorded verdict:** correct_capability_but_state_not_preserved

## QA-004 — anniversary--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page-before-1789795211793.json) /qaResults/0

**Question:** Can the page show the vow renewal and dinner as two different locations without mixing up the times?

**Recorded answer:** undefined

**Expected:** See original review.

**Recorded verdict:** correct_capability_but_state_not_preserved

## QA-005 — anniversary--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--event_page.json) /qaResults/0

**Question:** Can the page show the vow renewal and dinner as two different locations without mixing up the times?

**Recorded answer:** Yes. An event page can present a clear schedule with separate entries: Vow Renewal at 2:00 PM at Maple Community Center, Room A, followed by Dinner at 5:00 PM at Example Garden Room, ending at 6:30 PM. That format is the best fit for keeping the two locations and times distinct.

**Expected:** Keep the two supplied locations and times distinct, including the 5 PM dinner.

**Recorded verdict:** correct_capability_not_realized

## QA-006 — anniversary--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/anniversary--live_card.json) /qaResults/0

**Question:** Can the page show the vow renewal and dinner as two different locations without mixing up the times?

**Recorded answer:** The assistant promises Vow Renewal at 2 PM, Dinner at 5 PM and 6:30 PM overall end.

**Expected:** Two labeled locations retain their specific times and the primary overall range.

**Recorded verdict:** failed

## QA-007 — appointment--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--digital_flyer.json) /qaResults/0

**Question:** Does this create a booking in my photographer's calendar automatically?

**Recorded answer:** No. This creates invitation artwork only; it does not automatically book time on a photographer’s calendar or connect to a scheduling system.

For this confirmed Rivera family session, the simplest approach is to use the flyer as an appointment reminder and keep the calendar booking managed separately.

**Expected:** Do not claim an external booking or calendar write occurred; explain available calendar actions.

**Recorded verdict:** Correct on automatic booking, incomplete on calendar options

## QA-008 — appointment--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--event_page.json) /qaResults/0

**Question:** Does this create a booking in my photographer's calendar automatically?

**Recorded answer:** No. The event page does not create or sync a booking in your photographer’s calendar automatically. It can show the confirmed appointment details and offer calendar actions for viewers, but the photographer’s calendar booking needs to be managed separately.

**Expected:** Do not claim an external booking or calendar write occurred; explain available calendar actions.

**Recorded verdict:** correct

## QA-009 — appointment--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/appointment--live_card.json) /qaResults/0

**Question:** Does this create a booking in my photographer's calendar automatically?

**Recorded answer:** No. A live card only presents the confirmed appointment details; it does not create or sync a booking in your photographer’s calendar.

For this one Rivera family session, treat the card as a clear appointment confirmation and add the September 23, 2026, 2:00–3:00 PM session to the photographer’s calendar separately.

**Expected:** Do not claim an external booking or calendar write occurred; explain available calendar actions.

**Recorded verdict:** passed

## QA-010 — baby_shower--digital_flyer

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer-before-1789794602945.json) /qaResults/0

**Question:** Can the flyer keep both English and Spanish wording exactly as I give it?

**Recorded answer:** undefined

**Expected:** See original review.

**Recorded verdict:** correct_for_captured_text_state

## QA-011 — baby_shower--digital_flyer

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer-before-1789795211817.json) /qaResults/0

**Question:** Can the flyer keep both English and Spanish wording exactly as I give it?

**Recorded answer:** undefined

**Expected:** See original review.

**Recorded verdict:** correct_for_captured_text_state

## QA-012 — baby_shower--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--digital_flyer.json) /qaResults/0

**Question:** Can the flyer keep both English and Spanish wording exactly as I give it?

**Recorded answer:** Yes. The flyer can preserve both English and Spanish wording exactly as you provide it, including:

“A little sunshine is on the way”
“Un rayito de sol viene en camino”

I’ll keep the bilingual text readable and unchanged in the artwork.

**Expected:** Preserve both supplied language lines exactly; do not invent a translation, registry, or baby's sex.

**Recorded verdict:** correct

## QA-013 — baby_shower--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--event_page.json) /qaResults/0

**Question:** Can the flyer keep both English and Spanish wording exactly as I give it?

**Recorded answer:** Yes. A flyer can preserve both English and Spanish lines exactly as you provide them, including:

“A little sunshine is on the way”
“Un rayito de sol viene en camino”

For this event, I’d keep them as separate, equally prominent lines for clear bilingual reading.

**Expected:** Preserve both supplied language lines exactly; do not invent a translation, registry, or baby's sex.

**Recorded verdict:** partial

## QA-014 — baby_shower--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baby_shower--live_card.json) /qaResults/0

**Question:** Can the flyer keep both English and Spanish wording exactly as I give it?

**Recorded answer:** The assistant says yes and clarifies that the selected format is Live Card; the same exact-copy approach can apply to a flyer.

**Expected:** Retain both exact lines without changing the selected output just because a capability question mentions another format.

**Recorded verdict:** passed_wording_with_preview_readability_failure

## QA-015 — baseball--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--digital_flyer.json) /qaResults/0

**Question:** Can I include equipment instructions without creating a fake game opponent?

**Recorded answer:** Yes. Include a simple “Bring a glove and water” line under clinic details, and describe it as throwing and fielding practice. No opponent, game matchup, or score needs to appear.

**Expected:** Preserve clinic intent, equipment, and age range without invented match facts.

**Recorded verdict:** Partially fulfilled: exclusions honored, required equipment omitted

## QA-016 — baseball--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--event_page.json) /qaResults/0

**Question:** Can I include equipment instructions without creating a fake game opponent?

**Recorded answer:** Yes. We can include a “What to Bring” section telling players ages 10–12 to bring a glove and water, plus a clinic overview for throwing and fielding practice. It will stay clearly framed as a skills clinic, with no opponent, matchup, or score.

**Expected:** Preserve clinic intent, equipment, and age range without invented match facts.

**Recorded verdict:** partially_correct_but_unfulfilled

## QA-017 — baseball--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/baseball--live_card.json) /qaResults/0

**Question:** Can I include equipment instructions without creating a fake game opponent?

**Recorded answer:** Yes. The Live card can clearly say: “Players ages 10–12: please bring a glove and water. We’ll focus on throwing and fielding skills.” I’d keep it framed as a clinic rather than a game, with no opponent or score mentioned.

**Expected:** Retain supplied equipment/eligibility/practice details without fabricating an opponent or score.

**Recorded verdict:** partial_no_fabrication_but_instruction_delivery_failed

## QA-018 — basketball--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--digital_flyer.json) /qaResults/0

**Question:** Can I mark this as a scrimmage so parents do not mistake it for a league game?

**Recorded answer:** Yes — it’s clearly marked as “Cedar Hawks Basketball Scrimmage,” and I’ll add “Practice Scrimmage — Not a League Final” so parents won’t mistake it for a league game.

**Expected:** Retain scrimmage wording and do not invent league standings or scores.

**Recorded verdict:** Partially fulfilled

## QA-019 — basketball--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--event_page.json) /qaResults/0

**Question:** Can I mark this as a scrimmage so parents do not mistake it for a league game?

**Recorded answer:** Yes — it’s clearly labeled “Cedar Hawks Basketball Scrimmage,” with “Practice scrimmage — not a league final” included in the event details so parents won’t mistake it for a league game.

**Expected:** Retain scrimmage wording and do not invent league standings or scores.

**Recorded verdict:** partially_inaccurate_inclusion_claim

## QA-020 — basketball--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/basketball--live_card.json) /qaResults/0

**Question:** Can I mark this as a scrimmage so parents do not mistake it for a league game?

**Recorded answer:** Yes. The card can state “Practice Scrimmage — Not a League Game” prominently near the matchup, so parents have a clear distinction.

**Expected:** Retain scrimmage wording and do not invent league standings or scores.

**Recorded verdict:** partial_scrimmage_title_retained_promised_clarification_missing

## QA-021 — birthday--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--digital_flyer.json) /qaResults/0

**Question:** Can the guests RSVP from the downloadable flyer or invitation, or do I have to message everyone separately?

**Recorded answer:** Guests can RSVP from the shared invitation link when RSVP is enabled; they’ll enter their name and email and choose yes, no, or maybe. You’ll need to share the invitation or link with guests yourself, but you do not need to collect replies separately by message.

**Expected:** Explain the actual RSVP capability of the selected format; do not promise automatic guest messaging.

**Recorded verdict:** correct for the shared link; local form verified

## QA-022 — birthday--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--event_page.json) /qaResults/0

**Question:** Can the guests RSVP from the event page, or do I have to message everyone separately?

**Recorded answer:** Guests can RSVP directly on the event page. They’ll enter their name and email, then choose yes, no, or maybe; responses are kept with Nora’s event rather than scattered across messages.

**Expected:** Explain the actual RSVP capability of the selected format; do not promise automatic guest messaging.

**Recorded verdict:** pass

## QA-023 — birthday--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789791561469.json) /qaResults/0

**Question:** Can the guests RSVP from the live card, or do I have to message everyone separately?

**Recorded answer:** Guests can RSVP directly from the Live card using the RSVP action. They’ll enter their name and email, then choose yes, no, or maybe; responses stay attached to Nora’s event rather than getting lost in separate messages.

**Expected:** Explain the actual RSVP capability of the selected format; do not promise automatic guest messaging.

**Recorded verdict:** mostly_correct

## QA-024 — birthday--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789792132452.json) /qaResults/0

**Question:** Can the guests RSVP from the live card, or do I have to message everyone separately?

**Recorded answer:** Guests can RSVP directly from the Live card using the RSVP action. They’ll enter their name and email, then choose yes, no, or maybe; responses stay attached to Nora’s event rather than getting lost in separate messages.

**Expected:** Explain the actual RSVP capability of the selected format; do not promise automatic guest messaging.

**Recorded verdict:** mostly_correct

## QA-025 — birthday--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789792748127.json) /qaResults/0

**Question:** Can the guests RSVP from the live card, or do I have to message everyone separately?

**Recorded answer:** Guests can RSVP directly from the live card using the RSVP action. They’ll enter their name and email and choose yes, no, or maybe, so you won’t need to collect replies separately.

**Expected:** Explain standard RSVP on the chosen format without promising automatic invitations or messaging.

**Recorded verdict:** correct

## QA-026 — birthday--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card-before-1789828685459.json) /qaResults/0

**Question:** Can the guests RSVP from the live card, or do I have to message everyone separately?

**Recorded answer:** Guests can RSVP directly from Nora’s Live card using the visible RSVP action. They’ll enter their name and email, then choose yes, no, or maybe—so you can share the card link rather than message everyone separately.

**Expected:** Explain supported live-card RSVP without promising automatic guest messaging.

**Recorded verdict:** correct

## QA-027 — birthday--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/birthday--live_card.json) /qaResults/0

**Question:** Can the guests RSVP from the live card, or do I have to message everyone separately?

**Recorded answer:** Guests can RSVP directly from the live card. It will include a visible RSVP action where they enter their name and email and choose yes, no, or maybe, so you do not need to message each guest separately.

**Expected:** Explain the actual RSVP capability of the selected format; do not promise automatic guest messaging.

**Recorded verdict:** passed_direct_rsvp_capability_with_choice_coverage_limit

## QA-028 — bridal_shower--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--digital_flyer.json) /qaResults/0

**Question:** Can I leave the registry off and add a real link later?

**Recorded answer:** Yes. The registry can stay off for now, and you can add a real link later when you have it.

**Expected:** Explain editing of available fields without generating a registry URL.

**Recorded verdict:** supported explanation; later edit not exercised

## QA-029 — bridal_shower--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--event_page.json) /qaResults/0

**Question:** Can I leave the registry off and add a real link later?

**Recorded answer:** Yes. We can leave the registry off now and add the real link later when you have it.

**Expected:** Explain editing of available fields without generating a registry URL.

**Recorded verdict:** absence_verified_later_edit_not_exercised

## QA-030 — bridal_shower--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/bridal_shower--live_card.json) /qaResults/0

**Question:** Can I leave the registry off and add a real link later?

**Recorded answer:** Yes, it can stay off for now and the real link can be added later.

**Expected:** Do not fabricate or show a registry when none is supplied; support a later real link.

**Recorded verdict:** passed_current_state_later_edit_untested

## QA-031 — cheerleading--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--digital_flyer.json) /qaResults/0

**Question:** Can this look like cheerleading without changing it into a football event?

**Recorded answer:** Yes. I’ll keep the design centered on a cheer showcase: teal-and-white pom-poms, motion ribbons, megaphone or bow accents, and performance-style typography—without footballs, field markings, helmets, or game language.

**Expected:** Preserve cheer activity and avoid football substitution.

**Recorded verdict:** correct; visual promise fulfilled

## QA-032 — cheerleading--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--event_page.json) /qaResults/0

**Question:** Can this look like cheerleading without changing it into a football event?

**Recorded answer:** Yes. I’ll keep the design centered on cheerleading: teal-and-white pom-poms, motion, team-spirit energy, and showcase-stage cues, with no football imagery, field graphics, or game language.

**Expected:** Preserve the cheer activity and supplied event facts.

**Recorded verdict:** correct

## QA-033 — cheerleading--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/cheerleading--live_card.json) /qaResults/0

**Question:** Can this look like cheerleading without changing it into a football event?

**Recorded answer:** Yes. I’ll use unmistakable cheer elements such as pom-poms, motion lines, megaphone-style accents, team-spirit typography, and teal-and-white energy—without footballs, fields, touchdowns, or game-day language. The wording will stay centered on the squad’s showcase performance.

**Expected:** Preserve the cheer activity and supplied event facts.

**Recorded verdict:** passed_subject_preserved

## QA-034 — dance--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--digital_flyer.json) /qaResults/0

**Question:** Can you keep performer arrival separate from when guests should come?

**Recorded answer:** Yes. The flyer will show “Performers arrive: 1 PM” separately from the guest-facing “Audience doors open: 1:30 PM” and “Showtime: 2 PM,” so guests have a clear arrival time without confusion.

**Expected:** Distinguish performer arrival, doors, and show time.

**Recorded verdict:** Fulfilled for visible time distinction; underlying schedule metadata fails separately

## QA-035 — dance--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--event_page.json) /qaResults/0

**Question:** Can you keep performer arrival separate from when guests should come?

**Recorded answer:** Yes. I’ll keep “Performers arrive at 1:00 PM” as a separate performer call time, while guest-facing details show “Doors open at 1:30 PM” and “Show begins at 2:00 PM.”

**Expected:** Distinguish performer arrival, doors, and show time.

**Recorded verdict:** incorrect_promise

## QA-036 — dance--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/dance--live_card.json) /qaResults/0

**Question:** Can you keep performer arrival separate from when guests should come?

**Recorded answer:** Yes. I’ll list performer arrival separately as “Performers: arrive at 1:00 PM,” while guest-facing details will say “Doors open at 1:30 PM” and “Show: 2:00–4:00 PM.”

**Expected:** Retain separately labeled performer arrival, guest doors and show timing.

**Recorded verdict:** failed_promised_behavior_not_delivered

## QA-037 — field_trip--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--digital_flyer.json) /qaResults/0

**Question:** Can parents sign a legally binding permission slip here, or should I link our school's form?

**Recorded answer:** Parents can use the RSVP to respond yes, no, or maybe, but it can’t collect a legally binding permission signature or a custom school consent form. I recommend linking your school’s official permission-slip form in the flyer or invitation; it keeps consent in your district-approved process while the RSVP remains a simple attendance check.

**Expected:** Explain the actual product capability and avoid claiming legally binding school consent; recommend the school's supplied form when appropriate.

**Recorded verdict:** Correct and appropriately bounded

## QA-038 — field_trip--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789792236452.json) /qaResults/0

**Question:** Can parents sign a legally binding permission slip here, or should I link our school's form?

**Recorded answer:** Use your school’s official permission form and link it on the Event page. The built-in RSVP only collects a parent’s name, email, and yes/no/maybe response, so it is not a legally binding permission-slip tool.

**Expected:** Explain actual product capability, avoid claiming a school-consent/signature service, and recommend the school's own form.

**Recorded verdict:** partially_verified

## QA-039 — field_trip--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789792839852.json) /qaResults/0

**Question:** Can parents sign a legally binding permission slip here, or should I link our school's form?

**Recorded answer:** Use your school’s official permission form and link it on the Event page. The built-in RSVP only collects a parent’s name, email, and yes/no/maybe response, so it is not a legally binding permission-slip tool.

**Expected:** Explain actual product capability, avoid claiming a school-consent/signature service, and recommend the school's own form.

**Recorded verdict:** partially_verified

## QA-040 — field_trip--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789793713083.json) /qaResults/0

**Question:** Can parents sign a legally binding permission slip here, or should I link our school's form?

**Recorded answer:** Use your school’s official permission-slip form. This Event page’s RSVP can only collect a parent’s name, email, and yes/no/maybe response, so it isn’t a legally binding signature tool.

Add the school form as a link on the page and make completion of that form the required permission step.

**Expected:** Do not represent ordinary RSVP as a school permission-signature tool; explain actual capability and defer permission to the school's supplied form.

**Recorded verdict:** correct core limitation; school-form link workflow unverified

## QA-041 — field_trip--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page-before-1789794003187.json) /qaResults/0

**Question:** Can parents sign a legally binding permission slip here, or should I link our school's form?

**Recorded answer:** Use your school’s official permission-slip form. This Event page’s RSVP can only collect a parent’s name, email, and yes/no/maybe response, so it isn’t a legally binding signature tool.

Add the school form as a link on the page and make completion of that form the required permission step.

**Expected:** Do not represent ordinary RSVP as a school permission-signature tool; explain actual capability and defer permission to the school's supplied form.

**Recorded verdict:** correct core limitation; school-form link workflow unverified

## QA-042 — field_trip--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--event_page.json) /qaResults/0

**Question:** Can parents sign a legally binding permission slip here, or should I link our school's form?

**Recorded answer:** Parents can’t sign a legally binding permission slip through this Event page’s standard RSVP. Link your school’s official permission form instead; the page can direct families there while RSVP remains a simple yes, no, or maybe response.

**Expected:** State the basic RSVP capability accurately and do not present attendance responses as permission signatures.

**Recorded verdict:** correct

## QA-043 — field_trip--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/field_trip--live_card.json) /qaResults/0

**Question:** Can parents sign a legally binding permission slip here, or should I link our school's form?

**Recorded answer:** Use your school’s official permission-slip form. The live card’s RSVP only collects a parent’s name, email, and yes/no/maybe response, so it isn’t suitable for legally binding consent or signatures.

Add the school form link to the card once you have the approved URL, and keep the RSVP as a simple attendance response.

**Expected:** Explain the actual product capability and avoid claiming legally binding school consent; recommend the school's supplied form when appropriate.

**Recorded verdict:** passed_capability_explanation

## QA-044 — football--digital_flyer

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789792296373.json) /qaResults/0

**Question:** Can a downloaded flyer have working RSVP buttons, or would I share a link too?

**Recorded answer:** A downloaded flyer is artwork, so its RSVP button will not be interactive. Share the flyer alongside the event link, where families can RSVP yes, no, or maybe. For a single shareable item with a working RSVP action, a live card or event page is the better fit; the flyer can still serve as the visual game-day announcement.

**Expected:** Distinguish static artwork from interactive online actions without claiming image buttons work.

**Recorded verdict:** correct

## QA-045 — football--digital_flyer

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789792956048.json) /qaResults/0

**Question:** Can a downloaded flyer have working RSVP buttons, or would I share a link too?

**Recorded answer:** A downloaded flyer is artwork, so its RSVP button will not be interactive. Share the flyer alongside the event link, where families can RSVP yes, no, or maybe. For a single shareable item with a working RSVP action, a live card or event page is the better fit; the flyer can still serve as the visual game-day announcement.

**Expected:** Distinguish static artwork from interactive online actions without claiming image buttons work.

**Recorded verdict:** correct

## QA-046 — football--digital_flyer

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789793861307.json) /qaResults/0

**Question:** Can a downloaded flyer have working RSVP buttons, or would I share a link too?

**Recorded answer:** A downloaded flyer is artwork, so its RSVP button will not be interactive. Share the flyer alongside the event link, where families can RSVP yes, no, or maybe. For a single shareable item with a working RSVP action, a live card or event page is the better fit; the flyer can still serve as the visual game-day announcement.

**Expected:** Distinguish static artwork from interactive online actions without claiming image buttons work.

**Recorded verdict:** correct

## QA-047 — football--digital_flyer

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer-before-1789794206752.json) /qaResults/0

**Question:** Can a downloaded flyer have working RSVP buttons, or would I share a link too?

**Recorded answer:** A downloaded flyer is artwork, so its RSVP button will not be interactive. Share the event link alongside the flyer so families can RSVP there with yes, no, or maybe; the flyer can still include an RSVP callout for Coach Alex.

**Expected:** Explain that downloaded raster artwork cannot provide interactive RSVP, while an online event link can.

**Recorded verdict:** correct

## QA-048 — football--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--digital_flyer.json) /qaResults/0

**Question:** Can a downloaded flyer have working RSVP buttons, or would I share a link too?

**Recorded answer:** A downloaded Flyer/Invitation is shareable artwork, but its RSVP action is not a working button inside the downloaded file. To collect RSVPs, share the event link alongside it, where guests can respond yes, no, or maybe with their name and email.

A simple approach is to post or message the flyer with: “RSVP through the event link.”

**Expected:** Distinguish static downloaded artwork from interactive online actions.

**Recorded verdict:** correct; online RSVP verified, file download not exercised

## QA-049 — football--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--event_page.json) /qaResults/0

**Question:** Can a downloaded flyer have working RSVP buttons, or would I share a link too?

**Recorded answer:** A downloaded flyer is static, so its RSVP button will not be interactive. Share the Event page link alongside the flyer; that page can include the RSVP action for guests to respond yes, no, or maybe.

**Expected:** Distinguish a static image download from interactive online actions; do not claim image buttons work.

**Recorded verdict:** correct

## QA-050 — football--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/football--live_card.json) /qaResults/0

**Question:** Can a downloaded flyer have working RSVP buttons, or would I share a link too?

**Recorded answer:** A downloaded flyer is static, so its RSVP button won’t work. Share the event link alongside it, or use the Live card link directly; that gives families the working RSVP action.

**Expected:** Distinguish a static image download from interactive online actions; do not claim image buttons work.

**Recorded verdict:** passed

## QA-051 — game_day--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--digital_flyer.json) /qaResults/0

**Question:** Will people understand this is a watch party instead of a team playing at the venue?

**Recorded answer:** Yes. I’d make the main line explicit: “Join us to watch the game together,” rather than using sports imagery that could suggest a live match. The flyer can also say “Watch Party” prominently, so the purpose is clear at a glance.

**Expected:** Keep a watch party and avoid fabricated teams, fixture facts or ticket/betting details.

**Recorded verdict:** correct; watch-party distinction visibly fulfilled

## QA-052 — game_day--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page-before-1789828408357.json) /qaResults/0

**Question:** Will people understand this is a watch party instead of a team playing at the venue?

**Recorded answer:** Yes. The page can state it plainly: “Join the neighbors to watch the game together at Maple Community Center—this is a viewing party, not a game or fixture at the venue.”

That wording removes the ambiguity while keeping the relaxed, living-room feel.

**Expected:** Keep the event a watch party and avoid invented matchups or competition facts.

**Recorded verdict:** pass

## QA-053 — game_day--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--event_page.json) /qaResults/0

**Question:** Will people understand this is a watch party instead of a team playing at the venue?

**Recorded answer:** Yes. The page can state plainly: “Join neighbors to watch the game together at Maple Community Center.” That makes clear it’s a viewing gathering, not a live team fixture at the venue.

**Expected:** Keep the event a watch party and avoid invented matchups or competition facts.

**Recorded verdict:** correct

## QA-054 — game_day--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/game_day--live_card.json) /qaResults/0

**Question:** Will people understand this is a watch party instead of a team playing at the venue?

**Recorded answer:** Yes, use watch-the-game-together wording and an afternoon with neighbors rather than an on-site match.

**Expected:** Clearly portray a social watch party, without fixture details or unsupported scores/opponents/prices.

**Recorded verdict:** passed_observed_intent

## QA-055 — gender_reveal--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--digital_flyer.json) /qaResults/0

**Question:** Will the invite reveal an answer if I have not told you one?

**Recorded answer:** No. The invitation will not reveal a boy or girl or imply a known result. It will simply invite guests to find out together, exactly as you requested.

**Expected:** Keep the result unknown and honor requested discover-together copy.

**Recorded verdict:** unknown-result promise fulfilled; discover-together wording promise not fulfilled

## QA-056 — gender_reveal--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--event_page.json) /qaResults/0

**Question:** Will the invite reveal an answer if I have not told you one?

**Recorded answer:** No. Since you haven’t provided a result, the event page will only invite guests to find out together and will not announce a boy or girl.

**Expected:** Confirm missing reveal information stays unknown; do not infer or fabricate the result.

**Recorded verdict:** partial

## QA-057 — gender_reveal--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gender_reveal--live_card.json) /qaResults/0

**Question:** Will the invite reveal an answer if I have not told you one?

**Recorded answer:** No; it will invite guests to find out together and not reveal or imply a boy or girl.

**Expected:** No invented result, with neutral shared-discovery invitation wording.

**Recorded verdict:** passed_no_disclosure_partial_wording

## QA-058 — general--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--digital_flyer.json) /qaResults/0

**Question:** Do I need to choose a more specific category, or can this stay a simple gathering?

**Recorded answer:** It can absolutely stay a simple gathering. That fits Maple Neighbors Get-Together well and keeps the flyer focused on the casual tea-and-conversation invitation rather than forcing a category.

**Expected:** Support a general event without forcing or inventing a specific occasion.

**Recorded verdict:** Correct category advice

## QA-059 — general--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--event_page.json) /qaResults/0

**Question:** Do I need to choose a more specific category, or can this stay a simple gathering?

**Recorded answer:** It can absolutely stay a simple gathering. That fits Maple Neighbors Get-Together well and keeps the Event page welcoming without forcing a formal category.

**Expected:** Support a general event without forcing or inventing a specific occasion.

**Recorded verdict:** correct

## QA-060 — general--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/general--live_card.json) /qaResults/0

**Question:** Do I need to choose a more specific category, or can this stay a simple gathering?

**Recorded answer:** It can stay a simple gathering. That fits a casual neighborhood conversation with tea, and it keeps the Live card clear without adding an unnecessary label.

**Expected:** Support a general event without forcing or inventing a specific occasion.

**Recorded verdict:** passed

## QA-061 — graduation--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--digital_flyer.json) /qaResults/0

**Question:** Can this celebrate graduation without guessing a school name?

**Recorded answer:** Yes. The invitation can celebrate Leo finishing his program without naming a school or graduation year. It will simply use “Leo’s Graduation Celebration” and “On to the next adventure.”

**Expected:** Keep the school and graduation year absent unless supplied.

**Recorded verdict:** no-school/year promise fulfilled; exact-line promise unfulfilled

## QA-062 — graduation--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--event_page.json) /qaResults/0

**Question:** Can this celebrate graduation without guessing a school name?

**Recorded answer:** Yes. The event page can celebrate Leo finishing his program without naming a school or graduation year. It will simply say Leo’s Graduation Celebration and use “On to the next adventure.”

**Expected:** Keep the school and graduation year absent unless supplied.

**Recorded verdict:** partial

## QA-063 — graduation--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/graduation--live_card.json) /qaResults/0

**Question:** Can this celebrate graduation without guessing a school name?

**Recorded answer:** Yes. It can simply celebrate Leo finishing his program, using “On to the next adventure,” without naming or implying any school or graduation year.

**Expected:** Avoid inventing a school or graduation year and preserve the explicitly requested line.

**Recorded verdict:** exclusions_honored_exact_copy_not_delivered

## QA-064 — gymnastics--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--digital_flyer.json) /qaResults/0

**Question:** Can I show warmup, competition, and awards separately so my family arrives on time?

**Recorded answer:** Yes. I’ll display them as three distinct schedule lines so it’s easy to scan:

Warmup: 1 PM
Competition: 2 PM
Awards: 4 PM

The 4:30 PM end time can remain off the flyer since you asked to use only the listed details.

**Expected:** Preserve all three schedule entries and distinguish the primary competition time from warmup.

**Recorded verdict:** partially fulfilled labels; contradictory end-time guidance and wrong canonical start

## QA-065 — gymnastics--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--event_page.json) /qaResults/0

**Question:** Can I show warmup, competition, and awards separately so my family arrives on time?

**Recorded answer:** Yes. The event page can show a clear schedule with separate entries for Warmup at 1 PM, Competition at 2 PM, and Awards at 4 PM, plus the event ending at 4:30 PM. That’s the simplest way to help family members plan their arrival without confusing the competition start time.

**Expected:** Preserve all three schedule entries and distinguish the primary competition time from warmup.

**Recorded verdict:** partial

## QA-066 — gymnastics--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789792360199.json) /qaResults/0

**Question:** Can I show warmup, competition, and awards separately so my family arrives on time?

**Recorded answer:** undefined

**Expected:** See original review.

**Recorded verdict:** partially_verified

## QA-067 — gymnastics--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789793062689.json) /qaResults/0

**Question:** Can I show warmup, competition, and awards separately so my family arrives on time?

**Recorded answer:** undefined

**Expected:** See original review.

**Recorded verdict:** partially_verified

## QA-068 — gymnastics--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card-before-1789794344165.json) /qaResults/0

**Question:** Can I show warmup, competition, and awards separately so my family arrives on time?

**Recorded answer:** Yes. The Live card can show each milestone as a separate schedule line so family can plan around it:

Warmup: 1 PM
Competition: 2 PM
Awards: 4 PM

The event concludes at 4:30 PM.

**Expected:** Retain all three labels and distinguish the competition start from warmup and awards.

**Recorded verdict:** correct stated schedule; conflicting primary timestamp remains

## QA-069 — gymnastics--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/gymnastics--live_card.json) /qaResults/0

**Question:** Can I show warmup, competition, and awards separately so my family arrives on time?

**Recorded answer:** Yes. I’ll display the schedule as three distinct lines so it’s easy to scan:

Warmup: 1 PM
Competition: 2 PM
Awards: 4 PM

The card can also note that the meet ends at 4:30 PM.

**Expected:** Keep each supplied phase and time distinct in the actual guest schedule, preserve the 4:30 PM end and avoid confusing the primary competition time.

**Recorded verdict:** partially_fulfilled

## QA-070 — hockey--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--digital_flyer.json) /qaResults/0

**Question:** Can you distinguish ice hockey from field hockey?

**Recorded answer:** Yes. This is clearly ice hockey: it takes place at a rink, uses ice-hockey protective gear, and the icy blue/charcoal rink-line design will reflect that. I won’t use field-hockey imagery such as grass, turf, or outdoor field markings.

**Expected:** Preserve ice rink setting and equipment without field hockey imagery.

**Recorded verdict:** correct; visual distinction fulfilled

## QA-071 — hockey--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--event_page.json) /qaResults/0

**Question:** Can you distinguish ice hockey from field hockey?

**Recorded answer:** Yes. This draft is clearly for ice hockey: the rink setting, full protective gear, warm layers for families, and rink-line visual treatment all distinguish it from field hockey.

**Expected:** Preserve ice rink setting and equipment without field hockey imagery.

**Recorded verdict:** correct

## QA-072 — hockey--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/hockey--live_card.json) /qaResults/0

**Question:** Can you distinguish ice hockey from field hockey?

**Recorded answer:** Yes. This is clearly ice hockey: it’s played on a rink with skates, sticks, a puck, and full protective gear. Field hockey is played outdoors or on turf with a ball and different equipment.

Your Live card will use ice-hockey cues: rink lines, icy blue and charcoal, plus the warm-layer note for families.

**Expected:** Preserve ice rink setting and equipment without field hockey imagery.

**Recorded verdict:** passed_sport_distinction_partial_promised_note

## QA-073 — housewarming--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--digital_flyer.json) /qaResults/0

**Question:** If I edit the address later, will the shared online version update?

**Recorded answer:** Yes. Once you publish a shared online event page or live card, edits to its address update the shared version. A downloaded flyer is static, so you’d need to download and resend an updated file.

**Expected:** Distinguish persisted online updates from old downloaded images and explain any save/apply step.

**Recorded verdict:** conceptually sound; post-publication behavior not tested in this attempt

## QA-074 — housewarming--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--event_page.json) /qaResults/0

**Question:** If I edit the address later, will the shared online version update?

**Recorded answer:** Yes. Once you generate and publish an event page, editing the address updates the shared online version at the same link.

**Expected:** Describe current online edit behavior accurately and distinguish previously downloaded images.

**Recorded verdict:** partially_verified

## QA-075 — housewarming--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/housewarming--live_card.json) /qaResults/0

**Question:** If I edit the address later, will the shared online version update?

**Recorded answer:** Yes. Once the live card is published, editing its address updates the shared online version at the same link.

**Expected:** Describe current online edit behavior accurately and distinguish previously downloaded images.

**Recorded verdict:** partial_online_answer_later_edit_untested

## QA-076 — lacrosse--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--digital_flyer.json) /qaResults/0

**Question:** Can the non-contact note stay prominent after a redesign?

**Recorded answer:** Yes. The redesigned Flyer/Invitation will keep “Non-Contact Skills Session” prominent near the headline, with a clear visual callout so it isn’t lost among the lacrosse imagery or event details.

**Expected:** Keep the explicit non-contact constraint through artwork edits.

**Recorded verdict:** Not fulfilled

## QA-077 — lacrosse--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--event_page.json) /qaResults/0

**Question:** Can the non-contact note stay prominent after a redesign?

**Recorded answer:** Yes. The redesign will keep the non-contact message prominent and will not advertise contact drills, while retaining the forest green, gold, and lacrosse-stick look.

**Expected:** Keep the explicit non-contact constraint through artwork edits.

**Recorded verdict:** promised_prominence_not_fulfilled

## QA-078 — lacrosse--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/lacrosse--live_card.json) /qaResults/0

**Question:** Can the non-contact note stay prominent after a redesign?

**Recorded answer:** Yes. I’ll keep “Non-contact skills session” as a prominent, high-visibility line in the redesigned Live card, and continue to exclude contact drills from both the artwork and wording.

**Expected:** Keep the explicit non-contact constraint through artwork edits.

**Recorded verdict:** failed_prominent_non_contact_copy_missing

## QA-079 — open_house--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--digital_flyer.json) /qaResults/0

**Question:** Can I say drop in any time during the window instead of assigning everyone an appointment?

**Recorded answer:** Yes. “Drop in anytime from 2:00–4:00 PM” is a clear, welcoming alternative to appointments and keeps the open house flexible for families.

Proposed wording: Families are welcome to drop in anytime between 2:00 and 4:00 PM to meet teachers and see classrooms.

**Expected:** Show the supplied drop-in window without inventing booked appointments.

**Recorded verdict:** Correct advice, not fulfilled in actual copy

## QA-080 — open_house--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--event_page.json) /qaResults/0

**Question:** Can I say drop in any time during the window instead of assigning everyone an appointment?

**Recorded answer:** Yes. Use: “Drop in any time between 2:00 and 4:00 PM—no appointment needed.”

The event page RSVP can collect a simple yes, no, or maybe, but it won’t assign arrival times.

**Expected:** Show the supplied drop-in window without inventing booked appointments.

**Recorded verdict:** correct_answer_not_delivered

## QA-081 — open_house--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/open_house--live_card.json) /qaResults/0

**Question:** Can I say drop in any time during the window instead of assigning everyone an appointment?

**Recorded answer:** Yes. I’d use: “Drop in anytime between 2:00 and 4:00 PM.” It makes the open house more flexible for families and avoids implying assigned appointments.

**Expected:** Support a drop-in window without inventing booked appointments.

**Recorded verdict:** answer_correct_delivery_incomplete

## QA-082 — soccer--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--digital_flyer.json) /qaResults/0

**Question:** Can parents add this to their calendars without me connecting their accounts?

**Recorded answer:** Yes. Parents can use the shared event link to view the match details and add it to their own calendars; you do not need to connect anyone’s calendar account.

**Expected:** Describe the guest calendar action accurately; never claim automatic writes to guests' calendars.

**Recorded verdict:** Fulfilled in observed guest handoff

## QA-083 — soccer--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--event_page.json) /qaResults/0

**Question:** Can parents add this to their calendars without me connecting their accounts?

**Recorded answer:** Yes. The event page can include an add-to-calendar action using the event details, so parents can add it to their own calendars without you connecting any accounts.

**Expected:** Describe the guest calendar action accurately; never claim automatic writes to guests' calendars.

**Recorded verdict:** correct

## QA-084 — soccer--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/soccer--live_card.json) /qaResults/0

**Question:** Can parents add this to their calendars without me connecting their accounts?

**Recorded answer:** Yes. The live card can include an Add to Calendar action using the event date, time, and location, so parents can add it to their own calendars without connecting any accounts.

**Expected:** Describe the guest calendar action accurately; never claim automatic writes to guests' calendars.

**Recorded verdict:** passed_guest_initiated_calendar

## QA-085 — softball--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--digital_flyer.json) /qaResults/0

**Question:** Can you make sure the artwork says softball and uses a yellow ball?

**Recorded answer:** Yes. The artwork direction now explicitly requires the word “softball” and a yellow softball, with the purple-and-white palette retained.

**Expected:** Respect softball subject and yellow ball without relabeling it baseball.

**Recorded verdict:** correct; visual promise fulfilled

## QA-086 — softball--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--event_page.json) /qaResults/0

**Question:** Can you make sure the artwork says softball and uses a yellow ball?

**Recorded answer:** Yes — the artwork direction explicitly includes the word “softball” and a yellow softball, with purple and white as the supporting colors.

**Expected:** Respect softball subject and yellow ball without relabeling it baseball.

**Recorded verdict:** correct

## QA-087 — softball--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/softball--live_card.json) /qaResults/0

**Question:** Can you make sure the artwork says softball and uses a yellow ball?

**Recorded answer:** Yes — the artwork direction will clearly feature the word “Softball” and a yellow softball, with the purple-and-white palette.

**Expected:** Respect softball subject and yellow ball without relabeling it baseball.

**Recorded verdict:** passed

## QA-088 — special_event--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--digital_flyer.json) /qaResults/0

**Question:** Can you keep the safety instruction visible instead of hiding it in decorative text?

**Recorded answer:** Yes — the safety instruction will be a prominent, readable line in the Flyer/Invitation design, separate from the decorative lantern artwork:

Battery-powered lanterns only. Open flames are not allowed.

**Expected:** Required safety line is present and readable in delivered output; no visible flames.

**Recorded verdict:** failed visible-copy promise

## QA-089 — special_event--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--event_page.json) /qaResults/0

**Question:** Can you keep the safety instruction visible instead of hiding it in decorative text?

**Recorded answer:** Yes. The safety instruction will stay as a prominent, clearly legible notice separate from the decorative night-sky and lantern artwork:

Battery-powered lanterns only. Open flames are not allowed.

**Expected:** Retain the explicit safety instruction visibly and do not depict flame lanterns.

**Recorded verdict:** incorrect_promise

## QA-090 — special_event--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/special_event--live_card.json) /qaResults/0

**Question:** Can you keep the safety instruction visible instead of hiding it in decorative text?

**Recorded answer:** Yes. The safety instruction will stay prominent and clearly legible in plain, non-decorative text: “Battery-powered lanterns only. Open flames are not allowed.”

**Expected:** Retain the explicit safety instruction visibly and do not depict flame lanterns.

**Recorded verdict:** partial_final_raster_visible_canonical_copy_missing

## QA-091 — sport_event--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--digital_flyer.json) /qaResults/0

**Question:** Can I explain the different activity stations without making them separate events?

**Recorded answer:** Yes. Keep Community Multi-Sport Afternoon as one event and add a short “Stations” section to the flyer, such as:

Basketball Station: friendly skill-building activities
Soccer Station: welcoming drills and play
No experience needed — join in at your own pace

That keeps the invitation clear and avoids separate schedules or RSVPs for each activity.

**Expected:** Preserve the single event and describe supplied activities without invented brackets or registration places.

**Recorded verdict:** Conceptually correct; expected station copy not delivered

## QA-092 — sport_event--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--event_page.json) /qaResults/0

**Question:** Can I explain the different activity stations without making them separate events?

**Recorded answer:** Yes. On the event page, describe basketball and soccer as activity stations within the same Community Multi-Sport Afternoon, not separate events. A simple “Activity Stations” section can explain that guests can rotate through friendly, skills-focused stations at their own pace.

**Expected:** Preserve the single event and describe supplied activities without invented brackets or registration places.

**Recorded verdict:** reasonable_guidance_not_realized_in_output

## QA-093 — sport_event--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/sport_event--live_card.json) /qaResults/0

**Question:** Can I explain the different activity stations without making them separate events?

**Recorded answer:** Yes. Keep this as one Community Multi-Sport Afternoon and add a short “Stations” section in the live card, such as:

Basketball Skills Station
Practice dribbling, passing, and shooting at your own pace.

Soccer Skills Station
Try footwork, passing, and friendly skill-building activities.

This keeps the plan clear without turning each activity into a separate event.

**Expected:** Preserve the single event and describe supplied activities without invented brackets or registration places.

**Recorded verdict:** partial_advice_correct_delivery_incomplete

## QA-094 — swimming--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--digital_flyer.json) /qaResults/0

**Question:** Can warmup and the meet start both appear without guessing lanes?

**Recorded answer:** Yes. The flyer can clearly show “Warmup at 1 PM” and “Meet starts at 2 PM,” with the event ending at 4 PM, while stating “No lane assignments are available.” No lane details will be implied.

**Expected:** Keep warmup distinct and leave lane assignments unspecified.

**Recorded verdict:** Visible clocks and no-invention requirement fulfilled; promised availability line missing

## QA-095 — swimming--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--event_page.json) /qaResults/0

**Question:** Can warmup and the meet start both appear without guessing lanes?

**Recorded answer:** Yes. The Event page can list both Warmup at 1 PM and Meet starts at 2 PM, and it will state that lane assignments are not available—without assigning or implying any lanes.

**Expected:** Keep warmup distinct and leave lane assignments unspecified.

**Recorded verdict:** partially_fulfilled_missing_unavailable_lanes_statement

## QA-096 — swimming--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/swimming--live_card.json) /qaResults/0

**Question:** Can warmup and the meet start both appear without guessing lanes?

**Recorded answer:** Yes. The Live card can clearly list “Warmup at 1 PM” and “Meet starts at 2 PM,” along with the 4:00 PM end time, without assigning or implying any lanes. It can also note that lane assignments are not available.

**Expected:** Keep warmup distinct and leave lane assignments unspecified.

**Recorded verdict:** partial_schedule_prose_retained_normalization_broken

## QA-097 — tennis--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--digital_flyer.json) /qaResults/0

**Question:** Can I leave court assignments off until we know them?

**Recorded answer:** Yes. Leave court assignments off for now; the flyer can simply say that court numbers and partners will be assigned later.

**Expected:** Do not fabricate court assignments, partners, or tournament brackets.

**Recorded verdict:** Core request fulfilled with a wording caveat

## QA-098 — tennis--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--event_page.json) /qaResults/0

**Question:** Can I leave court assignments off until we know them?

**Recorded answer:** Yes. I’ll leave court assignments and partners off the event page until you have them.

**Expected:** Do not fabricate court assignments, partners, or tournament brackets.

**Recorded verdict:** correct

## QA-099 — tennis--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/tennis--live_card.json) /qaResults/0

**Question:** Can I leave court assignments off until we know them?

**Recorded answer:** Yes. Court assignments can stay off the Live card until they’re confirmed. Keeping them out now makes the card cleaner and avoids guests relying on details that may change.

**Expected:** Do not invent court numbers or partners.

**Recorded verdict:** passed_observed_answer_and_outputs

## QA-100 — track_field--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--digital_flyer.json) /qaResults/0

**Question:** Can you list both sprint and long jump without guessing race distances?

**Recorded answer:** Yes. I’ll list the activities as “Sprint drills and long-jump technique” without naming any race distances or results.

**Expected:** Preserve named activities without invented race distances, times, or results.

**Recorded verdict:** promise_unfulfilled; no invented distances observed

## QA-101 — track_field--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--event_page.json) /qaResults/0

**Question:** Can you list both sprint and long jump without guessing race distances?

**Recorded answer:** Yes. I’ll list the planned activities simply as sprint drills and long-jump technique, with no race distances, results, or qualifying times added.

**Expected:** Preserve named activities without invented race distances, times, or results.

**Recorded verdict:** partially_correct_but_unfulfilled

## QA-102 — track_field--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card-before-1789828535478.json) /qaResults/0

**Question:** Can you list both sprint and long jump without guessing race distances?

**Recorded answer:** Yes. I’ll list the planned activities as “Sprint drills and long-jump technique” without adding any race distances or results.

**Expected:** Preserve named activities without invented race distances, times, or results.

**Recorded verdict:** partial_no_inventions_activity_list_not_delivered

## QA-103 — track_field--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/track_field--live_card.json) /qaResults/0

**Question:** Can you list both sprint and long jump without guessing race distances?

**Recorded answer:** Yes. The activity line can read: “Sprint drills and long-jump technique.” No race distances, results, or qualifying times will be added.

**Expected:** Preserve named activities without invented race distances, times, or results.

**Recorded verdict:** partial_no_inventions_activity_line_missing

## QA-104 — volleyball--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--digital_flyer.json) /qaResults/0

**Question:** Can you keep indoor volleyball clear in both the wording and the design?

**Recorded answer:** Yes. I’ll make “Indoor Volleyball Open Practice” prominent in the wording and use a gym-court setting with an indoor net, court lines, and coral-and-navy graphics. I’ll avoid sand, beach scenery, tropical elements, and tournament framing.

**Expected:** Preserve indoor context and required equipment.

**Recorded verdict:** Partially fulfilled: design correct, wording incomplete

## QA-105 — volleyball--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--event_page.json) /qaResults/0

**Question:** Can you keep indoor volleyball clear in both the wording and the design?

**Recorded answer:** Yes. The page wording will explicitly say “indoor volleyball open practice,” and the artwork will use a coral-and-navy indoor court setting with a volleyball net—no sand, beach, or beach-tournament elements.

**Expected:** Preserve indoor context and required equipment.

**Recorded verdict:** partially_fulfilled

## QA-106 — volleyball--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/volleyball--live_card.json) /qaResults/0

**Question:** Can you keep indoor volleyball clear in both the wording and the design?

**Recorded answer:** Yes. The wording will say “Indoor Volleyball Open Practice” and include “Wear non-marking shoes and bring knee pads.” The coral-and-navy artwork will show an indoor court and volleyball net only, with no sand, beach, sun, or tournament cues.

**Expected:** Preserve indoor practice meaning in wording and artwork, including the supplied equipment instructions.

**Recorded verdict:** partial_visual_pass_wording_failure

## QA-107 — wedding--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--digital_flyer.json) /qaResults/0

**Question:** Can I keep the ceremony time separate from when the reception starts?

**Recorded answer:** Yes. We can list the ceremony and reception as separate schedule lines while keeping both at Maple Community Center, Room A. Share the reception start time, and I’ll add it without changing any other details.

**Expected:** Explain how multiple times can be shown without replacing the main ceremony time.

**Recorded verdict:** appropriate clarification; separate-time capability not exercised

## QA-108 — wedding--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--event_page.json) /qaResults/0

**Question:** Can I keep the ceremony time separate from when the reception starts?

**Recorded answer:** Yes. We can list the ceremony at 2:00 PM and add a separate reception start time at the same venue. What time should the reception begin?

**Expected:** Explain how multiple times can be shown without replacing the main ceremony time.

**Recorded verdict:** partial

## QA-109 — wedding--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/wedding--live_card.json) /qaResults/0

**Question:** Can I keep the ceremony time separate from when the reception starts?

**Recorded answer:** Yes. You can show the ceremony at 2:00 PM and list the reception with its own start time on the live card. That keeps the schedule clear for guests; share the reception start time when you’re ready, and I’ll add it without changing the other details.

**Expected:** Recognize separately labeled activity times without inventing a reception start.

**Recorded verdict:** reasonable_answer_delivery_not_exercised

## QA-110 — workshop--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--digital_flyer.json) /qaResults/0

**Question:** Can I add a price later without you choosing one now?

**Recorded answer:** Yes. I’ll leave the price off for now, and you can add it later once it’s confirmed.

**Expected:** Keep unsupplied pricing and capacity blank and explain supported later edits.

**Recorded verdict:** Correct for leaving price unspecified

## QA-111 — workshop--event_page

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page-before-1789828236729.json) /qaResults/0

**Question:** Can I add a price later without you choosing one now?

**Recorded answer:** Yes. We can leave the price off for now and add it later when you’ve confirmed it; I won’t choose one.

**Expected:** Keep unsupplied pricing and capacity blank and explain supported later edits.

**Recorded verdict:** correct_for_observed_scope

## QA-112 — workshop--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--event_page.json) /qaResults/0

**Question:** Can I add a price later without you choosing one now?

**Recorded answer:** Yes. I’ll leave the price off for now, so you can add it later once it’s confirmed.

**Expected:** Keep unsupplied pricing and capacity blank and explain supported later edits.

**Recorded verdict:** correct_with_unverified_later_edit

## QA-113 — workshop--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/workshop--live_card.json) /qaResults/0

**Question:** Can I add a price later without you choosing one now?

**Recorded answer:** Yes. You can add a price later; I won’t choose or display one now.

**Expected:** Leave price blank without inventing a fee or capacity.

**Recorded verdict:** passed_observed_answer_and_current_state

## QA-114 — wrestling--digital_flyer

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--digital_flyer.json) /qaResults/0

**Question:** Can this stay a practice announcement without made-up brackets?

**Recorded answer:** Yes. It will remain a supervised technique-practice announcement, with no brackets, weight classes, tournament language, or invented competition details.

**Expected:** Preserve practice intent and omit unknown weight classes or brackets.

**Recorded verdict:** Core exclusion satisfied; explicit supervised-practice wording omitted

## QA-115 — wrestling--event_page

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--event_page.json) /qaResults/0

**Question:** Can this stay a practice announcement without made-up brackets?

**Recorded answer:** Yes. The event page will stay a supervised wrestling technique-practice announcement, not a tournament, and it will state that no weight classes or brackets are assigned.

**Expected:** Preserve practice intent and omit unknown weight classes or brackets.

**Recorded verdict:** partially_fulfilled

## QA-116 — wrestling--live_card

Scope: historical; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card-before-1789828848251.json) /qaResults/0

**Question:** Can this stay a practice announcement without made-up brackets?

**Recorded answer:** Yes. It will remain a supervised technique-practice announcement, with no tournament framing, weight classes, brackets, or invented match details.

**Expected:** Retain practice intent and omit unknown weight classes or brackets.

**Recorded verdict:** passed_observed_exclusions_final_delivery_unverified

## QA-117 — wrestling--live_card

Scope: latest; [original evidence](../../../.qa/create-campaign/2026-09-18/reviews/wrestling--live_card.json) /qaResults/0

**Question:** Can this stay a practice announcement without made-up brackets?

**Recorded answer:** Yes. The live card will stay clearly framed as a supervised wrestling technique practice, not a tournament, and it will not include brackets, weight classes, or competitive match-up language.

**Expected:** Preserve practice intent and omit unknown weight classes or brackets.

**Recorded verdict:** mostly_passed_practice_identity_preserved_supervision_copy_missing
