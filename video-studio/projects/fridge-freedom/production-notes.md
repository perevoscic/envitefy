# Fridge Freedom — production notes

## Deliverable and creative treatment
- One 30-second vertical YouTube Short, 1080 × 1920, 30 fps. Composition: `EnvitefyFridgeFreedom`.
- New fictional mother and daughter in one warm sage-and-oak kitchen with a cream refrigerator; mustard cardigan, blue school polo and coral backpack maintain continuity.
- The 0–7 second opening has native dialogue: child “Can I go?” and mother “There has to be a better way.” Several papers actually fall. The final fridge retains the rainbow family drawing under the red magnet.
- Native video is 720 × 1280 at 24 fps, upscaled and conformed for the 1080 × 1920, 30 fps final. Original instrumental supplied by Google Lyria. Google Gemini Omni supplied moving footage. This is live-action-style moving footage with screen recordings, not a slideshow.

## Selected source and timing
- `opening.mp4`: first 7 seconds, complete dialogue. Child speech 1.24–1.799 seconds; mother sentence ends 6.879. Forced alignment mislocated the first word “There” into earlier paper noise; visual/audio review places caption at 5.5 seconds.
- `phone.mp4` and `cleanup.mp4`: provider appended the original eight-second reference despite the prompt. Every selected continuation trims away those first eight seconds; repeated dialogue is excluded.
- `snap-action.mp4`: phone source 12.9–14.0 seconds, showing the camera view and shutter action.
- `cleanup-edit.mp4`: cleanup source after 8 seconds, at 1.4×. Final selects five seconds from 22–27.
- `payoff-edit.mp4`: source after 14 seconds at 0.67×, preserving actual moving people/camera for the 27–30 second ending.
- Two continuation requests were explicitly rejected with HTTP 400 for background interactions. These were saved as failed request records and retried synchronously using the documented provider method. No ambiguous submission was blindly retried.

## Actual product proof and illustrative inserts
- Actual signed-in `/snap` page recorded locally with a fictional non-admin session. Real Snap flyer action, file-selection flow and processing card were exercised.
- Fictional OCR and upload/history responses were fulfilled inside the isolated recording browser. The real Dashboard code constructed the saved event payload; no customer record was written and no external messages were sent.
- Birthday display imports the unmodified actual `BirthdaySkin` component. Sharing imports the unmodified `EventGuestActions` component; this is an isolated source-component fixture. It does not claim a production-published event or a full customer account session.
- Date/time/location: Mia’s 8th Birthday, Saturday October 17 2026, 2–4 PM America/Chicago, Maple Park, Austin, TX. These appear on the source flyer, event screen, message and calendar.
- `buildCalendarLinks` from the app generated the actual calendar actions. The real local `/api/ics` response is saved as `birthday.ics`: DTSTART 20261017T190000Z, DTEND 20261017T210000Z. Title and location verified.
- The other-parent message and personal calendar are clearly labelled illustrative phone inserts. The calendar actually imports and saves the verified ICS-derived event into local fixture storage; it is not a recording of a Google/Apple account. The message is stored only locally. No external messages or calendar writes occurred.
- Google home/search typing is an actual browser recording with an editable magnification of the exact query for legibility. The result request encountered Google CAPTCHA, so that screen and all of its frames are excluded. The edit cuts from the completed search to opening Envitefy; no search ranking or result is fabricated.
- All external write requests were blocked in capture. Parent application source was not modified.

## Brand, assets and audio
- Exact supplied `public/brand/envitefy-com.png`; colors, proportions and transparency retained. No retyped substitute logo.
- Flyer artwork is a simple vector production prop. Its temporary raster was encoded with FFmpeg libwebp quality 85/compression 6, decoded and checked at 900 × 1200, and the exact temporary PNG was deleted. `flyer.webp` remains.
- Frame-timed camera clicks, soft tap effects and a calendar confirmation chime sit over the original warm pizzicato groove. Music ducks under both native lines and fades out smoothly during the final 1.4 seconds.
- Audio-only review confirms exactly the two spoken lines, no clipped words/repetition/distortion, audible shutter and confirmation effect, intelligible natural dialogue and smooth music ending.
- The secondary full-video audit confirms the story and readable screen states, but mistakenly listed some written captions as speech. Use the audio-only audit and forced alignment for the dialogue record, not that transcription field.

## Verification
- Studio ESLint and standalone TypeScript pass after media objectFit was moved to the supported prop. Parent Biome lint passes for all seven TS/TSX files.
- Optional VS Code bridge is unavailable: “Could not find a Chat to CLI linter bridge.” Standalone TypeScript and both linters supplied verification.
- Inspected the first rendered story contact sheet, full-size details and payoff frames, date/time/place readability, exact logo, clean drawing reveal, native speech alignment, and the source people/hand/prop motion.
- Final technical and boundary checks are recorded under `out/fridge-freedom/`. Assistant review is not user approval.

## Reproduction
1. `node scripts/generate-fridge-assets.mjs opening music phone cleanup` resumes saved provider jobs; it does not resubmit completed assets.
2. Local Envitefy app on port 3000; `node scripts/build-fridge-fixture.mjs`; `node scripts/capture-fridge-demo.mjs`; `node scripts/capture-fridge-search.mjs`; `node scripts/capture-fridge-calendar.mjs`.
3. `node scripts/prepare-fridge-edit.mjs video`; `node scripts/prepare-fridge-edit.mjs audio`.
4. `npx remotion render EnvitefyFridgeFreedom out/fridge-freedom/fridge-freedom-9x16-v1-render.mp4 --concurrency=2 --timeout=120000 --log=error`.
5. `node scripts/package-fridge-final.mjs` trims AAC padding to exactly 30 seconds and runs decode/spec/black-frame/loudness/boundary checks.

All exports, intermediate renders and review images remain under `out/fridge-freedom/`. Source footage is under `public/projects/fridge-freedom/`; private provider lineage stays under the campaign records.

## Final delivery verification — 2026-09-08
- Delivered `out/fridge-freedom/fridge-freedom-9x16-v1.mp4`, 22,168,628 bytes. Exactly 30.000 seconds; H.264 1080 × 1920, 30 fps, 900 frames; stereo 48 kHz AAC. Fast-start MP4.
- Full FFmpeg decode passed. No detected full black-frame intervals. Inspected frames 0–3, both sides of all major cut boundaries, final camera shutter shot, full saved-calendar view, and the final end frame. Extra empty cells in the boundary contact-sheet grid are padding, not movie frames.
- Final packaging holds the Snap launch view at frames 338–359 using frame 335 so the recorded processing preview does not appear before the physical photo shot. This is a short editorial hold in a moving film; it is implemented reproducibly in `package-fridge-final.mjs`.
- Final AAC measures −14.68 LUFS integrated and −1.43 dBTP. No clipped speech, repeated speech, distortion, or harsh sound effects identified.
- Exact supplied logo hash matches the parent asset. Flyer WebP exists and decodes correctly; its temporary PNG is absent.
- Final ESLint/TypeScript and Biome checks passed. Optional editor diagnostics bridge remains unavailable as documented above.
- The final MP4 is assistant-reviewed; `userApproved` remains false.


## V2 production and review - September 8, 2026
- User feedback supersedes the earlier v1 assessment of natural acting. V1 remains available, with its review status changed to user-requested-revision.
- New composition: EnvitefyFridgeFreedomV2. Previous composition and export retained. Shared payoff component accepts a source and trim while keeping its v1 defaults.
- Opening edit (all 1x): original source 0.4667-1.0333 tightly reframed around daughter/backpack (17 frames); v2-handoff-b 0.3-2.2 (57 frames); v2-insert-magnet 0.3-2.3 (60 frames); v2-fridge-mishap 1.7-4.2333 reframed close to mother (76 frames). No old body-turn frames appear in full view.
- Native forced alignment: handoff line 0.680-1.279 in its source; mother line 2.079-3.419 in its source. Final captions at frames 28-48 and 145-189 preserve both complete lines.
- Ending edit: snap-action first second; v2-insert-remove 1.2667-2.2667, cropped to 326x580 at x160/y700 below the unused duplicated-magnet area; v2-insert-last-sheet complete six seconds. Paper movement remains at 1x. Its last three seconds continue seamlessly beneath the calendar/CTA payoff.
- The longer v2-cleanup take is unused. Its multiple-action staging remained unsuitable. Other rejected/unselected spans remain in private provenance and source assets.
- Generation script: scripts/generate-fridge-revision.mjs, with independent image-conditioned and text-only shots, distinct saved job names, and no continuation-history replay. Initial handoff was explicitly filtered by provider HTTP 400; failure recorded and a shorter benign family prompt produced the selected handoff-b take. ImageGen could not read the local reference due to the sandbox helper; no raster asset was generated, and no image cleanup was due. Final clips came from the configured video provider.
- scripts/prepare-fridge-v2-opening.mjs and scripts/prepare-fridge-v2-final.mjs reproduce trims and the 30-second mix. scripts/align-fridge-v2.mjs records native timing. SearchV2 keeps the previously approved Snap-launch editorial hold in Remotion using Freeze, so no post-render video-frame patch is needed.
- Render: npx remotion render EnvitefyFridgeFreedomV2 out/fridge-freedom/fridge-freedom-9x16-v2-render.mp4 --concurrency=2 --timeout=120000 --log=info. Package: node scripts/package-fridge-v2.mjs.
- Final: out/fridge-freedom/fridge-freedom-9x16-v2.mp4; 17414263 bytes; exactly 30.000 seconds and 900 frames; H.264 1080x1920 at 30fps; stereo 48kHz AAC. Full decode passed; no black intervals; integrated loudness -13.96 LUFS and true peak -1.34 dBTP.
- Local review includes all first-second frames, dense selected opening/ending sequences, both sides of cuts, final product and calendar state, and copy/logo fit. Studio ESLint/TypeScript and parent Biome passed. Optional VS Code bridge remains unavailable as recorded under v1.
- Automatic approval review rejected a proposed upload of unpublished media to Gemini for a second automated audit. It was not retried or bypassed. Review completed locally; there is no external v2 motion/audio audit result and no claim that one passed.
- No social publishing or external parent message/calendar action occurred. Actual product versus labelled illustrative insert boundaries remain those documented for v1.


## V3 production and review - September 8, 2026
- Composition EnvitefyFridgeFreedomV3 preserves V2 opening and fridge cleanup; previous compositions/exports remain. Main product timing now allocates two seconds to the readable photo.
- SearchV3: frames 210-257 type the exact query in a contained box; 258-303 show the Envitefy Snap result; ripple begins 296; 304-359 show actual public https://envitefy.com/snap. Search demonstration label identifies the recreated result. The URL/title and customer promise were checked against public Snap and flyer-guide pages and the local product marketing catalog.
- Google real query capture returned CAPTCHA. No bypass attempted. Search artwork uses Google's own public logo asset; result icon is the exact supplied Envitefy app icon. No ranking or endorsement claim. See v3-product-proof.json.
- capture-fridge-v3-site.mjs recorded the actual public page. Playwright's 860x1600 video canvas contained a 430x800 CSS viewport at its upper-left; prepare-fridge-v3-site.mjs now crops to that viewport before upscaling. The incomplete first internal render was corrected before delivery.
- New text-only generated six-second v3-insert-camera.mp4 has stable phone geometry and native thumb movement. Selected source 1.35-3.35 seconds. FridgeCameraScreenV3 renders a 360x700 editable camera view with existing flyer.webp. composite-fridge-v3-camera.mjs replaces the green phone display, retains hands/bezel, then reframes to 1080x1920. Camera screen preview holds the full flyer, no cropping of event details. No new image-generation artwork was produced.
- Main photo is 12-14 seconds. Cleanup uses camera segment 0.65-1.65 seconds at 22-23, followed by the V2 removal sequence. Full original two-line dialogue preserved; shutters at 13.2 and 22.55; search/copy/calendar sounds and confirmation chime retimed by mix-fridge-v3.mjs.
- Native hand movement and all source photo action play at normal speed. The camera UI is a production screen replacement, not a new Envitefy camera feature. Subsequent actual-component demo and labelled illustrative message/calendar retain their V1 documented boundaries.
- Source checks: studio ESLint/TypeScript pass, parent Biome pass. Exact wordmark SHA-256 matches parent asset: 41b39fb11806985e1f1cc2c945bb726374002abf2d9e1df91117b860cd5dcf4d. Optional editor bridge remains unavailable as recorded previously.
- Final file: out/fridge-freedom/fridge-freedom-9x16-v3.mp4, 16443011 bytes; 30.000 seconds; 900 frames; H.264 1080x1920,30fps; stereo 48kHz AAC. Full decode passed, no black intervals, -13.97 LUFS and -1.38 dBTP.
- Final review was local: search box margins; completed query; result and ripple; first/middle/last Snap landing frames; camera hand/screen sequence; full flyer title/date/time/venue; both snap moments; cut boundaries; saved calendar and end copy. No external media audit was attempted.
- Reproduce camera screen with Remotion FridgeCameraScreenV3 -> out/fridge-freedom/v3-camera-screen.mp4; run composite-fridge-v3-camera.mjs; mix-fridge-v3.mjs; render EnvitefyFridgeFreedomV3 -> out/fridge-freedom/fridge-freedom-9x16-v3-render.mp4; package-fridge-v3.mjs. All selected assets and private provider records are versioned in this campaign.


## V4 shutter synchronization - September 8, 2026
- Retained V3's selected moving phone source and screen geometry. New CameraScreenV4 reads src/fridge-freedom/camera-timing-v4.json, shared with the V4 compositor and audio mixer. Local selected-shot contact frame 41, flash frame 42 and thumbnail frame 43. Empty thumbnail before capture removes the premature-photo cue.
- Main source remains 1.35-3.35 seconds, shown at global 12-14 seconds. Cleanup now takes selected-camera frames 30-59 at global 22-23 seconds. The paper-removal and payoff footage after 23 seconds is unchanged. All source motion remains at 1x.
- Main flash/shutter at global frame 402 (13.400 seconds); cleanup at frame 672 (22.400 seconds). scripts/verify-fridge-v4-sync.mjs measures peak flash brightness in the final encoded MP4 at those exact frames and checks the effects WAV onset samples (643200 and 1075200 at 48 kHz), with no shutter in the preceding 100 ms. This is a local timing check, not an external audiovisual audit.
- Visually inspected all frames around the presses, before/press/flash/thumbnail sequences, first 30 frames, search and Snap page, shot boundaries, ending motion and final CTA. Source ESLint/TypeScript and parent Biome passed. Optional editor bridge remains unavailable as previously documented.
- Final file: out/fridge-freedom/fridge-freedom-9x16-v4.mp4; 16463388 bytes; 30.000 seconds, 900 frames, 1080x1920 H.264 at 30fps, stereo 48kHz AAC. Full decode passed, no black intervals. Integrated loudness -13.97 LUFS, true peak -1.31 dBTP.
- Reproduce: render FridgeCameraScreenV4 to out/fridge-freedom/v4-camera-screen.mp4; run composite-fridge-v4-camera.mjs and mix-fridge-v4.mjs; render EnvitefyFridgeFreedomV4 to out/fridge-freedom/fridge-freedom-9x16-v4-render.mp4; run package-fridge-v4.mjs then verify-fridge-v4-sync.mjs.
- No new provider generation, external media upload, product capture or live-app changes. Prior acting/search/readability changes, branding, captions and product proof remain.


## V5 removes second snap - September 8, 2026
- New composition EnvitefyFridgeFreedomV5 preserves earlier versions. Product sequence extends from 300 to 330 frames; saved calendar extends from 42 to 72 frames (global 618-689). The three-second source calendar recording covers this 2.4-second use.
- Cleanup starts at global frame 690 with v4-ending-edit.mp4 trimmed by 30 frames, skipping its photo completely. The removal action and existing payoff retain their timing at 23-30 seconds. No source acting is stretched, repeated or regenerated.
- mix-fridge-v5.mjs includes only the main 13.4-second shutter. The effects WAV has zero samples from 22-30 seconds. V2 native ending audio's first second is anullsrc, so it contributes no residual second shutter. Music and native paper sounds retain their alignment.
- Local review: every exported frame 658-693 across the former second snap and new calendar-to-paper cut; main press/flash/thumbnail; first frames; scene boundaries; complete ending; saved event and final CTA. ESLint/TypeScript and parent Biome pass. Optional editor bridge remains unavailable as previously recorded.
- Final: out/fridge-freedom/fridge-freedom-9x16-v5.mp4; 15962810 bytes; exactly 30.000 seconds/900 frames, 1080x1920 H.264 at 30fps, stereo 48kHz AAC. Full decode pass, no black intervals; -13.97 LUFS and -1.41 dBTP.
- Reproduce: node scripts/mix-fridge-v5.mjs; render EnvitefyFridgeFreedomV5 to out/fridge-freedom/fridge-freedom-9x16-v5-render.mp4; node scripts/package-fridge-v5.mjs; node scripts/verify-fridge-v5-edit.mjs. No external media upload or new provider generation.
