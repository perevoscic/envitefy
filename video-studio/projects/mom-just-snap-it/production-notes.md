# Mom, Just Snap It! — production notes

One 35-second production, 1050 frames at 30 fps. Shared source animation, product assets and audio; two responsive Remotion compositions.

## Plan established before generation

The original animation uses 16:9 frames with tightly clustered interaction in the central 45 percent. Vertical story frames use a deliberate scene window so both faces and hand actions remain visible. Horizontal demonstrates the phone beside the wider scene; vertical gives the phone the main area. Captions, readable invitation details, extracted event fields, UI and official branding remain separate layers.

Fresh cast: mother with chestnut shoulder-length waves, teal knit top and ivory apron; daughter with high ponytail, coral school cardigan and lavender backpack. Cream/terracotta kitchen, afternoon sunlight, premium hand-drawn anime.

## Product verification

Verified with the current local source components and the actual ICS route, using fictional data. See the completed product demonstration record below.

Provider docs checked: https://ai.google.dev/gemini-api/docs/omni and https://ai.google.dev/gemini-api/docs/music-generation . Current local generator uses Gemini Omni 1.1 Flash and Lyria. Provider jobs will be persisted once and resumed.

## Delivery checks

Both moving format previews and key stills were rendered before final encoding. The final MP4s pass 35.000 seconds, 30 fps, 1050 frames, correct dimensions, full decode, no detected black intervals and identical decoded audio. Final encoded boundary images were inspected for framing, props, captions and branding. Reference-based pronunciation verification is pending approval.

## Selected production and corrections

- Four source anime scenes generated once for this production in landscape 1920 × 1080 at 24 fps, conformed to 30 fps during the shared edit. Both responsive formats reference the same selected files; no vertical animation was independently generated.
- Opening uses 0–7 seconds of opening.mp4. Unrequested mother ad-lib at 2.15–3.9 seconds is removed from the shared soundtrack; physical paper flutter remains.
- Discovery removes the repeated second “make it digital” phrase (5.8–7.35 seconds). Digital scene removes the repeated second “share it with” (8.43–8.87). Picture and dialogue use matching cuts; only short end holds fill the specified scene lengths.
- Camera insert uses the stable source span beginning 2.4 seconds, excluding its initial reference replay. The single camera-final.mp4 contains tracked screen replacement and editable-code lettering composited on the physical invitation. Gray-screen segmentation preserves the animated fingertip and bezel. Shutter contact/flash is at shared scene frame 35 (global frame 515); the same effect timing is used in both formats.
- Payoff-clean is an edit of the original payoff that clears the fridge after the removal insert. The montage is shortened before speech to keep the complete payoff line at the 31-second brand transition. Original complete payoff dialogue is retained in the common soundtrack.
- Native source dialogue is edited only once. Offline base.en and small.en transcript checks confirm all four requested passages, with no extra line or duplicate phrase in the final mix. Transcription does not establish brand phonetics.
- Original Lyria music is retimed from 30 to 35 seconds and ducked beneath dialogue. Native paper sounds, shared synthesized shutter/taps/detail-transfer/chime effects, and fade-out are mixed into one 48 kHz stereo WAV. One AAC encode is muxed into both final MP4s.

## Actual product demonstration

- The running parent app returned HTTP 500. Captures use an isolated local bundle of the current unmodified BirthdaySkin, EventGuestActions and SnapLaunchCards components, with the authenticated Snap heading treatment and the app's previously saved compiled stylesheet. Fictional party data is supplied to these actual components; no customer record, RSVP, message or calendar write occurred.
- Exact party: Mia’s 8th Birthday, October 17, 2026, 2–4 PM America/Chicago; Maple Park, 820 W 7th Street, Austin, TX. This is a fictional campaign sample, not a claim of a real scheduled party. Demo contact birthday-demo@envitefy.com is not represented as a provisioned mailbox.
- Received-invitation RSVP uses the extracted host contact. The footage does not present a newly invented hosted attendance form.
- Actual Share event control copied https://envitefy.com/event/mias-8th-birthday into the isolated browser clipboard. No message was sent to Dad; the copy describes the next sharing action.
- Actual buildCalendarLinks generated Google, Outlook and Apple URLs. The unchanged local /api/ics GET implementation was invoked directly because the running app route was unhealthy. Its real REQUEST ICS output is retained as birthday.ics; title, UTC start 20261017T190000Z and end 20261017T210000Z pass validation.
- Calendar app confirmation/saved views are explicitly labelled “Calendar preview”; they illustrate the required native Add confirmation. This manual ICS route does not require linking a calendar account to Envitefy. OAuth is not skipped or falsely shown as completed.

## Review and limitations

- Moving half-size previews of both full 35-second layouts were rendered before final encoding, plus every story and product state. Additional review corrected vertical face crops, calendar overflow, RSVP button cropping, and the gray phone display. Final file decode/spec/audio identity and cut-boundary checks are recorded separately.
- Studio ESLint and TypeScript passed. Focused parent Biome passed. The optional VS Code diagnostics bridge is absent; the parent lint wrapper also scans unrelated repository files and reports existing errors, so focused checks supply the touched-file result.
- Automatic approval review rejected uploading the supplied private pronunciation reference and generated dialogue to Google Gemini for analysis because this exact payload/destination was not explicitly approved. An approval question is pending. No upload was performed and no alternate upload route was attempted. Exact brand pronunciation against the reference remains unverified; do not describe these exports as having passed that audio comparison.
- The cast reference was converted with FFmpeg libwebp quality 85/compression 6, decoded and verified at 1672 × 941. The exact generated PNG original was removed under the standing cleanup authorization. Code-rendered flyer WebP is verified at 900 × 1100; its temporary PNG was removed. Supplied brand PNG and actual UI screenshots remain intact as source assets.

## Editable project

Shared scene source: src/mom-just-snap-it/SnapAnime.tsx. Shared captions: src/mom-just-snap-it/captions.json. Both compositions are registered in src/Root.tsx. Original and selected assets are retained in public/projects/mom-just-snap-it. All outputs/review media are in out/mom-just-snap-it.

Reproduce selected edit with prepare-snap-anime-edit.mjs, composite-snap-anime-camera.py, letter-snap-anime-invitation.py and mix-snap-anime.mjs. Render both with node scripts/render-snap-anime-final.mjs. Provider generation scripts resume saved jobs and must not be blindly re-submitted.

## Final technical result

- Horizontal: 43,053,187 bytes; 1920 × 1080. Vertical: 31,112,123 bytes; 1080 × 1920. Both H.264, 30 fps, exactly 1050 frames and 35.000 seconds; stereo 48 kHz AAC.
- Full decode passes and no full-black intervals. Identical decoded audio SHA-256: 9d46163b3a8460ed4dee1fb25c9b163394a128840ae18b0b732cd2d8fb392b14.
- Final AAC measures −16.05 LUFS integrated, −1.36 dBTP, 8.2 LU loudness range; no digital clipping.
- Official logo SHA-256 matches the supplied parent asset exactly. Generated cast PNG and temporary flyer PNG are absent; verified WebPs remain.
- Final encoded first frames, both sides of scene and product cuts, last frames, phone lettering/flash, calendar save, RSVP label, clean-fridge drawing and end-card bounds were inspected. The portable project passes TypeScript. This is assistant technical/visual review, not user approval or a completed reference-audio review.

## Revision 2 — user corrections, in progress

The user identified a blank invite, inaudible mother, a flying green magnet, and character/brightness mismatch between opening and discovery. These supersede the earlier assistant visual-check conclusion. OpenAI gpt-image-2.5-flare was explicitly selected through the bundled image CLI, quality high. The new reference preserves the discovery cast and medium warm exposure, adds printed birthday details and a green magnet attached to bare fridge metal. WebP 1671 × 941 was encoded with FFmpeg q85/compression6 and decoded successfully; the exact generated PNG and temporary input PNG were deleted. Provenance and prompt are retained.

Discovery lettering is now a separate Remotion SVG layer, driven by per-frame optical-flow tracking in discovery-tracking.json. Characters and hands remain in the original flattened footage. The common final-mix-v2.wav gives Mom’s payoff +2.5dB before common mastering, presence EQ and stronger music ducking. Original audio is retained; mono/stereo measurements found no phase cancellation. No listening or reference-pronunciation pass is claimed.

Automatic approval review rejected uploading the new Flare-generated reference to Google for animation, requiring permission for that specific payload/destination. No upload occurred. An artwork-and-scene-prompt-only approval question is pending; the personal audio reference is excluded. generate-snap-anime-v2.mjs and the exact animation prompt are prepared but must not run before approval. V2 local previews still contain the old opening and are not final corrected deliveries. Prior V1 exact exports were copied to explicit -v1.mp4 names.

V2 local previews completed for both 35-second responsive layouts at half resolution. Discovery card tracking and caption spacing were inspected in both. TypeScript, focused ESLint and Biome passed. Local small.en transcription of the isolated V2 mother line confirms the complete requested sentence. Master measures −16.18 LUFS and −1.19 dBTP. Opening replacement still awaits the specific upload approval, so these previews are explicitly named opening-pending and are not final corrected exports.

## Opening invitation correction — version 2 export

The original opening is corrected locally, without generating or uploading another scene. opening-lettering-base.mp4 is the same original opening conformed once to 30 fps. A separate Remotion SVG contains Mia’s 8th Birthday; SAT OCT 17, 2026; 2–4 PM; MAPLE PARK; 820 W 7th Street; Austin, TX. The opening-tracking.json provides shared projective transforms and paper-color masks for the moving card; masks preserve fingers, borders and occlusion. Forward/backward local optical flow is constrained by manual card anchors. The same source footage and lettering layer render in both layouts.

Both full moving previews and multiple card poses were inspected. The first-lift anchor was corrected after a preview exposed text moving onto the girl’s shirt; revised frames 4, 8, 12 and 15 were checked in both layouts before final rendering. TypeScript, focused ESLint and Biome pass. The existing v2 audio clarity mix is included in both exports.

This completes the user’s follow-up invitation-text correction. Earlier requested magnet/style replacement and silent opening mouth action remain pending the specific generated-artwork upload approval. No blocked upload occurred. The requested Flare reference is retained, but the current opening video is still the original animation with local text compositing.

V2 encoded-file checks pass: horizontal 1920 × 1080, vertical 1080 × 1920, both 1050 frames at 30 fps and 35.000 seconds, H.264/AAC stereo 48kHz, full decode and no full-black intervals. Identical decoded audio SHA256 ee6df35a8f6abe725768861a61718bad58eeeaeda466ee0d12da4e5839a05856. Final corrected lift and visible party details were inspected in encoded output. Versioned exports are -v2.mp4; original requested filenames now point to the same new files, and -v1.mp4 originals remain available. This is an invitation-text correction, not approval or completion of the pending replacement animation.

## V3 completion of the shared production

Continued the existing campaign for the repeated full production brief. Both formats use one shared scene component, 1050-frame timing, the same animation files and exactly the same mastered audio. The original final filenames now point to V3; V1 and V2 remain available.

Opening and payoff wardrobe corrections use text-only edits of the provider-hosted original jobs. No local artwork or audio was uploaded. The opening's remaining floating teal magnet was removed with a tracked local video inpaint, and a magnet remains fixed at the refrigerator contact area. Only this small prop was composited; flattened characters are never moved independently. The revised opening has a shared 30fps source and separate SVG invitation lettering with updated per-frame paper masks. Generated paper glyphs were removed locally before the accurate editable lettering. Product extraction timing and the calendar review/confirmation holds were refined without changing dialogue, scene boundaries or the five-second payoff.

The final source and preview checks cover first frames, handoff, magnet and falling-paper frames, both sides of scene and product cuts, phone close-ups, captions, and both end cards. Full 35-second previews of both layouts preceded final renders. Technical checks include exact resolution/duration/frame count, full decode, no black intervals and identical decoded audio. See export-verification-v3.json.

Pronunciation comparison was completed locally with a downloaded public Wav2Vec2 phoneme model running in ONNX CPU mode with telemetry disabled. Both the user acoustic reference and the actual daughter dialogue decode four vowel nuclei, approximately /ɪ n v aɪ d ə f aɪ/ in the reference and /ɪ n v aɪ ɾ ə f aɪ/ in the candidate, including the short unstressed vowel before fy. The stop/flap difference is an acoustic model estimate across speakers. This is automated acoustic verification, not a claim of human listening or user approval. Local transcript and loudness evidence for the unchanged shared dialogue are retained. See local-phoneme-review-v3.json. The earlier external audio-review upload was rejected by automatic approval review and never performed; the local alternative resolves the reference-comparison dependency without that upload.

Current source verification reconfirmed that Snap saves a received invite and navigates to the saved event. The real component captures and real ICS proof remain in use. Native calendar Add/saved displays are labelled calendar previews; no real customer RSVP, message or calendar write occurred.

TypeScript, focused ESLint and Biome validation were run. The optional editor diagnostics bridge is unavailable in this environment. No parent application source was edited. No new raster artwork was generated in V3; earlier verified WebP artwork and official supplied PNG logo remain intact.
