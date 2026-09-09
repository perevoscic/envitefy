# John is 10 — vertical production

Original request: one finished 30-second 9:16 animated Envitefy promotional video. This record belongs to the vertical task; the concurrent landscape task has separate wide footage and records.

## Creative and timing

- 0–5: John’s bedroom transforms into space with a teal dinosaur and disco ball. Native child dialogue and the exact imagination headline.
- 5–12: Mother and John plan together; full current ConciergeChatClient recording, personalized art, preview and live-card reveal.
- 12–19: Animated aunt, grandfather, and parent/child reactions with the real RSVP response, configured Gift List, Directions and Calendar panels. One action is highlighted at a time.
- 19–26: Native parent line; a paper-message graphic disappears with a timed pop; real Chat input changes 2 PM to 3 PM; the same demo URL opens the updated Overview.
- 26–30: Continuous space-party animation, dinosaur in a tiny hat, native John payoff, exact supplied wordmark and CTA.

## Source and claims

The source of customer-facing claims was ../src/lib/product-marketing-catalog.ts, especially Concierge, one-link sharing and updates, birthday Live Cards, RSVP, gift links and calendar saves. Source interfaces are imported directly from current ../src/app/chat/ConciergeChatClient.tsx and ../src/components/studio/SharedStudioCardPage.tsx. Entire mobile Chat/Preview UI was inspected.

The recording uses isolated Playwright route fixtures, not a production customer event. RSVP POST and host edit POST were recorded and fulfilled locally; evidence is in vertical-captured-actions.json. The personalized URL is a fictional demonstration URL, not a provisioned invitation. The sample host and guest contact addresses are demo copy, not provisioned mailboxes. Gift List demonstrates the actual configured registry-link panel, not an invented native shopping list.

The updated date/time is shown only on the shared Live Card. No shot implies automatic changes to an external calendar. No real customer responses or messages were sent.

## Generation and audio

Google gemini-omni-1.1-flash generated moving 3D character footage with native dialogue. Hook is 6 seconds; generated continuations include the 6-second continuity prefix. Final vertical preparation starts the parent/create shot at 6.5 seconds after its native dissolve, the update at 6 seconds, and the payoff at 6.333333 seconds after the continuity tail. The parent/create and payoff shots are gently retimed to fill their slots; the opening is sped to 5 seconds. ElevenLabs forced alignment found the closing first word at source 6.56 seconds, so the payoff trim preserves the complete line and keeps speech synchronized. Original source MP4s and private provider job state remain intact.

Original Lyria instrumental; Jessica ElevenLabs voice was auditioned on a short sample and audited before both full narration lines. Narration text is unchanged from the requested lines. Native dialogue, music and deterministic sparkle/pop sounds are mixed to 30 seconds. Audio audit found the complete spoken lines and no clipped or repeated words. Automated transcription approximates the brand pronunciation; source narration spells Envitefy correctly.

Provider API references checked during production:
- https://ai.google.dev/gemini-api/docs/omni
- https://ai.google.dev/gemini-api/docs/music-generation

## Artwork and branding

Built-in ImageGen generated the personalized card. The first 1086 × 1448 design remains card-art.webp for provenance and possible landscape use. Final vertical art is card-art-vertical.webp, 1024 × 1536, matching the actual Live Card frame so controls overlay continuing artwork.

Both were encoded directly from their generator PNG using FFmpeg libwebp, quality 85, compression level 6. Both WebPs passed codec, dimension and decode verification. Both exact generator PNG originals were deleted after verification. No unrelated supplied assets were deleted.

The supplied public/brand/envitefy-com.png wordmark is used without redraw, color change or an extra domain line.

## Editable production and output

Composition: EnvitefyJohnSpaceDisco.
Source: src/JohnSpaceDisco.tsx and src/john-space-disco/.
Current default and final export: out/john-space-disco/john-space-disco-9x16-v7.mp4. Earlier exports remain archived.
Preparation: scripts/prepare-john-vertical.mjs.
Capture: scripts/build-john-vertical-demo.mjs and scripts/capture-john-vertical-demo.mjs.
All reviews and renders are in out/john-space-disco/. Separate wide-prefixed files belong to the landscape task.

## Review

Reviewed source character contact sheets, the full styled Chat and Live Card UI, individual guest panels, a full 540 × 960 review export, every-second contact sheet and targeted host-edit frame. Corrected an action-caption containing-block width and fixed artwork ratio before final export. RSVP and time-edit request evidence saved.

ESLint, TypeScript and parent Biome checks pass. Optional editor diagnostics could not run because the installed Chat to CLI bridge is unavailable; standalone TypeScript and lint checks were completed.

Final export technical and cut checks are recorded in vertical-final-verification.json after rendering. Review status will be saved only after those checks. No user approval has been recorded.

Final V2 review completed: exact 30.000000 seconds, H.264 1080 × 1920, 900 frames at 30 fps, stereo 48 kHz AAC. Entire export decoded successfully. Measured integrated loudness -16.54 LUFS and true peak -1.50 dBTP. Checked the corrected first parent/payoff frames and both sides of all scene cuts. Closing-audio audit confirms the entire “That’s my kind of birthday” line without cutoff. Latest reviewed export and checksum are in deliverables-9x16.json. Assistant-reviewed; no user approval recorded.


## V3 user revision — September 8, 2026

Pronunciation: Envitefy is spoken as enviteuhfy (enviteafy), one continuous word. Persisted in STUDIO-GUIDE.md, the video producer skill and production reference, and the parent brand skill. scripts/brand-pronunciation.mjs supplies audio-only substitution and canonical caption spelling. Both narration generators use it; cached TTS keys reflect the spoken text. Six functional narration tests pass. The video producer skill validates; the generic skill validator flags the parent brand skill’s pre-existing argument-hint frontmatter, which was preserved.

New Jessica take: public/projects/john-space-disco/vo-create-v3.mp3. The isolated pronunciation review confirms the requested continuous name. Mixed with original dialogue, music and effects by scripts/prepare-john-vertical-v3.mjs into vertical-final-mix-v3.wav. Original takes remain intact.

Continuity: the normalized payoff source cuts to reversed screen positions at local frame 60 / master frame 840 (28.000 seconds). The V3 preparation mirrors only this second camera shot before adding text and logo overlays. John stays on the right and the dinosaur stays on the left throughout seconds 26–30. This retains native movement and speech timing. An attempted generated repair was provider content-blocked; no replacement request was made. Local video editing completed the fix.

Reviewed 32 ending samples and consecutive frames 837–842 across the repaired cut, plus full-video contact sheet and product/CTA details. Exact final duration 30.000000 seconds; 1080×1920 H.264, 900 frames at 30 fps; 48 kHz stereo AAC. Full decode passed. Integrated loudness -16.59 LUFS and true peak -1.47 dBTP. Offline Whisper confirms all spoken lines and an intact closing sentence; it is unreliable on the brand proper noun. The selected isolated pronunciation review remains the name-specific evidence. An external final soundtrack audit was denied by automatic approval review; no retry or external workaround was used. Local transcription and technical checks completed final verification.

ESLint, TypeScript, parent Biome and six functional tests pass. Optional editor diagnostics remain unavailable because the Chat to CLI bridge is absent. Latest review is vertical-v3-verification.json; delivery and checksum are recorded in deliverables-9x16.json. Assistant-reviewed, not user-approved.


## V4 pronunciation correction and full ending audit — September 8, 2026

The user clarified the final pronunciation as invitee-fy, superseding all earlier enviteuhfy/enviteafy guidance. Updated STUDIO-GUIDE.md, the video producer skill and production reference, parent brand skill, and shared audio helper. Text/captions retain Envitefy. New Jessica take vo-create-v4.mp3 uses the exact audio alias invitee-fy; final offline transcription reads “invitee fie concierge.” All five complete spoken lines are retained.

The user also supplied 27/28-second screenshots showing swapped sides. The V4 export uses the verified orientation: dinosaur always screen left, John always screen right. All 120 frames from 26–30 seconds were extracted from the actual V4 file and inspected individually in four frame grids. The V3 corrected video stream was preserved byte-for-byte; the final video packet hash matches. No new generative footage or external audio audit was used.

Preparation: scripts/prepare-john-vertical-v4.mjs. Mix: public/projects/john-space-disco/vertical-final-mix-v4.wav. Packaging uses V3 video stream plus the new V4 mix, H.264 stream copy and 192 kbps AAC, exact 30 seconds, faststart. Source composition audio and default export point to V4. The corrected payoff source remains vertical-payoff-v3.mp4. Verification: scripts/verify-john-vertical-v4.mjs and vertical-v4-verification.json.

Final V4: 1080×1920, 30 fps, 900 frames, exactly 30.000000 seconds, stereo AAC 48 kHz. Entire file decodes. Integrated loudness -16.51 LUFS, peak -1.39 dBTP. Local sentence-level transcription detects complete dialogue; word alignment initially failed and the sentence model emitted punctuation outside the actual media duration, which is excluded from review.

Six pronunciation/narration tests, changed-file ESLint and Biome, and video skill validation passed. Full repository lint/typecheck currently flags an unrelated unused Sequence import in another campaign’s SearchV3.tsx; that concurrent work was preserved. Editor diagnostics remain unavailable due to the missing Chat to CLI bridge. No user approval recorded.


## V5 — remove the reversing shot entirely

The user rejected the V3/V4 mirrored-shot approach and repeated the spoken spelling invitee-fy / 1nvitee-fy. Earlier claimed resolutions above are historical and were not user approvals. V5 abandons the mirrored take. Its four-second payoff uses original source payoff.mp4 beginning at 4.5 seconds, limited to 110 frames before the source cut at 8.1667 seconds, stretched by 12/11 to 120 output frames. No hflip is used. The original disco action continues, the tiny hat appears, and John speaks from the same side. Every final frame 780–899 was inspected; dinosaur remains left, John right.

Closing audio now starts at master 28.0 seconds with the original source line from 6.3333 seconds at 0.96 tempo. The measured source end places the final spoken sound around 29.965 seconds. The final exported closing audio transcribes the complete sentence.

The new name take uses stock Jessica on eleven_flash_v2 with the CMU phoneme tag IH0 N V AY2 T IY1 F AY0. Short initial i; invitee followed by fy, joined into one word. The user’s 1 represents the i sound, not a spoken number. Saved in the shared helper and brand/video skills. Exact spelling remains Envitefy in captions, including normalization of provider phoneme alignment tokens. The supported implementation was checked against https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices . The isolated take was offered in the task for user feedback; no user confirmation was received before packaging. Do not infer exact pronunciation from automatic transcription alone.

Automatic approval initially rejected a combined local-edit/TTS command. Local changes were completed independently. A read-only payload check confirmed the only network input was the exact user-provided promotional sentence with phoneme markup, with no media files or customer data. The narrowly scoped TTS retry was approved and succeeded. No private voice recordings were uploaded.

Final V5: exact 30.000 seconds, H.264 1080×1920, 900 frames at 30 fps, 48 kHz stereo AAC, full decode passed. Integrated -15.39 LUFS, -1.43 dBTP. Eight tests, changed-file ESLint/Biome, TypeScript and skill validation pass. Optional editor diagnostics remain unavailable. See vertical-v5-verification.json for frame and audio evidence.


## V6 — stress on VY

User clarified the pronunciation as **in-VY-tee-fy**, placing primary stress on VY. This supersedes the prior tee-stressed phonetic take. Updated STUDIO-GUIDE.md, video producer skill and production reference, parent brand skill, shared helper and tests. Current CMU is IH0 N V AY1 T IY0 F AY0; IPA is /ɪnˈvaɪtiːfaɪ/. Captions and artwork retain Envitefy.

Generated vo-create-v6.mp3 using the existing stock Jessica / eleven_flash_v2 request. Provider alignment confirms AY1 and IY0. All speech in the replacement line ends at source 2.926 seconds (master 8.426 seconds), comfortably within the scene. No media or customer data was uploaded for generation.

V6 is an audio-only revision: the video stream is copied directly from V5 and verified by matching SHA-256 packet hashes. The original unmirrored ending and fixed character sides are therefore retained exactly. Rebuilt vertical-final-mix-v6.wav with sample-accurate resampling and padding before trimming to 1,440,000 samples, then packaged into the 30-second MP4. Both audio and video streams are exactly 30 seconds. Entire decode passes; -15.41 LUFS integrated, -1.38 dBTP.

Scripts: prepare-john-vertical-v6.mjs and verify-john-vertical-v6.mjs. Eight tests, video skill validation, changed-file ESLint/Biome and TypeScript pass. Existing optional editor bridge remains unavailable. No user pronunciation approval is inferred.


## V7 — exact user IPA for all audio

Authoritative pronunciation: Inviteefy, IPA /ɪnˈvaɪtiˌfaɪ/, exact tag <phoneme alphabet="ipa" ph="ɪnˈvaɪtiˌfaɪ">Envitefy</phoneme>. This replaces earlier approximations, preserving the supplied primary and secondary stress and the absence of the former vowel-length mark. Written text remains Envitefy.

The shared helper now exports the exact SSML and IPA. All three TTS entry points use it; the generic narration pipeline chooses a compatible model rather than silently sending unsupported tags. Eight base native-video generators add this pronunciation direction when their prompt mentions Envitefy, without adding dialogue. Captions normalize current and archived pronunciation tokens. The legacy wide V4 setup is guarded against reverting newer shared pronunciation settings. Shared files were coordinated with the active landscape task; landscape media and deliverable entries are preserved.

V7 stock Jessica / eleven_flash_v2 request contains exactly the user-supplied IPA tag. Provider alignment is stored as returned and is not used to infer acoustic stress. The voice ends at 8.425 seconds on the master timeline. The full video is a copy of the V6 video stream with the new mix; packet hashes confirm frame identity and the fixed unmirrored ending. Both streams are exactly 30 seconds. Full decode passed; -15.39 LUFS, -1.43 dBTP.

Nine functional tests, syntax checks for 13 related scripts, video skill validation, changed-file ESLint/Biome and TypeScript pass. The optional editor bridge was previously unavailable; standalone checks completed. Source: prepare-john-vertical-v7.mjs; review: verify-john-vertical-v7.mjs and vertical-v7-verification.json. Earlier exports remain archived; no user audio approval is inferred.

## September 9, 2026 — final reference-based pronunciation

Completed the mandatory en-VITE-fy update after the user rejected the initial direct-TTS sample. The new reference-to-Jessica take passes audio review in the isolated narration and both final mixes; all animation packets remain identical. Final file: out/john-space-disco/john-space-disco-9x16-v9.mp4. See [current revision and verification](revision-brand-standard-2026-09-09.md). Assistant-reviewed; no user approval inferred.

## September 9, 2026 — user audio reference matched

Matched the narrator to the supplied envitefy.wav recording after the user authorized its Gemini analysis. Both final narration mixes pass direct reference comparison, approximately in-VY-tih-fy /ɪnˈvaɪtɪfaɪ/. Every animation packet remains identical to the prior version. Final file: out/john-space-disco/john-space-disco-9x16-v10.mp4. See [current revision](revision-user-audio-reference-2026-09-09.md). Assistant-reviewed; no approval of the finished video is inferred.

## September 9, 2026 — approved pronunciation preserved; sharing narration added

The user confirmed the current pronunciation is perfect. Saved the approved reference and Jessica take under assets/brand/audio/ with approval and hashes. Added “One easy link. All the party details.” at 12.25 seconds, with smooth music ducking. The accepted brand audio is unchanged, and every animation packet matches the previous version. Final export: out/john-space-disco/john-space-disco-9x16-v11.mp4. Exact 30 seconds, full decode, levels and final sharing audio review pass. Source and skill checks pass. See [revision notes](revision-share-narration-2026-09-09.md). Pronunciation is user-approved; this completed video is assistant-reviewed.

## September 9, 2026 — social post copy

Prepared Facebook/Instagram Reels, YouTube Shorts title and description, TikTok caption, and a transparently affiliated Reddit title/body in social-posts-v1.md. Copy follows the finished video and verified product claims, including guests reopening the same link for updated card details. No external-calendar auto-update claim or publishing action.
