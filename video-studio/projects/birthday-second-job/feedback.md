# Feedback and resolution

## Original request — September 5, 2026

One 30-second vertical TikTok with realistic people, quick cuts, playful music, readable captions, the requested birthday-planning joke, guests RSVP and save to calendar with visible confirmations, and the child's theme-change punchline.

## Production QA fixes

- Removed generated subtitle glyphs and a source border via shot cropping.
- Corrected browser-recording canvas padding.
- Trimmed four transient oversized RSVP frames; preserved visible guest tap, Send RSVP, and confirmation.
- Moved calendar success caption to after the verified calendar-file download.
- Preserved exact supplied brand assets and both requested spoken lines.
- Trimmed AAC padding so the delivered container and both streams are exactly 30 seconds.

V2 was reviewed by the user; their requested revisions are recorded below. No user approval of a revised export has been received.


## User revision — September 5, 2026

- Replace the POV hook with “Birthday party planning” and “Before” beside the wordmark.
- After the spoken second-job line, show the wordmark and “Birthday invites just got easier.”
- Fit the actual Live Card ratio so the complete popup and controls stay visible; put RSVP. Done. below it.
- Change confirmation to “Calendar event saved”.
- Smooth the cut/drop before the child says “Actually, I want”.
- Fix the sudden camera move toward Dad, especially the ending closeup.
- Use the supplied parent public/brand/envitefy-com.png throughout. Stack the icon above the new wordmark in the product scenes.
- Enlarge and center the final icon, position it higher, replace the old wordmark with the new one, and remove the separate black domain text.

### V3 resolved and export verified

- New wordmark copied byte-for-byte, with its alpha transparency intact; standing branding preference updated.
- Opening copy moved to a lower white panel so it cannot cover Dad’s face; message overlays repositioned above it.
- Product video displays the actual 796 × 1194 card crop at 744 × 1116. All form states and bottom controls fit at 2:3.
- Found and normalized four high-resolution frames in the RSVP capture and six in the calendar capture; other frames use the lower-resolution viewport. This removes the transient size jumps that a fixed crop could not fix.
- Revised opening video keeps the early phone reaction and sharing shots wider; the spoken line remains a deliberate closer shot.
- The video provider rejected the photorealistic child reference for regeneration. No resubmission was attempted. The existing scene was edited locally: 2-frame overlap at the camera shift, followed by a slowed wide reaction replacing the final closeup.
- Music now ducks and returns on short continuous ramps, including before the child’s dialogue.

### V3 final verification

- Reviewed the final 1080 × 1920 export at the opening, sharing panel, RSVP action/confirmation, calendar confirmation, both sides of the child-scene cut, wide reaction, and final CTA.
- The original padding detector missed compressed grey pixels with a five-level RGB difference. Its tolerance now handles those pixels; all 117 RSVP and 129 calendar frames pass the padding scan.
- Final video/audio/container: exactly 30 seconds; 900 frames; clean full decode. Final size: 14,844,367 bytes.
- Final soundtrack: -16.2 LUFS integrated, -1.5 dBFS true peak, 4.1 LU range. No clipping.
- Optional external audiovisual review was rejected by automatic approval because it would send the footage to Google. That review was not run; local checks were completed.
- Latest reviewed export: out/birthday-second-job-9x16-v3.mp4. V2 is retained. User approval remains pending.

## V4 request — September 5, 2026

- Opening must be exactly three rows: “Birthday party”, “planning before”, then the supplied logo wordmark. The previous Before/wordmark row was crowded.
- Recheck the child scene and ending for remaining drops between shots.

### V4 resolved and verified

- Opening copy now uses two clean text lines and the larger wordmark on its own third row.
- Source frame inspection found the native two-shot recomposition at frame 311 and the closeup at frame 394. The new cut uses source frames 240–287 for Dad relaxing and turning, then 311–393 for the full child line and wide reaction. This skips the repeated entrance preceding the jump.
- A short audio lead-in preserves the child’s breath and full line. Separate continuous shots use motion interpolation from 24 to 30 fps; the ending reaction plays at normal speed.
- The last reaction frame remains under the final fade; the card becomes opaque before the video layer ends. There is no empty cream-only frame between the reaction and CTA.

- Final rendered opening and scene-boundary proof inspected. The reaction remains visible during the CTA fade; no isolated blank card frame.
- Final export: out/birthday-second-job-9x16-v4.mp4; 14,169,476 bytes; exactly 30 seconds; 1080 × 1920 at 30 fps, 900 frames. Both final and ending-source frame timestamps are continuous. Full decode passed.
- Soundtrack: -16.4 LUFS integrated, -1.5 dBFS true peak, 3.9 LU range. ESLint/TypeScript and Biome passed. All work for V4 stayed local.
