# Wedding Characters — production notes

Created September 8, 2026 for the user's three-character wedding mockumentary brief. Current final delivery: `out/wedding-characters/wedding-characters-9x16-v4.mp4`. V3 remains available; V1 and V2 are retained in delivery history but their files were already absent at this revision’s final check. Composition: `EnvitefyWeddingCharacters`.

## Story and edit

- 0.00–1.30: The Planner opens invitation.
- 1.30–3.00: Actual RSVP form, submission and confirmation.
- 3.00–4.50: Actual Add to Calendar panel and Apple/ICS tap.
- 4.50–8.00: Hanging garment bag reveal, native “Been ready since February.” and proud reaction.
- 8.00–12.40: The Dancer reads, taps, receives RSVP confirmation, rehearses shimmy and ambitious lunge.
- 12.40–17.50: The Crier opens invitation, tears up, RSVPs, partner slides tissue box and gives camera a deadpan glance.
- 17.50–21.30: Wedding cuts: Planner dressed in emerald, Dancer on the dance floor, Crier still crying beside partner.
- 21.30–25.00: Exact requested end copy and supplied Envitefy.com wordmark.

Home and wedding footage use new fictional characters, generated with Gemini Omni 1.1 Flash. Native camera zooms and room sounds are retained. The original instrumental is Lyria. Full prompts are in brief.json. Wedding interactions appended five seconds after the eight-second home references; the selected wedding cuts begin after source second eight.

## Product proof and branding

Captured the current public Garden Vows renderer at https://envitefy.com/showcase/garden-vows, with local-only demo RSVP props and Envitefy demo contact values. All outbound writes were intercepted; the one RSVP POST received a local success fixture, never a server submission. The real calendar request returned a valid ICS with a VEVENT, October 10 date, 4:30 PM resolved in the capture browser's Central timezone, and Garden Vows title. Receipts: capture-network-safety.json, demo-response.json, wedding-invitation.ics.

The first saved HTML referenced a removed deployment chunk and would not hydrate. A fresh cache-busted response resolved this. Re-fetch the live HTML before future recaptures. No live application edits were needed.

The final wordmark and icon match the parent assets byte-for-byte; hashes are in out/wedding-characters/final-technical-review.json. No replacement logo or new raster artwork was generated.

## Generation recovery

Planner and music background submissions returned explicit HTTP 400 unsupported-mode errors; their preserved requests were retried synchronously. The first Dancer wedding submission returned explicit HTTP 500 api_error; its request was preserved and one replacement succeeded. Other jobs were resumed rather than resubmitted. Private provider job records remain in this campaign directory and are ignored by Git.

## Verification

Assistant visual review used local source contact sheets, first frames 0–3, both sides of every cut, each major character/action frame, close views of RSVP/calendar/CTA, and the actual packaged video's full contact sheet. Corrected the initial calendar caption to describe the visible action, and used generic confirmation inserts for the Dancer and Crier. Characters, phone/prop continuity, tissue-box contact, garment reveal, dance moves, wedding visuals, text fit, and CTA were inspected. The wedding Planner remains in emerald; generated dress neckline differs slightly from the hanging dress.

Audio review was technical and transcription-based, not a manual listening pass. Local faster-whisper base.en and small.en recognized the isolated native Planner sentence as “Been ready since February.” Full-mix ASR sometimes added a low-confidence “I've” before it; isolated source and trimmed dialogue consistently matched the requested line. Music was lowered during speech. Final loudness is -17.29 LUFS integrated, -3.39 dBTP peak, 5.60 LU loudness range, without clipping. No external media analysis upload was performed: automatic approval review rejected that step, and local-only review replaced it.

Final FFprobe: exactly 25.000000 seconds, 750 video frames, 1080 × 1920, 30 fps, H.264 yuv420p Rec.709, AAC stereo 48 kHz. MP4 uses fast-start metadata. Complete FFmpeg decode passed. Final size: 17,023,082 bytes.

ESLint, standalone TypeScript and Biome passed for the new composition. The requested editor diagnostics wrapper was attempted but the Chat to CLI bridge was unavailable; standalone checks passed instead.

## Reproduction

1. Resume saved media jobs with scripts/generate-wedding-characters.mjs only as needed.
2. Refresh showcase-remote.html, then scripts/capture-wedding-characters-demo.mjs for recapture.
3. Run scripts/prepare-wedding-characters.mjs portraits, demo, and audio.
4. Render EnvitefyWeddingCharacters to out/wedding-characters/wedding-characters-9x16-v1-final-render.mp4.
5. Run scripts/package-wedding-characters.mjs for the exactly 25-second deliverable.
6. Local QA: scripts/review-wedding-characters-local.mjs and scripts/transcribe-wedding-characters-local.py. Runtime/model downloads live only in the ignored output folder.

Status: assistant-reviewed; not user-approved.


## Revision 2 — completed September 8, 2026

User identified the Dancer tapping a paper-like/back-facing invitation and requested advertising wedding-website creation at envitefy.com/weddings. The flawed Dancer introduction (final seconds 8.00–8.90) is now a new four-second generated source insert using the saved Dancer interaction for continuity; it is appended after the original eight-second provider reference. Selected source begins at 8.65 seconds, exactly 27 frames. Final asset: public/projects/wedding-characters/dancer-open-v2-composite.mp4.

The new over-shoulder angle clearly shows a black smartphone, its illuminated front glass, and the right index finger contacting that glass. The actual Garden Vows screenshot is perspective-composited on the screen with local OpenCV; the original finger stays in front. Screen boundaries and the briefly obscured lower-right corner were checked and corrected. Tracking records and intermediate previews are in out/wedding-characters/. Generation prompts and resumable provider state remain with this campaign. No external analysis upload occurred.

The closing card now reads “Bring yours together. Create your own wedding website.” and prominently displays envitefy.com/weddings alongside the exact supplied brand asset. “Every wedding has its characters.” remains over the wedding payoff. The wedding URL returned HTTP 200; website-creation claims match the parent marketing catalog.

Reviewed source contact frames, the exported phone interaction at close range, both revised cut boundaries, wedding headings, end-card layout and final frames. Full final MP4 decode passed. FFprobe confirms exactly 25.000 seconds, 750 frames, 1080 × 1920, 30 fps, H.264/Rec.709, AAC stereo, and fast-start metadata. Final size: 17,236,019 bytes. Existing soundtrack is unchanged; measured loudness -17.29 LUFS, peak -3.39 dBTP. ESLint, TypeScript and Biome passed. Editor diagnostics bridge remains unavailable after an attempted check.

Reproduce v2 with scripts/composite-wedding-characters-phone-v2.py, render EnvitefyWeddingCharacters to out/wedding-characters/wedding-characters-9x16-v2-final-render.mp4, package with scripts/package-wedding-characters-v2.mjs, and inspect using scripts/review-wedding-characters-v2.mjs. Preserve the v1 exports. Status: assistant-reviewed, awaiting user feedback.

## Revision 3 — completed September 8, 2026

User reported unnatural suction/levitation of the partner’s tissue box around 13–14 seconds. Local frame review confirmed that the previous box moved before hand contact and rose off the table. Generated one replacement continuation using the original Crier interaction for matching cast, clothes and room. The detailed prompt is saved as brief.shots.crier-contact-v3; resumable provider state is in crier-contact-v3-job.json. The 14.016-second provider result includes the original eight-second reference followed by the replacement. No external media-analysis upload occurred.

Selected assets: public/projects/wedding-characters/crier-open-v3.mp4 uses source 8.00 seconds, first 0.64 seconds stretched 1.25x to 24 frames/0.80 seconds. public/projects/wedding-characters/crier-tissue-v3.mp4 uses source 9.35 seconds for 108 frames/3.60 seconds. The selection begins in the wide angle with the woman’s hand already touching the box. Her hand guides the box left while its base stays on the tabletop; the man then pulls a tissue and dabs his face. The preceding close shot and intervening RSVP insert retain the original timing. The source contains a camera cut, so the final wide selection starts after that cut.

Reviewed every first 30 frames of the selected push, the complete source action at five frames per second, exported changed frames and transitions, the full final contact sheet, and the end card. The old levitation footage is absent. Audio rebuilt with native replacement room/tissue sounds at the same timeline positions, preserving the Planner line and existing music arrangement. A local Whisper check of the replacement produced only a near-zero-confidence “You” token (0.005 probability), which was not treated as reliable speech. No manual listening claim is made.

Final MP4 full decode passed. Exactly 25.000 seconds, 750 frames, 1080 × 1920, 30 fps, H.264/yuv420p/Rec.709, stereo AAC 48 kHz and fast-start metadata. Size 16,595,772 bytes. Measured final loudness -17.30 LUFS and true peak -3.54 dBTP. Both supplied brand assets remain byte-identical to parent sources. ESLint, TypeScript and Biome passed; the attempted editor-diagnostics wrapper cannot find its installed Chat to CLI bridge.

Reproduce the mix with scripts/prepare-wedding-characters-v3-audio.mjs audio, render EnvitefyWeddingCharacters to out/wedding-characters/wedding-characters-9x16-v3-final-render.mp4, package with scripts/package-wedding-characters-v3.mjs, and review with scripts/review-wedding-characters-v3.mjs. Root defaultOutName now targets wedding-characters/wedding-characters-9x16-v3. The previous exports are retained. Status: assistant-reviewed, awaiting user feedback.

## Revision 4 — completed September 8, 2026

User supplied an end-card crop and requested retaining the wordmark with “weddings” on the second row. Changed only the editable closing-card text from envitefy.com/weddings to lowercase weddings; kept the exact PNG wordmark, layout, colors and font settings. CTA headline remains “Create your own wedding website.” The campaign destination remains https://envitefy.com/weddings in the brief. This is a campaign layout revision, not a redesign of the brand asset. No new generated artwork or footage.

Rendered a new complete 25-second vertical export from EnvitefyWeddingCharacters. Footage and final-mix-v3.wav remain unchanged, retaining v2’s front-screen Dancer interaction and v3’s physically grounded tissue-box movement. Packaging source: scripts/package-wedding-characters-v4.mjs. Default output name now targets wedding-characters/wedding-characters-9x16-v4.

Reviewed the exported closing-card text and composition, its first frames/fade-in and final frame. Full MP4 decode passed. FFprobe confirms exactly 25.000 seconds, 750 frames, 1080 × 1920, 30 fps, H.264/yuv420p/Rec.709 and stereo AAC 48 kHz. Exact supplied brand PNG hashes match parent sources. ESLint, TypeScript and Biome passed. The repository editor diagnostics bridge is unavailable. Technical measurements and file hash are saved in out/wedding-characters/v4-technical-review.json. V3 remains available; the V1 and V2 files were already absent at the final directory check, so their history is retained with availableLocally set to false. No earlier exports were deleted in this revision. Status: assistant-reviewed, awaiting user feedback.
