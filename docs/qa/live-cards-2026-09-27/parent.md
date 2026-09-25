# Parent persona — Live Card workflow test

This is simulated persona testing by an agent, not research with a human participant.

## Scenario and test scope

- Parent persona: Alex Parker, planning a seventh birthday with siblings and caregivers welcome.
- Title: Mia's Woodland Birthday.
- Event: Sunday, September 27, 2026, 2:00–4:00 PM, Maggie Daley Park, Chicago.
- Fictional contact: 202-555-0101 and parent.qa@example.com.
- Environment: signed-in Chrome desktop, local app at http://localhost:3000/live-cards. A production Design page was initially opened; no artwork, draft, or event was created there. The user then directed all work to localhost.
- Intended persistence: explicit private draft; no publication, invitations, guest responses, email tests, or outbound calendar saves.

## Workflow observations

- The blank Design screen offered four ideas immediately, and Generate & continue stayed disabled until the event type and design description were present.
- Birthday selection updated the suggested ideas. The custom brief requested a rich storybook woodland with fox, rabbit, hedgehog, berry birthday cake, layered ferns, autumn light, sage, amber, and coral.
- Generate & continue immediately opened editable Event details. Artwork was ready within 41 seconds of the click; title, guest message, and caregiver guidance were entered during generation without loss.
- Date/time fields accepted September 27, 2026 and 14:00–16:00. Venue entry began with a simple venue name and city, without premature provider errors.
- Enabling RSVP showed Host name, Host phone, optional Host email, and optional reply date. Missing host name/phone blocked Review and Publish with focusable correction links. Used reply deadline September 26, 2026.
- Registry was intentionally left off; no registry control appeared in preview.
- Pre-Review full-screen preview opened after automatic preparation. Overview showed the exact Sunday and 2–4 PM schedule, guest message, and separate caregiver instructions. The RSVP popup showed the fictional host/contact/deadline. Calendar choices were visible; none were activated.
- Preview Share was correctly disabled for the unpublished card. Save draft and Publish remained explicit actions below the artwork.
- Visual inspection before final lettering: immersive woodland scene preserved all requested focal animals and cake. Title was readable plain sans-serif at this stage. All four white guest controls and their labels fit on the artwork, with clear Close and Save draft/Publish controls.
- Minor copy issue both before venue resolution and after save/reload: the button read **Directions to Maggie** for **Maggie Daley Park**. Truncating the venue name to its first word makes this action less clear.

## Completion

- First Review attempt reached “Drawing your title and opening line…” by 54 seconds, then failed by 88 seconds with: **“The generated lettering is clipped or overlaps the guest controls. We tried correcting it once. Your card is unchanged. Please try again.”**
- The app preserved the original artwork and form. One manual retry succeeded within 49 seconds. The original failure is an observed quality-check rejection, not proof that the underlying image was actually clipped: the rejected artwork was never displayed for inspection.
- Review resolved the venue to **Maggie Daley Park · 337 E Randolph St, Chicago, IL 60601**, with **Local time in Chicago**. No manual address or timezone was needed.
- Finished lettering was visually inspected in full-screen preview. It reads **You're invited / Mia's Woodland Birthday** in expressive storybook serif lettering, forest green and rust with small leaves/acorns. The complete wording is legible, fits its title pocket, and preserves the woodland animals, cake, layered scene, and lighting. All four guest controls, Share, Download, Close, and the explicit save/publish actions fit without overlap or clipping at the tested desktop viewport.
- Clicked **Save draft** from the full-screen preview. It closed the preview, showed **Saving…**, then confirmed **Draft saved. Find it in Drafts anytime.**
- Saved event ID: **1d767baf-a163-4276-95e5-2064fd5ebf63**.
- Saved editor: [Open parent Live Card](http://localhost:3000/live-cards?edit=1d767baf-a163-4276-95e5-2064fd5ebf63).
- Reloaded the saved editor URL. It reopened in Event details with the finished lettered artwork. Verified **2026-09-27**, **14:00**, **16:00**, Chicago local time, full resolved venue/address, Host name **Alex Parker**, phone **2025550101**, email **parent.qa@example.com**, and reply deadline **2026-09-26**. The contact fields were verified visually because their values were omitted from the accessibility tree.
- Both guest-message disclosures persisted: woodland games/cake/picnic, siblings welcome, allergy guidance, comfortable clothes/picnic blanket, caregiver-stay instruction, and fictional-test disclaimer. Overview still showed **Sunday, September 27 at 2:00 PM–4:00 PM**.
- **Save draft** was disabled after reload with no edits, and Share remained disabled for the private unpublished card.
- Clicked **Download invitation** in Review once; no visible application error appeared. Download completion, extension, image bytes, and printed details could not be verified: macOS blocked the Downloads folder and browser security policy blocked the browser Downloads page. No workaround or additional access was attempted. This is a testing limitation, not a confirmed download failure.

## Prioritized feedback

| Priority | Observation | Classification | Improvement |
| --- | --- | --- | --- |
| P1 | First Review attempt rejected lettering after about 88 seconds including its automatic correction; the next manual attempt succeeded in about 49 seconds. | Confirmed recoverable generation/quality-check failure. Cause and correctness of the rejected-image diagnosis unverified. | Offer a direct **Retry lettering** button beside the error, explain that details/background are safe, and preserve resolved venues so recovery remains focused and quick. |
| P2 | Final Review's When summary showed **Sep 27, 2026, 2:00 PM** without the 4:00 PM end time; Overview and the saved fields had both. | Confirmed review-summary omission. | Show the full time range so a parent can check pickup/end time before saving or publishing. |
| P3 | Location popup said **Directions to Maggie** instead of the complete venue name, including after resolution/reload. | Confirmed copy defect. | Use **Directions to Maggie Daley Park**, or simply **Get directions**. |
| P3 | Clicking Download gave no application-level success/error feedback. | Observed feedback gap; file completion unverified. | Add a short accessible status such as **Invitation downloaded** only after successful encoding/download initiation, with a retryable error when it fails. |
| P3 | The saved edit page still used **Create your Live Card** as its heading; saving from full-screen closed that surface. | Usability suggestions, not data-loss defects. | Consider an **Editing draft** status and keeping the preview open with a save confirmation to reinforce that the work is saved. |

## Simulated parent assessment

The three stages are understandable, and filling details while the artwork generates makes the wait productive. Seeing the actual card beside the form helps judge whether it feels right for a child. Separate guest-message and extra-instruction disclosures work well for sibling, allergy, and caregiver guidance. Verified venue/address and Chicago-local times reduce planning ambiguity. The finished artwork is strong and the explicit save/reload flow preserved the complete event.

The main frustration was waiting through the first lettering failure without an obvious dedicated retry action. The parent also needs the end time visible in the final review because pickup time is as important as arrival time. A clear download confirmation would improve confidence when preparing a printable invitation.

## Limits

Desktop signed-in organizer flow only. No mobile-device, anonymous public-card, actual RSVP submission, calendar-save, email-delivery, or publication tests were performed. No real participants or contacts were used. Artwork was inspected through tool screenshots; screenshot files were not exported. The private card and all tested data were saved explicitly and verified after reload.
