# Field Day signup: teacher-to-parent UX audit

Date: September 18, 2026. Tested the local app through its browser UI at desktop size and a 390 × 844 mobile viewport.

## Result

Created, saved, resumed, published, and submitted a fictional school signup. Creation and persistence worked, and the server enforced the two-slot limit. The most serious issue is the recovery path after submission: a waitlisted person cannot save a correction or cancel, and the teacher has no action controls on that waitlist entry.

This was an audit, not a fixes pass. Existing application changes were left intact.

- [Published test form](http://localhost:3000/smart-signup-form/test-maple-grove-field-day-at-school-playing-field)
- [Edit test form](http://localhost:3000/signup-forms/templates/editorial--school-days/customize?edit=26662ddc-e4c6-4fff-ace0-6017cadcc7b0)
- Event ID: `26662ddc-e4c6-4fff-ace0-6017cadcc7b0`
- Final state: published, with one clearly named fictional waitlisted response, zero confirmed places, and the original section order restored.

## Scenario

Acted as Ms. Taylor at a fictional Maple Grove Elementary, organizing Field Day on October 23, 2026, from 9 AM to noon in America/Chicago. Chose the School Days design after searching the gallery.

Built three sections:

1. Before you arrive: front-office check-in, photo ID, footwear, water bottle, and rain-date instructions.
2. Games station volunteers: 9–10:30 AM and 10:30 AM–noon, two parents per shift.
3. Snack and water donations: six 24-packs of water, eight bags of oranges, and four packs of napkins.

Added a required grade/teacher question, email and phone collection, a two-slot limit, quantity limit of three, waitlisting, remaining-place display, and hidden participant names. Used fictional parent details and `parent@example.test`. No invitations were sent to real parents. The live submission may trigger the app's confirmation-email attempt to that non-deliverable test address; email delivery was not tested.

## What worked

| Check | Observed result |
| --- | --- |
| Choose a template and start a new form | Chosen design carried into the editor; content could be authored from scratch. |
| Inline event editing | Title, organization, welcome, organizer, date/time, and location could be edited. |
| Add and arrange sections | Information, time slots, and donation items worked. Arrow reordering worked. Keyboard drag pickup, movement, drop, and cancellation worked; final order was restored. |
| Explicit draft save and resume | Content, order, capacities, questions, and settings survived leaving and reopening through Drafts. |
| Publish | Opened the published form with the authored content. |
| Live maximum-slot validation | Selecting three slots with a limit of two was rejected with “Choose no more than 2 slots per person.” A visible failure dialog appeared. |
| Live capacity protection | A request for three volunteers where only two fit became waitlisted; confirmed capacity was not overbooked. |
| Persistence after submission | The waitlisted response appeared in the host dashboard and survived reload. |
| Existing-response protection in editor | Removing the occupied sections/slots was disabled with an explanation. |
| Mobile width | No page-level horizontal overflow in the sampled editor and published page. |

## Prioritized findings

### P1 — Submitted signups have no reachable correction/cancellation path

**Reproduction:** Submit the test response, dismiss the confirmation, and try to change the quantity or cancel. Quantity/select controls remain enabled, but there is no Save, Update, Edit signup, or Cancel my spot action. The host's Waitlist entry also has no Edit or Remove action. Changing the morning quantity from three to one appeared locally, but reloading restored three.

**Impact:** A parent cannot recover from an accidental quantity, choose another shift, or withdraw. The teacher cannot correct this waitlist entry through the visible dashboard.

**Recommendation:** Give every existing response a persistent “Edit my signup” and “Cancel signup” action. During editing, show Save changes and Cancel; outside editing, show the saved selections as a summary. Add teacher management actions for waitlisted entries too.

**Source corroboration:** `SignupViewer.tsx:953` hides the form when `myResponse` exists unless `editingResponse` is set. The participant cancellation control is inside that hidden form. Host edit/remove controls are rendered for confirmed responses, but not the waitlist branch at line 1323. The browser reproduction was on the owner account's own waitlisted response; the shared rendering logic suggests the participant path needs the same repair.

### P1 — Preview gives false success for selections the live form rejects

**Reproduction:** With a two-slot limit, select three slots in the interactive preview and complete the required details. Preview reports “Test signup complete.” The live page rejects the same three-slot selection. Preview also accepts a quantity of three for the morning shift with capacity two without explaining waitlisting.

**Impact:** A teacher cannot use the preview to validate the rules parents will experience.

**Recommendation:** Run the same selection, quantity, required-answer, availability, and waitlist decision logic in preview and live submission. Preview should clearly distinguish a simulated confirmation from a simulated waitlist result, without saving either.

**Source corroboration:** `SignupViewer.tsx` returns preview success before the server-side checks in `signup-mutations.ts`.

### P1 — An oversized volunteer request waitlists an available donation too

**Reproduction:** Select morning helper ×3 (only two places available) and water ×1 (six places available). Submit. The entire response becomes waitlisted, including the water. Water still reads six open, now also showing “Waitlist 1.” Both selections display “You're signed up,” while the overall status says Waitlisted.

**Impact:** Available donations are not committed, and a parent has conflicting signals about whether help is confirmed. In this example a request for three cannot ever fit a two-place shift unless its quantity or capacity changes.

**Recommendation:** Warn at selection time about the available quantity. Separate confirmed and waitlisted selections, or explicitly ask the parent to accept an all-or-nothing waitlist. Use “Waitlisted” on affected slot cards and make correction immediately available.

**Source corroboration:** `signup-mutations.ts:189` checks whether any selected slot is over capacity and line 208 assigns one status to the entire response.

### P2 — Volunteer shifts, donation quantities, and extra guests share unsuitable global rules

**Observed:** I could not enforce “one volunteer shift per parent” while permitting several donations. The maximum-slot rule applies across the entire form. Increasing the quantity limit to three also adds “Extra guests (for headcount)” to the parent form, although I intended three donated packs, not extra attendees. The dashboard combines four volunteer places and eighteen donation units into one total of 22.

**Recommendation:** Give sections meaningful types and rules: volunteer shifts count people, donations count named units, and attendance counts guests. Support per-section selection limits and separate guest headcount from item quantity. Summarize staffing and supplies separately.

### P2 — Sharing access is unclear at the moment a teacher needs to distribute the form

**Observed:** The editor says only invited contacts can sign in after accepting an invitation and that the page link alone grants no signup access. The published page offers a generic Share event action, without an obvious invite-management or audience setup step in this creation flow.

**Impact:** A teacher expecting to paste a link into a school newsletter may publish successfully without having made the form usable by those parents.

**Recommendation:** Before distribution, clearly show the current audience and what recipients must do. Provide a concrete copy-link/invite workflow with a recipient-access check. If link-based school participation is a product requirement, make it an explicit, deliberate access option; do not silently change the current privacy defaults.

**Scope:** The page/API access restrictions were corroborated in source. A separate invited-parent or anonymous session was not exercised. Share event produced no observable copy confirmation/dialog in this embedded browser, so clipboard/native-sharing success remains unverified rather than classified as a confirmed app defect.

### P2 — Preview validation feedback is easy to miss

**Observed:** Missing-selection and missing-required-answer messages appear above the long section list, far from Test signup. The required-question message is generic (“Answer all required questions”) and does not focus or identify the field inline. An old missing-selection error remains after choosing a slot until another submission. Preview success disappears after four seconds; repeating the same successful test did not show the message again until reopening preview.

**Recommendation:** Put errors beside their fields and a persistent summary beside Submit, focus the first invalid field, clear resolved errors as inputs change, and give each test attempt visible feedback. Keep this scoped to preview/client validation: the live server rejection did show a clear dialog.

### P2 — Time-slot creation hides the main fields

**Observed:** Adding Time slots gives starter shift labels, but start/end inputs are hidden inside Time & notes for each slot. Making just two shifts required opening each disclosure and entering each range manually.

**Recommendation:** Show start/end fields by default for a time-slot section. Offer a small “Generate shifts” helper with event day, start/end, interval, and volunteers per shift. Keep notes optional.

### P2 — Required classroom answers are missing from the teacher's onscreen response view

**Observed:** The parent supplied “Grade 3 — Ms. Taylor,” but the waitlist entry displays only name, timestamp, and selected slots. There is no response-details action. The required answer is therefore not usable in the visible teacher dashboard.

**Recommendation:** Add a participant details view showing answers and contact fields, with school-friendly filtering by grade/classroom. The CSV exporter includes question answers in source, but export delivery was not tested; downloading a spreadsheet should not be the only way to inspect an answer.

### P2 — Participant search collapses on mobile

**Observed:** At the 390 × 844 viewport, the host dashboard puts search, Export CSV, and Close signups on one row. The search input measured approximately 38 pixels wide and displayed only a fragment of its placeholder.

**Recommendation:** Put participant search on its own full-width mobile row, with the two actions below it.

### P2 — Edit opens Preview & publish instead of editable content

**Reproduction:** Publish the form, click its Edit action, and wait for the editor to load. It reopens Preview & publish; the teacher must find Back to editing at the bottom to reach the fields.

**Recommendation:** An Edit action should open the build view, preferably at the last edited section. Keep the last preview state for explicit preview navigation only. Also adapt the draft/publish toolbar copy when editing an already published form.

### P3 — Gallery discovery does not match a teacher's intent

**Observed:** Searching “field day” returned no templates. Searching “school” found School Days and Sunday School. No School/Education style category was available.

**Recommendation:** Search use-case tags and synonyms as well as design names. Add an optional Field Day starter with volunteer shifts, supplies, instructions, and classroom question; allow each section to be removed. Selecting a visual theme should still lead directly to building.

### P3 — Date context and drag announcements need polish

The editor preview showed the event's start but not its noon end; the published page did show the end in a separate planning area. Neither sampled display clearly named the timezone. Show one understandable date/time range consistently. Keyboard drag worked, but its live announcement read an internal identifier such as `sg-mup1hvl5`; announce the section title and position instead.

## Recommended workflow

1. Choose a theme and open the editable page immediately.
2. Edit the event heading, date range, location, and instructions inline.
3. Add clearly typed sections: Volunteer shifts, Items to bring, Attendance, Information, and Questions. Keep styling in the optional Design panel.
4. Configure rules next to each section, using “parents,” “packs,” and other meaningful units. Offer shift generation where relevant.
5. Preview the same validation, capacity, waitlist, and confirmation experience parents will receive.
6. Publish into a concrete distribution screen showing the link, audience, and recipient requirements.
7. After submission, show a durable confirmation with exact commitments and reachable Edit/cancel actions. Give the teacher per-section progress and participant details.

Fix response recovery and preview/live validation parity first, then section-specific rules and sharing clarity. The current two-view Build → Preview approach is sufficient; adding more wizard steps would not solve these problems.

## Limits and retained evidence

- Used the signed-in owner/admin account with fictional parent fields. Independent parent authentication, invitation acceptance, ordinary-user menu permissions, and actual email/SMS delivery were not tested.
- The live submission reached a persisted waitlist result, not a confirmed reservation. A correction to a valid quantity was blocked by the missing update path. No API or database bypass was used to manufacture a successful result.
- No real parent invitations were sent, no existing user events were edited, and the test form/response remain available for reproduction.
- Tested narrow viewport layout, keyboard drag, and arrow reordering. A physical phone and touch dragging were not tested.
- Local save/navigation requests were sometimes slow; this was not treated as a production performance benchmark.
- UI/UX guidance used the skill's accessibility, responsive-layout, and form-feedback priorities. Its optional local search script could not run with the available Python launchers; recommendations above are grounded in observed behavior and general guidance, not claimed search results.

## Implementation follow-up — September 18, 2026

The observations above describe the original audit. The following fixes were implemented and verified afterward.

| Finding | Applied change |
| --- | --- |
| Missing recovery after submission | Durable Edit my signup and Cancel my signup actions for confirmed and waitlisted responses. Existing choices are read-only until Edit is selected. Cancel edit restores saved choices. Hosts can edit or cancel waitlisted participants as well. |
| Preview/live disagreement | A shared reservation validator now checks overall and section limits, quantities, capacity, signup windows, required contacts, and answers in preview and on the server. Capacity conflicts retain HTTP 409. Preview makes no reservation request. |
| Misleading waitlist results | A quantity larger than a slot's total capacity is rejected. When any choice lacks remaining capacity, the UI explains that the entire submission will be waitlisted and requires explicit consent. Available choices can be confirmed by removing the unavailable choices. This preserves the existing all-or-nothing reservation model; partial confirmation was not introduced. |
| One global limit cannot express a school form | Sections now have a purpose, unit label, maximum choices per participant, and maximum quantity per choice. Overall limits remain optional. Extra-guest headcount is an independent opt-in field. Legacy forms retain their prior quantity default when read. |
| Hidden time fields | Time sections show start/end inputs, with a bounded shift generator using a start, end, interval, and capacity. Generated shifts append without deleting current slots or responses. |
| Distribution is unclear | Published owner pages provide Copy signup link, visible copy feedback, Invite people & check access, and pending/accepted recipient status. The roster endpoint is owner-only and private/no-store. A signed-in pending invitee receives an Accept invitation action. Existing invitation-only permissions remain intact. |
| Classroom answers unavailable onscreen | Participant details show answers and contact fields for confirmed and waitlisted responses. Search includes answer text. |
| Mixed totals and narrow mobile search | Progress is per section, with its configured units. Participant search gets its own full-width mobile row. Displayed remaining capacity includes the parent's already confirmed places. |
| Edit reopens preview | The editor opens Build independently of previously saved preview state. Published-form toolbar wording makes Publish versus Save as private draft explicit. |
| Teacher discovery | School & Education audience filtering and Field Day search keywords were added. The optional Field Day starter adds editable instructions, volunteer shifts, supplies, and a required classroom question without inventing a date or school identity. |
| Date/drag polish | Headers show the start/end range and event timezone. Drag announcements identify section titles rather than internal IDs. Existing drag controls and move buttons remain available. |

### Browser verification

- Corrected the original impossible waitlisted reservation from three volunteers to one. The live result was confirmed, with one morning volunteer and one water pack reserved.
- Cancelled an unsaved quantity edit and confirmed the saved quantity remained one.
- Cancelled the real test reservation through the UI; both capacities returned to zero claimed. Resubmitted successfully. The cancelled record remains in the audit trail, and one active confirmed test response remains.
- Opened the classroom answer, searched for Grade 3, and checked a no-match search.
- Opened the invitation roster (no invitees) and verified Copy signup link feedback. No real invitation was sent.
- Visually checked the 390 × 844 teacher dashboard: full-width search with actions on the next row. Restored the normal viewport afterward.
- Opened the saved editor in Build, configured one volunteer choice with quantity one, donation quantity three, and no overall choice limit. Preview rejected two shifts, accepted one shift plus two donations, and displayed repeatable success feedback. Publishing retained the existing confirmed response and the new section units.
- Searched for Field Day in the gallery, opened School Days, and added the optional starter. Generated six half-hour shifts for 09:00–12:00 and two for 09:00–10:00. Move up worked, and keyboard drag/cancel announcements used section names. The temporary unsaved form was discarded through Save your progress; the draft count stayed at one.

### Automated verification and limits

- **76 tests passed** across signup preview markup, Field Day behavior, planning, theme/workflow, onboarding, and public-template flow suites. These cover response edit/cancel handlers, preview isolation, limits, waitlist consent/promotion, contact privacy, concurrent last-place claims, transactional rollback, draft behavior, and all 150 signup designs.
- Biome passed for 20 affected TypeScript files. Scoped TypeScript checking reported zero diagnostics. `git diff --check` passed.
- The required VS Code diagnostics command was attempted; the local diagnostics bridge was unavailable. TypeScript and Biome checks were used directly.
- Separate invited-parent authentication, actual invitation acceptance in a second account, email delivery, and physical-phone touch dragging remain untested. No real parents were contacted.
- The retained fictional form is `/smart-signup-form/test-maple-grove-field-day-at-school-playing-field` (event `26662ddc-e4c6-4fff-ace0-6017cadcc7b0`). Its confirmed response is Jordan Parent (test), one morning volunteer and one water pack. Preview test submissions were not persisted.
