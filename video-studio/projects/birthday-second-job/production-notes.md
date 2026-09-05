# Birthday Second Job — production notes

Created September 5, 2026. Current reviewed export: out/birthday-second-job-9x16-v4.mp4. The original production notes below describe V1/V2; the revision section records the current implementation.

## Creative and selected media

- One vertical 30-second TikTok, 1080 × 1920, 30 fps; composition `EnvitefyBirthdaySecondJob`.
- Fresh fictional dad and daughter in a sage kitchen, rust-orange shirt, green/orange dinosaur party supplies. Two adult guests in their own homes.
- Live-action generated moving footage with native synchronized dialogue. No still-image storytelling.
- Native dad line: “It’s a birthday party, not a second job.” Native child line: “Actually, I want a different theme.”
- Google Gemini Omni 1.1 Flash generated the footage. Google Lyria generated the original instrumental. The existing configured account supplied generation; no account purchase or plan change.
- Generation inputs are in brief.json, resumable provider records are in ignored *-job.json files. The payoff references the completed chaos interaction and is a 20-second continuation: the final edit uses seconds 10–20.
- Provider documentation checked: https://ai.google.dev/gemini-api/docs/omni and https://ai.google.dev/gemini-api/docs/music-generation.
- The generated chaos clip contained unwanted subtitle glyphs and an opening bottom border. `prepare-birthday-edit.mjs` crops the first 7.3 seconds and uses the full later phone shot. Editable captions replace the glyphs.

## Real product proof

- Product claims checked in the parent `src/lib/product-marketing-catalog.ts`: reusable sharing link, guest RSVP, calendar saves, birthday support.
- The local app on port 3000 did not answer. Capture uses the public `https://envitefy.com/showcase/lara-s-7th-dino-quest` page with the actual production JavaScript and UI.
- The capture-only HTML fixture enables the real direct RSVP branch by adding fictional event ID `demo-birthday-second-job`, `rsvpEnabled:true`, and `rsvpMode:envitefy` to the existing sample birthday card.
- Playwright intercepts RSVP requests, writes Jamie Parker's fictional response to `demo-response.json`, and returns local success. No customer RSVP or live event data was submitted or changed.
- Share action exercised the actual clipboard handler and verified the copied public Envitefy showcase link.
- Calendar action tapped Apple Calendar and downloaded the actual /api/ics response. `birthday-invitation.ics` was verified to contain VEVENT, event title, date, time, and location. The visible confirmation accurately says “Calendar file saved”; this does not claim a calendar-account import.
- The sample card's phone and past event date belong to the existing fictional showcase. Sample guest email is a demonstration string, not a claim of a provisioned mailbox.
- Footage is a browser screen recording, including cursor tap highlights, real form transition and real UI success state. Screenshots are verification references.
- Playwright's recording included unused grey canvas outside its viewport; the preparation script crops the actual 430 × 760 viewport and scales it. Four transient oversized frames at the RSVP segment start were found during final boundary QA; the revised segment starts 1/6 second later.

## Timeline and audio

- 0–3.7 s: decor chaos and “What time?” / “Where?” / “Can his sister come?” message overlays.
- About 4–7 s: parent looks at camera and delivers the requested line.
- 7.7–10 s: parent taps phone; Envitefy sharing overlay.
- 10–11 s: guest taps phone.
- 11–14.9 s: real RSVP form, submit tap, and success confirmation.
- 14.9–15.7 s: second guest taps phone.
- 15.7–20 s: real Add to Calendar panel, Apple action, and verified save confirmation.
- 20–22.8 s: parent sits and relaxes.
- About 23–25.6 s: child delivers the theme-change line.
- 25.8–27 s: music pause, dad's deadpan reaction.
- 27–30 s: “Less planning. More partying. Envitefy.com.” with the exact supplied brand PNG assets.
- `prepare-birthday-edit.mjs` creates original notification/chime effects and combines instrumental with the two native dialogue tracks. Dialogue is ducked into the music; final fade finishes naturally.
- Measured v1 full mix: -16.1 LUFS integrated, -1.5 dB true peak, 4.0 LU loudness range. V2 only moves one quiet RSVP chime earlier.

## Rendering and validation

- `npm run lint` passed (ESLint and TypeScript).
- Parent Biome passed all six edited TS/TSX files.
- The optional VS Code diagnostics command was attempted; the Chat to CLI bridge was unavailable. Standalone TypeScript and ESLint validation passed instead.
- Review export inspected at one-second samples across all scenes. Native source video was independently transcribed and examined for continuity. Actual final first frames and both sides of edit boundaries were extracted and visually reviewed.
- A media-model audiovisual review of the full cut confirmed intelligible dialogue, readable captions, product confirmations, consistent people/set, and no visible border/anatomy defects. It treated one onscreen non-dialogue caption as speech; the original clip transcript remains the source for native dialogue.
- V1 is retained as a review export. V2 removes the four transient RSVP capture frames; no story or layout change.
- Final v2 is packaged with faststart. Both video and audio streams and the MP4 container are exactly 30.000000 seconds; 900 video frames. Complete decode passed. Final v2 corrected RSVP first frames, submit tap, success state and calendar confirmation were visually inspected. File size: 17,588,998 bytes.
- No social publication is part of this task.

## Reproduction

Run from Video Studio:
1. `node scripts/generate-birthday-assets.mjs chaos guests music payoff` resumes saved jobs and downloads existing media. Never remove job files to force paid resubmission.
2. `node scripts/capture-birthday-demo.mjs` records the isolated demo using the locally saved public page response.
3. `node scripts/prepare-birthday-edit.mjs`
4. `npx remotion render EnvitefyBirthdaySecondJob out/birthday-second-job-9x16-v2-render.mp4 --concurrency=2 --timeout=120000 --log=error`
5. Remux/copy the video and encode a 30-second AAC track with `-af atrim=0:30 -t 30 -movflags +faststart` into the versioned deliverable.

The existing studio remains on port 3100. Campaign source files are separate from Host Mode and Intro.

Final export: out/birthday-second-job-9x16-v2.mp4. Assistant-reviewed on September 5, 2026; not user-approved. A four-worker browser render crashed; the successful render used two workers.

## V3 — user revision, September 5, 2026

- Used the exact newly supplied envitefy-com.png, copied byte-for-byte with alpha intact. Opening: “Birthday party planning” / “Before” and wordmark, placed below Dad’s face. Solution: new wordmark and “Birthday invites just got easier.”
- Product branding stacks the icon above the domain wordmark. The actual Live Card is 2:3, displayed at 744 × 1116. Action headings are below the complete popup and controls. Confirmation is now “Calendar event saved”, referring to the verified event-file download; no calendar-account import was performed.
- Browser capture intermittently switched between a 430 × 760 viewport in an 860 × 1520 canvas and a full-resolution viewport. normalize-birthday-demo.mjs classifies each raw frame, normalizes its size, and crops the 796 × 1194 card. Final counts: RSVP 112 low-resolution + 4 high-resolution + 1 tail frame; calendar 122 low-resolution + 6 high-resolution + 1 tail frame. Compression-tolerant padding detection fixed additional transient grey frames.
- chaos-wide.mp4 is the selected reference-based adult shot edit. The opening and sharing reactions are wider; the spoken line retains a deliberate closer shot.
- The provider rejected regeneration using the photorealistic child reference; no resubmission was attempted. prepare-birthday-revision.mjs edits the existing footage locally: a short two-frame blend at the small incoming camera shift and a slowed wide reaction replacing the ending closeup. Native child dialogue timing and audio are retained.
- mix-birthday-revision.mjs uses smooth music ducking ramps before dialogue and through the gag pause. The final icon is enlarged, centered higher, and accompanied by the new wordmark with no duplicate black domain text.
- npm run lint and Biome passed after TSX changes. The optional editor diagnostic bridge was unavailable. Local final-frame inspection, all-frame product padding scan, brand SHA-256 equality, full decode and exact-duration verification passed. Audio measures -16.2 LUFS / -1.5 dBFS true peak / 4.1 LU range.
- Automatic approval rejected the optional external audiovisual review because it would transmit the revised footage to Google. No upload for that review occurred. Final review is local; older audiovisual reports refer to earlier cuts only.
- Final file: out/birthday-second-job-9x16-v3.mp4; 14,844,367 bytes; 1080 × 1920, 30 fps, 900 frames; H.264/AAC, 48 kHz stereo; video/audio/container exactly 30 seconds, faststart enabled. Assistant-reviewed, not user-approved.

### Reproduce V3 from saved assets

1. node scripts/normalize-birthday-demo.mjs
2. node scripts/prepare-birthday-revision.mjs
3. node scripts/mix-birthday-revision.mjs
4. npx remotion render EnvitefyBirthdaySecondJob out/birthday-second-job-9x16-v3-render.mp4 --concurrency=2 --timeout=120000 --log=error
5. node scripts/package-birthday-v3.mjs

Do not rerun generation for reproduction: use the saved selected media. Evidence: export-verification-v3.json, local-media-qa-v3.json, demo-normalization-v3.json, audio-loudness-v3.log, and out/birthday-v3-final-proof.jpg.

## V4 — three-row opening and clean ending

- User clarified the hook to exactly three rows: “Birthday party”, “planning before”, then the supplied wordmark. The logo is now 620 pixels wide in its own row.
- V3 still had a native character-position jump at source frame 311 (12.958333 seconds) and a gap when the footage ended before the CTA fade. Source frame 394 starts the rejected closeup.
- New edit: Dad relaxes and turns during 20–22 seconds, then cut to the existing child line at source frame 311. Skipping the overlapping entrance avoids repeating her movement across that camera shift. Native spoken audio begins slightly before the visual cut to preserve the full onset.
- Dialogue and wide reaction play at normal speed. Each continuous shot is interpolated from 24 to 30 fps, without interpolating across the edit. The final reaction frame is held only beneath the end-card fade.
- CTA fades from 25.4 to 25.7 seconds, fully opaque before the retained video layer ends at 25.733333 seconds. No empty cream-only frame, dark flash, or ending closeup.
- Timeline: product scenes unchanged through 20 seconds; Dad rests/turns 20–22; child speaks about 22–24.8; wide reaction follows; CTA starts at 25.4 and remains through 30. Music ducking is aligned to the earlier line and reaction pause.
- Final V4: 1080 × 1920, 30 fps, 900 frames, exactly 30 seconds in both streams and container, H.264/AAC with faststart; 14,169,476 bytes. Full decode passed.
- All final frame timestamps are evenly spaced; all 172 frames in payoff-clean-v4-cfr.mp4 are also consecutive at 30 fps. Integer 1/30 time base avoids rounding gaps at the final fade. Audio: -16.4 LUFS integrated, -1.5 dBFS true peak, 3.9 LU range.
- Visual checks: actual opening frame, cut from calendar to Dad, both sides of the turn-to-child cut, full line captions, wide deadpan reaction, and intermediate CTA fade frames. ESLint/TypeScript and Biome passed; optional editor bridge was unavailable in prior local validation. No external media review or provider calls for V4.
- Assistant-reviewed; not user-approved. V2 and V3 retained in deliverables history.

### Reproduce V4

1. node scripts/prepare-birthday-v4.mjs (uses saved source assets; no generation)
2. npx remotion render EnvitefyBirthdaySecondJob out/birthday-second-job-9x16-v4-render.mp4 --concurrency=2 --timeout=120000 --log=error
3. node scripts/package-birthday-v4.mjs
4. node scripts/verify-birthday-v4.mjs

Evidence: export-verification-v4.json, local-media-qa-v4.json, audio-loudness-v4.log, out/birthday-v4-opening.jpg, and out/birthday-v4-final-proof.jpg.
