# Teacher and parent signup creation audit

Date: September 19, 2026.

Follow-up implementation and retest: [Signup remediation and retest](signup-teacher-parent-retest-2026-09-19.md). The findings below record the original, pre-fix behavior.

## Result

The basic teacher and room-parent journeys work: create sections, set quantities, preview rules, explicitly save, reopen, publish, accept an anonymous parent, change a booking, and cancel it. The highest-priority problem is starting another form: choosing a gallery template can silently reuse an unrelated saved draft and its existing event ID.

This was a simulated persona walkthrough of the real browser UI, not research with recruited teachers or parents. Findings describe the local working tree tested on September 19. No application code was changed for this audit.

## Coverage

| Persona and goal | Exercised | Result |
| --- | --- | --- |
| Classroom teacher: four 15-minute conferences, one appointment per parent, required classroom answer | Template discovery, time generation, date/timezone, preview validation, save/reopen, publish, host response details | Completed; discovery and starter-slot friction; misleading access instructions |
| Room mom on a 390 × 844 viewport: two setup helpers, one cleanup helper, fruit, juice and napkins | Mobile section picker, item capacities, instructions, section reordering, mixed-role/item preview, explicit save/reopen, publish | Completed; mixed signup accepted and saved content preserved |
| Parent receiving the teacher's link | Anonymous reservation, edit to another appointment, reload, cancellation | Completed without an account; original capacity released and cancellation persisted |
| PE teacher: Field Day instructions, shifts, supplies and classroom question | Added the starter to an existing form; checked existing sections stayed intact | Focused check passed; no separate Field Day event published |
| PTA organizer: repeated station sections | Duplicated the Field Day volunteer section on mobile; tested leaving with unsaved changes and discarding | Duplication worked; saved class-party content survived discard. A full large carnival was not built |
| Mom starting a separate potluck after saving the class party | Returned to gallery and selected Harvest Table | Failed form isolation: the class-party draft was restored under Harvest Table, including its existing event ID |
| First-time creator with no account or saved draft | Opened a clean Harvest Table editor, previewed an empty form, followed the missing-title error | Blank content stayed blank; validation listed missing title/slots and returned focus to Edit event title. Account creation was not attempted |

## Findings, in recommended order

### 1. P1 — Choosing a new gallery template can update the wrong saved form

**Expected:** A mom finishes saving a class-party draft, then picks a potluck design to begin a different signup. The new signup should start with the chosen artwork and blank event details.

**Observed:** The School Days class-party draft was explicitly saved and reopened successfully. After returning to the gallery and choosing Harvest Table through its ordinary Customize link, the editor showed `TEST — Room 3 Fall Class Party`, its helper roles, and its supply quantities. There was no explicit choice to resume that event. Publishing retained event ID `298bec5c-8d4a-4e84-b101-7daf855cc730`, and the resulting event's Edit link used `editorial--harvest-table`.

**Impact:** A teacher or parent trying to create their next signup can unknowingly alter the previous draft instead. This is particularly risky when organizing several classes or events.

**Reproduction:**

1. Choose School Days, enter a distinctive title and sections, and Save draft.
2. Return to Signup forms templates.
3. Click Customize on another design, without using Continue your browser draft.
4. Observe the old title and content under the new design.
5. An explicit save/publish targets the existing record rather than a new record.

**Source corroboration:** `src/components/templates/TemplateEditorContext.tsx:232` calls `readTemplateDraft(category, requestedDraft || undefined)` even when no draft was requested. `src/lib/template-draft-storage.ts:48` returns the most recently updated draft in the category when no ID is supplied. The context's following template-change branch replaces appearance while retaining the snapshot and event identity. The custom AI theme handoff has a separate isolation path; that passing regression does not protect ordinary gallery selection.

**Recommended fix:** Only restore a draft for an explicit resume/edit action. Ordinary gallery selection should create a fresh in-memory form. Keep an explicit in-editor design change capable of preserving the current form. Add a regression covering save form A → select template B → save form B, verifying two event IDs and unchanged form A.

### 2. P1 — Publishing instructions contradict actual guest access

**Observed in Preview & publish:** The “Who can sign up?” paragraph says the link alone does not grant signup access, participants need an Envitefy account, and invited contacts must accept an invitation.

**Observed on the same form:** The guest preview says “No account needed.” After publishing, Share your signup says anyone with the link can sign up. An anonymous browser on the separate `127.0.0.1` origin successfully reserved, edited, reloaded and cancelled a conference appointment. No invitation or login was required, and no host controls were exposed to that anonymous parent.

**Impact:** An organizer can abandon sharing because they think every parent must register. Conversely, someone may believe publishing creates an invitation-only form when it actually allows guests with the link.

**Source corroboration:** The invitation-only paragraph is hardcoded in `src/components/smart-signup-form/Wizard.tsx:126`.

**Recommended fix:** Show access copy derived from the actual saved/pending access setting. Ordinary published forms should say anyone with the link can sign up; restricted forms should explain their specific requirements. Use the same access model in editor, preview, published page, and sharing controls.

### 3. P2 — Generated appointment lists retain untimed starter slots

**Observed:** Adding Time slots created “First shift” and “Second shift,” each with capacity one and no times. Generating 15-minute appointments from 3–4 PM added four more slots. Preview therefore exposed six bookable choices, including the two untimed starters. The generated appointment names were “Volunteer shift 1” through “Volunteer shift 4.”

**Impact:** A teacher expecting four conferences can share extra, ambiguous appointments. The creator must manually remove two starter rows and rename the volunteer wording.

**Evidence:** `signup-persona-2026-09-19/01-conference-preview.png` shows the two untimed starters followed by generated appointments. They were removed before the live test form was published.

**Source corroboration:** `src/lib/signup-composer.ts:34` defines the initial shift labels. `src/components/smart-signup-form/SignupSectionRules.tsx:134` appends generated slots to all existing rows.

**Recommended fix:** Offer a clear choice to replace untouched starter rows or append to existing real slots. Preserve rows with responses. Consider appointment-specific wording and flag untimed appointment rows before publishing. Do not silently delete authored slots.

### 4. P2 — Reminder promises have no discoverable signup workflow

**Observed:** The landing page promises targeted reminders, and the participant field says “Email for reminders.” In the tested editor Settings and the published Host dashboard, there was no visible reminder schedule, Send reminder action, recipient selector, or reminder delivery status. Host actions provided search, export and close/reopen.

**Impact:** A room mom or PTA organizer may assume reminders are handled and only discover later that they cannot find how to configure or verify them.

**Source corroboration:** `src/components/smart-signup-form/SignupSettingsEditor.tsx` exposes contact requirements, limits, waitlists, names, and signup windows, but no reminders. `SignupBuilder.tsx` contains unused underscore-prefixed reminder helpers. A scoped search found reminder data/defaults but did not establish an active signup reminder-sending workflow.

**Recommended fix:** Expose the actual supported reminder behavior with timing and delivery status, or narrow the promises until that workflow exists. This finding is about discoverability and expectations; timed email delivery was not exercised, so it is not a measured delivery failure.

### 5. P3 — Teachers must guess design-search vocabulary

**Observed:** “parent teacher” and “class party” each returned zero templates. “conference” returned Conference Schedule under Business & Professional. “school” returned School Days and Sunday School.

**Impact:** Common school tasks look unsupported even though the builder can handle them.

**Recommended fix:** Search use-case aliases such as parent–teacher conferences, classroom party, room parent, class celebration and appointments. Offer a suitable general design or starter when an exact use case has no named design. Keep searching by style available.

## What worked and should be preserved

- New clean forms had empty event details; the conference and School Days designs carried into the initial editors.
- Event date, end time and timezone displayed as October 22, 2026, 3–4 PM CDT and survived the teacher draft save/reopen.
- Preview rejected two appointments with a one-choice section limit, and accepted the corrected single choice.
- Missing selections/contact/required answers produced a clickable error summary and field-level messages. Errors cleared as the relevant values were corrected.
- A separate anonymous, fresh editor identified a missing title and missing slots before publishing. Clicking the title error returned to Build with focus on the title pencil.
- A valid preview clearly said no submission or reservation was made.
- Mobile class-party preview accepted one setup role plus two packs of juice. Supply quantities did not create an extra-guests field.
- Section move buttons worked at phone width. The sampled editor had `scrollWidth === innerWidth === 390`, with no page-level horizontal overflow.
- The Field Day starter appended its sections without replacing existing content; section duplication worked.
- Save-and-return preserved the teacher draft. The mom's saved draft reopened with just Volunteer roles and Snacks and supplies after later Field Day/duplicate experiments were discarded through the unsaved-progress dialog.
- An anonymous parent reserved 3 PM, changed to 3:15 PM, and retained the revised booking after reload. The teacher saw the required classroom answer in Participant details.
- Parent cancellation restored all four conference places. The host saw zero confirmed responses and the cancelled audit entry.
- Both test forms were closed through the Host dashboard. The final views displayed the closed message, disabled booking controls, and Reopen signups.

## Test records and retained evidence

Only newly created, clearly labeled fictional test forms were modified. No pre-existing user event was edited. No invitations or messages were sent to real people. The live conference form did not collect email, and its confirmation explicitly said no email was sent. Addresses entered in guest previews used `example.test` and were not submitted.

| Record | ID | Final verified state |
| --- | --- | --- |
| TEST — Maple Grove Parent Conferences | `bceb929c-3c71-4b4d-a346-eb9fbf372730` | Published, signups closed, zero active reservations, one cancelled fictional response |
| TEST — Room 3 Fall Class Party | `298bec5c-8d4a-4e84-b101-7daf855cc730` | Published, signups closed, zero responses; Harvest Table appearance after reproducing finding 1 |

Local paths (use a running app against the same configured database):

- `/smart-signup-form/test-maple-grove-parent-conferences`
- `/smart-signup-form/test-room-3-fall-class-party`

Screenshots in `docs/qa/signup-persona-2026-09-19/`:

- `01-conference-preview.png`: untimed starter slots beside generated appointments.
- `02-parent-confirmed.png`: confirmed anonymous parent reservation.
- `03-mobile-add-items.png`: mobile section controls and supply editor.
- `04-mobile-mixed-preview.png`: successful local preview with a helper role and multiple supply units.
- `05-first-time-validation.txt`: empty-form validation and accurate organizer account requirement in the fresh anonymous editor.
- `final-class-party.txt`: final closed-state UI and Edit link identifying the changed design.

The screenshot API captured the currently visible scroll surface; these images should not be read as exhaustive captures of every element on the page.

## Automated verification and limits

72 targeted regression tests passed, zero failed:

```text
node --test src/lib/signup-field-day.test.mjs src/lib/signup-guest-access.test.mjs src/lib/signup-themes-workflow.test.mjs src/components/smart-signup-form/signup-preview-markup.test.mjs
```

These are supporting unit/source/route tests, many with mocked services. They do not substitute for the browser findings or prove production capacity. The ordinary gallery draft-isolation failure was observed despite these tests passing.

The existing port-3000 development server could not reach the database, so the persisted journeys ran on a separate network-enabled development server on port 3001, using the app's configured database. The separate QA server was stopped after verification, and Chrome's temporary mobile viewport was reset. Compilation delays and browser-control timeouts were excluded from product performance conclusions. The workspace had unrelated edits before this audit and continued to receive hot reloads; no claim is made that these observations exactly match the deployed production version.

Not covered: recruited human participants, physical-phone touch/keyboard behavior, real email delivery or cross-device email recovery, new-account registration, AI custom-theme generation, a complete large carnival, actual timed reminders, and CSV file contents. The attempt to start the separate potluck uncovered draft reuse; it was not completed as an independent third published form.

Fix form isolation and access instructions first, then re-run the teacher/mom journeys before recruiting real users.
