# Signup teacher / parent remediation and retest

Date: September 19, 2026. Local working tree; no deployment or recruitment performed.

## Changes

- New gallery selections start a fresh signup in memory. Explicit browser-draft and account-edit links restore the requested form. Account draft saves now leave a durable edit URL for reload. Other categories retain their existing draft behavior.
- Preview/publish and sharing explain public-link access consistently. Explicitly restricted forms describe sign-in and invitation requirements; drafts remain private. Legacy form-level privacy flags normalize to a restriction that survives subsequent saves and reservation mutations.
- New time sections begin without bookable placeholder rows. Teachers can generate appointments with one place each. Identical time ranges are skipped. Legacy untouched starter rows have an explicit replacement option; authored/occupied rows are preserved. Preview flags untimed appointment choices without blocking intentional untimed content.
- Signup marketing and participant email labels describe confirmations accurately. Settings and the FAQ state that automatic reminders are not currently sent and explain exporting responses for manual follow-up. New forms have no inactive default reminder schedule.
- Template search recognizes school use cases such as parent–teacher conferences, class party, room parent, PTA and appointments, with punctuation and word-order tolerance. Style and audience filters remain available.
- The browser retest exposed an additional date-range hydration mismatch: Node used thin/nonbreaking spaces while Chrome used ordinary spaces. Signup date labels now normalize that whitespace. A fresh browser load after the fix produced no hydration warnings and retained the Chicago event timezone.

## Automated checks

93 targeted tests passed, zero failed, using:

```text
node --test src/lib/public-template-flow.test.mjs src/lib/signup-field-day.test.mjs src/lib/signup-guest-access.test.mjs src/lib/signup-themes-workflow.test.mjs src/components/smart-signup-form/signup-preview-markup.test.mjs
```

New behavioral coverage includes two separately saved form identities, a new editor ignoring unrelated drafts, explicit resume, four generated appointments, repeat generation, preservation of booked/waitlisted/edited rows, untimed warnings, school search aliases, restriction retention and public/restricted preview wording.

Biome passed on 21 changed application files. The VS Code diagnostics bridge was unavailable. A scoped TypeScript compiler check reported zero diagnostics for those 21 files; this is not a clean whole-repository typecheck. The broader check was interrupted to reduce local resource contention. `git diff --check` passed for the changed application files.

Results and the scoped check script are retained in `signup-persona-2026-09-19/`.

## Browser verification

Completed against the local working tree on port 3001, using the app's configured database. These were simulated teacher/mom journeys, not research with recruited participants.

| Journey | Verified result |
| --- | --- |
| Teacher discovery and creation | “parent–teacher conferences” found three designs, including School Days. A new School Days form was blank. Added a time section with zero starter rows and generated exactly four 15-minute appointments from 3–4 PM. Repeating generation produced an “already exist” message and no duplicates. |
| Teacher preview | Two selections violated the one-choice rule. One appointment plus a fictional name and required classroom answer succeeded as a local test without reserving capacity. Preview correctly explained draft privacy and public access after publication. |
| Teacher save and reload | Explicitly saved, received an account edit URL, and reloaded. The title, four appointments, required classroom question, October 22 date, and America/Chicago timezone were retained. |
| Isolation and mom discovery | The gallery displayed an explicit Continue your browser draft link. “class party” found three designs. Choosing Harvest Table through its ordinary Customize link opened blank details and zero sections, with none of the teacher's content. |
| Mom creation at 390 × 844 | Added two setup places, one cleanup place, three fruit trays, four juice packs and two napkin packs. Removed an unwanted starter, edited instructions and moved supplies above roles using the move button. Preview accepted one setup role plus two juice packs. Document width and viewport width were both 390 pixels. |
| Separate saved identities | Mom saved as a distinct event ID. Reload retained the five choices and capacities 3/4/2/2/1. Reopening the teacher's original edit URL showed the unchanged title, schedule, question and four appointments. |
| Mom anonymous participant | Published the fictional form and opened it on the separate 127.0.0.1 origin without an account. Booked a setup role plus two juice packs, changed juice quantity to one, reloaded successfully and cancelled. All capacities were restored. |
| Teacher anonymous participant | Published the fictional form. An anonymous parent reserved 3 PM, edited to 3:15 PM and reloaded. The original place was released, the revised booking persisted and the required classroom answer appeared in the organizer's Participant details. Cancellation restored all four places. |
| Final cleanup | Both new test forms are closed, with zero confirmed reservations and one cancelled fictional entry each. The closed teacher guest page contains no Host dashboard. Chrome's temporary viewport override was reset. |

The first isolated QA server took 261.8 seconds to compile the gallery and browser commands timed out. A replacement isolated Turbopack server also had slow initial compilation and transient database timeouts, then completed the journeys. No production performance conclusions follow from these development timings. The QA server was stopped after verification.

## Test records and evidence

Two new clearly labeled fictional forms were created. The two fixtures from the initial audit and pre-existing user events were not modified. No real users were recruited or contacted. Email collection was disabled before actual guest submissions; the confirmation UI explicitly stated that no email was sent. The `example.test` address was used only in a local preview.

| Record | ID | Final state |
| --- | --- | --- |
| TEST — Teacher Conferences Retest | `e1492bac-58ad-417c-a997-98d1d95751f9` | Published, closed, zero active reservations, one cancelled fictional response |
| TEST — Room Mom Fall Party Retest | `87e831a2-97b4-4abe-b1e9-78f8dd17ab6f` | Published, closed, zero active reservations, one cancelled fictional response |

Public test paths: `/smart-signup-form/test-teacher-conferences-retest` and `/smart-signup-form/test-room-mom-fall-party-retest`.

Evidence in `signup-persona-2026-09-19/` includes the isolated new form, both reopened forms, the teacher form after the mom save, anonymous confirmation/update/cancellation and final closed views. `retest-mobile-mixed.png` shows the mobile guest preview; `retest-teacher-updated.png` shows the four-appointment board with the revised second appointment selected. Screenshots show a viewport, not the complete scrollable page; text snapshots record the full accessible state.

## Limits before a real-user pilot

Restricted/private access and legacy flag preservation were tested with automated behavior/route/render checks, not a newly restricted live browser fixture. Real email delivery, cross-device email recovery, account registration, physical-phone gestures, AI custom themes, timed reminders, and a complete large carnival remain outside this retest. Automatic reminders are explicitly described as unavailable. No changes were deployed in this task.
