# Small. Absolutely. — production notes

Created September 9, 2026. 30 seconds / 900 frames / 30 fps. Two adaptive layouts share all footage selections, timing and the exact same encoded audio stream. Fictional photorealistic people were generated with Gemini Omni 1.1 Flash; this is generated live-action-style footage, not an on-location camera shoot. Music is an original Lyria 3 instrumental.

## Creative and source edit

Maya: expectant mom, cream knit dress, long dark waves. Zoe: best friend, sage linen shirt, short natural hair. Warm cream interiors, sage paper garland, eucalyptus, tiny teddy cookies, an enormous physical-looking teddy on the sofa. Native synchronized conversational dialogue, restrained humor. No narrator and no spoken brand occurrence. End-card brand copy is separate editable text.

Café: source 0.15–4.75 seconds retimed to 4.3 seconds with pitch preserved; complete sentences retained. Trunk: 4.3–5.0 seconds, source 5.75–6.45. The linked video provider appended the original café to later clips; that lead-in is intentionally trimmed. Reveal begins exactly at 21.0 seconds using source frame 121 at 24 fps, avoiding café bleed. All native source clips and generation lineage are retained.

Product timeline: host at laptop 5.0–5.8; chat request 5.8–8.2; artwork 8.2–10.0; detail check 10.0–11.8; copied link 11.8–14.0; RSVP 14.0–16.2; gifts 16.2–17.8; calendar 17.8–19.5; directions 19.5–21.0. Reveal 21.0–27.0; celebration and brand 27.0–30.0.

The portrait edit uses speaker crops and a close-up of the giant teddy. It retains the same source frames and audio as the wide edit. Product recordings get dedicated portrait and wide layouts. Captions and official wordmark are independent Remotion overlays; dialogue SRT is also exported.

Music is completely gated out at 24.2–25.6 seconds around “It was on sale.” The same final-mix.wav is encoded once as shared-audio-v1.m4a and stream-copied into both final MP4 files.

## Product truth and isolated recording

Current source components: ../src/app/chat/ConciergeChatClient.tsx with UnsavedProgressProvider; ../src/components/studio/SharedStudioCardPage.tsx; its real StudioLiveCardActionSurface; and the actual ../src/app/api/ics/route.ts calendar handler, bundled locally. App CSS comes from the existing compiled layout. No live app files were edited.

Fictional event: Maya’s Baby Shower, October 17, 2026, 2–5 PM America/Chicago, The Garden Room, Austin. This is staged demo data. The displayed URL is a fictional sample live-card route intercepted locally, not an actually published customer invitation. POST requests are intercepted; no real RSVP, customer record, email or message is created. captured-actions.json verifies the copied link, demo RSVP body, and downloaded ICS. Calendar UTC times 19:00–22:00 match 2–5 PM CDT. Sample contact addresses illustrate fields, not provisioned mailboxes.

The current baby-shower UI labels its gift action Registry and panel Gift Registry. The explanatory overlay says Browse the Gift List, while preserving the real supported button and registry-link workflow. This flow exposes an external registry link; it does not contain an invented in-app product catalog. The supported feature claims are confirmed against ../src/lib/product-marketing-catalog.ts.

The first browser recording had device-scale padding. It was replaced by a clean viewport-sized recording before final rendering. Low-impact demo screenshots stay as captures; generated invitation art was converted to verified WebP with FFmpeg and its exact generated PNG original deleted. See artwork-provenance.json. Canonical wordmark bytes match the supplied parent asset; see brand-verification.json.

## Editable sources and commands

Canonical edit: src/small-shower/*.tsx and captions.json. Compositions: EnvitefySmallShowerWide and EnvitefySmallShowerVertical. Both have per-campaign defaultOutName values. All exports and review artifacts remain under out/small-shower/.

Generation/resume: node scripts/generate-small-shower.mjs <shot>. Never delete saved job files to force a new request. Capture: build-small-shower-demo.mjs then capture-small-shower.mjs. Normalize clean UI: prepare-small-shower-ui.mjs. Mix: mix-small-shower.mjs. Export: render-small-shower-final.mjs. Initial setup/scaffolding scripts are historical planning tools and should not overwrite later editorial choices.

## Verification

Source ESLint and TypeScript checks passed. Parent Biome lint passed after minor style fixes. The optional VS Code diagnostics bridge was unavailable; the wrapper reported that Chat to CLI is not connected. Standalone TypeScript checking completed successfully.

All scene layouts were manually inspected, including realistic faces, trunk measurement, invitation copy, actual product panels, both speaker crops, giant-bear reveal, and exact wordmark. Native dialogue was reviewed by a multimodal model and independently transcribed locally with faster-whisper; sentences match the user’s script. The failed attempt with bundled Python 3.12 was corrected by using the existing Python 3.11 runtime. Final export review is recorded separately in final-verification.json and final-media-review-*.json when complete. Do not mark these as user-approved.

Final cut-boundary inspection caught one blank browser frame at the end of the chat insert. Trimmed the capture 0.25 seconds earlier and retimed that stable interval to the same 2.4-second slot. Source, voice, music, other actions and overall timing remain unchanged. Pre-QA exports retained in the same output folder.

Final completion: both exports verified at 900 frames, exactly 30.000 seconds, 30 fps, H.264 video and AAC stereo audio. 1920×1080 and 1080×1920. Encoded AAC bitstreams are identical across both exports and unchanged from the reviewed audio. Final blank-frame repair was rechecked at the actual cut. All deliverables are assistant-reviewed, not user-approved. Separate dialogue SRT is saved alongside the videos.
