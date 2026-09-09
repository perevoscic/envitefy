# John is 10 — widescreen production

This record covers the requested ONE horizontal 16:9 YouTube video at 1920 × 1080, 30 seconds and 30 fps. The separately produced vertical campaign files are preserved.

## Creative and timing

- 0–5: Native wide 3D animation transforms John's bedroom with a friendly dinosaur, floating planets and a disco ball. John says the complete requested line. The dinosaur dances with comic seriousness.
- 5–12: John and his mother share the left side; the right side shows the full current Concierge conversation, then John's personalized invitation. The actual Live Card opens and closes Overview, demonstrating interaction and the confirmed 2 PM party details.
- 12–19: Animated guests and a traveling violet ribbon sit beside large, individually highlighted RSVP, Gift List, Directions and Add to Calendar panels. The personalized URL is clearly displayed.
- 19–26: The parent says the complete time-change line. The actual captured Chat input changes 2 PM to 3 PM, retimed for readability. A horizontal split shows the parent and guests reopening the updated Overview. The URL remains unchanged and the message stack pops away.
- 26–30: John and the dinosaur return in a wide space-party shot. The dinosaur wears a tiny hat; John's complete payoff line precedes the clean official brand card.

## Product grounding

Verified against the current marketing catalog, ConciergeChatClient, SharedStudioCardPage and StudioLiveCardActionSurface. The demo imports actual app components. Guest controls remain over the artwork. Gift List uses the configured registry-link feature, not an invented shopping-list interface.

The full current Concierge Chat/Preview interface was inspected. Shared source recordings include real UI interactions: an RSVP POST and the published-card edit POST were intercepted and fulfilled locally. See vertical-captured-actions.json. This task additionally captured a real Live Card Overview interaction in wide-live-capture.json. No customer records, real guest replies or external messages were sent.

envitefy.com/card/john-is-10 is the user-requested fictional demonstration link, not a published invitation. Updated details are shown only on the Live Card when reopened. The earlier calendar panel remains a demonstration of manual calendar addition; no automatic external calendar update is implied.

## Footage, art and sound

Fresh landscape 16:9 video was generated for all five character shots with the studio's configured Google Gemini Omni video provider. No portrait character footage was stretched or used as a full-frame scene. Source create and update continuations include a six-second context prefix, removed from the edit. The wide payoff is a standalone four-second clip. The hook is retimed from six to five seconds with pitch-preserving audio; the latter part of the parent shot is slowed after dialogue finishes.

Shared original instrumental music and the Jessica narration files were reused. The saved audition review preceded generation of the narration. This task verified the final lines offline with faster-whisper and checked levels with FFmpeg. Provider requests and job state remain in ignored campaign records. Approval review rejected external quality-analysis uploads; review was completed locally.

The existing ImageGen card-art-vertical.webp (1024 × 1536) is reused inside the actual 2:3 Live Card frame. It preserves John, the large 10, space dinosaurs, dancing stars and disco art. Its original generation, FFmpeg libwebp quality 85/compression 6 conversion, successful decode and original-PNG cleanup are documented in production-notes-9x16.md. No additional raster artwork was generated in this widescreen task.

The exact supplied transparent public/brand/envitefy-com.png is used without redraw, recoloring or a duplicate domain line. Marketing overlays use the locally bundled Josefin Sans.

## Editable sources and reproduction

Composition: EnvitefyJohnSpaceDiscoWide.
Sources: src/JohnSpaceDiscoWide.tsx and src/john-space-disco-wide/.
Brief and generation inputs: brief-16x9.json.
Footage: scripts/generate-john-wide.mjs, scripts/prepare-john-wide-media.mjs.
Product inserts and audio: scripts/prepare-john-wide-edit.mjs.
Live UI capture: scripts/build-john-wide-demo.mjs, scripts/john-wide-demo-session.mjs and scripts/capture-john-wide-live.mjs.
Final time-input insert: source capture 31.0–31.74 seconds, setpts multiplier 3.8, 30 fps, trimmed to 2.734 seconds, saved as wide-ui-edit-slow.mp4. This preserves real typing/submit frames while extending the readable text.
Final render: npx remotion render EnvitefyJohnSpaceDiscoWide out/john-space-disco/john-space-disco-16x9-v2-render.mp4 --codec=h264 --crf=17 --audio-codec=aac --audio-bitrate=192k --pixel-format=yuv420p --concurrency=2 --timeout=120000 --log=error
Packaging copies video and encodes the master wide-final-mix.wav as AAC 192 kbps, trims to exactly 30 seconds and places MP4 metadata first for playback.
Final local review: scripts/verify-john-wide-export.mjs.
Default Studio/CLI destination: john-space-disco/john-space-disco-16x9-v2.

## Review

ESLint, standalone TypeScript and Biome pass. The optional VS Code diagnostics bridge is unavailable; standalone checks were used and the editor bridge limitation was recorded.

Inspected scene frames, face clearance, full action buttons, original and updated time states, the complete dialogue, supplied branding, first frames and both sides of cuts. Earlier review exports remain available; V2 corrects the time-input timing and is the final deliverable. File checks and measured loudness are in wide-export-checks.json. Review is assistant review, not user approval.

## V3 user revision completed — September 8, 2026

- The user explicitly authorized sending the two cartoon clips to the configured Google video editor after the earlier automatic-review block. The saved two-shot jobs completed and their outputs were downloaded; no external review upload was used.
- The six-second opening edit preserves Mom on screen right and the dinosaur on John’s anatomical right, screen left, through the last frame. It was normalized to five seconds using a 1.2 playback factor and pitch-preserving native audio. Local transcription confirms the full requested sentence, ending at 3.60 seconds, followed by the natural laugh.
- The seven-second creation edit preserves the cast and framing while showing the lavender outer laptop cover throughout. The actual product overlays remain intact.
- The master soundtrack uses the completed Jessica vo-create-v4.mp3 recording with the audio-only alias invitee-fy. The pronunciation is permanently saved in STUDIO-GUIDE.md and scripts/brand-pronunciation.mjs. Written copy retains Envitefy.
- Live Cards is centered immediately below the unchanged official closing logo.
- Revised sources: wide-hook-fixed-v3.mp4, wide-create-fixed-v3.mp4; normalized edit files wide-edit-hook-v3.mp4 and wide-edit-create-v3.mp4; master wide-final-mix-v3.wav. Reproduction: scripts/edit-john-wide-v3.mjs, scripts/assemble-john-wide-v3.mjs and scripts/verify-john-wide-v3.mjs.
- Final: out/john-space-disco/john-space-disco-16x9-v3.mp4; exact 1920 × 1080, 30 fps, 900 frames, 30.000 seconds, H.264/AAC stereo. V2 remains available. Default output is john-space-disco/john-space-disco-16x9-v3.
- ESLint, TypeScript and Biome passed. The optional editor diagnostics bridge remains unavailable. Local final media checks, measured loudness and review-frame index are recorded in wide-export-checks-v3.json.

V3 is assistant-reviewed; no user approval of the finished export or publishing is implied.

## V4 completed — in-VY-tee-fy

September 8, 2026: User changed the brand pronunciation to **in-VY-tee-fy**, with primary stress on VY. Updated the current studio guide, production skill/reference, shared brand guidance and speech helper. Historical delivered versions remain available.

The creation line uses the same Jessica voice with Flash v2 and explicit CMU `IH0 N V AY1 T IY0 F AY0`; returned provider alignment includes `@ih0@n@v@ay1@t@iy0@f@ay0`. This sets VY as stressed and tee as unstressed. The complete spoken line was checked locally, including after mixing. Automatic transcription was used for completeness, not as proof of stress. Request/alignment records provide the exact configured pronunciation.

New source: public/projects/john-space-disco/vo-create-wide-v4.mp3 (3.004 seconds). New master: wide-final-mix-v4.wav. Narration begins at 5.35 seconds and fits completely before the next scene. Final MP4 copies the V3 H.264 stream exactly; its video-stream SHA-256 matches V3, so all 900 reviewed frames and visual corrections are preserved. Full decode passed; final duration is exactly 30 seconds at 1920 × 1080, 30 fps, stereo 48 kHz AAC. Measured loudness: -15.1 LUFS, true peak -1.5 dBFS.

Shared pronunciation tests, ESLint, TypeScript and Biome passed. Final checks: wide-export-checks-v4.json. Reproduction: scripts/john-wide-voice.mjs create v4; scripts/prepare-john-wide-v4.mjs; scripts/verify-john-wide-v4.mjs. Current default composition output: john-space-disco/john-space-disco-16x9-v4.

Latest assistant-reviewed export: out/john-space-disco/john-space-disco-16x9-v4.mp4. No publishing or user approval of the final media is implied.

## V5 completed — exact IPA for all new Envitefy audio

September 8, 2026: User supplied **Inviteefy**, IPA **/ɪnˈvaɪtiˌfaɪ/**, and the exact tag `<phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>`, asking that it apply to all Envitefy audio. This supersedes all earlier pronunciation variants. The shared helper, compatible-model selection, reusable speech generators, native-dialogue prompt direction, studio guide and brand/producer skills now use this exact specification. Older setup code is guarded against restoring obsolete defaults. Written branding remains Envitefy. Previous exported revisions remain available.

The horizontal V5 creation line was regenerated as vo-create-wide-v5.mp3 using the exact IPA tag. The completed private request records its precise text; provider normalized alignment is retained. For IPA input the provider returned zero-stress CMU token labels, so those labels and automatic transcription are not used as an acoustic stress judgment. The exact requested input and complete final spoken line were verified. Caption normalization handles these returned token labels.

Master: wide-final-mix-v5.wav. Final MP4 copies the V4 video stream exactly, retaining all 900 previously reviewed frames. All visual corrections, actual product demonstrations and the Live Cards closing label remain intact. Full decode passes, duration is exactly 30 seconds, dimensions 1920 × 1080 at 30 fps, stereo 48 kHz AAC. Loudness is -15.2 LUFS; true peak -1.5 dBFS. The new line begins at 5.35 seconds and ends within its creation scene.

Nine shared speech/caption tests passed. Actual returned alignment was tested against official caption spelling. ESLint passed with Node globals for scripts; TypeScript and Biome passed for touched composition sources. The optional editor diagnostics bridge remains unavailable as previously recorded. Full media checks are in wide-export-checks-v5.json.

Reproduce with scripts/john-wide-voice.mjs create v5, scripts/package-john-wide-audio.mjs v5, and scripts/verify-john-wide-v5.mjs. Default output: john-space-disco/john-space-disco-16x9-v5. Latest assistant-reviewed file: out/john-space-disco/john-space-disco-16x9-v5.mp4. No publishing or user approval of the completed media is implied.

## September 9, 2026 — final reference-based pronunciation

Completed the mandatory en-VITE-fy update after the user rejected the initial direct-TTS sample. The new reference-to-Jessica take passes audio review in the isolated narration and both final mixes; all animation packets remain identical. Final file: out/john-space-disco/john-space-disco-16x9-v7.mp4. See [current revision and verification](revision-brand-standard-2026-09-09.md). Assistant-reviewed; no user approval inferred.

## September 9, 2026 — user audio reference matched

Matched the narrator to the supplied envitefy.wav recording after the user authorized its Gemini analysis. Both final narration mixes pass direct reference comparison, approximately in-VY-tih-fy /ɪnˈvaɪtɪfaɪ/. Every animation packet remains identical to the prior version. Final file: out/john-space-disco/john-space-disco-16x9-v8.mp4. See [current revision](revision-user-audio-reference-2026-09-09.md). Assistant-reviewed; no approval of the finished video is inferred.

## September 9, 2026 — approved pronunciation preserved; sharing narration added

The user confirmed the current pronunciation is perfect. Saved the approved reference and Jessica take under assets/brand/audio/ with approval and hashes. Added “One easy link. All the party details.” at 12.25 seconds, with smooth music ducking. The accepted brand audio is unchanged, and every animation packet matches the previous version. Final export: out/john-space-disco/john-space-disco-16x9-v9.mp4. Exact 30 seconds, full decode, levels and final sharing audio review pass. Source and skill checks pass. See [revision notes](revision-share-narration-2026-09-09.md). Pronunciation is user-approved; this completed video is assistant-reviewed.
