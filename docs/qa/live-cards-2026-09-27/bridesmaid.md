# Bridesmaid Live Card workflow test

Simulated persona feedback, not feedback from a real human participant. Tested the actual signed-in UI on `http://localhost:3000/live-cards`; no API or database shortcuts. No invitations, emails, guest responses or calendar entries were sent.

## Scenario

- Persona: Ava, a bridesmaid coordinating a warm, polished bridal shower.
- Title: Sophie’s Garden Bridal Shower
- Date: Sunday, September 27, 2026
- Time: 1:00–3:00 PM, event-local time
- Venue entered: Garfield Park Conservatory, Chicago
- Design: immersive glasshouse garden, blush/ivory roses, sage foliage, romantic expressive lettering, luminous afternoon light.
- Opening line: Join us to celebrate
- Message: Please join us for tea, sweet treats, and a joyful afternoon celebrating Sophie before her big day. Hosted with love by Ava and the bridesmaids.
- Additional guidance: Garden party attire is welcome. Please let Ava know about any dietary needs when you RSVP.
- RSVP: enabled, fictional Ava, reserved fictional number `202-555-0103`, `bridesmaid.qa@example.com`, reply by September 26, 2026.
- Registry: enabled with synthetic QA placeholder `https://example.com/sophie-registry`; gift message explicitly identifies the placeholder.
- Intended outcome: private saved draft, including finished artwork; no publication.

## Observed workflow

1. Opened the local Live Card builder in a dedicated browser tab. Existing authenticated account was available.
2. Selected Bridal shower, supplied a custom art direction, and chose Generate & continue.
3. The UI immediately opened Event details while the artwork generated. Entered title, opening line, message and guidance concurrently. No entered text was lost.
4. Artwork was ready within approximately 35 seconds (upper bound from next observation). The generated scene visually matched the glasshouse, flowers, table and warm light requested.
5. Entered date, start/end times and the venue name. Review became available once required facts were present.
6. Enabled RSVP; inline missing-field links clearly identified Host name and Host phone. Supplied fictional contact details and deadline.
7. Enabled Registry; its missing-link requirement immediately appeared. Added the safe placeholder link and gift message.
8. Selected Review. All step navigation, Save draft, Publish and Preview were disabled during preparation. The status initially said “Preparing your Live Card…” and changed to “Drawing your title and opening line…” by approximately 27 seconds.
9. Review succeeded by approximately 79 seconds. The app resolved the venue to **Garfield Park Conservatory, 300 N. Central Park Ave., Chicago, IL 60624**, showing local time in Chicago. No venue-choice intervention or generation retry was needed.
10. Visually inspected finished artwork: exact opening line and title, expressive burgundy calligraphy for Sophie’s Garden, contrasting formal Bridal Shower lettering, detailed glasshouse scene retained. No visible spelling errors or cropped title.
11. Opened the dark full-screen preview. Artwork fit the viewing surface with Save draft and Publish below it. Opened and closed all five guest popups without moving the artwork. Overview and Calendar showed **Sunday, September 27 at 1:00 PM–3:00 PM**. Overview retained both guest messages. RSVP showed Ava, the fictional contacts and September 26 deadline. Registry showed example.com; no outbound registry, directions, calendar or RSVP action was taken.
12. Clicked Download invitation. No app error appeared; completion/file format/content could not be verified (see limits below).
13. Chose Save draft inside full-screen preview. It returned to Review with “Saving…”, then showed **“Draft saved. Find it in Drafts anytime.”** within approximately 12 seconds. The URL gained the saved event ID and the Drafts counter increased.
14. Reloaded the saved editor. It reopened Event details with the finished lettering artwork. Verified the title/opening line, date `2026-09-27`, start `13:00`, end `15:00`, local Chicago timezone label and resolved venue. Also verified enabled RSVP, Ava, fictional phone/email, deadline, enabled Registry, placeholder URL and gift message. Save draft remained disabled with no new edits.

## Result

**Saved successfully as a private draft.** Never published.

- Event ID: `fe205a9b-b09a-48a8-a1f3-bbc2ac48f070`
- Local editor: [Open Sophie’s Garden Bridal Shower](http://localhost:3000/live-cards?edit=fe205a9b-b09a-48a8-a1f3-bbc2ac48f070)
- Date and duration persisted: Sunday, September 27, 2026, 1:00–3:00 PM, local Chicago time.
- Finished artwork persisted through reload. Share remained visibly disabled for the private draft.
- No product error blocked generation, Review, save or reopen in this scenario.

## Persona feedback

- The Design → Event details transition made the first wait productive: I could write the invitation while the background was being drawn.
- The rich conservatory scene feels appropriate for a bridal shower and supplies enough atmosphere without needing a reference upload.
- The separate guest message and practical guidance disclosures are useful. Their helper copy clearly explains that these details live in Overview rather than on the artwork.
- Required-field guidance is compact and specific. Turning on RSVP or Registry immediately makes the new requirement clear.
- Review preparation is less informative than the initial generation experience. The form remains on screen while actions are disabled; the generic first status does not reveal whether the venue or wording is being checked. A bridesmaid trying to finish before sending invitations would benefit from clearer stage-specific status and a way to return to editing during preparation.

## Improvements, in priority order

| Priority | Observed issue | Why it matters / suggested change |
| --- | --- | --- |
| P2 | The Review summary shows only “Sep 27, 2026, 1:00 PM Local time in Chicago,” omitting the entered 3:00 PM end time. | A host cannot verify the complete schedule in the final summary. Display the full date and time range there, as already shown in Overview and Calendar. End time was correctly saved, so this is a summary omission rather than data loss. |
| P2 | Review preparation locks step navigation, Preview and Save while showing a generic initial status. It took up to ~79 seconds overall in this run. | Show the actual venue/wording/lettering stage consistently and offer a safe return to editing before persistence starts. Long waits feel less certain when the form remains visible while primary actions are unavailable. Editing text fields during preparation was not tested. |
| P3 | The Location action says “Directions to Garfield” for Garfield Park Conservatory. | Keep the complete recognizable venue name, or simply use “Get directions.” The first word alone is less trustworthy and can read like a person’s name. |
| P3 | The optional gift message appears in Overview, but the Gift Registry popup contains only the registry name/domain/button. | A bridesmaid placing “your presence is the sweetest gift” beside the gift link reasonably expects that guidance to appear with the registry. Repeat it in that popup or explain its destination beside the field. |
| P3 | On reopening an existing saved card, the main heading still says “Create your Live Card.” | “Edit your Live Card” plus a subtle saved-draft indicator would reassure the host that they reopened the existing invitation. The URL and disabled Save button do convey state, but less directly. |

## Limits and tool observations

- This is simulated desktop persona testing, not a real participant study, mobile test, or cross-browser accessibility audit.
- The existing signed-in account was used; no new user account was created. All event/person/contact details are fictional, and the gift list is an explicit QA placeholder.
- Download was invoked once. Opening the browser’s downloads page for completion verification was blocked by browser security policy. No workaround was attempted; the report therefore does **not** claim that a JPEG finished or that its pixels/QR codes were verified.
- The browser observation briefly reported a detached debugger during reload. The next UI observation succeeded and confirmed the saved draft; this was a browser-tool interruption, not an observed Envitefy application error.
- No publishing, guest RSVP submission, email, invitation, directions launch or external calendar save was performed.
- Timings are approximate observation upper bounds, not instrumented server durations.
