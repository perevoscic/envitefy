# Birthday Support — production notes

## V2 — restore “Please hold”

User feedback: “she is not saying Please hold”.

V1 cut the source at 5.05 seconds using inaccurate prior transcription timing. V2 preserves the first complete phrase by retaining synchronized original footage and dialogue through 5.9 seconds, then a 1.1-second silent reaction. A 40 ms fade begins after 5.86 seconds; the later repeated phrase is omitted. Opening music is reduced slightly for intelligibility. The 7–25 second story and mix are retained.

Current assets: opening-edit-v2.mp4 and final-mix-v2.wav. The composition points to these assets. Reproduce with scripts/prepare-birthday-support-v2.mjs, render the opening/full composition, then scripts/package-birthday-support-v2.mjs for this revision's splice.

The installed Windows en-US dictation recognizer ran entirely locally. The dry source recognized “birthday support please hold” in a phrase ending at 5.81 seconds. V1's exported audio did not recognize the requested phrase. Both the revised mix and exported V2 AAC recognize one “please hold”. Other transcription words are noisy and low-confidence; this is supporting evidence for the restored phrase, not a canonical complete transcript. No finished footage was uploaded for this check.

Final speaking frames at 4.9–7.2 seconds were inspected. Full decode passed. Container and both streams are exactly 25.000000 seconds; 750 frames, 1080 × 1920 at 30 fps. Audio: -16.67 LUFS, -1.42 dBTP, 3.3 LU range. Studio ESLint/TypeScript and parent Biome passed; optional editor bridge remains unavailable.

Latest export: out/birthday-support/birthday-support-9x16-v2.mp4 (12,491,165 bytes). V1 is preserved and superseded. Assistant-reviewed locally; not user-approved.

## V1 historical production record

Completed September 5, 2026. Final export: `out/birthday-support/birthday-support-9x16-v1.mp4`. Composition: `EnvitefyBirthdaySupport`. One vertical 25-second video, 1080 × 1920, 30 fps.

## Creative and assets

- Fresh fictional mother with dark bob and mustard sweatshirt in a cream kitchen with pink, coral and blue balloons; same mother and setting in the party payoff. Her daughter wears mint. Two fictional adult guests use phones at home.
- Moving generated footage with native synchronized caller, mother and child dialogue. Original instrumental generated through the configured Lyria pipeline. No stock stills or photo slideshow.
- Exact supplied transparent `public/brand/envitefy-com.png` and app icon are used. SHA256 hashes match the canonical parent assets. No substitute wordmark or duplicate domain line.
- Generation inputs are preserved in brief.json. Private resumable job records remain under this campaign. No account or plan purchase and no social posting.
- Google Omni and Lyria documentation checked at https://ai.google.dev/gemini-api/docs/omni and https://ai.google.dev/gemini-api/docs/music-generation.

## Selected takes and editing

- Selected `chaos.mp4`, `guests.mp4`, and seconds 10–16 of `payoff.mp4`. The payoff provider output includes the reference opening before its six-second continuation.
- Original opening repeats “Please hold.” A bounded native edit attempt, `chaos-clean.mp4`, retained the repetition and is NOT selected.
- The final opening uses source seconds 0–5.05, followed by a close silent reaction from source 1.033333–1.95, slowed to 1.95 seconds. V1 native opening audio stopped at 5.05 seconds, incorrectly removing the requested phrase; V2 above fixes this. The reaction remains footage with human micro-movement.
- Headset removal and sharing use source seconds 7–10 at 1.5x in a two-second insert.
- Guest inserts: first source offset 30 composition frames; second offset 120. The second offset avoids an unwanted male-to-female cut discovered during final boundary review.
- First-call caption timing was tightened to 0–0.6 / 0.6–1.4 / 1.4–2.8667 seconds.
- Final isolated hook and guest renders were spliced into the full-resolution render using `assemble-birthday-support-final.mjs`. The Remotion source includes both final corrections and can reproduce the full edit.

## Real product proof

- Claims checked against the parent product-marketing-catalog.ts: sharing, event details, guest RSVP, and calendar saves.
- Real public Lara birthday showcase, rendered with its actual production interface. The capture reuses the saved public showcase response and loads real production scripts.
- Capture-only fixture enables the real direct RSVP branch with a fictional demo event ID. Playwright intercepts the RSVP request locally; Alex Morgan and birthday-guest@envitefy.com are demonstration data. No customer event or RSVP is changed.
- Sharing exercises the actual Share live card button and verifies the copied Envitefy URL.
- Calendar footage exercises the real Calendar panel and Apple action. The real ICS endpoint response is saved and verified to contain VEVENT. On-screen wording is “Calendar file saved”; no claim of an import into a calendar account.
- Continuous browser recording at 430 × 760 and deviceScaleFactor 1 avoids the old variable-resolution capture defect. Full card crop is 398 × 597, preserving all actions.
- Screenshots and capture-timing.json retain verification references. Product UI and editable explanatory captions remain distinct. Demo label: Envitefy Live Card Demo.

## Final timeline

- 0–7: headset/call-center opening and exhausted line; “You volunteered to plan ONE party.”
- 7–9: headset off, phone tap; “One invitation. Everyone in the loop.”
- 9–11.2: actual details and share tap.
- 11.2–11.8: first guest phone tap.
- 11.8–14.8: actual RSVP form, Send RSVP tap, confirmation.
- 14.8–15.4: second guest phone tap.
- 15.4–18: actual calendar panel, Apple tap, file-save confirmation.
- 18–22.5: mother enjoying party, daughter asks “Did you get the cake?”, deadpan reaction.
- 22.5–25: “We handle the invite. You handle the cake.” and supplied envitefy.com wordmark.

## Audio and verification

- Original instrumental, native source dialogue, original short call chirps/UI chimes and a brief stop effect. Music stops at 21.45 seconds; audio settles to silence at 21.638 seconds through the end.
- Final measured audio: -16.56 LUFS integrated, -1.45 dBTP, 3.8 LU loudness range. No digital clipping detected by the measured peak.
- Full video/audio decode passed. MP4 container, video and audio are each exactly 25.000000 seconds; 750 video frames, H.264 1080 × 1920 at 30 fps, stereo AAC 48 kHz. Final size 12,666,941 bytes.
- Inspected the review export across all scenes and the final export's first three frames, both sides of main cuts, repaired guest insert, RSVP confirmation, calendar state, CTA and final frames. No blank frame, border, malformed prop or identity discontinuity was found in those inspected frames.
- Source dialogue and footage were checked with the studio media review pipeline before assembly. The optional remote analysis of the complete finished video was later blocked by automatic approval review because it contained Envitefy interface footage; no retry or alternate upload was made. Final verification used local frame inspection, source-dialogue timing and audio signal checks. Do not describe this as an independent full audiovisual review.
- Studio ESLint and TypeScript passed. Parent Biome passed all seven touched TS/TSX files. Optional editor diagnostics attempted; the Chat to CLI bridge was unavailable.
- Assistant-reviewed locally; not user-approved.

## Reproduction

Run from Video Studio:
1. Existing provider media and job state are already saved. Resume only as needed with `node scripts/generate-birthday-support-assets.mjs chaos guests music payoff`; never delete job state to force another paid submission.
2. `node scripts/capture-birthday-support-demo.mjs` records the isolated real UI demo if needed.
3. `node scripts/prepare-birthday-support.mjs all`.
4. `npx remotion render EnvitefyBirthdaySupport out/birthday-support/birthday-support-new-render.mp4 --concurrency=2 --timeout=120000 --log=error`.
5. Package with audio trimmed to 25 seconds and MP4 faststart. The saved packaging script targets the final assembled file from this production; adjust its input explicitly for a new version.
6. Review a new export before changing deliverables.json.
