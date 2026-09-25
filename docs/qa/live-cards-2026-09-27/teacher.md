# Teacher Live Card workflow test

Simulated teacher usability test, performed September 24, 2026, in the local application at `http://localhost:3000/live-cards`. This is an agent persona walkthrough, not feedback from an actual teacher. All scenario names and contacts are fictional. No guest messages, invitations, calendar saves or RSVP submissions were sent.

**Completed and saved as a private draft.** [Open the saved teacher Live Card](http://localhost:3000/live-cards?edit=dd56be08-b632-4bdb-b9a4-1cd9138a3a30).

Event ID: `dd56be08-b632-4bdb-b9a4-1cd9138a3a30`. The draft was reloaded and its artwork, exact title, opening line, date, start/end times, venue, guest wording, RSVP contact/deadline and disabled registry were verified through the UI. Publish was not selected; Share remained disabled for the private draft.

## Scenario

- Persona: Ms. Morgan, elementary classroom teacher inviting families.
- Event: **Room 12 Family Reading Picnic**.
- Date: **Sunday, September 27, 2026**.
- Time: **10:00 AM–12:00 PM**, local to Chicago.
- Venue: Lincoln Park Conservatory; application resolved **2391 N Stockton Dr., Chicago, IL 60614** without a clarification step.
- Opening line after automatic proofreading: **Read, relax, and connect**.
- Design: storybook picnic, books, blankets, trees and warm sunlight; watercolor texture, sage/gold/sky blue.
- RSVP enabled. Host **Ms. Morgan**, reserved fictional phone **202-555-0102**, **teacher.qa@example.com**, reply by **September 26, 2026**.
- Registry disabled.
- Guest message welcomes caregivers and siblings, with a favorite book, blanket and water.
- Additional notes require an accompanying caregiver, meeting outside the main entrance, contacting the host about seating/access, and checking with the host if rain is expected. Notes explicitly identify this as a fictional workflow test.

## Observed workflow

1. Selected General event and wrote a design brief. Generate & continue immediately opened Event details while artwork generated.
2. Entered Basics and practical notes concurrently with generation; changes survived the generation failure and retry.
3. First artwork attempt was rejected with: “The background included unwanted lettering or did not match the design. Your previous artwork is unchanged; please try again.” The UI did not identify which condition failed, and there was no previous artwork.
4. Retried once with the same brief. The second attempt succeeded, showing a warm family reading picnic with books, blankets, baskets, trees and the Chicago skyline.
5. Entered the explicit date, start/end times, venue, RSVP contacts and deadline. Left Registry off.
6. Review resolved the venue and displayed “Times are local to Chicago.” Automatic proofreading added a comma to the opening line, then lettering generation began.
7. Review finished successfully on its first attempt, about one minute after selection. The finished artwork preserved the family scene and rendered the full correct title in distinctive dark green and rust storybook lettering. The complete card fit within the full-screen preview, with readable guest buttons and Save draft beneath it.
8. Opened every guest popup. Overview showed **Sunday, September 27 at 10:00 AM–12:00 PM**, the family welcome and all practical notes. Its long text fit inside the card with a visible Close control. Location showed the resolved venue/address. RSVP showed the intended host/contact/deadline. Calendar showed the correct complete time range and three provider choices; no external calendar was opened.
9. Selected **Download invitation** in full-screen preview. No visible app success message or failure followed. Download initiation was exercised, but completion, JPEG encoding and downloaded composition were not verified.
10. Selected **Save draft** in full-screen preview. It closed the preview, showed Saving, then changed the URL to the saved edit ID. Save draft became disabled after persistence. No conspicuous saved-success wording was seen.
11. Reloaded the saved URL. It reopened in Event details with the finished artwork. Verified date `2026-09-27`, start `10:00`, end `12:00`, Chicago-local venue, contacts and September 26 reply deadline, full Overview wording and Registry off. No unwanted regeneration or lost field was observed.

The application walkthrough ran roughly 02:47–02:53 UTC on September 25 (the evening of September 24 in Chicago). Timings are observation estimates, not performance measurements. There were two background generation attempts and one lettering attempt.

## Early observations

- Working on details while artwork generated was useful and preserved all work across retry.
- The three-stage flow and separate Basics / When & Where / RSVP / Registry tabs were easy to follow.
- No School or classroom category exists. General event is usable, but the four initial ideas (disco, rooftop, movie, wellness) did not help this teacher scenario.
- Required host phone may discourage teachers who prefer school email; this is current product policy, not a regression. Explain clearly that a school-controlled contact number may be used and that downloaded invitations display it.
- Meeting and access notes had to go in Overview; the location entry exposed venue name only.

## Prioritized improvements and actual errors

| Priority | Evidence | Teacher impact and suggested improvement |
| --- | --- | --- |
| High | First background generation returned the combined “unwanted lettering or did not match the design” rejection; retry of the unchanged brief succeeded. | Recoverable, but the teacher cannot tell what to change. Give the actual failed check and actionable next step, retain edits, and use first-generation wording instead of “previous artwork is unchanged” when there is no prior artwork. The rejected image was not displayed, so this test cannot establish which condition failed. |
| Medium | Review's When summary showed only `Sep 27, 2026, 10:00 AM Local time in Chicago`; the editor, Overview and Calendar correctly retained noon. | Show the complete time range in the final review summary. A teacher should verify the expected finish and family pickup plan without opening another popup. This is a summary omission, not lost end-time data. |
| Medium | Location's directions button read **Directions to Lincoln**, while the venue was Lincoln Park Conservatory. | Use the full venue name or “Get directions.” The shortened word can sound like a person or a different place. |
| Medium | The main-entrance meeting note and accessibility contact instructions appeared only in Overview, not Location. | Offer an optional meeting-point/access note associated with the venue, then surface it next to directions. This is a workflow improvement, not a failure to save the supplied notes. |
| Low | General event suggestions were unrelated to an elementary classroom picnic. | Add a school/family gathering idea or occasion category to reduce design-brief effort. |
| Low | Successful saving was inferred from the new edit URL and disabled Save draft; download click gave no visible completion cue. | Add concise saved/download-started status text. Never claim download success before the browser confirms it. |

## Simulated teacher feedback

“The book-and-picnic artwork feels inviting, and being able to write family instructions while it generates saves time. I could keep siblings, caregiver supervision and access information together. I would want the review screen to show the noon finish, the directions popup to repeat where families should meet, and the generation error to tell me whether I should change my description. I also want a clear Saved confirmation before I close the page.”

This quotation is a synthesis from the agent's assigned persona, not a statement collected from a real person.

## Environment limitation

Initial Chrome extension control failures delayed entry. They occurred before application interaction and are not classified as Envitefy errors. The test recovered in its own local browser tab. Production was not used for creation.

Desktop viewport only. Mobile layouts, anonymous guest access, publication, real RSVP submission, email delivery and external calendar saving were intentionally not exercised. Local filesystem access to Downloads was denied, so the invitation file's actual completion and pixels remain unverified. No application code was changed during this walkthrough.
